# AI Agent Instructions for yume-develop

This repository is the development workspace for the portable `.yume.js` file format and its co-located runtimes. It is intentionally self-contained: do not assume a sibling `yume-files` checkout is available at runtime.

## Start Here

1. Read `runAndReadMe.aiDoc.yume.js` first. It is the operational runbook for AI agents.
1. Use `README.md` for the human-facing overview and examples.
1. Use `BLOCKFILE.aiDoc.yume.js` only when exact format or runtime semantics are needed.
1. Use `examples/hello.fn.yume.js` as the smallest valid `.yume.js` sample.

## Project Rules

- **Dependency-Free**: Keep the runtime dependency-free. Do not add npm dependencies unless the project deliberately changes that constraint.
- **Sniper Reading**: `.yume.js` files are huge due to history. Do not `read_file` blindly. Use `node runYume.js <file>.yume.js show head --raw` to get clean HEAD source.
- **Eyes over Server**: Use `ai-eyes` for structural verification of UI/3D logic instead of waiting for human visual confirmation.
- **REAL / SHADOW (A3)**: Markdown files (*.md) are SHADOWs. Never edit them directly. Edit the corresponding *.aiDoc.yume.js (REAL) and export.
- **Strict Validation**: Run `validate` and `refs-check .` after any structural change.

## Common Commands

```sh
npm test
node runYume.js runAndReadMe.aiDoc.yume.js show head --raw
node runYume.js examples/hello.fn.yume.js refs-check .
node runYume.js <file>.yume.js commit --note "why this change exists"
```

