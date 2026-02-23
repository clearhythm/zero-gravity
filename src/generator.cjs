/**
 * Zero Gravity — Generator
 *
 * Takes article text and produces Zero Gravity stamp fields using Claude.
 */

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

const SYSTEM_PROMPT = `You are a Zero Gravity generator. Your job is to distill an article into a structured semantic abstract.

OUTPUT ONLY VALID JSON. No explanations, no commentary, no markdown fences.

## Required Fields

- title: Short article title
- intent: What the article does. MUST be one of: proposal / critique / synthesis / report / design
- metaindex: Array of 4-8 semantic fragments for vectorization. Each entry should capture one of three things: (1) unique key phrases — distinctive terms that make this article findable in semantic search, (2) argument distillation — core claims as indexable propositions, (3) notable snippets — specific quotes or formulations worth preserving. Mix all three freely. Include the author name as an entry if identifiable.

## Optional Fields (include when identifiable)

- author: Author name if identifiable, or the company/website if not

## Example Output

{
  "title": "Zero Gravity — A Semantic Bootstrap for the Agentic Web",
  "intent": "proposal",
  "metaindex": ["Erik Burns", "semantic bootstrap for agents", "token gravity", "agents need structure not prose", "meaning has bones"],
  "author": "Erik Burns"
}

Now distill the provided article.`;

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
    system: SYSTEM_PROMPT,
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
