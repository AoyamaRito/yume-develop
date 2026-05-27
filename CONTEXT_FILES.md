# yume-develop Context Files

> Generated from `runAndReadMe.aiDoc.yume.js`. Do not edit this Markdown directly.

AI セッションで読むファイルを絞るためのリスト。広く読む前にここで入口と対象範囲を決める。

## 常に読む

```sh
sed -n '1,220p' BIBLE.md
sed -n '1,240p' runYume.js
node runYume.js runAndReadMe.aiDoc.yume.js show head --raw
node runYume.js cli.module.yume.js show head --raw
```

## 作業別に追加

| 作業 | 追加ファイル | 読み方 |
|---|---|---|
| core / graph / parser | `core.module.yume.js` | `show head --raw` |
| CLI | `cli.module.yume.js` | `show head --raw` |
| runtime | `runtimes/ver002.handle.yume.js` | direct read; runtime handler is plain ESM |
| runtime compatibility | `runtimes/ver001.handle.yume.js` | direct read; runtime handler is plain ESM |
| block format spec | `BLOCKFILE.aiDoc.yume.js` | `show head --raw` only when exact semantics are needed |
| runtime tests/spec | `runtime.spec.yume.js`, `e2e.js` | targeted read |
| 3D prefab | `3d-prefab/`, `3dplus/tests/` | targeted read |
| external samples | `/Users/AoyamaRito/PJs/sample/` | only when the task explicitly targets sample projects |

## Current Workspace Inventory

Observed: 2026-05-27

### Tracked Core
- `core.module.yume.js`
- `cli.module.yume.js`
- `runYume.js`
- `runtimes/ver001.handle.yume.js`
- `runtimes/ver002.handle.yume.js`
- `runtime.spec.yume.js`
- `BLOCKFILE.aiDoc.yume.js`
- `e2e.js`

### Untracked Docs And Artifacts
- `READ_THE_LIST.md`
- `CONTEXT_FILES.md`
- `GEMINI.md`
- `plan.mermaid.md`
- `presentation.html`
- `task_A_artifact.md`

### Scratch Or Unclassified
- `yume-kantoku/run-swarm-planner.js`

### External Samples
- `/Users/AoyamaRito/PJs/sample/yume-develop-apps/`

## Repository Boundary

yume-develop is the product/runtime workspace for yume-files itself.

- Do not create app demos, sample projects, generated client work, throwaway experiments, or exploratory apps inside yume-develop.
- Use an external workspace such as /Users/AoyamaRito/PJs/sample/<project>/ for experiments that exercise yume-develop.
- Keep yume-develop tests focused on the core runtime, CLI, docs generation, 3D prefab support, and eyes modules that belong to the product.
- Only add files inside yume-develop when they are part of the core product, its canonical docs, or its verification suite.
- If a sample app becomes useful as a regression fixture, first discuss whether it belongs in an external fixture repo or a narrowly scoped core test.

### Verification Entrypoints
- `generated-docs.verify.js`
- `npm run docs:check`
- `npm run refs-check`
- `npm run verify`

## Policy

- Do not create sample apps or experiments inside yume-develop.
- Put app-level experiments under /Users/AoyamaRito/PJs/sample/ or another external project workspace.
- Do not wire external app experiments into yume-develop npm test or verify.
- Run npm run docs:check after editing any aiDoc REAL that generates Markdown.
- Keep repository changes limited to product code, canonical docs, and product-owned verification.
- Generated Markdown should name its REAL source at the top.

## Verification Commands

```sh
npm run docs:check
npm run refs-check
npm test
npm run verify
```
