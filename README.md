# Zero Gravity

A lightweight semantic encoding for the agentic web.

## Why

Every time an agent fetches an article, it does the same work: read the whole thing, figure out what it means, decide if it's relevant, maybe summarize it, maybe embed it. That's tokens. That's compute. And it happens again the next time a different agent hits the same page.

The fix doesn't require publishers to do anything. Your agent can do it.

## What

Zero Gravity is a structured semantic abstract — a compact, agent-parseable block that captures what an article means: its intent, its key claims, its indexable fragments. Generate one after fetching content, store it in your knowledge base, and you never have to re-process that article again.

Fetch once. Stamp it. Query forever.

The stamp is content-absolute, not query-relative. Unlike retrieval tools that return context shaped by your current query, a Zero Gravity stamp represents the article's meaning independently — so it stays useful across every future query, every future agent, every future context.

A Zero Gravity stamp looks like this:

## 🪐 Zero Gravity Stamp
Semantic encoding for agents | learn more »

```
---BEGIN ZERO GRAVITY---
encoding: "zero-gravity"
version: "0.1"
author: "Erik Burns"
title: "Zero Gravity — A Semantic Bootstrap for the Agentic Web"
intent: "Argues that publishers can eliminate redundant agent computation by embedding a lightweight semantic declaration in each article"
metaindex:
  - "Erik Burns"
  - "semantic bootstrap for agents"
  - "token gravity"
  - "agents need structure not prose"
  - "meaning has bones"
model: "claude-sonnet-4-6"
---END ZERO GRAVITY---
```

Three required fields do the heavy lifting:

- **`intent`** — what the article is trying to get you to think or do. Not a summary — the core purpose.
- **`metaindex`** — 4-8 semantic fragments for vectorization. Key phrases, distilled claims, notable snippets. Unlike tags that categorize, metaindex entries carry propositional content — what the article *argues*, what makes it *unique*, what's worth *remembering*.
- **`encoding`** / **`version`** — a generic envelope, so the pattern can evolve and other encodings can reuse it.

Three optional fields add context: **`author`** (who wrote it), **`model`** (what generated the stamp), and **`manifest`** (URL to embeddings or other published resources).

An agent encountering this stamp can parse it for free, assess relevance from the metaindex, and decide whether the full article is worth reading — without processing a single paragraph of prose.

## How to Use It

### Option 1: Use the Skill

Just add [`zero-gravity.md`](skill/zero-gravity.md) to your agent's context. Point it at an article. Any LLM can generate a stamp.

Boom. Done.

### Option 2: Use the CLI

If you're building a research pipeline or want to stamp a batch of articles, the CLI handles fetching, generation, and embedding.

The CLI has two input modes:

**From a URL** — fetches the page, converts it to markdown, and generates a stamp:

```bash
node cli.cjs generate --url https://example.com/article --stamp
```

**From a local file** — generates a stamp from a markdown file you already have:

```bash
node cli.cjs generate --input article.md --stamp
```

#### Other commands

```bash
# Generate with embedding vector
node cli.cjs generate --input article.md --embed

# Parse an existing stamp from a document
node cli.cjs parse --input file-with-stamp.md --json
```

Output is written to `./output/` (auto-created, gitignored):

- `output/{slug}.zg.json` — full JSON with all stamp fields
- `output/{slug}.stamp.md` — the stamp block, ready to paste into your article
- `output/raw/{slug}.md` — fetched article markdown (URL mode only)

Add `--stamp` to also print the stamp to stdout.

_Note: Generation requires an Anthropic API key. Embeddings require an OpenAI API key. Set `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` in a `.env` file._

### Option 3: Write it by hand

The format is simple enough to author manually. The hardest part is distilling a good metaindex. But if you think you can do it better than AI, by all means go for it.

This option is particularly good for people who like to use rotary phones (batteries not included).

## Formats

### Stamp (inline)

The stamp lives inside an article — Markdown, HTML, plain text. Agents find it by regex (`---BEGIN ZERO GRAVITY---`), parse the fields, and move on.

### Full JSON (canonical)

The generator produces a full JSON output file (`.zg.json`). The stamp is derived from a subset of these fields.

```json
{
  "encoding": "zero-gravity",
  "version": "0.1",
  "title": "Zero Gravity — A Semantic Bootstrap for the Agentic Web",
  "intent": "Argues that publishers can eliminate redundant agent computation by embedding a lightweight semantic declaration in each article",
  "metaindex": [
    "semantic bootstrap for agents",
    "token gravity",
    "agents need structure not prose",
    "meaning has bones"
  ],
  "author": "Erik Burns",
  "created_at": "2026-02-22T00:00:00.000Z",
  "embedding": {
    "model": "text-embedding-3-small",
    "dimensions": 1536,
    "input_hash": "sha256-of-embedded-text",
    "vector": [0.0123, -0.0456, "..."]
  }
}
```

### HTML (future)

```html
<script type="application/zero-gravity">
{
  "encoding": "zero-gravity",
  "version": "0.1",
  "author": "Erik Burns",
  "title": "Zero Gravity — A Semantic Bootstrap for the Agentic Web",
  "intent": "Introduce a lightweight semantic declaration layer",
  "metaindex": ["Erik Burns", "semantic bootstrap for agents", "token gravity"]
}
</script>
```

## Repo Structure

```
spec/           Schema and field definitions
skill/          Portable agent skill for generating stamps
src/            Parser, generator, embedder
examples/       Sample stamped documents
output/         Generated files: fetched articles and .zg.json (gitignored)
cli.cjs         CLI tool
```

## Future Directions

- **Embedding manifests.** The `manifest` field currently points to a single embedding. Future versions could serve a manifest with vectors from multiple providers (OpenAI, Cohere, Voyage, etc.) so agents grab the representation matching their model.
- **Script tag / sidecar.** Export the stamp as `<script type="application/zero-gravity">` for HTML-native consumption, or as a `.zg.json` sidecar file alongside the article.
- **Native HTML.** If stamps become a web standard, the format could collapse to native meta elements. The stamp is the bootstrap — a format that works today, inside articles, without waiting for browser vendors.
- **Publisher adoption.** If publishers embed stamps at the source, agents benefit without doing any work. A long-term vision — but the format is designed for it.

## Status

This is v0.1 — exploratory and open to revision. The `encoding` and `version` fields travel with every block, so parsers can handle format evolution gracefully.

Full specification: [zero-gravity-0.1.md](spec/zero-gravity-0.1.md)
