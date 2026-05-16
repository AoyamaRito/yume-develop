// @yume-format: 1

export const __block = {
  "id": "ai-desk-cli",
  "type": "module",
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
      "hash": "852302aee69c9b644d9cf1a2a64224ccc6b814a459f602163653f57708e9a667",
      "prevHash": null,
      "content": "// ai-desk.js\n// Node.js CLI Shell for ai-desk v2\n//\n// This file handles I/O (filesystem, process) and delegates logic to ai-desk-core.js.\n// Isomorphic Architecture: logic is platform-agnostic, shell is Node-specific.\n\nimport { readFileSync, writeFileSync, existsSync } from 'node:fs';\nimport { dirname, resolve as pathResolve } from 'node:path';\nimport {\n  Block, Graph, parseJS, parseMD, checkBraces, inferTags,\n  exportModule, exportMermaid,\n  virtualHeavy, expandVirtualHeavy, virtualApply, heavyApply,\n  applyToBlock, applyBlockSmart, applyPatch, resolveImportsPure,\n  constraintBlock, evalConstraint,\n  observationBlock,\n  graphStats, blockContext, formatContextForLLM,\n  sameArr, sameRefs, hashVersion\n} from './core.module.yume.js';\nimport {\n  Axioms, BlockTypes, Taboos, Vocabulary,\n  Kernel as BibleKernel, VERSION as BIBLE_VERSION,\n} from './bible.aiDoc.yume.js';\n\n// ============================================================\n// Node-specific I/O helpers\n// ============================================================\n\nexport function loadProject(files) {\n  const graph = new Graph();\n  for (const f of files) {\n    const src = readFileSync(f, 'utf8');\n    const blocks = f.endsWith('.md') ? parseMD(src, f) : parseJS(src, f);\n    for (const b of blocks) graph.add(b);\n  }\n  return graph;\n}\n\nexport function saveGraph(graph, path) {\n  writeFileSync(path, JSON.stringify(graph.toJSON(), null, 2));\n  return path;\n}\n\nexport function loadGraph(path) {\n  return Graph.fromJSON(JSON.parse(readFileSync(path, 'utf8')));\n}\n\nexport function buildAndSave(files, outPath) {\n  const g = loadProject(files);\n  saveGraph(g, outPath);\n  return g;\n}\n\nexport function exportToFile(graph, moduleId, outPath) {\n  const code = exportModule(graph, moduleId);\n  writeFileSync(outPath, code);\n  return outPath;\n}\n\n// Node-specific path resolver for resolveImports\nfunction nodeResolvePath(fromId, target) {\n  const baseDir = dirname(pathResolve(fromId));\n  const abs = pathResolve(baseDir, target);\n  const cand = [abs, abs + '.js', abs + '/index.js'].find(c => existsSync(c));\n  return cand ? pathResolve(cand) : pathResolve(abs);\n}\n\nexport function resolveImports(graph) {\n  // graph 内の module は絶対パスで正規化しておく必要がある\n  const idToAbs = new Map();\n  for (const b of graph.byType('module')) idToAbs.set(pathResolve(b.id), b.id);\n\n  return resolveImportsPure(graph, (mId, target) => {\n    const abs = nodeResolvePath(mId, target);\n    return idToAbs.get(abs);\n  });\n}\n\n// ============================================================\n// CLI hints\n// ============================================================\n\nconst HINT_STATE_FILE = '.ai-desk-state.json';\nconst HINTS = [\n  {\n    key: '3dplus',\n    detect: (g) => {\n      const pats = [/\\bWebGL2?\\b/, /\\bWebGPU\\b/i, /\\bTHREE\\./, /\\bnew\\s+THREE\\b/, /\\b(?:Mat4|Matrix4|Vector3|Vec3|Quaternion)\\b/];\n      const matched = new Set();\n      for (const b of g.all()) {\n        const c = b.content || '';\n        for (const re of pats) { const m = re.exec(c); if (m) matched.add(m[0]); if (matched.size >= 5) break; }\n        if (matched.size >= 5) break;\n      }\n      return matched.size > 0 ? [...matched] : null;\n    },\n    render: (m) => `\\n─── ai-desk hint ───\\n  3D code detected: ${m.join(', ')}\\n  → v2/3dplus/ provides a CPU 3D Twin.\\n────────────────────\\n`,\n  },\n];\n\nfunction runHintsOnce(graphOrBlocks) {\n  const g = (typeof graphOrBlocks.all === 'function') ? graphOrBlocks : { all: () => graphOrBlocks };\n  let state = { hints_shown: [] };\n  try { state = JSON.parse(readFileSync(HINT_STATE_FILE, 'utf8')); } catch {}\n  let dirty = false;\n  for (const h of HINTS) {\n    if (state.hints_shown.includes(h.key)) continue;\n    const m = h.detect(g);\n    if (m) { process.stderr.write(h.render(m)); state.hints_shown.push(h.key); dirty = true; }\n  }\n  if (dirty) try { writeFileSync(HINT_STATE_FILE, JSON.stringify(state, null, 2)); } catch {}\n}\n\n// ============================================================\n// CLI Command Loop\n// ============================================================\n\nasync function runCommand() {\n  const [cmd, ...args] = process.argv.slice(2);\n  const cliLoadProject = (files) => {\n    const g = loadProject(files);\n    runHintsOnce(g);\n    return g;\n  };\n  const cliLoadGraph = (path) => {\n    const g = loadGraph(path);\n    runHintsOnce(g);\n    return g;\n  };\n  const cliLoadGraphOrProject = (path) => {\n    if (/\\.json$/i.test(path)) return cliLoadGraph(path);\n    return cliLoadProject([path]);\n  };\n\n  switch (cmd) {\n    case 'skeleton': {\n      if (!args[0]) return console.error('usage: skeleton <file>');\n      const g = cliLoadProject([args[0]]);\n      for (const b of g.all()) {\n        console.log(`${b.id} (${b.type})`);\n        for (const r of b.refs) console.log(`  ${r.kind} -> ${r.target}`);\n      }\n      break;\n    }\n    case 'focus': {\n      if (!args[0] || !args[1]) return console.error('usage: focus <file> <id>');\n      const g = cliLoadProject([args[0]]);\n      const b = g.get(args[1]);\n      if (!b) return console.error('not found:', args[1]);\n      console.log(b.content);\n      break;\n    }\n    case 'graph': {\n      if (args.length === 0) return console.error('usage: graph <file...>');\n      console.log(JSON.stringify(cliLoadProject(args).toJSON(), null, 2));\n      break;\n    }\n    case 'impact': {\n      if (!args[0] || !args[1]) return console.error('usage: impact <file> <id>');\n      const g = cliLoadProject([args[0]]);\n      for (const b of g.impact(args[1])) console.log(b.id);\n      break;\n    }\n    case 'self': {\n      const me = new URL(import.meta.url).pathname;\n      const blocks = parseJS(readFileSync(me, 'utf8'), 'ai-desk');\n      runHintsOnce(blocks);\n      console.log(`self-parse: ${blocks.length} blocks extracted from ${me}`);\n      for (const b of blocks) {\n        console.log(`  ${b.id.padEnd(40)} ${b.type.padEnd(10)} calls:${b.refs.filter(r => r.kind === 'calls').length} [${b.tags.join(',')}]`);\n      }\n      break;\n    }\n    case 'bible-info':\n      console.log(`BIBLE.js version: ${BIBLE_VERSION}`);\n      console.log(`[Axioms]`);\n      for (const a of Object.values(Axioms)) console.log(`  - ${a.id} ${a.name}`);\n      console.log(`\\nBlock types`);\n      for (const [name, t] of Object.entries(BlockTypes)) console.log(`  - ${name}: ${t.purpose.slice(0, 60)}`);\n      console.log(`\\nTaboos`);\n      for (const t of Taboos) console.log(`  ${t.id}. ${t.name}`);\n      console.log(`\\nVocabulary`);\n      for (const [k, v] of Object.entries(Vocabulary.use)) console.log(`  - ${k}: ${v.meaning}`);\n      for (const v of Vocabulary.avoid) console.log(`  - avoid ${v.term}: ${v.reason.slice(0, 60)}`);\n      break;\n    case 'bible-check': {\n      if (!args[0]) return console.error('usage: bible-check <file>');\n      const res = BibleKernel.diagnose(readFileSync(args[0], 'utf8'), args[0]);\n      console.log(JSON.stringify(res, null, 2));\n      if (!res.ok) process.exit(1);\n      break;\n    }\n    case 'bible-summon':\n      process.stdout.write(BibleKernel.summonContext(args, { spotlight: true }));\n      break;\n    case 'tag': {\n      if (!args[0] || !args[1]) return console.error('usage: tag <file> <tag>');\n      const g = cliLoadProject([args[0]]);\n      for (const b of g.byTag(args[1])) console.log(`  ${b.id} [${b.tags.join(',')}]`);\n      break;\n    }\n    case 'tags': {\n      if (!args[0]) return console.error('usage: tags <file>');\n      const g = cliLoadProject([args[0]]);\n      const counts = new Map();\n      for (const b of g.all()) for (const t of b.tags) counts.set(t, (counts.get(t) || 0) + 1);\n      for (const [t, c] of Array.from(counts.entries()).sort((a,b) => b[1]-a[1])) console.log(`  ${t.padEnd(15)} ${c}`);\n      break;\n    }\n    case 'save': {\n      if (args.length < 2) return console.error('usage: save <out.json> <files...>');\n      const [out, ...files] = args;\n      buildAndSave(files, out);\n      console.log(`saved → ${out}`);\n      break;\n    }\n    case 'load': {\n      if (!args[0]) return console.error('usage: load <in.json>');\n      const g = cliLoadGraph(args[0]);\n      const v = g.verify();\n      console.log(`loaded ${g.all().length} blocks, verify: ${JSON.stringify(v)}`);\n      if (v.ok) console.log('ok: true');\n      break;\n    }\n    case 'search': {\n      if (!args[0] || !args[1]) return console.error('usage: search <file> <query>');\n      const g = cliLoadProject([args[0]]);\n      const hits = g.search(args[1]);\n      for (const h of hits) console.log(`  ${h.block.id} (v${h.versionIndex})`);\n      console.log(`${hits.length} hits`);\n      break;\n    }\n    case 'diff': {\n      if (!args[0] || !args[1]) return console.error('usage: diff <file> <id> [i] [j]');\n      const g = cliLoadProject([args[0]]);\n      const b = g.get(args[1]);\n      if (!b) return console.error('not found:', args[1]);\n      console.log(JSON.stringify(b.diff(args[2]?Number(args[2]):null, args[3]?Number(args[3]):null), null, 2));\n      break;\n    }\n    case 'blame': {\n      if (!args[0] || !args[1] || !args[2]) return console.error('usage: blame <file> <id> <target>');\n      const g = cliLoadProject([args[0]]);\n      const b = g.get(args[1]);\n      if (!b) return console.error('not found:', args[1]);\n      console.log(JSON.stringify(b.blameRef(args[2]) || 'no such ref', null, 2));\n      break;\n    }\n    case 'apply': {\n      if (args.length < 3) return console.error('usage: apply <graph.json> <patch.js> <moduleId>');\n      const g = cliLoadGraph(args[0]);\n      const updates = applyPatch(g, readFileSync(args[1], 'utf8'), args[2]);\n      saveGraph(g, args[0]);\n      for (const u of updates) console.log(`  ${u.action.padEnd(10)} ${u.id}`);\n      break;\n    }\n    case 'apply-block': {\n      if (args.length < 3) return console.error('usage: apply-block <graph.json> <id> <patch|->');\n      const g = cliLoadGraph(args[0]);\n      const src = args[2] === '-' ? readFileSync(0, 'utf8') : readFileSync(args[2], 'utf8');\n      const res = applyBlockSmart(g, args[1], src);\n      saveGraph(g, args[0]);\n      console.log(`${res.action}: ${args[1]} (v${res.block.versions.length})`);\n      break;\n    }\n    case 'resolve': {\n      if (!args[0]) return console.error('usage: resolve <graph.json>');\n      const g = cliLoadGraph(args[0]);\n      const res = resolveImports(g);\n      saveGraph(g, args[0]);\n      console.log(`resolved in ${res.length} modules`);\n      break;\n    }\n    case 'lint': {\n      if (!args[0]) return console.error('usage: lint <file>');\n      const g = cliLoadProject([args[0]]);\n      const issues = g.lint();\n      for (const i of issues) console.log(`  ${i.kind.padEnd(15)} ${JSON.stringify(i)}`);\n      console.log(`${issues.length} issues`);\n      break;\n    }\n    case 'export': {\n      if (args.length < 2) return console.error('usage: export <graph.json> <moduleId> [out.js]');\n      const g = cliLoadGraph(args[0]);\n      const code = exportModule(g, args[1]);\n      if (args[2]) { writeFileSync(args[2], code); console.log(`exported → ${args[2]}`); }\n      else process.stdout.write(code);\n      break;\n    }\n    case 'stats': {\n      if (!args[0]) return console.error('usage: stats <file>');\n      console.log(JSON.stringify(graphStats(cliLoadProject([args[0]])), null, 2));\n      break;\n    }\n    case 'heavy': {\n      if (args.length < 2) return console.error('usage: heavy <file|graph.json> <root> [--depth=N]');\n      let d = Infinity; for (const a of args) { const m = a.match(/^--depth=(\\d+)$/); if (m) d = Number(m[1]); }\n      process.stdout.write(expandVirtualHeavy(cliLoadGraphOrProject(args[0]), args[1], { depth: d }));\n      break;\n    }\n    case 'virtual-apply': {\n      if (args.length < 3) return console.error('usage: virtual-apply <graph.json> <root> <patch>');\n      const g = cliLoadGraph(args[0]);\n      const src = args[2] === '-' ? readFileSync(0, 'utf8') : readFileSync(args[2], 'utf8');\n      for (const u of virtualApply(g, args[1], src)) console.log(`  ${u.action.padEnd(20)} ${u.id}`);\n      saveGraph(g, args[0]);\n      break;\n    }\n    case 'heavy-apply': {\n      if (args.length < 3) return console.error('usage: heavy-apply <graph.json> <root> <patch|-> [--depth=N] [--out=heavy.after.txt]');\n      let d = Infinity;\n      let outPath = null;\n      for (const a of args) {\n        const dm = a.match(/^--depth=(\\d+)$/); if (dm) d = Number(dm[1]);\n        const om = a.match(/^--out=(.+)$/); if (om) outPath = om[1];\n      }\n      const g = cliLoadGraph(args[0]);\n      const src = args[2] === '-' ? readFileSync(0, 'utf8') : readFileSync(args[2], 'utf8');\n      const result = heavyApply(g, args[1], src, { depth: d });\n      saveGraph(g, args[0]);\n      for (const u of result.updates) console.error(`  ${u.action.padEnd(20)} ${u.id}`);\n      console.error(`  reapplied heavy scope: ${result.blocks} blocks ${JSON.stringify(result.stats)}`);\n      if (outPath) { writeFileSync(outPath, result.expanded); console.error(`  expanded → ${outPath}`); }\n      else process.stdout.write(result.expanded);\n      break;\n    }\n    case 'mermaid': {\n      if (!args[0]) return console.error('usage: mermaid <file>');\n      console.log(exportMermaid(cliLoadProject([args[0]])));\n      break;\n    }\n    case 'infer-tags': {\n      if (args.length < 2) return console.error('usage: infer-tags <file> <id>');\n      const g = cliLoadProject([args[0]]);\n      const b = g.get(args[1]);\n      if (b) console.log(`tags: ${inferTags(b.content, b.type).join(', ')}`);\n      break;\n    }\n    case 'context': {\n      if (args.length < 2) return console.error('usage: context <file> <id> [depth]');\n      const g = cliLoadProject([args[0]]);\n      process.stdout.write(formatContextForLLM(blockContext(g, args[1], { depth: args[2]?Number(args[2]):1 }), args[1]));\n      break;\n    }\n    case 'e2e': {\n      // 実際の e2e.js を child process で起動(name と挙動を一致させる)\n      const { spawnSync } = await import('node:child_process');\n      const here = new URL('./e2e.js', import.meta.url).pathname;\n      const r = spawnSync('node', [here], { stdio: 'inherit' });\n      process.exit(r.status ?? 0);\n    }\n    case 'demo': {\n      runDemo();\n      break;\n    }\n    default:\n      console.log('ai-desk v2 — All-as-Block, Versions-as-Body architecture');\n      console.log('Block.versions が本体。すべてはここから派生する。');\n      console.log('');\n      console.log('first-time? → \"node ai-desk.js bible-info\" で公理 A0〜A13 を浴びる');\n      console.log('動作確認?    → \"node ai-desk.js demo\" で in-memory な Block / Graph を見る');\n      console.log('全テスト?    → \"node ai-desk.js e2e\" or \"npm test\"(185 tests, all green)');\n      console.log('');\n      console.log('Bible 系(まずここから):');\n      console.log('  bible-info, bible-check <file>, bible-summon');\n      console.log('');\n      console.log('Block / Graph 操作:');\n      console.log('  skeleton, focus, graph, impact, self, tag, tags, search, lint, stats, context');\n      console.log('  save, load, diff, blame, apply, apply-block, resolve, export, mermaid, infer-tags');\n      console.log('');\n      console.log('Virtual Heavy Function:');\n      console.log('  heavy, virtual-apply, heavy-apply');\n      console.log('');\n      console.log('テスト / デモ:');\n      console.log('  e2e(node e2e.js を spawn、114 tests), demo(in-memory 動作確認)');\n      break;\n  }\n}\n\n// 旧 runSelfTest を rename: ハードコード文字列だけで verify してないので「self-test」と\n// 名乗らせない。`demo` に rename して in-memory な Block / Graph 動作確認の position に。\nfunction runDemo() {\n  process.stdout.write('=== ai-desk demo (in-memory Block / Graph) ===\\n');\n  const a = new Block({ id: 'a', type: 'function' });\n  a.commit({ content: 'function a(){}' });\n  const b = new Block({ id: 'b', type: 'function' });\n  b.commit({ content: 'function b(){ a(); }', refs: [{ kind: 'calls', target: 'a' }] });\n  const g = new Graph([a, b]);\n  process.stdout.write(`graph size: ${g.all().length}\\n`);\n  process.stdout.write(`a impact (forward): ${JSON.stringify(g.impact('a').map(b => b.id))}\\n`);\n  process.stdout.write(`verify (hash chain): ${JSON.stringify(g.verify())}\\n`);\n  process.stdout.write('\\nOK(本物の test は \"node ai-desk.js e2e\" or \"npm test\")\\n');\n}\n\nif (typeof process !== 'undefined' && import.meta.url.endsWith(process.argv[1])) {\n  runCommand().catch(console.error);\n}\n",
      "ts": 1778788882014,
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
          "target": "./core.module.yume.js"
        },
        {
          "kind": "import",
          "target": "./bible.aiDoc.yume.js"
        },
        {
          "kind": "dynamic-import",
          "target": "node:child_process"
        },
        {
          "kind": "calls",
          "target": "Graph"
        },
        {
          "kind": "calls",
          "target": "readFileSync"
        },
        {
          "kind": "calls",
          "target": "parseMD"
        },
        {
          "kind": "calls",
          "target": "parseJS"
        },
        {
          "kind": "calls",
          "target": "writeFileSync"
        },
        {
          "kind": "calls",
          "target": "loadProject"
        },
        {
          "kind": "calls",
          "target": "saveGraph"
        },
        {
          "kind": "calls",
          "target": "exportModule"
        },
        {
          "kind": "calls",
          "target": "dirname"
        },
        {
          "kind": "calls",
          "target": "pathResolve"
        },
        {
          "kind": "calls",
          "target": "existsSync"
        },
        {
          "kind": "calls",
          "target": "Map"
        },
        {
          "kind": "calls",
          "target": "resolveImportsPure"
        },
        {
          "kind": "calls",
          "target": "nodeResolvePath"
        },
        {
          "kind": "calls",
          "target": "Set"
        },
        {
          "kind": "calls",
          "target": "runHintsOnce"
        },
        {
          "kind": "calls",
          "target": "loadGraph"
        },
        {
          "kind": "calls",
          "target": "cliLoadGraph"
        },
        {
          "kind": "calls",
          "target": "cliLoadProject"
        },
        {
          "kind": "calls",
          "target": "URL"
        },
        {
          "kind": "calls",
          "target": "buildAndSave"
        },
        {
          "kind": "calls",
          "target": "Number"
        },
        {
          "kind": "calls",
          "target": "applyPatch"
        },
        {
          "kind": "calls",
          "target": "applyBlockSmart"
        },
        {
          "kind": "calls",
          "target": "resolveImports"
        },
        {
          "kind": "calls",
          "target": "graphStats"
        },
        {
          "kind": "calls",
          "target": "expandVirtualHeavy"
        },
        {
          "kind": "calls",
          "target": "cliLoadGraphOrProject"
        },
        {
          "kind": "calls",
          "target": "virtualApply"
        },
        {
          "kind": "calls",
          "target": "heavyApply"
        },
        {
          "kind": "calls",
          "target": "exportMermaid"
        },
        {
          "kind": "calls",
          "target": "inferTags"
        },
        {
          "kind": "calls",
          "target": "formatContextForLLM"
        },
        {
          "kind": "calls",
          "target": "blockContext"
        },
        {
          "kind": "calls",
          "target": "spawnSync"
        },
        {
          "kind": "calls",
          "target": "runDemo"
        },
        {
          "kind": "calls",
          "target": "Block"
        },
        {
          "kind": "calls",
          "target": "runCommand"
        }
      ],
      "tags": [],
      "applyId": null
    }
  ]
};

// === HEAD ===
// ai-desk.js
// Node.js CLI Shell for ai-desk v2
//
// This file handles I/O (filesystem, process) and delegates logic to ai-desk-core.js.
// Isomorphic Architecture: logic is platform-agnostic, shell is Node-specific.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve as pathResolve } from 'node:path';
import {
  Block, Graph, parseJS, parseMD, checkBraces, inferTags,
  exportModule, exportMermaid,
  virtualHeavy, expandVirtualHeavy, virtualApply, heavyApply,
  applyToBlock, applyBlockSmart, applyPatch, resolveImportsPure,
  constraintBlock, evalConstraint,
  observationBlock,
  graphStats, blockContext, formatContextForLLM,
  sameArr, sameRefs, hashVersion
} from './core.module.yume.js';
import {
  Axioms, BlockTypes, Taboos, Vocabulary,
  Kernel as BibleKernel, VERSION as BIBLE_VERSION,
} from './bible.aiDoc.yume.js';

// ============================================================
// Node-specific I/O helpers
// ============================================================

export function loadProject(files) {
  const graph = new Graph();
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    const blocks = f.endsWith('.md') ? parseMD(src, f) : parseJS(src, f);
    for (const b of blocks) graph.add(b);
  }
  return graph;
}

export function saveGraph(graph, path) {
  writeFileSync(path, JSON.stringify(graph.toJSON(), null, 2));
  return path;
}

export function loadGraph(path) {
  return Graph.fromJSON(JSON.parse(readFileSync(path, 'utf8')));
}

export function buildAndSave(files, outPath) {
  const g = loadProject(files);
  saveGraph(g, outPath);
  return g;
}

export function exportToFile(graph, moduleId, outPath) {
  const code = exportModule(graph, moduleId);
  writeFileSync(outPath, code);
  return outPath;
}

// Node-specific path resolver for resolveImports
function nodeResolvePath(fromId, target) {
  const baseDir = dirname(pathResolve(fromId));
  const abs = pathResolve(baseDir, target);
  const cand = [abs, abs + '.js', abs + '/index.js'].find(c => existsSync(c));
  return cand ? pathResolve(cand) : pathResolve(abs);
}

export function resolveImports(graph) {
  // graph 内の module は絶対パスで正規化しておく必要がある
  const idToAbs = new Map();
  for (const b of graph.byType('module')) idToAbs.set(pathResolve(b.id), b.id);

  return resolveImportsPure(graph, (mId, target) => {
    const abs = nodeResolvePath(mId, target);
    return idToAbs.get(abs);
  });
}

// ============================================================
// CLI hints
// ============================================================

const HINT_STATE_FILE = '.ai-desk-state.json';
const HINTS = [
  {
    key: '3dplus',
    detect: (g) => {
      const pats = [/\bWebGL2?\b/, /\bWebGPU\b/i, /\bTHREE\./, /\bnew\s+THREE\b/, /\b(?:Mat4|Matrix4|Vector3|Vec3|Quaternion)\b/];
      const matched = new Set();
      for (const b of g.all()) {
        const c = b.content || '';
        for (const re of pats) { const m = re.exec(c); if (m) matched.add(m[0]); if (matched.size >= 5) break; }
        if (matched.size >= 5) break;
      }
      return matched.size > 0 ? [...matched] : null;
    },
    render: (m) => `\n─── ai-desk hint ───\n  3D code detected: ${m.join(', ')}\n  → v2/3dplus/ provides a CPU 3D Twin.\n────────────────────\n`,
  },
];

function runHintsOnce(graphOrBlocks) {
  const g = (typeof graphOrBlocks.all === 'function') ? graphOrBlocks : { all: () => graphOrBlocks };
  let state = { hints_shown: [] };
  try { state = JSON.parse(readFileSync(HINT_STATE_FILE, 'utf8')); } catch {}
  let dirty = false;
  for (const h of HINTS) {
    if (state.hints_shown.includes(h.key)) continue;
    const m = h.detect(g);
    if (m) { process.stderr.write(h.render(m)); state.hints_shown.push(h.key); dirty = true; }
  }
  if (dirty) try { writeFileSync(HINT_STATE_FILE, JSON.stringify(state, null, 2)); } catch {}
}

// ============================================================
// CLI Command Loop
// ============================================================

async function runCommand() {
  const [cmd, ...args] = process.argv.slice(2);
  const cliLoadProject = (files) => {
    const g = loadProject(files);
    runHintsOnce(g);
    return g;
  };
  const cliLoadGraph = (path) => {
    const g = loadGraph(path);
    runHintsOnce(g);
    return g;
  };
  const cliLoadGraphOrProject = (path) => {
    if (/\.json$/i.test(path)) return cliLoadGraph(path);
    return cliLoadProject([path]);
  };

  switch (cmd) {
    case 'skeleton': {
      if (!args[0]) return console.error('usage: skeleton <file>');
      const g = cliLoadProject([args[0]]);
      for (const b of g.all()) {
        console.log(`${b.id} (${b.type})`);
        for (const r of b.refs) console.log(`  ${r.kind} -> ${r.target}`);
      }
      break;
    }
    case 'focus': {
      if (!args[0] || !args[1]) return console.error('usage: focus <file> <id>');
      const g = cliLoadProject([args[0]]);
      const b = g.get(args[1]);
      if (!b) return console.error('not found:', args[1]);
      console.log(b.content);
      break;
    }
    case 'graph': {
      if (args.length === 0) return console.error('usage: graph <file...>');
      console.log(JSON.stringify(cliLoadProject(args).toJSON(), null, 2));
      break;
    }
    case 'impact': {
      if (!args[0] || !args[1]) return console.error('usage: impact <file> <id>');
      const g = cliLoadProject([args[0]]);
      for (const b of g.impact(args[1])) console.log(b.id);
      break;
    }
    case 'self': {
      const me = new URL(import.meta.url).pathname;
      const blocks = parseJS(readFileSync(me, 'utf8'), 'ai-desk');
      runHintsOnce(blocks);
      console.log(`self-parse: ${blocks.length} blocks extracted from ${me}`);
      for (const b of blocks) {
        console.log(`  ${b.id.padEnd(40)} ${b.type.padEnd(10)} calls:${b.refs.filter(r => r.kind === 'calls').length} [${b.tags.join(',')}]`);
      }
      break;
    }
    case 'bible-info':
      console.log(`BIBLE.js version: ${BIBLE_VERSION}`);
      console.log(`[Axioms]`);
      for (const a of Object.values(Axioms)) console.log(`  - ${a.id} ${a.name}`);
      console.log(`\nBlock types`);
      for (const [name, t] of Object.entries(BlockTypes)) console.log(`  - ${name}: ${t.purpose.slice(0, 60)}`);
      console.log(`\nTaboos`);
      for (const t of Taboos) console.log(`  ${t.id}. ${t.name}`);
      console.log(`\nVocabulary`);
      for (const [k, v] of Object.entries(Vocabulary.use)) console.log(`  - ${k}: ${v.meaning}`);
      for (const v of Vocabulary.avoid) console.log(`  - avoid ${v.term}: ${v.reason.slice(0, 60)}`);
      break;
    case 'bible-check': {
      if (!args[0]) return console.error('usage: bible-check <file>');
      const res = BibleKernel.diagnose(readFileSync(args[0], 'utf8'), args[0]);
      console.log(JSON.stringify(res, null, 2));
      if (!res.ok) process.exit(1);
      break;
    }
    case 'bible-summon':
      process.stdout.write(BibleKernel.summonContext(args, { spotlight: true }));
      break;
    case 'tag': {
      if (!args[0] || !args[1]) return console.error('usage: tag <file> <tag>');
      const g = cliLoadProject([args[0]]);
      for (const b of g.byTag(args[1])) console.log(`  ${b.id} [${b.tags.join(',')}]`);
      break;
    }
    case 'tags': {
      if (!args[0]) return console.error('usage: tags <file>');
      const g = cliLoadProject([args[0]]);
      const counts = new Map();
      for (const b of g.all()) for (const t of b.tags) counts.set(t, (counts.get(t) || 0) + 1);
      for (const [t, c] of Array.from(counts.entries()).sort((a,b) => b[1]-a[1])) console.log(`  ${t.padEnd(15)} ${c}`);
      break;
    }
    case 'save': {
      if (args.length < 2) return console.error('usage: save <out.json> <files...>');
      const [out, ...files] = args;
      buildAndSave(files, out);
      console.log(`saved → ${out}`);
      break;
    }
    case 'load': {
      if (!args[0]) return console.error('usage: load <in.json>');
      const g = cliLoadGraph(args[0]);
      const v = g.verify();
      console.log(`loaded ${g.all().length} blocks, verify: ${JSON.stringify(v)}`);
      if (v.ok) console.log('ok: true');
      break;
    }
    case 'search': {
      if (!args[0] || !args[1]) return console.error('usage: search <file> <query>');
      const g = cliLoadProject([args[0]]);
      const hits = g.search(args[1]);
      for (const h of hits) console.log(`  ${h.block.id} (v${h.versionIndex})`);
      console.log(`${hits.length} hits`);
      break;
    }
    case 'diff': {
      if (!args[0] || !args[1]) return console.error('usage: diff <file> <id> [i] [j]');
      const g = cliLoadProject([args[0]]);
      const b = g.get(args[1]);
      if (!b) return console.error('not found:', args[1]);
      console.log(JSON.stringify(b.diff(args[2]?Number(args[2]):null, args[3]?Number(args[3]):null), null, 2));
      break;
    }
    case 'blame': {
      if (!args[0] || !args[1] || !args[2]) return console.error('usage: blame <file> <id> <target>');
      const g = cliLoadProject([args[0]]);
      const b = g.get(args[1]);
      if (!b) return console.error('not found:', args[1]);
      console.log(JSON.stringify(b.blameRef(args[2]) || 'no such ref', null, 2));
      break;
    }
    case 'apply': {
      if (args.length < 3) return console.error('usage: apply <graph.json> <patch.js> <moduleId>');
      const g = cliLoadGraph(args[0]);
      const updates = applyPatch(g, readFileSync(args[1], 'utf8'), args[2]);
      saveGraph(g, args[0]);
      for (const u of updates) console.log(`  ${u.action.padEnd(10)} ${u.id}`);
      break;
    }
    case 'apply-block': {
      if (args.length < 3) return console.error('usage: apply-block <graph.json> <id> <patch|->');
      const g = cliLoadGraph(args[0]);
      const src = args[2] === '-' ? readFileSync(0, 'utf8') : readFileSync(args[2], 'utf8');
      const res = applyBlockSmart(g, args[1], src);
      saveGraph(g, args[0]);
      console.log(`${res.action}: ${args[1]} (v${res.block.versions.length})`);
      break;
    }
    case 'resolve': {
      if (!args[0]) return console.error('usage: resolve <graph.json>');
      const g = cliLoadGraph(args[0]);
      const res = resolveImports(g);
      saveGraph(g, args[0]);
      console.log(`resolved in ${res.length} modules`);
      break;
    }
    case 'lint': {
      if (!args[0]) return console.error('usage: lint <file>');
      const g = cliLoadProject([args[0]]);
      const issues = g.lint();
      for (const i of issues) console.log(`  ${i.kind.padEnd(15)} ${JSON.stringify(i)}`);
      console.log(`${issues.length} issues`);
      break;
    }
    case 'export': {
      if (args.length < 2) return console.error('usage: export <graph.json> <moduleId> [out.js]');
      const g = cliLoadGraph(args[0]);
      const code = exportModule(g, args[1]);
      if (args[2]) { writeFileSync(args[2], code); console.log(`exported → ${args[2]}`); }
      else process.stdout.write(code);
      break;
    }
    case 'stats': {
      if (!args[0]) return console.error('usage: stats <file>');
      console.log(JSON.stringify(graphStats(cliLoadProject([args[0]])), null, 2));
      break;
    }
    case 'heavy': {
      if (args.length < 2) return console.error('usage: heavy <file|graph.json> <root> [--depth=N]');
      let d = Infinity; for (const a of args) { const m = a.match(/^--depth=(\d+)$/); if (m) d = Number(m[1]); }
      process.stdout.write(expandVirtualHeavy(cliLoadGraphOrProject(args[0]), args[1], { depth: d }));
      break;
    }
    case 'virtual-apply': {
      if (args.length < 3) return console.error('usage: virtual-apply <graph.json> <root> <patch>');
      const g = cliLoadGraph(args[0]);
      const src = args[2] === '-' ? readFileSync(0, 'utf8') : readFileSync(args[2], 'utf8');
      for (const u of virtualApply(g, args[1], src)) console.log(`  ${u.action.padEnd(20)} ${u.id}`);
      saveGraph(g, args[0]);
      break;
    }
    case 'heavy-apply': {
      if (args.length < 3) return console.error('usage: heavy-apply <graph.json> <root> <patch|-> [--depth=N] [--out=heavy.after.txt]');
      let d = Infinity;
      let outPath = null;
      for (const a of args) {
        const dm = a.match(/^--depth=(\d+)$/); if (dm) d = Number(dm[1]);
        const om = a.match(/^--out=(.+)$/); if (om) outPath = om[1];
      }
      const g = cliLoadGraph(args[0]);
      const src = args[2] === '-' ? readFileSync(0, 'utf8') : readFileSync(args[2], 'utf8');
      const result = heavyApply(g, args[1], src, { depth: d });
      saveGraph(g, args[0]);
      for (const u of result.updates) console.error(`  ${u.action.padEnd(20)} ${u.id}`);
      console.error(`  reapplied heavy scope: ${result.blocks} blocks ${JSON.stringify(result.stats)}`);
      if (outPath) { writeFileSync(outPath, result.expanded); console.error(`  expanded → ${outPath}`); }
      else process.stdout.write(result.expanded);
      break;
    }
    case 'mermaid': {
      if (!args[0]) return console.error('usage: mermaid <file>');
      console.log(exportMermaid(cliLoadProject([args[0]])));
      break;
    }
    case 'infer-tags': {
      if (args.length < 2) return console.error('usage: infer-tags <file> <id>');
      const g = cliLoadProject([args[0]]);
      const b = g.get(args[1]);
      if (b) console.log(`tags: ${inferTags(b.content, b.type).join(', ')}`);
      break;
    }
    case 'context': {
      if (args.length < 2) return console.error('usage: context <file> <id> [depth]');
      const g = cliLoadProject([args[0]]);
      process.stdout.write(formatContextForLLM(blockContext(g, args[1], { depth: args[2]?Number(args[2]):1 }), args[1]));
      break;
    }
    case 'e2e': {
      // 実際の e2e.js を child process で起動(name と挙動を一致させる)
      const { spawnSync } = await import('node:child_process');
      const here = new URL('./e2e.js', import.meta.url).pathname;
      const r = spawnSync('node', [here], { stdio: 'inherit' });
      process.exit(r.status ?? 0);
    }
    case 'demo': {
      runDemo();
      break;
    }
    default:
      console.log('ai-desk v2 — All-as-Block, Versions-as-Body architecture');
      console.log('Block.versions が本体。すべてはここから派生する。');
      console.log('');
      console.log('first-time? → "node ai-desk.js bible-info" で公理 A0〜A13 を浴びる');
      console.log('動作確認?    → "node ai-desk.js demo" で in-memory な Block / Graph を見る');
      console.log('全テスト?    → "node ai-desk.js e2e" or "npm test"(185 tests, all green)');
      console.log('');
      console.log('Bible 系(まずここから):');
      console.log('  bible-info, bible-check <file>, bible-summon');
      console.log('');
      console.log('Block / Graph 操作:');
      console.log('  skeleton, focus, graph, impact, self, tag, tags, search, lint, stats, context');
      console.log('  save, load, diff, blame, apply, apply-block, resolve, export, mermaid, infer-tags');
      console.log('');
      console.log('Virtual Heavy Function:');
      console.log('  heavy, virtual-apply, heavy-apply');
      console.log('');
      console.log('テスト / デモ:');
      console.log('  e2e(node e2e.js を spawn、114 tests), demo(in-memory 動作確認)');
      break;
  }
}

// 旧 runSelfTest を rename: ハードコード文字列だけで verify してないので「self-test」と
// 名乗らせない。`demo` に rename して in-memory な Block / Graph 動作確認の position に。
function runDemo() {
  process.stdout.write('=== ai-desk demo (in-memory Block / Graph) ===\n');
  const a = new Block({ id: 'a', type: 'function' });
  a.commit({ content: 'function a(){}' });
  const b = new Block({ id: 'b', type: 'function' });
  b.commit({ content: 'function b(){ a(); }', refs: [{ kind: 'calls', target: 'a' }] });
  const g = new Graph([a, b]);
  process.stdout.write(`graph size: ${g.all().length}\n`);
  process.stdout.write(`a impact (forward): ${JSON.stringify(g.impact('a').map(b => b.id))}\n`);
  process.stdout.write(`verify (hash chain): ${JSON.stringify(g.verify())}\n`);
  process.stdout.write('\nOK(本物の test は "node ai-desk.js e2e" or "npm test")\n');
}

if (typeof process !== 'undefined' && import.meta.url.endsWith(process.argv[1])) {
  const legacyVerbs = new Set([
    'skeleton', 'focus', 'graph', 'impact', 'self', 'tag', 'tags',
    'bible-info', 'bible-check', 'bible-summon', 'save', 'load', 'search',
    'diff', 'blame', 'apply', 'apply-block', 'resolve', 'lint', 'export',
    'stats', 'heavy', 'virtual-apply', 'heavy-apply', 'mermaid', 'infer-tags',
    'context', 'e2e', 'demo'
  ]);
  const verb = process.argv[2];

  if (legacyVerbs.has(verb) || !verb) {
    await runCommand().catch(console.error);
  } else {
    const path = __block.runtime.path ?? `./runtimes/ver${__block.runtime.version}.handle.yume.js`;
    const rt = await import(path);
    await rt.cli(import.meta.url, __block, process.argv);
  }
}

// === /HEAD ===
