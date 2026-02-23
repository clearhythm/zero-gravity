#!/usr/bin/env node

/**
 * Zero Gravity — CLI
 *
 * Usage:
 *   node cli.cjs generate --input article.md                   Generate full JSON from article
 *   node cli.cjs generate --url https://example.com/article    Fetch URL, save article, then generate
 *   node cli.cjs generate --input article.md --embed           Also generate embedding
 *   node cli.cjs generate --input article.md --stamp           Also output a stamp
 *   node cli.cjs parse --input file-with-stamp.md              Parse stamp from document
 *   node cli.cjs parse --input file-with-stamp.md --json       Output as JSON
 *   node cli.cjs embed --input output.zg.json                  Add embedding to JSON
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const OUTPUT_DIR = path.join(__dirname, 'output');

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function parseArgs(argv) {
  const args = {
    command: null,
    input: null,
    url: null,
    output: null,
    json: false,
    embed: false,
    stamp: false,
    manifest: null
  };
  let i = 2; // skip 'node' and script path

  if (argv[i]) args.command = argv[i++];

  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--input' && argv[i + 1]) {
      args.input = argv[++i];
    } else if (arg === '--url' && argv[i + 1]) {
      args.url = argv[++i];
    } else if (arg === '--output' && argv[i + 1]) {
      args.output = argv[++i];
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--embed') {
      args.embed = true;
    } else if (arg === '--stamp') {
      args.stamp = true;
    } else if (arg === '--manifest' && argv[i + 1]) {
      args.manifest = argv[++i];
    }
    i++;
  }

  return args;
}

function readInput(inputPath) {
  if (!inputPath) {
    console.error('Error: --input <path> or --url <url> is required');
    process.exit(1);
  }
  const resolved = path.resolve(inputPath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }
  return fs.readFileSync(resolved, 'utf-8');
}

function writeOutput(outputPath, content) {
  const resolved = path.resolve(outputPath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(resolved, content);
  console.error(`Written to: ${resolved}`);
}

async function fetchFromUrl(url) {
  const parsed = new URL(url);
  const segments = parsed.pathname.split('/').filter(Boolean);
  const slug = segments[segments.length - 1] || 'article';

  const html = await new Promise((resolve, reject) => {
    const https = require('https');
    const http = require('http');

    function follow(targetUrl, redirects) {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const mod = targetUrl.startsWith('https') ? https : http;
      mod.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZeroGravity/0.1)' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, targetUrl).href;
          return follow(next, redirects + 1);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    }

    follow(url, 0);
  });

  // Strip non-content semantic elements before converting
  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

  const TurndownService = require('turndown');
  const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });
  const text = td.turndown(cleaned);

  return { slug, text };
}

function getAnthropicClient() {
  const apiKey = process.env.ZEROGRAVITY_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('No Anthropic API key found. Set ZEROGRAVITY_API_KEY or ANTHROPIC_API_KEY in .env');
    process.exit(1);
  }
  const Anthropic = require('@anthropic-ai/sdk');
  return new Anthropic({ apiKey });
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('No OpenAI API key found. Set OPENAI_API_KEY in .env');
    process.exit(1);
  }
  const OpenAI = require('openai');
  return new OpenAI({ apiKey });
}

// ─── GENERATE command ────────────────────────────────────────────

async function cmdGenerate(args) {
  let text, slug;

  if (args.url) {
    console.error(`[zerogravity] Fetching ${args.url}...`);
    const fetched = await fetchFromUrl(args.url);
    slug = fetched.slug;
    text = fetched.text;
    ensureOutputDir();
    const savedPath = path.join(OUTPUT_DIR, `${slug}.md`);
    fs.writeFileSync(savedPath, text);
    console.error(`[zerogravity] Article saved to: ${savedPath}`);
  } else {
    text = readInput(args.input);
    slug = args.input ? path.basename(args.input, path.extname(args.input)) : null;
  }

  const anthropic = getAnthropicClient();
  const { generate } = require('./src/generator.cjs');
  const { validateFullJSON } = require('./src/parser.cjs');
  const { embed, buildFullJSON } = require('./src/embedder.cjs');

  console.error('[zerogravity] Generating Zero Gravity fields...');
  const result = await generate(anthropic, { text });

  if (!result.fields) {
    console.error('[zerogravity] ERROR: Failed to generate valid fields');
    console.error('[zerogravity] Raw output:');
    console.error(result.raw);
    process.exit(1);
  }

  // Validate
  const validation = validateFullJSON(result.fields);
  if (validation.valid) {
    console.error('[zerogravity] Fields are valid');
  } else {
    console.error('[zerogravity] Validation warnings:');
    for (const err of validation.errors) {
      console.error(`  - ${err}`);
    }
  }

  console.error(`[zerogravity] Tokens used: ${result.usage.input_tokens} in / ${result.usage.output_tokens} out`);

  // Optionally embed
  let embeddingResult = null;
  if (args.embed) {
    const openai = getOpenAIClient();
    console.error('[zerogravity] Generating embedding...');
    embeddingResult = await embed(openai, { fields: result.fields });
    console.error(`[zerogravity] Embedding: ${embeddingResult.dimensions} dimensions, model: ${embeddingResult.model}`);
  }

  // Build and write full JSON
  const fullJSON = buildFullJSON({
    fields: result.fields,
    embedding: embeddingResult
  });

  const fileSlug = slug || 'output';
  const jsonStr = JSON.stringify(fullJSON, null, 2);
  ensureOutputDir();
  const jsonPath = args.output || path.join(OUTPUT_DIR, `${fileSlug}.zg.json`);
  writeOutput(jsonPath, jsonStr);

  // Output stamp if requested
  if (args.stamp) {
    const { formatStampWithHeader } = require('./src/parser.cjs');
    const { DEFAULT_MODEL } = require('./src/generator.cjs');
    const stampFields = {
      author: result.fields.author,
      title: result.fields.title,
      intent: result.fields.intent,
      metaindex: result.fields.metaindex || [],
      model: DEFAULT_MODEL,
      manifest: args.manifest || undefined
    };

    const stamp = formatStampWithHeader(stampFields);
    console.error('\n[zerogravity] Stamp:\n');
    console.log(stamp);
  }
}

// ─── PARSE command ───────────────────────────────────────────────

async function cmdParse(args) {
  const text = readInput(args.input);
  const { parseZG } = require('./src/parser.cjs');

  const result = parseZG(text);

  if (!result) {
    console.error('[zerogravity] No Zero Gravity stamp found in input');
    process.exit(1);
  }

  if (args.json) {
    console.log(JSON.stringify({
      version: result.version,
      fields: result.fields,
      validation: result.validation
    }, null, 2));
    return;
  }

  // Human-readable output
  console.error(`[zerogravity] Zero Gravity v${result.version} stamp found\n`);

  for (const [key, value] of Object.entries(result.fields)) {
    if (Array.isArray(value)) {
      console.error(`  ${key}: [${value.length} items]`);
      for (const item of value) {
        console.error(`    - ${item}`);
      }
    } else {
      console.error(`  ${key}: ${value}`);
    }
  }

  console.error('');
  if (result.validation.valid) {
    console.error('  Status: VALID');
  } else {
    console.error('  Status: INVALID');
    for (const err of result.validation.errors) {
      console.error(`    - ${err}`);
    }
  }
}

// ─── EMBED command ───────────────────────────────────────────────

async function cmdEmbed(args) {
  const text = readInput(args.input);
  const { embed, buildFullJSON } = require('./src/embedder.cjs');

  // Input can be either a .zg.json file or a document with a stamp
  let fields;
  try {
    const json = JSON.parse(text);
    // It's a JSON file — use the fields directly
    const { embedding, encoding, version, created_at, ...rest } = json;
    fields = rest;
  } catch {
    // Not JSON — try to parse as a document with a stamp
    const { parseZG } = require('./src/parser.cjs');
    const result = parseZG(text);
    if (!result) {
      console.error('[zerogravity] No Zero Gravity stamp or JSON found in input');
      process.exit(1);
    }
    fields = {
      title: result.fields.title,
      intent: result.fields.intent
    };
    console.error('[zerogravity] WARNING: Stamp has limited fields. For best embeddings, use the full .zg.json file as input.');
  }

  const openai = getOpenAIClient();
  console.error('[zerogravity] Generating embedding...');
  const embeddingResult = await embed(openai, { fields });

  const fullJSON = buildFullJSON({ fields, embedding: embeddingResult });
  const jsonStr = JSON.stringify(fullJSON, null, 2);

  if (args.output) {
    writeOutput(args.output, jsonStr);
  } else {
    console.log(jsonStr);
  }

  console.error(`[zerogravity] Embedding: ${embeddingResult.dimensions} dimensions, model: ${embeddingResult.model}`);
}

// ─── HELP ────────────────────────────────────────────────────────

function printHelp() {
  console.error(`
  Zero Gravity CLI

  Commands:
    generate  Generate Zero Gravity fields from an article
    parse     Parse a Zero Gravity stamp from a document
    embed     Add embedding to a .zg.json file

  Generate:
    node cli.cjs generate --input article.md
    node cli.cjs generate --url https://example.com/article
    node cli.cjs generate --input article.md --embed
    node cli.cjs generate --input article.md --stamp
    node cli.cjs generate --input article.md --stamp --manifest https://example.com/embed.json
    node cli.cjs generate --input article.md --output path/to/output.zg.json

  Parse:
    node cli.cjs parse --input file-with-stamp.md
    node cli.cjs parse --input file-with-stamp.md --json

  Embed:
    node cli.cjs embed --input output.zg.json --output output-with-embedding.zg.json

  All output files are written to ./output/ (auto-created, gitignored).
`);
}

// ─── MAIN ────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  switch (args.command) {
    case 'generate':
      return cmdGenerate(args);
    case 'parse':
      return cmdParse(args);
    case 'embed':
      return cmdEmbed(args);
    default:
      printHelp();
      process.exit(args.command ? 1 : 0);
  }
}

main().catch(e => {
  console.error(`[zerogravity] Fatal error: ${e.message}`);
  process.exit(1);
});
