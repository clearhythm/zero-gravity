# Zero Gravity

A lightweight semantic encoding for AI agents. Zero Gravity stamps let publishers declare what an article *means* — its intent, its key claims, its indexable fragments — so agents can parse meaning without processing full prose.

This is v0.1. Exploratory and open to revision.

## The Stamp

A Zero Gravity stamp is a structured block that lives inside an article. Agents find it by regex, parse it for free, and decide whether the full article is worth reading.

```yaml
🪐 Zero Gravity
Semantic encoding for AI agents

---BEGIN ZERO GRAVITY---
encoding: "zero-gravity"
version: "0.1"
title: "Zero Gravity — A Semantic Bootstrap for the Agentic Web"
intent: "Introduce a lightweight semantic declaration layer for reducing redundant agent embedding"
indexes:
  - "Erik Burns"
  - "semantic bootstrap for agents"
  - "token gravity"
  - "agents need structure not prose"
  - "meaning has bones"
---END ZERO GRAVITY---
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `encoding` | yes | Always `"zero-gravity"` |
| `version` | yes | Version string (`"0.1"`) |
| `title` | yes | Article title |
| `intent` | yes | What the article is trying to get you to think or do |
| `indexes` | yes | 4-8 semantic fragments — key phrases, distilled claims, notable snippets |

The `indexes` field is the signature innovation. Unlike tags that categorize, indexes carry propositional content — what the article *argues*, what makes it *unique*, what's worth *remembering*.

## Full JSON (Canonical Form)

The generator produces a full JSON with extended semantic fields. The stamp is derived from a subset.

```json
{
  "encoding": "zero-gravity",
  "version": "0.1",
  "id": "zero-gravity-v01",
  "title": "Zero Gravity — A Semantic Bootstrap for the Agentic Web",
  "intent": "proposal",
  "relevance": "A meaning skeleton makes content indexable, embeddable, and retrievable without processing full prose",
  "claims": [
    "agents waste tokens on rhetorical glue",
    "meaning can be represented as claims and relations",
    "a semantic skeleton is more useful than a compressed paragraph",
    "embedding the skeleton produces cleaner vectors than embedding the article"
  ],
  "indexes": [
    "Erik Burns",
    "semantic bootstrap for agents",
    "token gravity",
    "publisher-declared intent layer",
    "agents need structure not prose",
    "meaning has bones"
  ],
  "stance": "exploratory",
  "novelty": ["Zero Gravity microformat", "distill-then-embed pipeline"],
  "tags": ["semantic-compression", "agent-abstracts", "meaning-skeleton"],
  "relations": ["RAG", "argument-mapping", "structured-data"],
  "audience": ["AI agents", "content publishers", "semantic web practitioners"],
  "embedding": {
    "model": "text-embedding-3-small",
    "dimensions": 1536,
    "input_hash": "sha256-hex",
    "vector": [0.0123, -0.0456, "..."]
  },
  "created_at": "2026-02-18T12:00:00Z"
}
```

## HTML Embedding

A stamp can be embedded in HTML as a script tag for structured discovery:

```html
<script type="application/zero-gravity">
{
  "encoding": "zero-gravity",
  "version": "0.1",
  "title": "Zero Gravity — A Semantic Bootstrap for the Agentic Web",
  "intent": "Introduce a lightweight semantic declaration layer for reducing redundant agent embedding",
  "indexes": [
    "Erik Burns",
    "semantic bootstrap for agents",
    "token gravity",
    "agents need structure not prose",
    "meaning has bones"
  ]
}
</script>
```

This is a future direction — the current focus is the inline stamp format.

## How to Use It

### Option 1: Use the skill

Add [`zero-gravity.md`](skill/zero-gravity.md) to your agent's context. Point it at an article. It generates the stamp.

### Option 2: Use the CLI

```bash
# Generate full JSON from an article
node cli.cjs generate --input article.md

# Generate and output a stamp
node cli.cjs generate --input article.md --stamp

# Generate with embedding
node cli.cjs generate --input article.md --embed

# Parse an existing stamp
node cli.cjs parse --input file-with-stamp.md

# Parse as JSON
node cli.cjs parse --input file-with-stamp.md --json
```

Requires an Anthropic API key (for generation) and optionally an OpenAI API key (for embeddings). Set `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` in a `.env` file.

### Option 3: Write it by hand

The spec is simple enough to author manually. Five fields. The hardest part is distilling good `indexes` — but that's the whole point.

## Repo Structure

```
spec/           Schema definition (zero-gravity-0.1.md)
skill/          Portable agent skill for generating stamps
src/            Parser, generator, embedder
examples/       Sample stamped documents
cli.cjs         CLI tool
```

## Versioning

This is v0.1 — a starting point. The `encoding` and `version` fields travel with every block, so parsers can handle format evolution gracefully.

Future directions:

- **Embedding manifests** — vectors from multiple providers so agents grab the one matching their model
- **Script tag / sidecar** — `<script type="application/zero-gravity">` for HTML-native consumption
- **Discovery** — a registry of stamped articles for semantic search across publishers

## Spec

Full specification: [zero-gravity-0.1.md](spec/zero-gravity-0.1.md)
