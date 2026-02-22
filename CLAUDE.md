# Working with AI Agents on Zero Gravity

Zero Gravity is a lightweight semantic encoding format for AI agents. It defines a stamp — a structured abstract embedded in articles — that lets agents quickly understand a document's intent, stance, claims, and key concepts without reading the full text.

## What This Project Is

- **A format spec**: `spec/zero-gravity-0.1.md` — the canonical definition of the stamp format
- **A parser**: `src/parser.cjs` — extracts and validates stamps from documents
- **A generator**: `src/generator.cjs` — uses Claude to distill an article into stamp fields
- **An embedder**: `src/embedder.cjs` — generates OpenAI embeddings from stamp fields
- **A CLI**: `cli.cjs` — wraps the above into `generate`, `parse`, and `embed` commands
- **A skill file**: `skill/zero-gravity.md` — portable prompt for Claude to generate stamps without the full toolchain
- **Examples**: `examples/sample.md` — test file with an embedded stamp

## Repo Structure

```
zero-gravity/
  cli.cjs              Entry point for all CLI commands
  src/
    parser.cjs         Parse/validate stamps; format stamp output
    generator.cjs      Claude-powered field distiller
    embedder.cjs       OpenAI embedding generator
  spec/
    zero-gravity-0.1.md  Format specification
  skill/
    zero-gravity.md    Portable agent skill (no toolchain required)
  examples/
    sample.md          Sample article with embedded stamp
  data/                Output directory for .zg.json files (gitignored)
  README.md            Public-facing landing page
```

## The Stamp Format

A stamp has two parts:

**Visual header** (markdown, for humans):
```
🪐 Zero Gravity Stamp
Semantic encoding for agents | [learn more](https://github.com/clearhythm/zero-gravity) »
```

**Data block** (structured, for agents):
```
---BEGIN ZERO GRAVITY---
encoding: "zero-gravity"
version: "0.1"
author: "Author Name"
title: "Article Title"
intent: "inform|argue|guide|reflect|reference"
metaindex:
  - semantic fragment one
  - semantic fragment two
model: "claude-sonnet-4-6"
manifest: "https://..."
---END ZERO GRAVITY---
```

Required fields: `encoding`, `version`, `title`, `intent`, `metaindex`
Optional fields: `author`, `model`, `manifest`

`metaindex` is 4–8 short semantic fragments for vectorization — not a summary, not bullets. Each fragment captures a distinct concept, claim, or stance from the article.

## CLI Usage

Requires `.env` with `ANTHROPIC_API_KEY` and optionally `OPENAI_API_KEY`.

```bash
node cli.cjs generate --input article.md              # Generate fields, write .zg.json
node cli.cjs generate --input article.md --stamp      # Also print stamp to stdout
node cli.cjs generate --input article.md --embed      # Also generate embedding
node cli.cjs parse --input article.md                 # Parse existing stamp
node cli.cjs parse --input article.md --json          # Parse as JSON
node cli.cjs embed --input output.zg.json             # Add embedding to JSON
```

## Key Source Files

**`src/parser.cjs`**
- `parseZG(text)` — extracts stamp from a document, returns `{ version, fields, validation }`
- `validateStamp(fields)` — validates stamp fields
- `formatStamp(fields, version)` — serializes fields to the data block format
- `formatStampWithHeader(fields, infoUrl, version)` — full stamp with visual header
- `ZG_BLOCK_REGEX` — regex agents use to find stamps

**`src/generator.cjs`**
- `generate(anthropic, { text })` — calls Claude to distill article into fields
- Returns `{ fields, usage, raw }`

**`src/embedder.cjs`**
- `embed(openai, { fields })` — generates embedding from `title + intent + metaindex`
- `buildFullJSON({ fields, embedding })` — assembles the full `.zg.json` output

## Code Style

- CommonJS (`.cjs`) throughout — no ESM
- No unnecessary abstractions; keep functions focused
- Don't add error handling for internal callers; validate at CLI boundaries
- Don't add docstrings or comments to code you didn't change

## Spec and Skill Files

When changing the format:
- Update `spec/zero-gravity-0.1.md` first (source of truth for the format)
- Update `skill/zero-gravity.md` to match (agents use this without the toolchain)
- Update examples and parser together
- Keep stamp examples in README, spec, and skill consistent

The skill file at `skill/zero-gravity.md` is designed to be dropped into any agent context as a portable capability. Keep it self-contained — no external references required to use it.

## Git Workflow

- Commit docs in the same commit as code changes
- Use Claude Code co-author footer:
  `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- This repo is used as a dependency in `github:clearhythm/habitualos` via npm git dep — breaking changes need a heads-up

## Interoperability Note

`AGENTS.md` is a symlink pointing to this file. One source of truth.
