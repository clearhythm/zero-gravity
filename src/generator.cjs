/**
 * Zero Gravity — Generator
 *
 * Takes article text and produces Zero Gravity stamp fields using Claude.
 * Uses skill/zero-gravity.md as the base prompt — single source of truth
 * for field definitions. Appends a JSON-output override.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

const SKILL_PATH = path.join(__dirname, '../skill/zero-gravity.md');

const JSON_OVERRIDE = `
---

For this invocation, output ONLY valid JSON — no stamp format, no markdown fences, no commentary.

Required fields: title, intent, metaindex
Optional fields: author

IMPORTANT: intent MUST be exactly one of: proposal / critique / synthesis / report / design

Example:
{
  "title": "Zero Gravity — A Semantic Bootstrap for the Agentic Web",
  "intent": "proposal",
  "metaindex": ["semantic bootstrap for agents", "token gravity", "agents need structure not prose", "meaning has bones"],
  "author": "Erik Burns"
}`;

function buildSystemPrompt() {
  const skill = fs.readFileSync(SKILL_PATH, 'utf-8');
  return skill + JSON_OVERRIDE;
}

/**
 * Generate Zero Gravity fields from article text using Claude.
 *
 * @param {Object} anthropic - Anthropic SDK client
 * @param {Object} options
 * @param {string} options.text - Article text to distill
 * @param {string} [options.model] - Claude model to use
 * @returns {Promise<{fields: Object|null, raw: string, usage: Object}>}
 */
async function generate(anthropic, { text, model = DEFAULT_MODEL }) {
  const response = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    system: buildSystemPrompt(),
    messages: [
      { role: 'user', content: text }
    ]
  });

  const raw = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();

  if (!raw) {
    console.error(`[generator] WARNING: Empty response. Stop reason: ${response.stop_reason}`);
    return { fields: null, raw: '', usage: response.usage };
  }

  // Parse JSON — strip markdown code fences if present
  let fields;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    fields = JSON.parse(cleaned);
  } catch (e) {
    console.error(`[generator] WARNING: Response is not valid JSON: ${e.message}`);
    return { fields: null, raw, usage: response.usage };
  }

  return {
    fields,
    raw,
    usage: response.usage
  };
}

module.exports = { generate, DEFAULT_MODEL };
