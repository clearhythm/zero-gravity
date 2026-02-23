# Zero Gravity

A lightweight semantic encoding for AI agents.

## Why

Web content is optimized for humans. Prose is great for reading — and incredibly expensive for agents to parse. Every time an agent encounters an article, it does the same work: read the whole thing, figure out what it says, decide if it's relevant, maybe summarize it, maybe embed it. That's tokens. That's compute.

Now multiply that by every agent, every article, every day. The same distillation happening redundantly across millions of agents.

What if the publisher did that work once?

## What

Zero Gravity is a structured semantic abstract that lives inside an article. It declares what the article *means* — its intent, its key claims, its indexable fragments — in a format agents can parse instantly and for free.

The publisher distills the meaning once. Every agent that encounters the article benefits. Zero redundant compute.

A Zero Gravity stamp looks like this:

## 🪐 Zero Gravity Stamp
Semantic encoding for agents | learn more »

```
---BEGIN ZERO GRAVITY---
encoding: "zero-gravity"
version: "0.1"
author: "Erik Burns"
title: "Zero Gravity — A Semantic Bootstrap for the Agentic Web"
intent: "proposal"
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

If you plan to use Zero Gravity in a research project or generate stamps for an entire blog, this option will save you time.

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

The generator produces a full JSON with extended semantic fields. The stamp is derived from a subset. The full JSON includes claims, relevance, stance, tags, relations, and an optional embedding vector.

```json
{
  "encoding": "zero-gravity",
  "version": "0.1",
  "id": "zero-gravity-v01",
  "author": "Erik Burns",
  "title": "Zero Gravity — A Semantic Bootstrap for the Agentic Web",
  "intent": "proposal",
  "relevance": "A meaning skeleton makes content indexable without processing full prose",
  "claims": [
    "agents waste tokens on rhetorical glue",
    "meaning can be represented as claims and relations",
    "embedding the skeleton produces cleaner vectors than embedding the article"
  ],
  "metaindex": [
    "Erik Burns",
    "semantic bootstrap for agents",
    "token gravity",
    "agents need structure not prose",
    "meaning has bones"
  ],
  "stance": "exploratory",
  "tags": ["semantic-compression", "agent-abstracts", "meaning-skeleton"],
  "relations": ["RAG", "argument-mapping", "structured-data"],
  "embedding": {
    "model": "text-embedding-3-small",
    "dimensions": 1536,
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
- **Discovery.** A registry of Zero Gravity-stamped articles, enabling semantic search across publishers.

## Status

This is v0.1 — exploratory and open to revision. The `encoding` and `version` fields travel with every block, so parsers can handle format evolution gracefully.

Full specification: [zero-gravity-0.1.md](spec/zero-gravity-0.1.md)
