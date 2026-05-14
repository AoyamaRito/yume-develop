// @yume-format: 1

export const __block = {
  "id": "eyes",
  "type": "observation",
  "schemaVersion": 1,
  "runtime": {
    "name": "yume",
    "version": "002"
  },
  "api": [
    "commit",
    "history",
    "heavy",
    "heavyApply",
    "show",
    "diff",
    "rollback",
    "validate",
    "refs",
    "tags",
    "impact",
    "refsCheck",
    "noteAdd",
    "noteList",
    "notesSearch",
    "applyList",
    "applyShow",
    "applyIndex",
    "applySearch"
  ],
  "versions": [
    {
      "hash": "1a66679fdcd0870da64689dbf1f10294be0f4e4219d1d3c4d5084c5d473fe2f1",
      "prevHash": null,
      "content": "// ============================================================\n// AI-Eyes — v2 観測ハーネス(Node-side, in-memory)\n// ============================================================\n//\n// LLM が demo の挙動を browser なしで witness するためのランナー。\n// demo は以下のインターフェイスを満たすこと(v2 観測可能性 = 公理 A8 系列):\n//\n//   demo = {\n//     initialState():       state                — 初期状態(JSON-serializable)\n//     dispatch(state, evt): state                — pure reducer\n//     render(ctx, state, dims): void              — pure renderer (ctx は VirtualCanvasContext)\n//     events?:              [{label, evt}, ...]  — 任意。runSession のデフォルトシナリオ\n//   }\n//\n// 出力は ai-desk.js v2 の `loadGraph` がそのまま読める形式の Block Graph。\n// 各 snapshot Block の content には PNG でなく **draw operation log** が入る\n// (公理 A0 — 透明な算術として LLM が直接読める)。\n//\n// CLI:\n//   node v2/eyes/ai-eyes.js <demo.js>          — シナリオ実行 + graph.json 標準出力\n//   node v2/eyes/ai-eyes.js <demo.js> -o file  — file に書き出し\n//   node v2/eyes/ai-eyes.js <demo.js> -s       — summary だけ表示\n// ============================================================\n\nimport { writeFileSync } from 'node:fs';\nimport { resolve, dirname, basename } from 'node:path';\nimport { fileURLToPath, pathToFileURL } from 'node:url';\nimport { Block, Graph } from './core.module.yume.js';\nimport { createVirtualCanvas, summarizeOps } from './virtual-canvas.module.yume.js';\n\n// ============================================================\n// 1 frame を捕捉\n// ============================================================\nexport function captureFrame(demo, state, dims = { w: 800, h: 600 }) {\n  const canvas = createVirtualCanvas(dims.w, dims.h);\n  const ctx = canvas.getContext('2d');\n  demo.render(ctx, state, dims);\n  return {\n    capturedAt: Date.now(),\n    dims,\n    state: clone(state),\n    draw_ops: ctx.ops,\n    summary: summarizeOps(ctx.ops),\n  };\n}\n\n// ============================================================\n// 1 セッションを実行(初期 snap + tx ごとに snap)\n// ============================================================\nexport function runSession(demo, options = {}) {\n  const dims = options.dims || { w: 800, h: 600 };\n  const events = options.events || demo.events || [];\n  const sessionId = options.sessionId || ('session_' + Math.random().toString(36).slice(2, 10));\n  const startedAt = Date.now();\n\n  const graph = new Graph();\n  const session = new Block({\n    id: sessionId, type: 'session',\n    meta: { startedAt, dims, demo: options.demoLabel || null, ua: 'node/ai-eyes' },\n  });\n  session.commit({\n    content: { startedAt, dims },\n    children: [],\n    meta: { action: 'session-start' },\n  });\n  graph.add(session);\n\n  let state = demo.initialState();\n  let lastTxId = null;\n  let txSeq = 0;\n  let snapSeq = 0;\n\n  function appendChild(id) {\n    const head = session.head();\n    session.commit({\n      content: head.content,\n      children: [...head.children, id],\n      meta: { action: 'append-child', child: id },\n    });\n  }\n  function recordSnap(label) {\n    snapSeq++;\n    const id = `${sessionId}_snap_${String(snapSeq).padStart(3, '0')}`;\n    const refs = [{ kind: 'observes', target: sessionId }];\n    if (lastTxId) refs.push({ kind: 'after', target: lastTxId });\n    const snap = new Block({ id, type: 'snapshot', meta: { seq: snapSeq, sessionId, label } });\n    snap.commit({\n      content: captureFrame(demo, state, dims),\n      refs,\n      meta: { action: 'snapshot', label },\n    });\n    graph.add(snap);\n    appendChild(id);\n    return snap;\n  }\n  function recordTx(label, evtList) {\n    txSeq++;\n    const id = `${sessionId}_tx_${String(txSeq).padStart(4, '0')}`;\n    const refs = [{ kind: 'in-session', target: sessionId }];\n    if (lastTxId) refs.push({ kind: 'after', target: lastTxId });\n    const tx = new Block({ id, type: 'tx', meta: { seq: txSeq, sessionId, label } });\n    tx.commit({\n      content: { events: evtList, label },\n      refs,\n      meta: { action: 'tx', label, count: evtList.length },\n    });\n    graph.add(tx);\n    appendChild(id);\n    lastTxId = id;\n    return tx;\n  }\n\n  // 初期 snap\n  recordSnap('initial');\n\n  // events シナリオを順に適用\n  for (const step of events) {\n    const evtList = Array.isArray(step.evt) ? step.evt : [step.evt];\n    for (const e of evtList) state = demo.dispatch(state, e);\n    recordTx(step.label || `step-${txSeq + 1}`, evtList);\n    if (step.snapshot !== false) recordSnap(step.label || `after-step-${txSeq}`);\n  }\n\n  return { graph, finalState: state, sessionId };\n}\n\n// ============================================================\n// 出力 — ai-desk.js loadGraph 互換(配列ルート)\n// ============================================================\nexport function dumpGraph(graph, path) {\n  const json = JSON.stringify(graph.toJSON(), null, 2);\n  writeFileSync(path, json);\n  return path;\n}\n\nfunction clone(v) {\n  // 浅い JSON コピー。state が serializable 前提。\n  return v == null ? v : JSON.parse(JSON.stringify(v));\n}\n\n// ============================================================\n// CLI\n// ============================================================\nconst isMain =\n  typeof process !== 'undefined' &&\n  process.argv[1] &&\n  import.meta.url === pathToFileURL(process.argv[1]).href;\n\nif (isMain) {\n  const args = process.argv.slice(2);\n  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {\n    console.log(`AI-Eyes (Node, in-memory) — observe a v2 demo headless\n\nUsage:\n  node v2/eyes/ai-eyes.js <demo.js>               run scenario, write graph.json\n  node v2/eyes/ai-eyes.js <demo.js> -o <file>     write to file\n  node v2/eyes/ai-eyes.js <demo.js> -s            print summary only\n  node v2/eyes/ai-eyes.js <demo.js> --width=W --height=H\n\nThe demo module must export an object with:\n  initialState(): state\n  dispatch(state, evt): newState\n  render(ctx, state, dims): void\n  events?: [{label, evt, snapshot?}, ...]\n`);\n    process.exit(0);\n  }\n\n  const demoPath = resolve(args[0]);\n  const outIdx = args.indexOf('-o');\n  const summaryOnly = args.includes('-s') || args.includes('--summary');\n  let dims = { w: 800, h: 600 };\n  for (const a of args) {\n    const m = /^--width=(\\d+)$/.exec(a); if (m) dims.w = Number(m[1]);\n    const n = /^--height=(\\d+)$/.exec(a); if (n) dims.h = Number(n[1]);\n  }\n  const outPath = outIdx >= 0 && args[outIdx + 1]\n    ? resolve(args[outIdx + 1])\n    : resolve(`./ai-eyes-${basename(demoPath, '.js')}.json`);\n\n  const demoUrl = pathToFileURL(demoPath).href;\n  const mod = await import(demoUrl);\n  const demo = mod.default || mod;\n  const { graph, finalState, sessionId } = runSession(demo, {\n    dims,\n    demoLabel: basename(demoPath),\n  });\n  if (summaryOnly) {\n    const summary = {\n      sessionId,\n      blocks: graph.all().length,\n      snapshots: graph.all().filter(b => b.type === 'snapshot').length,\n      tx: graph.all().filter(b => b.type === 'tx').length,\n      finalState,\n    };\n    console.log(JSON.stringify(summary, null, 2));\n  } else {\n    dumpGraph(graph, outPath);\n    console.log(`written: ${outPath} (${graph.all().length} blocks, session ${sessionId})`);\n  }\n}\n",
      "ts": 1778788882056,
      "refs": [
        {
          "kind": "import",
          "target": "node:fs"
        },
        {
          "kind": "import",
          "target": "node:path"
        },
        {
          "kind": "import",
          "target": "node:url"
        },
        {
          "kind": "import",
          "target": "./core.module.yume.js"
        },
        {
          "kind": "import",
          "target": "./virtual-canvas.module.yume.js"
        },
        {
          "kind": "calls",
          "target": "createVirtualCanvas"
        },
        {
          "kind": "calls",
          "target": "clone"
        },
        {
          "kind": "calls",
          "target": "summarizeOps"
        },
        {
          "kind": "calls",
          "target": "Graph"
        },
        {
          "kind": "calls",
          "target": "Block"
        },
        {
          "kind": "calls",
          "target": "String"
        },
        {
          "kind": "calls",
          "target": "captureFrame"
        },
        {
          "kind": "calls",
          "target": "appendChild"
        },
        {
          "kind": "calls",
          "target": "recordSnap"
        },
        {
          "kind": "calls",
          "target": "recordTx"
        },
        {
          "kind": "calls",
          "target": "writeFileSync"
        },
        {
          "kind": "calls",
          "target": "pathToFileURL"
        },
        {
          "kind": "calls",
          "target": "resolve"
        },
        {
          "kind": "calls",
          "target": "Number"
        },
        {
          "kind": "calls",
          "target": "basename"
        },
        {
          "kind": "calls",
          "target": "runSession"
        },
        {
          "kind": "calls",
          "target": "dumpGraph"
        }
      ],
      "tags": [],
      "applyId": null
    }
  ]
};

// === HEAD ===
// ============================================================
// AI-Eyes — v2 観測ハーネス(Node-side, in-memory)
// ============================================================
//
// LLM が demo の挙動を browser なしで witness するためのランナー。
// demo は以下のインターフェイスを満たすこと(v2 観測可能性 = 公理 A8 系列):
//
//   demo = {
//     initialState():       state                — 初期状態(JSON-serializable)
//     dispatch(state, evt): state                — pure reducer
//     render(ctx, state, dims): void              — pure renderer (ctx は VirtualCanvasContext)
//     events?:              [{label, evt}, ...]  — 任意。runSession のデフォルトシナリオ
//   }
//
// 出力は ai-desk.js v2 の `loadGraph` がそのまま読める形式の Block Graph。
// 各 snapshot Block の content には PNG でなく **draw operation log** が入る
// (公理 A0 — 透明な算術として LLM が直接読める)。
//
// CLI:
//   node v2/eyes/ai-eyes.js <demo.js>          — シナリオ実行 + graph.json 標準出力
//   node v2/eyes/ai-eyes.js <demo.js> -o file  — file に書き出し
//   node v2/eyes/ai-eyes.js <demo.js> -s       — summary だけ表示
// ============================================================

import { writeFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Block, Graph } from './core.module.yume.js';
import { createVirtualCanvas, summarizeOps } from './virtual-canvas.module.yume.js';

// ============================================================
// 1 frame を捕捉
// ============================================================
export function captureFrame(demo, state, dims = { w: 800, h: 600 }) {
  const canvas = createVirtualCanvas(dims.w, dims.h);
  const ctx = canvas.getContext('2d');
  demo.render(ctx, state, dims);
  return {
    capturedAt: Date.now(),
    dims,
    state: clone(state),
    draw_ops: ctx.ops,
    summary: summarizeOps(ctx.ops),
  };
}

// ============================================================
// 1 セッションを実行(初期 snap + tx ごとに snap)
// ============================================================
export function runSession(demo, options = {}) {
  const dims = options.dims || { w: 800, h: 600 };
  const events = options.events || demo.events || [];
  const sessionId = options.sessionId || ('session_' + Math.random().toString(36).slice(2, 10));
  const startedAt = Date.now();

  const graph = new Graph();
  const session = new Block({
    id: sessionId, type: 'session',
    meta: { startedAt, dims, demo: options.demoLabel || null, ua: 'node/ai-eyes' },
  });
  session.commit({
    content: { startedAt, dims },
    children: [],
    meta: { action: 'session-start' },
  });
  graph.add(session);

  let state = demo.initialState();
  let lastTxId = null;
  let txSeq = 0;
  let snapSeq = 0;

  function appendChild(id) {
    const head = session.head();
    session.commit({
      content: head.content,
      children: [...head.children, id],
      meta: { action: 'append-child', child: id },
    });
  }
  function recordSnap(label) {
    snapSeq++;
    const id = `${sessionId}_snap_${String(snapSeq).padStart(3, '0')}`;
    const refs = [{ kind: 'observes', target: sessionId }];
    if (lastTxId) refs.push({ kind: 'after', target: lastTxId });
    const snap = new Block({ id, type: 'snapshot', meta: { seq: snapSeq, sessionId, label } });
    snap.commit({
      content: captureFrame(demo, state, dims),
      refs,
      meta: { action: 'snapshot', label },
    });
    graph.add(snap);
    appendChild(id);
    return snap;
  }
  function recordTx(label, evtList) {
    txSeq++;
    const id = `${sessionId}_tx_${String(txSeq).padStart(4, '0')}`;
    const refs = [{ kind: 'in-session', target: sessionId }];
    if (lastTxId) refs.push({ kind: 'after', target: lastTxId });
    const tx = new Block({ id, type: 'tx', meta: { seq: txSeq, sessionId, label } });
    tx.commit({
      content: { events: evtList, label },
      refs,
      meta: { action: 'tx', label, count: evtList.length },
    });
    graph.add(tx);
    appendChild(id);
    lastTxId = id;
    return tx;
  }

  // 初期 snap
  recordSnap('initial');

  // events シナリオを順に適用
  for (const step of events) {
    const evtList = Array.isArray(step.evt) ? step.evt : [step.evt];
    for (const e of evtList) state = demo.dispatch(state, e);
    recordTx(step.label || `step-${txSeq + 1}`, evtList);
    if (step.snapshot !== false) recordSnap(step.label || `after-step-${txSeq}`);
  }

  return { graph, finalState: state, sessionId };
}

// ============================================================
// 出力 — ai-desk.js loadGraph 互換(配列ルート)
// ============================================================
export function dumpGraph(graph, path) {
  const json = JSON.stringify(graph.toJSON(), null, 2);
  writeFileSync(path, json);
  return path;
}

function clone(v) {
  // 浅い JSON コピー。state が serializable 前提。
  return v == null ? v : JSON.parse(JSON.stringify(v));
}

// ============================================================
// CLI
// ============================================================
const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`AI-Eyes (Node, in-memory) — observe a v2 demo headless

Usage:
  node v2/eyes/ai-eyes.js <demo.js>               run scenario, write graph.json
  node v2/eyes/ai-eyes.js <demo.js> -o <file>     write to file
  node v2/eyes/ai-eyes.js <demo.js> -s            print summary only
  node v2/eyes/ai-eyes.js <demo.js> --width=W --height=H

The demo module must export an object with:
  initialState(): state
  dispatch(state, evt): newState
  render(ctx, state, dims): void
  events?: [{label, evt, snapshot?}, ...]
`);
    process.exit(0);
  }

  const demoPath = resolve(args[0]);
  const outIdx = args.indexOf('-o');
  const summaryOnly = args.includes('-s') || args.includes('--summary');
  let dims = { w: 800, h: 600 };
  for (const a of args) {
    const m = /^--width=(\d+)$/.exec(a); if (m) dims.w = Number(m[1]);
    const n = /^--height=(\d+)$/.exec(a); if (n) dims.h = Number(n[1]);
  }
  const outPath = outIdx >= 0 && args[outIdx + 1]
    ? resolve(args[outIdx + 1])
    : resolve(`./ai-eyes-${basename(demoPath, '.js')}.json`);

  const demoUrl = pathToFileURL(demoPath).href;
  const mod = await import(demoUrl);
  const demo = mod.default || mod;
  const { graph, finalState, sessionId } = runSession(demo, {
    dims,
    demoLabel: basename(demoPath),
  });
  if (summaryOnly) {
    const summary = {
      sessionId,
      blocks: graph.all().length,
      snapshots: graph.all().filter(b => b.type === 'snapshot').length,
      tx: graph.all().filter(b => b.type === 'tx').length,
      finalState,
    };
    console.log(JSON.stringify(summary, null, 2));
  } else {
    dumpGraph(graph, outPath);
    console.log(`written: ${outPath} (${graph.all().length} blocks, session ${sessionId})`);
  }
}

// === /HEAD ===

// === BOOT ===
if (import.meta.url === `file://${process.argv[1]}`) {
  const path = __block.runtime.path ?? `./runtimes/ver${__block.runtime.version}.handle.yume.js`;
  const rt = await import(path);
  await rt.cli(import.meta.url, __block, process.argv);
}
// === /BOOT ===
