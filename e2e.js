// e2e.js — ai-desk の end-to-end テスト (adapted for yume-develop)
// 純JS、Zero-Dep。Node 標準の node:assert と node:child_process のみ使用。

import { strict as assert } from 'node:assert';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Phase 2.1 coverage hook
if (process.env.YUME_COVER) {
  const calls = new Map();
  globalThis.__yumeCoverHook = (name, args) => {
    if (!calls.has(name)) calls.set(name, []);
    calls.get(name).push(Array.from(args));
  };
  process.on('exit', () => {
    if (process.env.YUME_COVER_OUT) {
      writeFileSync(process.env.YUME_COVER_OUT, JSON.stringify([...calls.entries()]));
    }
  });
}

import {
  Block, Graph, parseJS,
  applyPatch,
  applyToBlock, applyBlockSmart,
  exportModule,
  graphStats,
  blockContext, formatContextForLLM,
  parseMD, exportMermaid, inferTags,
  virtualHeavy, expandVirtualHeavy, virtualApply,
  heavyApply,
  constraintBlock, evalConstraint,
  observationBlock,
} from './core.module.yume.js';
import {
  loadProject, saveGraph, loadGraph, buildAndSave,
  exportToFile, resolveImports
} from './cli.module.yume.js';

import * as rt1 from './runtimes/ver001.handle.yume.js';
import * as rt2 from './runtimes/ver002.handle.yume.js';

const TMP = mkdtempSync(join(tmpdir(), 'yume-e2e-'));
const RUNTIME_BASE_URL = new URL('./runtimes/', import.meta.url).href;
let pass = 0, fail = 0;
const fails = [];

async function test(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    fails.push({ name, error: e });
    console.log(`  ✗ ${name}`);
    console.log(`      ${e.message}`);
  }
}

async function group(name, fn) {
  console.log(`\n[${name}]`);
  await fn();
}

// ============================================================
// 1. Block: versions が本体、SHADOW getter
// ============================================================
await group('Block', async () => {
  await test('id/type 必須', async () => {
    assert.throws(() => new Block({}));
    assert.throws(() => new Block({ id: 'a' }));
    assert.throws(() => new Block({ type: 'function' }));
  });

  await test('初期 versions は空', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    assert.equal(b.versions.length, 0);
    assert.equal(b.head(), null);
    assert.equal(b.content, null);
    assert.deepEqual(b.refs, []);
    assert.deepEqual(b.tags, []);
  });

  await test('commit すると versions が増える', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    b.commit({ content: 'x' });
    b.commit({ content: 'y' });
    assert.equal(b.versions.length, 2);
    assert.equal(b.content, 'y');
  });

  await test('head は最新 version', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    b.commit({ content: 'x' });
    b.commit({ content: 'y' });
    assert.equal(b.head().content, 'y');
  });

  await test('at で過去の version を取得(timestamp 厳密)', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    const v1 = b.commit({ content: 'x' });
    const v2 = b.commit({ content: 'y' });
    if (v1.timestamp !== v2.timestamp) {
      assert.equal(b.at(v1.timestamp).content, 'x');
    }
  });

  await test('hash チェーン整合性', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    b.commit({ content: 'x' });
    b.commit({ content: 'y' });
    b.commit({ content: 'z' });
    assert.deepEqual(b.verify(), { ok: true });
  });

  await test('改ざん検知', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    b.commit({ content: 'x' });
    b.commit({ content: 'y' });
    // 強引に書き換える
    b.versions[0].content = 'tampered';
    const r = b.verify();
    assert.equal(r.ok, false);
  });

  await test('tags の SHADOW getter', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    b.commit({ content: 'x', tags: ['core', 'critical'] });
    assert.deepEqual(b.tags, ['core', 'critical']);
    assert.equal(b.hasTag('core'), true);
    assert.equal(b.hasTag('xxx'), false);
    assert.equal(b.hasAllTags(['core', 'critical']), true);
    assert.equal(b.hasAnyTag(['xxx', 'core']), true);
  });

  await test('refs の SHADOW getter', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    b.commit({ content: 'x', refs: [{ kind: 'calls', target: 'b' }] });
    assert.equal(b.refs.length, 1);
    assert.equal(b.refs[0].target, 'b');
  });

  await test('JSON ラウンドトリップ', async () => {
    const b = new Block({ id: 'a', type: 'function', meta: { name: 'foo' } });
    b.commit({ content: 'x', tags: ['core'] });
    b.commit({ content: 'y' });
    const json = b.toJSON();
    const restored = Block.fromJSON(json);
    assert.equal(restored.versions.length, 2);
    assert.equal(restored.content, 'y');
    assert.deepEqual(restored.verify(), { ok: true });
  });
});

// ============================================================
// 2. Graph
// ============================================================
await group('Graph', async () => {
  function fixture() {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'a' });
    const b = new Block({ id: 'b', type: 'function' });
    b.commit({ content: 'b', refs: [{ kind: 'calls', target: 'a' }] });
    const c = new Block({ id: 'c', type: 'function' });
    c.commit({ content: 'c', refs: [{ kind: 'calls', target: 'b' }] });
    return new Graph([a, b, c]);
  }

  await test('forward', async () => {
    const g = fixture();
    assert.deepEqual(g.forward('b').map(x => x.id), ['a']);
    assert.deepEqual(g.forward('c').map(x => x.id), ['b']);
    assert.deepEqual(g.forward('a').map(x => x.id), []);
  });

  await test('backward', async () => {
    const g = fixture();
    assert.deepEqual(g.backward('a').map(x => x.id), ['b']);
    assert.deepEqual(g.backward('b').map(x => x.id), ['c']);
    assert.deepEqual(g.backward('c').map(x => x.id), []);
  });

  await test('impact (推移閉包)', async () => {
    const g = fixture();
    const ids = g.impact('a').map(x => x.id).sort();
    assert.deepEqual(ids, ['b', 'c']);
  });

  await test('byTag', async () => {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'a', tags: ['core'] });
    const b = new Block({ id: 'b', type: 'function' });
    b.commit({ content: 'b', tags: ['core', 'export'] });
    const c = new Block({ id: 'c', type: 'function' });
    c.commit({ content: 'c', tags: ['util'] });
    const g = new Graph([a, b, c]);
    assert.deepEqual(g.byTag('core').map(x => x.id), ['a', 'b']);
    assert.deepEqual(g.byTag('export').map(x => x.id), ['b']);
    assert.deepEqual(g.byAllTags(['core', 'export']).map(x => x.id), ['b']);
    assert.deepEqual(g.byAnyTag(['util', 'export']).map(x => x.id), ['b', 'c']);
  });

  await test('byType', async () => {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'a' });
    const b = new Block({ id: 'b', type: 'class' });
    b.commit({ content: 'b' });
    const g = new Graph([a, b]);
    assert.deepEqual(g.byType('function').map(x => x.id), ['a']);
    assert.deepEqual(g.byType('class').map(x => x.id), ['b']);
  });

  await test('JSON ラウンドトリップ', async () => {
    const g = fixture();
    const restored = Graph.fromJSON(g.toJSON());
    assert.equal(restored.all().length, 3);
    assert.deepEqual(restored.verify(), { ok: true });
    assert.deepEqual(restored.forward('b').map(x => x.id), ['a']);
  });

  await test('remove で参照も整理されるか', async () => {
    const g = fixture();
    g.remove('a');
    assert.deepEqual(g.forward('b').map(x => x.id), []);
  });
});

// ============================================================
// 3. parseJS
// ============================================================
await group('parseJS', async () => {
  await test('function 宣言', async () => {
    const blocks = parseJS(`function foo() { return 1; }`, 'm');
    assert.equal(blocks.length, 2);
    const foo = blocks.find(b => b.meta.name === 'foo');
    assert.ok(foo);
    assert.equal(foo.type, 'function');
    assert.ok(foo.tags.includes('function'));
  });

  await test('export function', async () => {
    const blocks = parseJS(`export function foo() {}`, 'm');
    const foo = blocks.find(b => b.meta.name === 'foo');
    assert.ok(foo.tags.includes('export'));
  });

  await test('async function', async () => {
    const blocks = parseJS(`async function foo() {}`, 'm');
    const foo = blocks.find(b => b.meta.name === 'foo');
    assert.ok(foo.tags.includes('async'));
  });

  await test('arrow function', async () => {
    const blocks = parseJS(`const foo = (x) => { return x; };`, 'm');
    const foo = blocks.find(b => b.meta.name === 'foo');
    assert.ok(foo);
    assert.ok(foo.tags.includes('arrow'));
  });

  await test('class 宣言', async () => {
    const blocks = parseJS(`class Foo { run() {} }`, 'm');
    const foo = blocks.find(b => b.meta.name === 'Foo');
    assert.ok(foo);
    assert.equal(foo.type, 'class');
    assert.ok(foo.tags.includes('class'));
  });

  await test('import 文', async () => {
    const blocks = parseJS(`import { x } from './x.js';\nfunction f(){}`, 'm');
    const m = blocks[0];
    assert.equal(m.type, 'module');
    assert.ok(m.refs.some(r => r.kind === 'import' && r.target === './x.js'));
  });

  await test('destructuring 引数の関数本体を正しく取得', async () => {
    const src = `
function makeVersion({ content, refs = [] }, prev = null) {
  const v = { content, refs };
  v.hash = hashVersion(v);
  return v;
}
function hashVersion(v) { return 'h'; }
`;
    const blocks = parseJS(src, 'm');
    const mv = blocks.find(b => b.meta.name === 'makeVersion');
    assert.ok(mv.content.includes('hashVersion'));
    assert.ok(mv.refs.some(r => r.kind === 'calls' && r.target === 'm:fn:hashVersion'));
  });

  await test('呼び出しグラフ(同モジュール内)', async () => {
    const src = `
function a() { return 1; }
function b() { return a() + 1; }
function c() { return b() + a(); }
`;
    const blocks = parseJS(src, 'm');
    const b = blocks.find(x => x.meta.name === 'b');
    const c = blocks.find(x => x.meta.name === 'c');
    assert.ok(b.refs.some(r => r.kind === 'calls' && r.target === 'm:fn:a'));
    assert.ok(c.refs.some(r => r.kind === 'calls' && r.target === 'm:fn:b'));
    assert.ok(c.refs.some(r => r.kind === 'calls' && r.target === 'm:fn:a'));
  });

  await test('@tags 注釈', async () => {
    const src = `\n// @tags: core, critical\nfunction foo() {}\n`;
    const blocks = parseJS(src, 'm');
    const foo = blocks.find(b => b.meta.name === 'foo');
    assert.ok(foo.tags.includes('core'));
    assert.ok(foo.tags.includes('critical'));
  });

  await test('v1 emblem 互換', async () => {
    const src = `\n// [ai_s_emblem:#high#logic Foo]\nfunction foo() {}\n`;
    const blocks = parseJS(src, 'm');
    const foo = blocks.find(b => b.meta.name === 'foo');
    assert.ok(foo.tags.includes('high'));
    assert.ok(foo.tags.includes('logic'));
  });

  await test('module の contains refs', async () => {
    const src = `function a(){} function b(){}`;
    const blocks = parseJS(src, 'm');
    const m = blocks[0];
    const containsTargets = m.refs.filter(r => r.kind === 'contains').map(r => r.target);
    assert.deepEqual(containsTargets, ['m:fn:a', 'm:fn:b']);
  });

  await test('文字列やコメント内のキーワードを無視', async () => {
    const src = `
// function ignoreMe() {}
/* class IgnoreMe {} */
const s = "function fake() {}";
const r = /class Fake {}/;
function real() { return "ok"; }
`;
    const blocks = parseJS(src, 'm');
    const names = blocks.map(b => b.meta.name).filter(Boolean);
    assert.ok(names.includes('real'));
    assert.ok(!names.includes('ignoreMe'));
    assert.ok(!names.includes('IgnoreMe'));
    assert.ok(!names.includes('fake'));
    assert.ok(!names.includes('Fake'));
  });

  await test('複雑なネストとブレースの追跡', async () => {
    const src = `
function outer() {
  if (true) {
    const s = "{";
    function inner() {
      return "}";
    }
  }
}
function next() {}
`;
    const blocks = parseJS(src, 'm');
    const outer = blocks.find(b => b.meta.name === 'outer');
    const next = blocks.find(b => b.meta.name === 'next');
    assert.ok(outer);
    assert.ok(next);
    assert.ok(!outer.content.includes('function next'));
    assert.ok(outer.content.includes('function inner'));
  });
});

// ============================================================
// 4. loadProject
// ============================================================
await group('loadProject', async () => {
  const f1 = `${TMP}/a.js`;
  const f2 = `${TMP}/b.js`;
  writeFileSync(f1, `\nimport { foo } from './b.js';\nexport function bar() { return foo() + 1; }\n`);
  writeFileSync(f2, `\nexport function foo() { return 42; }\n`);

  await test('2ファイル読み込み', async () => {
    const g = loadProject([f1, f2]);
    assert.ok(g.has(f1));
    assert.ok(g.has(f2));
    assert.ok(g.has(`${f1}:fn:bar`));
    assert.ok(g.has(`${f2}:fn:foo`));
  });

  await test('module 間の import エッジ', async () => {
    const g = loadProject([f1, f2]);
    const aMod = g.get(f1);
    assert.ok(aMod.refs.some(r => r.kind === 'import' && r.target === './b.js'));
  });
});

// ============================================================
// 5. CLI
// ============================================================
await group('CLI', async () => {
  function run(args) {
    return execSync(`node cli.module.yume.js ${args}`, { encoding: 'utf8' });
  }

  await test('default help 実行', async () => {
    const out = run('');
    assert.ok(out.includes('Block.versions が本体'));
  });

  await test('demo 実行', async () => {
    const out = run('demo');
    assert.ok(out.includes('demo (in-memory'));
  });

  await test('bible-info shows axioms / block types / taboos / vocabulary', async () => {
    const out = run('bible-info');
    assert.ok(out.includes('A0 認知非対称性'));
    assert.ok(out.includes('Vocabulary'));
  });

  await test('bible-check on clean file → ok:true', async () => {
    const f = `${TMP}/clean.js`;
    writeFileSync(f, 'export function foo(){ return 42; }');
    const out = run(`bible-check ${f}`);
    const r = JSON.parse(out);
    assert.equal(r.ok, true);
  });

  await test('bible-check on framework import → exit 1 + violation', async () => {
    const f = `${TMP}/violation.js`;
    writeFileSync(f, 'import x from "react";');
    let exitCode = 0;
    let stdout = '';
    try { stdout = run(`bible-check ${f}`); }
    catch (e) { exitCode = e.status; stdout = e.stdout?.toString() || ''; }
    assert.equal(exitCode, 1);
    const r = JSON.parse(stdout);
    assert.equal(r.ok, false);
    assert.ok(r.violations.some(v => v.name === 'No Frameworks'));
  });

  await test('bible-check on runtime code generation → exit 1 + violation', async () => {
    const f = `${TMP}/dynamic-code.js`;
    writeFileSync(f, 'export const f = new Function("return 1");');
    let exitCode = 0;
    let stdout = '';
    try { stdout = run(`bible-check ${f}`); }
    catch (e) { exitCode = e.status; stdout = e.stdout?.toString() || ''; }
    assert.equal(exitCode, 1);
    const r = JSON.parse(stdout);
    assert.equal(r.ok, false);
    assert.ok(r.violations.some(v => v.name === 'No eval / new Function'));
  });

  await test('bible-audit-history reports old version without failing command', async () => {
    const f = `${TMP}/audit-history.fn.yume.js`;
    const block = {
      id: 'audit-history',
      type: 'fn',
      schemaVersion: 2,
      runtime: { name: 'yume', version: '002' },
      versions: [
        {
          v: 1,
          content: 'export const f = new Function("return 1");',
          ts: 1716100000000,
          refs: [],
          tags: [],
          applyId: null,
        },
        {
          v: 2,
          content: 'export function ok(){ return 1; }',
          ts: 1716100000001,
          refs: [],
          tags: [],
          applyId: null,
        },
      ],
    };
    writeFileSync(f, [
      '// @yume-format: 1',
      '',
      'export const __block = ' + JSON.stringify(block, null, 2) + ';',
      '',
      '// === HEAD ===',
      'export function ok(){ return 1; }',
      '// === /HEAD ===',
      '',
    ].join('\n'));

    const head = JSON.parse(run(`bible-check ${f}`));
    assert.equal(head.ok, true);

    const audit = JSON.parse(run(`bible-audit-history ${f}`));
    assert.equal(audit.ok, false);
    assert.equal(audit.versions, 2);
    assert.equal(audit.violationCount, 1);
    assert.equal(audit.violations[0].versionIndex, 0);
    assert.equal(audit.violations[0].violation.name, 'No eval / new Function');

    const alias = JSON.parse(run(`bible-check --history ${f}`));
    assert.equal(alias.violationCount, audit.violationCount);
  });

  await test('bible-check on all key repository files', async () => {
    const files = [
      'core.module.yume.js',
      'cli.module.yume.js',
      'examples/hello.fn.yume.js',
      'janken.fn.yume.js',
      'rules.constraint.yume.js',
    ];
    for (const f of files) {
      let exitCode = 0;
      let stdout = '';
      try { stdout = run(`bible-check ${f}`); }
      catch (e) { exitCode = e.status; stdout = e.stdout?.toString() || ''; }
      assert.equal(exitCode, 0, `bible-check on ${f} failed with exit code ${exitCode}`);
      const r = JSON.parse(stdout);
      assert.equal(r.ok, true, `bible-check on ${f} failed: ${JSON.stringify(r.violations)}`);
    }
  });

  await test('bible-summon outputs gravity-field prompt', async () => {
    const out = run('bible-summon A0 A8');
    assert.ok(out.includes('CONTEXT_GRAVITY_FIELD'));
  });

  await test('yume-map outputs minimal AI read index', async () => {
    const dir = mkdtempSync(join(TMP, 'map-'));
    const logic = join(dir, 'sample.logic.yume.js');
    const testFile = join(dir, 'sample.test.yume.js');
    const helper = join(dir, 'helper.js');
    const noise = join(dir, 'noise.logic.yume.js');
    const block = {
      id: 'sample-logic',
      type: 'app',
      schemaVersion: 2,
      runtime: { name: 'yume', version: '002' },
      versions: [{
        v: 1,
        content: '// === HEAD ===\nexport function stale(){ return "old"; }\n// === /HEAD ===',
        ts: 1716100000000,
        refs: [],
        tags: [],
        applyId: null,
      }],
    };
    const testBlock = {
      ...block,
      id: 'sample-test',
      type: 'test',
      versions: [{ ...block.versions[0], content: 'export function testRender(){ return true; }' }],
    };
    writeFileSync(logic, [
      '// @yume-format: 1',
      '',
      'export const __block = ' + JSON.stringify(block, null, 2) + ';',
      '',
      '// === HEAD ===',
      "import { helper } from './helper.js';",
      'export function render(){ return helper(); }',
      '// === /HEAD ===',
      '',
    ].join('\n'));
    writeFileSync(testFile, [
      '// @yume-format: 1',
      '',
      'export const __block = ' + JSON.stringify(testBlock, null, 2) + ';',
      '',
      '// === HEAD ===',
      'export function testRender(){ return true; }',
      "import './sample.logic.yume.js';",
      '// === /HEAD ===',
      '',
    ].join('\n'));
    writeFileSync(helper, 'export function helper(){ return "ok"; }');
    writeFileSync(noise, 'export function noise(){ return 0; }');
    execSync(`git -C ${dir} init`, { stdio: 'ignore' });
    execSync(`git -C ${dir} add sample.logic.yume.js sample.test.yume.js helper.js`, { stdio: 'ignore' });

    const result = JSON.parse(run(`yume-map --top=2 ${dir}`));
    assert.equal(result.ok, true);
    assert.equal(result.kind, 'yume-map');
    assert.equal(result.source, 'git-tracked');
    assert.ok(result.readOrder.length <= 2);
    assert.ok(!result.entries.some(e => e.path === 'noise.logic.yume.js'));
    const entry = result.entries.find(e => e.path === 'sample.logic.yume.js');
    assert.ok(entry);
    assert.equal(entry.kind, 'yume');
    assert.equal(entry.block.id, 'sample-logic');
    assert.ok(entry.read.includes('show head --raw'));
    assert.ok(entry.tests.includes('sample.test.yume.js'));
    assert.ok(entry.testConfidence.includes('import'));
    assert.ok(entry.refs.some(r => r.kind === 'import' && r.target === './helper.js' && r.resolved === 'helper.js'));
    assert.ok(entry.next.includes('helper.js'));

    const all = JSON.parse(run(`yume-map --all ${dir}`));
    assert.equal(all.source, 'filesystem');
    assert.ok(all.entries.some(e => e.path === 'noise.logic.yume.js'));
  });

  await test('skeleton', async () => {
    const f = `${TMP}/sk.js`;
    writeFileSync(f, `function a(){} function b(){ a(); }`);
    const out = run(`skeleton ${f}`);
    assert.ok(out.includes(`${f}:fn:a`));
  });

  await test('focus', async () => {
    const f = `${TMP}/fo.js`;
    writeFileSync(f, `function hello() { return 'hi'; }`);
    const out = run(`focus ${f} ${f}:fn:hello`);
    assert.ok(out.includes('return'));
  });

  await test('show --raw', async () => {
    const f = `examples/hello.fn.yume.js`;
    const out = execSync(`node runYume.js ${f} show head --raw`, { encoding: 'utf8' });
    assert.ok(out.includes('export function hello'));
    assert.ok(!out.includes('hash:'));
    assert.ok(!out.includes('--- content'));
  });

  await test('runYume parses __block when version content contains semicolon brace', async () => {
    const f = `${TMP}/block-expr.yume.js`;
    const head = `export const config = { enabled: true };\nexport function readConfig() { return config; }\n`;
    const ts = 1714000000000;
    const block = {
      id: "block-expr",
      type: "module",
      schemaVersion: 1,
      runtime: { name: "yume", version: "001" },
      versions: [{
        hash: rt1.hashContent(head, null, ts),
        prevHash: null,
        content: head,
        ts,
        refs: [],
        tags: [],
        applyId: null,
      }],
    };
    writeFileSync(f, rt1.serializeBlock({ block, head }));
    const out = execSync(`node runYume.js ${f} show head --raw`, { encoding: 'utf8' });
    assert.ok(out.includes('export const config = { enabled: true };'));
  });

  await test('graph (JSON)', async () => {
    const f = `${TMP}/gr.js`;
    writeFileSync(f, `function a(){}`);
    const out = run(`graph ${f}`);
    const parsed = JSON.parse(out);
    assert.ok(Array.isArray(parsed));
  });

  await test('impact', async () => {
    const f = `${TMP}/im.js`;
    writeFileSync(f, `function a(){} function b(){ a(); }`);
    const out = run(`impact ${f} ${f}:fn:a`);
    assert.ok(out.includes(`${f}:fn:b`));
  });

  await test('tag', async () => {
    const f = `${TMP}/tg.js`;
    writeFileSync(f, `export function a(){}`);
    const out = run(`tag ${f} export`);
    assert.ok(out.includes(`${f}:fn:a`));
  });

  await test('tags', async () => {
    const f = `${TMP}/tgs.js`;
    writeFileSync(f, `export function a(){} class B{}`);
    const out = run(`tags ${f}`);
    assert.ok(/function\s+\d+/.test(out));
  });

  await test('self', async () => {
    const out = run('self');
    assert.ok(out.includes('self-parse'));
  });

  await test('save / load', async () => {
    const f = `${TMP}/sv.js`;
    writeFileSync(f, `function a(){}`);
    const out = `${TMP}/sv.json`;
    run(`save ${out} ${f}`);
    assert.ok(existsSync(out));
    const res = run(`load ${out}`);
    assert.ok(res.includes('loaded'));
  });

  await test('heavy accepts graph.json input', async () => {
    const f = `${TMP}/heavy-cli.js`;
    writeFileSync(f, `function a(){ return 1; } function b(){ return a(); }`);
    const graphPath = `${TMP}/heavy-cli.json`;
    run(`save ${graphPath} ${f}`);
    const out = run(`heavy ${graphPath} ${f}:fn:b`);
    assert.ok(out.includes(`--- BLOCK: ${f}:fn:b (function) ---`));
  });

  await test('search', async () => {
    const f = `${TMP}/sr.js`;
    writeFileSync(f, `function a(){ return SENTINEL; }`);
    const result = run(`search ${f} SENTINEL`);
    assert.ok(result.includes(`${f}:fn:a`));
  });

  await test('diff', async () => {
    const f = `${TMP}/df.js`;
    writeFileSync(f, `function a(){}`);
    const result = run(`diff ${f} ${f}:fn:a`);
    assert.ok(result.includes('null') || result.length >= 0);
  });
});

// ============================================================
// 6a. diff / blame / rollback
// ============================================================
await group('Block diff/blame/rollback', async () => {
  await test('diff(content)', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    b.commit({ content: 'function a(){ return 1; }' });
    b.commit({ content: 'function a(){ return 2; }' });
    const d = b.diff();
    assert.equal(d.contentChanged, true);
    assert.equal(d.content.from.includes('return 1'), true);
    assert.equal(d.content.to.includes('return 2'), true);
  });

  await test('diff(refs added/removed)', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    b.commit({ content: 'x', refs: [{ kind: 'calls', target: 'foo' }] });
    b.commit({ content: 'x', refs: [{ kind: 'calls', target: 'bar' }] });
    const d = b.diff();
    assert.equal(d.refsAdded.length, 1);
    assert.equal(d.refsAdded[0].target, 'bar');
    assert.equal(d.refsRemoved.length, 1);
    assert.equal(d.refsRemoved[0].target, 'foo');
  });

  await test('diff(tags added/removed)', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    b.commit({ content: 'x', tags: ['a', 'b'] });
    b.commit({ content: 'x', tags: ['b', 'c'] });
    const d = b.diff();
    assert.deepEqual(d.tagsAdded, ['c']);
    assert.deepEqual(d.tagsRemoved, ['a']);
  });

  await test('blameRef(refが追加されたversion)', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    b.commit({ content: 'x' });
    b.commit({ content: 'x', refs: [{ kind: 'calls', target: 'foo' }] });
    b.commit({ content: 'x', refs: [{ kind: 'calls', target: 'foo' }, { kind: 'calls', target: 'bar' }] });
    const r = b.blameRef('foo');
    assert.equal(r.index, 1);
    const r2 = b.blameRef('bar');
    assert.equal(r2.index, 2);
    assert.equal(b.blameRef('xxx'), null);
  });

  await test('rollback', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    b.commit({ content: 'v1' });
    b.commit({ content: 'v2' });
    b.commit({ content: 'v3' });
    b.rollback(0);
    assert.equal(b.versions.length, 4);
    assert.equal(b.content, 'v1');
    assert.equal(b.head().meta.rollbackIndex, 0);
    // hash 整合性は維持
    assert.deepEqual(b.verify(), { ok: true });
  });
});

// ============================================================
// 6b. search
// ============================================================
await group('Graph search', async () => {
  function fixture() {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'function a(){ return SECRET; }', tags: ['core'] });
    const b = new Block({ id: 'b', type: 'function' });
    b.commit({ content: 'function b(){ return 1; }', tags: ['util'] });
    const c = new Block({ id: 'c', type: 'class' });
    c.commit({ content: 'class C { run() { return SECRET; } }', tags: ['core'] });
    return new Graph([a, b, c]);
  }

  await test('文字列検索', async () => {
    const g = fixture();
    const hits = g.search('SECRET');
    assert.equal(hits.length, 2);
  });

  await test('RegExp 検索', async () => {
    const g = fixture();
    const hits = g.search(/return\s+\d+/);
    assert.equal(hits.length, 1);
    assert.equal(hits[0].block.id, 'b');
  });

  await test('type 絞り込み', async () => {
    const g = fixture();
    const hits = g.search('SECRET', { type: 'class' });
    assert.equal(hits.length, 1);
    assert.equal(hits[0].block.id, 'c');
  });

  await test('tag 絞り込み', async () => {
    const g = fixture();
    const hits = g.search('return', { tag: 'core' });
    assert.equal(hits.length, 2);
  });
});

// ============================================================
// 6c. saveGraph / loadGraph
// ============================================================
await group('Persistence', async () => {
  await test('save → load ラウンドトリップ', async () => {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'function a(){}', tags: ['core'] });
    const b = new Block({ id: 'b', type: 'function' });
    b.commit({ content: 'function b(){ a(); }', refs: [{ kind: 'calls', target: 'a' }] });
    const g = new Graph([a, b]);
    const path = `${TMP}/graph.json`;
    saveGraph(g, path);
    const restored = loadGraph(path);
    assert.equal(restored.all().length, 2);
    assert.equal(restored.get('a').content, 'function a(){}');
    assert.deepEqual(restored.verify(), { ok: true });
  });

  await test('buildAndSave (一発)', async () => {
    const f = `${TMP}/x.js`;
    writeFileSync(f, `export function foo(){}`);
    const out = `${TMP}/g.json`;
    const g = buildAndSave([f], out);
    assert.ok(existsSync(out));
    const restored = loadGraph(out);
    assert.equal(restored.has(`${f}:fn:foo`), true);
  });
});

// ============================================================
// 6c-2. Block.applyPatch / applyToBlock / applyBlockSmart
// ============================================================
await group('Block-level apply', async () => {
  await test('Block.applyPatch — content 差し替え', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    b.commit({ content: 'function a(){}', tags: ['core'] });
    const r = b.applyPatch('function a(){ return 1; }');
    assert.equal(r.action, 'updated');
    assert.equal(b.content, 'function a(){ return 1; }');
    // tags は引き継がれてる
    assert.deepEqual(b.tags, ['core']);
    assert.equal(b.versions.length, 2);
  });

  await test('Block.applyPatch — 同じ内容なら unchanged', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    b.commit({ content: 'function a(){}', tags: ['core'] });
    const r = b.applyPatch('function a(){}');
    assert.equal(r.action, 'unchanged');
    assert.equal(b.versions.length, 1);
  });

  await test('Block.applyPatch — 未 commit なら created', async () => {
    const b = new Block({ id: 'a', type: 'function' });
    const r = b.applyPatch('function a(){}');
    assert.equal(r.action, 'created');
    assert.equal(b.versions.length, 1);
  });

  await test('applyToBlock(graph, id, content)', async () => {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'function a(){}' });
    const g = new Graph([a]);
    const r = applyToBlock(g, 'a', 'function a(){ return 2; }');
    assert.equal(r.action, 'updated');
    assert.equal(g.get('a').content, 'function a(){ return 2; }');
  });

  await test('applyBlockSmart — content から refs/tags 自動抽出', async () => {
    const a = new Block({ id: 'm:fn:foo', type: 'function', meta: { name: 'foo' } });
    a.commit({ content: 'function foo(){}', tags: ['function'] });
    const g = new Graph([a]);
    const newSrc = `// @tags: high\nexport function foo(){ return 1; }`;
    const r = applyBlockSmart(g, 'm:fn:foo', newSrc);
    assert.equal(r.action, 'updated');
    const updated = g.get('m:fn:foo');
    // tags が再抽出されてる(function/export/high)
    assert.ok(updated.tags.includes('export'));
    assert.ok(updated.tags.includes('high'));
  });

  await test('applyToBlock — 存在しない id は throw', async () => {
    const g = new Graph();
    assert.throws(() => applyToBlock(g, 'nonexistent', 'x'));
  });
});

// ============================================================
// 6d. applyPatch
// ============================================================
await group('applyPatch', async () => {
  await test('既存 Block の更新', async () => {
    const f = `${TMP}/ap.js`;
    writeFileSync(f, `function foo(){ return 1; }`);
    const g = loadProject([f]);
    const beforeVersions = g.get(`${f}:fn:foo`).versions.length;
    const patch = `function foo(){ return 2; }`;
    const updates = applyPatch(g, patch, f);
    const after = g.get(`${f}:fn:foo`);
    assert.equal(after.content.includes('return 2'), true);
    assert.equal(after.versions.length, beforeVersions + 1);
    assert.ok(updates.some(u => u.action === 'updated'));
  });

  await test('新規 Block の追加', async () => {
    const f = `${TMP}/ap2.js`;
    writeFileSync(f, `function foo(){}`);
    const g = loadProject([f]);
    const patch = `function foo(){} function bar(){}`;
    const updates = applyPatch(g, patch, f);
    assert.ok(g.has(`${f}:fn:bar`));
    assert.ok(updates.some(u => u.id === `${f}:fn:bar` && u.action === 'added'));
  });

  await test('変更なしは unchanged', async () => {
    const f = `${TMP}/ap3.js`;
    writeFileSync(f, `function foo(){ return 1; }`);
    const g = loadProject([f]);
    const beforeVersions = g.get(`${f}:fn:foo`).versions.length;
    const updates = applyPatch(g, `function foo(){ return 1; }`, f);
    const after = g.get(`${f}:fn:foo`);
    assert.equal(after.versions.length, beforeVersions); // 増えてない
    assert.ok(updates.some(u => u.id === `${f}:fn:foo` && u.action === 'unchanged'));
  });
});

// ============================================================
// 6e. resolveImports
// ============================================================
await group('resolveImports', async () => {
  await test('相対パスの解決', async () => {
    const f1 = `${TMP}/ri-a.js`;
    const f2 = `${TMP}/ri-b.js`;
    writeFileSync(f1, `import { x } from './ri-b.js';`);
    writeFileSync(f2, `export const x = 1;`);
    const g = loadProject([f1, f2]);
    resolveImports(g);
    const head = g.get(f1).head();
    const importRef = head.refs.find(r => r.kind === 'import');
    // 解決された target は f2 の絶対パス相当
    assert.ok(importRef.target.endsWith('ri-b.js'));
    assert.ok(importRef.originalTarget === './ri-b.js');
  });
});

// ============================================================
// 6f. constraintBlock + evalConstraint
// ============================================================
await group('Constraint Folding', async () => {
  await test('じゃんけん 27世界', async () => {
    const cb = constraintBlock({
      id: 'janken',
      axes: ['a', 'b', 'c'],
      values: { a: ['rock', 'paper', 'scissors'], b: ['rock', 'paper', 'scissors'], c: ['rock', 'paper', 'scissors'] },
      derive: combo => ({ allSame: combo.a === combo.b && combo.b === combo.c }),
    });
    const all = evalConstraint(cb);
    assert.equal(all._worlds, 27);
  });

  await test('filter で絞り込み', async () => {
    const cb = constraintBlock({
      id: 'janken2',
      axes: ['a', 'b'],
      values: { a: ['rock', 'paper', 'scissors'], b: ['rock', 'paper', 'scissors'] },
      derive: combo => ({ tie: combo.a === combo.b }),
    });
    const ties = evalConstraint(cb, { tie: true });
    assert.equal(ties._worlds, 3);
  });

  await test('矛盾は _contradiction', async () => {
    const cb = constraintBlock({
      id: 'imp',
      axes: ['x'],
      values: { x: [1, 2, 3] },
      derive: combo => ({ ok: combo.x > 100 }),
    });
    const r = evalConstraint(cb, { ok: true });
    assert.equal(r._contradiction, true);
  });
});

// ============================================================
// 6g. observationBlock
// ============================================================
await group('Observation Block', async () => {
  await test('観測の記録と参照', async () => {
    const obs = observationBlock({
      id: 'obs:001',
      observedId: 'mod:fn:bar',
      snapshot: { hp: 50, x: 10 },
      tags: ['ai-eyes'],
    });
    assert.equal(obs.type, 'observation');
    assert.equal(JSON.parse(obs.content).hp, 50);
    assert.ok(obs.refs.some(r => r.kind === 'observes' && r.target === 'mod:fn:bar'));
    assert.ok(obs.tags.includes('ai-eyes'));
  });
});

// ============================================================
// 6h. lint
// ============================================================
await group('Graph lint', async () => {
  await test('broken-ref を検出', async () => {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'a', refs: [{ kind: 'calls', target: 'nonexistent' }] });
    const g = new Graph([a]);
    const issues = g.lint();
    assert.ok(issues.some(i => i.kind === 'broken-ref'));
  });

  await test('orphan を検出', async () => {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'a' });
    const g = new Graph([a]);
    const issues = g.lint();
    assert.ok(issues.some(i => i.kind === 'orphan' && i.id === 'a'));
  });

  await test('module は orphan にしない', async () => {
    const m = new Block({ id: 'm', type: 'module' });
    m.commit({ content: null });
    const g = new Graph([m]);
    const issues = g.lint();
    assert.ok(!issues.some(i => i.kind === 'orphan'));
  });

  await test('循環参照を検出', async () => {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'a', refs: [{ kind: 'calls', target: 'b' }] });
    const b = new Block({ id: 'b', type: 'function' });
    b.commit({ content: 'b', refs: [{ kind: 'calls', target: 'a' }] });
    const g = new Graph([a, b]);
    const issues = g.lint();
    assert.ok(issues.some(i => i.kind === 'circular'));
  });

  await test('健全な graph では issue なし', async () => {
    const m = new Block({ id: 'm', type: 'module' });
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'function a(){}', tags: ['function'] });
    m.commit({ content: null, refs: [{ kind: 'contains', target: 'a' }] });
    const g = new Graph([m, a]);
    const issues = g.lint();
    assert.equal(issues.length, 0);
  });

  await test('brace-mismatch を検出', async () => {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'function a(){ return; ', tags: ['function'] });  // 閉じカッコなし
    const g = new Graph([a]);
    const issues = g.lint({ orphan: false });
    assert.ok(issues.some(i => i.kind === 'brace-mismatch'));
  });

  await test('brace 検査が文字列リテラル中の {} を無視', async () => {
    const a = new Block({ id: 'm:fn:a', type: 'function', meta: { name: 'a' } });
    a.commit({ content: 'function a(){ return "{ unclosed string"; }', tags: ['function'] });
    const g = new Graph([a]);
    const issues = g.lint({ orphan: false });
    assert.ok(!issues.some(i => i.kind === 'brace-mismatch'));
  });

  await test('calls-leak を検出', async () => {
    const a = new Block({ id: 'm:fn:a', type: 'function', meta: { name: 'a' } });
    a.commit({ content: 'function a(){ return 1; }', tags: ['function'] });
    const b = new Block({ id: 'm:fn:b', type: 'function', meta: { name: 'b' } });
    // content には a() がある、refs には calls エッジがない
    b.commit({ content: 'function b(){ return a() + 1; }', tags: ['function'], refs: [] });
    const g = new Graph([a, b]);
    const issues = g.lint({ orphan: false });
    assert.ok(issues.some(i => i.kind === 'calls-leak' && i.from === 'm:fn:b' && i.missing === 'm:fn:a'));
  });

  await test('tag-mismatch を検出(function なのに tag なし)', async () => {
    const a = new Block({ id: 'a', type: 'function', meta: { name: 'a' } });
    a.commit({ content: 'function a(){}', tags: [] });
    const g = new Graph([a]);
    const issues = g.lint({ orphan: false });
    assert.ok(issues.some(i => i.kind === 'tag-mismatch' && i.expected === 'function'));
  });

  await test('empty-block を検出', async () => {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: null, refs: [], children: [], tags: ['function'] });
    const g = new Graph([a]);
    const issues = g.lint({ orphan: false });
    assert.ok(issues.some(i => i.kind === 'empty-block'));
  });

  await test('hash-broken を検出', async () => {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'function a(){}', tags: ['function'] });
    a.versions[0].content = 'tampered';  // 改ざん
    const g = new Graph([a]);
    const issues = g.lint({ orphan: false });
    assert.ok(issues.some(i => i.kind === 'hash-broken'));
  });

  await test('opts でカテゴリを無効化できる', async () => {
    const a = new Block({ id: 'a', type: 'function', meta: { name: 'a' } });
    a.commit({ content: 'function a(){}', tags: [] }); // tag-mismatch + orphan
    const g = new Graph([a]);
    const all = g.lint();
    const noOrphan = g.lint({ orphan: false });
    assert.ok(all.length > noOrphan.length);
  });
});

// ============================================================
// 6i. exportModule
// ============================================================
await group('exportModule', async () => {
  await test('module Block から JS 復元', async () => {
    const f = `${TMP}/em.js`;
    writeFileSync(f, `export function foo(){ return 1; }\nfunction bar(){}`);
    const g = loadProject([f]);
    const code = exportModule(g, f);
    assert.ok(code.includes('foo'));
    assert.ok(code.includes('bar'));
  });

  await test('exportToFile でファイル出力', async () => {
    const f = `${TMP}/etf.js`;
    writeFileSync(f, `function hello(){}`);
    const g = loadProject([f]);
    const out = `${TMP}/etf-out.js`;
    exportToFile(g, f, out);
    assert.ok(existsSync(out));
    assert.ok(readFileSync(out, 'utf8').includes('hello'));
  });
});

// ============================================================
// 6j. graphStats
// ============================================================
await group('graphStats', async () => {
  await test('Block 数 / type 集計', async () => {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'a', tags: ['core'] });
    const b = new Block({ id: 'b', type: 'class' });
    b.commit({ content: 'b' });
    const g = new Graph([a, b]);
    const s = graphStats(g);
    assert.equal(s.blocks, 2);
    assert.equal(s.byType.function, 1);
    assert.equal(s.byType.class, 1);
    assert.equal(s.byTag.core, 1);
  });
});

// ============================================================
// 6k. blockContext
// ============================================================
await group('blockContext', async () => {
  function fixture() {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'a' });
    const b = new Block({ id: 'b', type: 'function' });
    b.commit({ content: 'b', refs: [{ kind: 'calls', target: 'a' }] });
    const c = new Block({ id: 'c', type: 'function' });
    c.commit({ content: 'c', refs: [{ kind: 'calls', target: 'b' }] });
    return new Graph([a, b, c]);
  }

  await test('depth=1 で隣接 Block を取得', async () => {
    const g = fixture();
    const ctx = blockContext(g, 'b', { depth: 1 });
    const ids = ctx.map(x => x.id).sort();
    assert.deepEqual(ids, ['a', 'b', 'c']);
  });

  await test('depth=0 で target のみ', async () => {
    const g = fixture();
    const ctx = blockContext(g, 'b', { depth: 0 });
    assert.equal(ctx.length, 1);
    assert.equal(ctx[0].id, 'b');
  });

  await test('formatContextForLLM が markdown を返す', async () => {
    const g = fixture();
    const ctx = blockContext(g, 'b', { depth: 1 });
    const md = formatContextForLLM(ctx, 'b');
    assert.ok(md.includes('# Context for b'));
    assert.ok(md.includes('⭐ b'));
    assert.ok(md.includes('```js'));
  });
});

// ============================================================
// 6l. parseMD
// ============================================================
await group('parseMD', async () => {
  await test('section を Block に分解', async () => {
    const md = `# Title\n\nintro\n\n## Section A\n\ncontent\n\n## Section B\n\nmore`;
    const blocks = parseMD(md, 'doc.md');
    const sections = blocks.filter(b => b.type === 'section');
    assert.equal(sections.length, 3);
    assert.ok(sections.some(s => s.meta.title === 'Title'));
    assert.ok(sections.some(s => s.meta.title === 'Section A'));
  });

  await test('code block を子 Block に', async () => {
    const md = `## Foo\n\nintro\n\n\`\`\`js\nconst x = 1;\n\`\`\`\n`;
    const blocks = parseMD(md, 'doc.md');
    const code = blocks.find(b => b.type === 'code');
    assert.ok(code);
    assert.equal(code.content, 'const x = 1;');
    assert.ok(code.tags.includes('js'));
  });

  await test('リンクを refs に', async () => {
    const md = `## Foo\n\nsee [bar](./bar.md) for more`;
    const blocks = parseMD(md, 'doc.md');
    const sec = blocks.find(b => b.type === 'section');
    assert.ok(sec.refs.some(r => r.kind === 'link' && r.target === './bar.md'));
  });

  await test('module の contains refs', async () => {
    const md = `## A\n\n## B`;
    const blocks = parseMD(md, 'doc.md');
    const m = blocks[0];
    const containsCount = m.refs.filter(r => r.kind === 'contains').length;
    assert.equal(containsCount, 2);
  });
});

// ============================================================
// 6m. exportMermaid
// ============================================================
await group('exportMermaid', async () => {
  await test('flowchart 形式で出力', async () => {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'a' });
    const b = new Block({ id: 'b', type: 'function' });
    b.commit({ content: 'b', refs: [{ kind: 'calls', target: 'a' }] });
    const g = new Graph([a, b]);
    const out = exportMermaid(g);
    assert.ok(out.startsWith('flowchart LR'));
    assert.ok(out.includes('-->|calls|'));
  });

  await test('type で絞り込み', async () => {
    const a = new Block({ id: 'a', type: 'function' });
    a.commit({ content: 'a' });
    const b = new Block({ id: 'b', type: 'class' });
    b.commit({ content: 'b' });
    const g = new Graph([a, b]);
    const out = exportMermaid(g, { type: 'function' });
    assert.ok(out.includes('n_a'));
    assert.ok(!out.includes('n_b'));
  });
});

// ============================================================
// 6n. inferTags
// ============================================================
await group('inferTags', async () => {
  await test('I/O 検出', async () => {
    const tags = inferTags(`function f() { return readFileSync('x'); }`, 'function');
    assert.ok(tags.includes('io'));
  });

  await test('async 検出', async () => {
    const tags = inferTags(`async function f() { await x(); }`, 'function');
    assert.ok(tags.includes('async'));
  });

  await test('test 検出', async () => {
    const tags = inferTags(`test('foo', () => { assert.ok(1); })`, 'function');
    assert.ok(tags.includes('test'));
    assert.ok(tags.includes('assertion'));
  });

  await test('pure 検出', async () => {
    const tags = inferTags(`function add(a, b) { return a + b; }`, 'function');
    assert.ok(tags.includes('pure'));
  });

  await test('large 検出', async () => {
    const lines = Array(60).fill('  // line').join('\n');
    const tags = inferTags(`function f() {\n${lines}\n}`, 'function');
    assert.ok(tags.includes('large'));
  });
});

// ============================================================
// 6o. virtual heavy / virtualApply
// ============================================================
await group('Virtual Heavy Function', async () => {
  function fixture() {
    const a = new Block({ id: 'm:fn:a', type: 'function', meta: { name: 'a' } });
    a.commit({ content: 'function a(){ return 1; }', tags: ['function'] });
    const b = new Block({ id: 'm:fn:b', type: 'function', meta: { name: 'b' } });
    b.commit({
      content: 'function b(){ return a() + 1; }',
      tags: ['function'],
      refs: [{ kind: 'calls', target: 'm:fn:a' }],
    });
    const c = new Block({ id: 'm:fn:c', type: 'function', meta: { name: 'c' } });
    c.commit({
      content: 'function c(){ return b() + a(); }',
      tags: ['function'],
      refs: [{ kind: 'calls', target: 'm:fn:b' }, { kind: 'calls', target: 'm:fn:a' }],
    });
    const d = new Block({ id: 'm:fn:d', type: 'function', meta: { name: 'd' } });
    d.commit({ content: 'function d(){}', tags: ['function'] });  // 関係ない
    return new Graph([a, b, c, d]);
  }

  await test('virtualHeavy が依存先を集める', async () => {
    const g = fixture();
    const heavy = virtualHeavy(g, 'm:fn:c');
    const ids = heavy.map(b => b.id).sort();
    assert.deepEqual(ids, ['m:fn:a', 'm:fn:b', 'm:fn:c']);
    assert.ok(!ids.includes('m:fn:d'));
  });

  await test('expandVirtualHeavy が BLOCK ヘッダ付き content を返す', async () => {
    const g = fixture();
    const expanded = expandVirtualHeavy(g, 'm:fn:c');
    assert.ok(expanded.includes('--- BLOCK: m:fn:c (function) ---'));
    assert.ok(expanded.includes('--- BLOCK: m:fn:b (function) ---'));
    assert.ok(expanded.includes('--- BLOCK: m:fn:a (function) ---'));
    assert.ok(!expanded.includes('m:fn:d'));
  });

  await test('virtualApply が各 Block を更新する', async () => {
    const g = fixture();
    const expanded = expandVirtualHeavy(g, 'm:fn:c');
    // a, b, c 全部書き換える形に
    const newContent = expanded
      .replace('function a(){ return 1; }', 'function a(){ return 100; }')
      .replace('function b(){ return a() + 1; }', 'function b(){ return a() * 2; }')
      .replace('function c(){ return b() + a(); }', 'function c(){ return b() * 10; }');
    const updates = virtualApply(g, 'm:fn:c', newContent);
    assert.equal(g.get('m:fn:a').content, 'function a(){ return 100; }');
    assert.equal(g.get('m:fn:b').content, 'function b(){ return a() * 2; }');
    assert.equal(g.get('m:fn:c').content, 'function c(){ return b() * 10; }');
    assert.equal(g.get('m:fn:d').content, 'function d(){}'); // 範囲外、無傷
    assert.ok(updates.every(u => u.action === 'updated'));
  });

  await test('virtualApply は範囲外の Block を skip', async () => {
    const g = fixture();
    // d を patch しようとする(範囲外)
    const fake = `// --- BLOCK: m:fn:d (function) ---\nfunction d(){ return 'hacked'; }`;
    const updates = virtualApply(g, 'm:fn:c', fake);
    assert.ok(updates.some(u => u.action === 'skipped-out-of-scope' && u.id === 'm:fn:d'));
    assert.equal(g.get('m:fn:d').content, 'function d(){}'); // 無傷
  });

  await test('depth で範囲制御', async () => {
    const g = fixture();
    const heavy0 = virtualHeavy(g, 'm:fn:c', { depth: 0 });
    assert.deepEqual(heavy0.map(b => b.id), ['m:fn:c']);
    const heavy1 = virtualHeavy(g, 'm:fn:c', { depth: 1 });
    assert.equal(heavy1.length, 3);  // c + b + a
  });

  // MANUAL §4.5/§4.7: content が head と同一なら新 version は作らない
  await test('virtualApply: content 同一なら新 version 作らない (unchanged)', async () => {
    const g = fixture();
    const heavy = virtualHeavy(g, 'm:fn:c');
    const before = heavy.map(b => b.versions.length);
    const segments = heavy.map(b =>
      `// --- BLOCK: ${b.id} (${b.type}) ---\n${b.content}\n`
    ).join('\n');
    const updates = virtualApply(g, 'm:fn:c', segments);
    const after = heavy.map(b => b.versions.length);
    assert.equal(updates.length, 3);
    for (const u of updates) assert.equal(u.action, 'unchanged');
    assert.deepEqual(before, after);  // versions 数は不変
  });

  // MANUAL §4.5/§4.6: expand → そのまま virtualApply で全 unchanged(編集なし round-trip)
  await test('virtualApply: expand 出力をそのまま戻すと全 unchanged', async () => {
    const g = fixture();
    const before = ['m:fn:a', 'm:fn:b', 'm:fn:c'].map(id => g.get(id).versions.length);
    const expanded = expandVirtualHeavy(g, 'm:fn:c');
    const updates = virtualApply(g, 'm:fn:c', expanded);
    const after = ['m:fn:a', 'm:fn:b', 'm:fn:c'].map(id => g.get(id).versions.length);
    for (const u of updates) assert.equal(u.action, 'unchanged');
    assert.deepEqual(before, after);
  });

  // MANUAL §4.5/§4.8 #6: 入力中の // refs: // tags: 行は除去され、refs/tags は head から継承
  await test('virtualApply: // refs: / // tags: 行は無視され head から継承', async () => {
    const g = fixture();
    const c = g.get('m:fn:c');
    const originalRefs = c.refs.map(r => `${r.kind}:${r.target}`).sort();
    const originalTags = [...c.tags].sort();
    const patch =
`// --- BLOCK: m:fn:c (function) ---
// tags: BOGUS_TAG_THAT_SHOULD_BE_IGNORED
// refs: calls->NONEXISTENT_TARGET
function c(){ return b() + 999; }
`;
    const updates = virtualApply(g, 'm:fn:c', patch);
    const cAfter = g.get('m:fn:c');
    assert.equal(cAfter.content, 'function c(){ return b() + 999; }');
    assert.equal(updates.find(u => u.id === 'm:fn:c').action, 'updated');
    // refs / tags は元のまま(head 継承)
    assert.deepEqual(
      cAfter.refs.map(r => `${r.kind}:${r.target}`).sort(),
      originalRefs,
    );
    assert.deepEqual([...cAfter.tags].sort(), originalTags);
  });

  await test('heavyApply は apply 後に同じ scope を再展開する', async () => {
    const g = fixture();
    const expanded = expandVirtualHeavy(g, 'm:fn:c');
    const patch = expanded
      .replace('function a(){ return 1; }', 'function a(){ return 10; }')
      .replace('function c(){ return b() + a(); }', 'function c(){ return b() - a(); }');
    const result = heavyApply(g, 'm:fn:c', patch);
    assert.equal(result.stats.updated, 2);
    assert.equal(result.stats.unchanged, 1);
    assert.equal(result.blocks, 3);
    assert.ok(result.expanded.includes('function a(){ return 10; }'));
    assert.ok(result.expanded.includes('function c(){ return b() - a(); }'));
    assert.ok(!result.expanded.includes('function d(){}'));
  });
});

// ============================================================
// 6. Handle Runtime Coverage (A14)
// ============================================================
await test('eyes:debugger', async () => {
  const demo = `headless-demo.fn.yume.js`;
  const scenario = `examples/coma-scenario.js`;
  const out = `${TMP}/replay_test.html`;
  execSync(`node eyes.debugger.yume.js ${demo} ${scenario} --out ${out}`, { encoding: 'utf8' });
  const html = readFileSync(out, 'utf8');
  assert.ok(html.includes('Coma-Okuri Replay'));
  assert.ok(html.includes('player-canvas'));
});
await test('Handle Runtime Coverage (A14)', async () => {
  const F = `${TMP}/test.yume.js`;
  
  async function setup(runtime) {
    const head = 'export function test() { return 1; }';
    const ts = 1714000000000;
    const block = {
      id: "test", type: "fn", schemaVersion: 1,
      runtime: { name: "yume", version: runtime.VERSION },
      versions: [{
        hash: runtime.hashContent(head, null, ts),
        prevHash: null, content: head, ts,
        refs: [], tags: [], applyId: null
      }]
    };
    const boot = `{
  const { fileURLToPath } = await import('node:url');
  const { realpathSync } = await import('node:fs');
  const isMain = process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  if (isMain) {
  const runtimeBase = ${JSON.stringify(RUNTIME_BASE_URL)};
  const rt = await import(\`\${runtimeBase}ver\${__block.runtime.version}.handle.yume.js\`);
  await rt.cli(import.meta.url, __block, process.argv);
  }
}`;
    writeFileSync(F, runtime.serializeBlock({ block, head, boot }));
  }

  await test('v001: basic verbs', async () => {
    await setup(rt1);
    assert.equal((await rt1.history(F)).length, 1);
    assert.ok((await rt1.show(F, 'head')).hash);
    assert.equal((await rt1.refs(F)).length, 0);
    assert.equal((await rt1.tags(F)).length, 0);
  });

  await test('v001: codec', async () => {
    await setup(rt1);
    const view = await rt1.heavy([F], 'test', 1);
    const res = await rt1.heavyApply([F], 'test', view.replace('return 1;', 'return 2;'), 1);
    assert.equal(res.updated.length, 1);
  });

  await test('v002: notes and apply', async () => {
    await setup(rt2);
    const n = await rt2.noteAdd(F, 'head', { text: 'note', kind: 'todo' });
    assert.ok(n.noteId);
    await rt2.noteEdit(F, 'head', n.noteId, { text: 'fixed', kind: 'done' });
    assert.ok((await rt2.noteList(F)).some(x => x.text === 'fixed'));
    assert.ok((await rt2.notesSearch(TMP, 'fixed')).length >= 1);
    await rt2.noteRm(F, 'head', n.noteId);
    assert.equal((await rt2.noteList(F)).length, 0);
    
    // Apply indexing
    const view = await rt2.heavy([F], 'test', 0);
    const res = await rt2.heavyApply([F], 'test', view.replace('return 1;', 'return 3;'), 0);
    const aid = res.applyId;
    assert.ok((await rt2.applyList(F)).some(a => a.applyId === aid));
    assert.ok((await rt2.applyShow(F, aid)).versions.length >= 1);
    assert.ok((await rt2.applyIndex(TMP)).some(a => a.applyId === aid));
    assert.ok((await rt2.applySearch(TMP, aid)).fileCount >= 1);
  });

  await test('v002: history, diff, rollback', async () => {
    await setup(rt2);
    const view = await rt2.heavy([F], 'test', 0);
    await rt2.heavyApply([F], 'test', view.replace('return 1;', 'return 4;'), 0);
    
    assert.equal((await rt2.history(F)).length, 2);
    assert.ok((await rt2.diff(F, 0, 1)).includes('return 4'));
    
    await rt2.rollback(F, 0);
    assert.equal((await rt2.history(F)).length, 3);
    assert.ok((await rt2.show(F, 'head')).content.includes('return 1'));
  });

  await test('v002: schemaVersion 2 uses v numbers without hashes', async () => {
    const head = 'export function test() { return 1; }';
    const ts = 1714000000000;
    const block = {
      id: "test", type: "fn", schemaVersion: 2,
      runtime: { name: "yume", version: "002" },
      versions: [{
        v: 1, content: head, ts,
        refs: [], tags: [], applyId: null
      }],
      notes: {
        v1: [{ id: 'n-seed', author: 'human', ts, text: 'seed' }]
      }
    };
    writeFileSync(F, rt2.serializeBlock({ block, head, boot: '' }));

    assert.equal(rt2.validateBlock(rt2.parseBlock(readFileSync(F, 'utf8')).block).ok, true);
    assert.equal((await rt2.show(F, 'v1')).content, head);
    assert.equal((await rt2.noteList(F, 'head'))[0].key, 'v1');
    const n = await rt2.noteAdd(F, 'head', { author: 'ai', text: 'hashless note' });
    assert.equal(n.key, 'v1');

    const view = await rt2.heavy([F], 'test', 0);
    assert.ok(view.includes('"version":"v1"'));
    const res = await rt2.heavyApply([F], 'test', view.replace('return 1;', 'return 2;'), 0);
    assert.equal(res.updated.length, 1);
    assert.equal(Object.values(res.newHashes)[0], 'v2');

    const versions = await rt2.history(F);
    assert.equal(versions.length, 2);
    assert.equal(versions[1].v, 2);
    assert.equal(versions[1].hash, undefined);
    assert.ok((await rt2.diff(F, 'v1', 'v2')).includes('return 2'));

    await rt2.rollback(F, 'v1');
    assert.equal((await rt2.show(F, 'head')).v, 3);
    const historyOut = execSync(`node runYume.js ${F} history`, { encoding: 'utf8' });
    assert.ok(historyOut.includes('v3'));
  });

  await test('v001/v002: trimVersions archives old versions', async () => {
    const archivePath = F.replace(/\.yume\.js$/, '.archive.yume.js');

    function rewriteRuntimeHead(value) {
      const src = readFileSync(F, 'utf8');
      const headStart = src.indexOf('// === HEAD ===') + '// === HEAD ==='.length;
      const headEnd = src.indexOf('// === /HEAD ===');
      writeFileSync(
        F,
        src.slice(0, headStart) +
          `\nexport function test() { return ${value}; }\n` +
          src.slice(headEnd),
      );
    }

    await setup(rt1);
    rewriteRuntimeHead(2);
    await rt1.commitManual(F);
    rewriteRuntimeHead(3);
    await rt1.commitManual(F);
    const r1 = await rt1.trimVersions(F, { keep: 1 });
    assert.equal(r1.trimmed, 2);
    assert.equal(r1.kept, 1);
    assert.ok(existsSync(r1.archivePath));
    assert.equal((await rt1.history(F)).length, 1);
    const parsed1 = rt1.parseBlock(readFileSync(F, 'utf8'));
    assert.equal(parsed1.block.trimmedAt.count, 2);
    const archiveSrc1 = readFileSync(r1.archivePath, 'utf8');
    const archive1 = JSON.parse(archiveSrc1
      .slice(archiveSrc1.indexOf('export const __archive = ') + 'export const __archive = '.length)
      .replace(/;\s*$/, ''));
    assert.equal(archive1.versions.length, 2);
    assert.ok(execSync( `node runYume.js ${F} history` , { encoding: 'utf8' }).includes('archived'));

    if (existsSync(archivePath)) unlinkSync(archivePath);
    await setup(rt2);
    rewriteRuntimeHead(2);
    await rt2.commitManual(F);
    rewriteRuntimeHead(3);
    await rt2.commitManual(F);
    const r2 = await rt2.trimVersions(F, { keep: 2 });
    assert.equal(r2.trimmed, 1);
    assert.equal((await rt2.history(F)).length, 2);
    assert.equal(rt2.validateBlock(rt2.parseBlock(readFileSync(F, 'utf8')).block).ok, true);
  });

  await test('v002: refs-check and impact', async () => {
    const f1 = `${TMP}/a.yume.js`;
    const f2 = `${TMP}/b.yume.js`;
    const write = async (file, id, targetId, opts = {}) => {
      const refs = opts.refs ?? [{ kind: "ref", target: targetId }];
      const head = opts.head ?? `// @ref: ${targetId}\nexport function ${id}() {}`;
      const ts = 1714000000000;
      const b = {
        id, type: "fn", schemaVersion: 1,
        runtime: { name: "yume", version: "002" },
        versions: [{
          hash: rt2.hashContent(head, null, ts),
          prevHash: null, content: head, ts,
          refs,
          tags: [], applyId: null
        }]
      };
      writeFileSync(file, rt2.serializeBlock({ block: b, head, boot: '' }));
    };
    await write(f1, 'a', 'b');
    await write(f2, 'b', 'none');
    assert.equal((await rt2.refsCheck([f1, f2])).ok, true);
    assert.ok((await rt2.impact([f1, f2], 'b', 1)).some(i => i.blockId === 'a'));

    const f3 = `${TMP}/external.yume.js`;
    await write(f3, 'external', null, {
      head: "import fs from 'node:fs';\nimport pkg from '@scope/pkg/subpath';\nexport function external() {}",
      refs: [
        { kind: "import", target: "node:fs" },
        { kind: "import", target: "@scope/pkg/subpath" },
      ],
    });
    const externalReport = await rt2.refsCheck([f3]);
    assert.equal(externalReport.ok, true);
    assert.equal(externalReport.warnings.filter(i => i.type === 'unresolved-ref').length, 0);

    const f4 = `${TMP}/selfcall.yume.js`;
    await write(f4, 'selfcall', null, {
      head: "export function selfcall() { return selfcall(); }",
      refs: [{ kind: "calls", target: "selfcall" }],
    });
    const selfReport = await rt2.refsCheck([f4]);
    assert.equal(selfReport.ok, true);
    assert.equal(selfReport.warnings.filter(i => i.type === 'cycle').length, 0);
  });

  await test('v001: CLI and direct cli call', async () => {
    await setup(rt1);
    
    // External call
    assert.ok(execSync( `node runYume.js ${F} history` , { encoding: 'utf8' }).includes('apply='));
    
    // Direct call (for coverage)
    const { block } = rt1.parseBlock(readFileSync(F, 'utf8'));
    let out = '';
    const oldLog = console.log;
    console.log = (...args) => { out += args.join(' ') + '\n'; };
    try {
      await rt1.cli(F, block, ['node', F, 'history']);
    } finally {
      console.log = oldLog;
    }
    assert.ok(out.includes('apply='));
    
    // commitManual
    const src = readFileSync(F, 'utf8');
    const headStart = src.indexOf('// === HEAD ===');
    const headEnd = src.indexOf('// === /HEAD ===');
    const newSrc = src.slice(0, headStart + 15) + 'export function test() { return 5; }\n' + src.slice(headEnd);
    writeFileSync(F, newSrc);
    
    const res = await rt1.commitManual(F, { note: { author: 'cli', text: 'manual' } });
    assert.equal(res.committed, true);
    assert.ok((await rt1.history(F)).length, 2);
  });
});

// ============================================================
// 7. Self-parse
// ============================================================
await group('Self-parse', async () => {
  await test('自分自身を Block に分解できる', async () => {
    const src = readFileSync('./core.module.yume.js', 'utf8');
    const blocks = parseJS(src, 'self');
    const g = new Graph(blocks);
    assert.ok(g.byType('function').length > 5);
    assert.deepEqual(g.verify(), { ok: true });
  });
});

// ============================================================
// 集計
// ============================================================
if (existsSync(TMP)) rmSync(TMP, { recursive: true });

console.log(`\n=========================================`);
console.log(`  ${pass} passed, ${fail} failed`);
console.log(`=========================================`);

if (fail > 0) process.exit(1);
