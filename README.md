# yume-develop

> Generated from `README.aiDoc.yume.js`. Do not edit this Markdown directly.

## For AI Agents (first read)

AI agents: this repo's structured rules live in AGENTS.aiDoc.yume.js. Access two ways:

### Access
- show head: `node runYume.js AGENTS.aiDoc.yume.js show head --raw`
- import: `import { Forbidden, BlindSpots, BlockOps, GraphOps, Glossary, VirtualHeavy, RealVariable, AutoUseProtocol, OperatingModel, ContextEconomy } from './AGENTS.aiDoc.yume.js'`

### Facts
- Axioms (A0–A14): BIBLE.md or `node runYume.js bible.aiDoc.yume.js show head --raw`.
- `.yume.js` is a portable Block file (HEAD + append-only history). Edit HEAD; commit via runtime.
- AGENTS.md / GEMINI.md are SHADOW stubs (CLI auto-load convention) that point here.

## Overview

yume-develop is a self-contained workspace for AI-Native development on the `.yume.js` (BLOCKFILE) portable file format.

## Philosophy

- **All-as-Block** — Functions, constraints, observations, and documentation are all Blocks.
- **Versions-as-Body** — A Block's true state is its append-only `versions` array.
- **Top-Down E2E-First (Axiom A14)** — Start with E2E scenarios; fill coverage gaps with autonomously generated unit tests.

## Contents

- `AGENTS.aiDoc.yume.js` — AI single import surface — rules, ops, manual, runbook, axiom pointers.
- `bible.aiDoc.yume.js` — Canonical philosophy and axioms (A0–A14).
- `core.module.yume.js` — Block / Graph / parseJS implementation.
- `cli.module.yume.js` — CLI implementation.
- `runtimes/` — Co-located yume runtimes (ver001 / ver002 handlers).

## Usage

```sh
# Run the complete local suite.
npm test

# docs:check + validate + refs-check + tests.
npm run verify

# Clean HEAD source, history-free (sniper reading).
node runYume.js <file>.yume.js show head --raw

# Append a new version after editing HEAD.
node runYume.js <file>.yume.js commit --note "why"

# Reference graph integrity.
npm run refs-check
```

## Completion Standard

- Changed .yume.js files validate.
- Reference graph changes pass refs-check.
- Public docs (SHADOW) are aligned with REAL source.
