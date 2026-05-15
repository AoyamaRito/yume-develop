// cover.js — Phase 2.0 (spec self-coverage) + Phase 2.1 (e2e coverage)
// Adapted for yume-develop.

import { cases } from './runtime.spec.yume.js';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Use v001 as the primary coverage target for now as the specs are written for it.
const realRt = await import('./runtimes/ver001.handle.yume.js');

function percent(part, whole) {
  if (whole === 0) return '100.0%';
  return `${((part / whole) * 100).toFixed(1)}%`;
}

// ----------------------------------------------------------------------
// Phase 2.0: spec self-coverage (Proxy wrap)
// ----------------------------------------------------------------------
const callsByCase = new Map();
let currentCase = null;

const hookedRt = new Proxy(realRt, {
  get(target, prop, receiver) {
    const v = Reflect.get(target, prop, receiver);
    if (typeof v !== 'function') return v;
    return function (...args) {
      if (currentCase) {
        if (!callsByCase.has(currentCase)) callsByCase.set(currentCase, new Set());
        callsByCase.get(currentCase).add(prop);
      }
      return v.apply(this, args);
    };
  },
});

let pass = 0;
let fail = 0;
const failTags = [];

for (const c of cases) {
  currentCase = c.tag;
  try {
    const ok = await c.run(hookedRt);
    if (ok) pass++;
    else { fail++; failTags.push(c.tag); }
  } catch (e) {
    fail++;
    failTags.push(c.tag + ' ERROR: ' + e.message);
  }
}
currentCase = null;

console.log(`spec: ${pass}/${cases.length} pass (${percent(pass, cases.length)})`);
if (failTags.length) {
  console.log('  failing:');
  for (const t of failTags) console.log('    ' + t);
}

const callsAll = new Set();
for (const set of callsByCase.values()) for (const n of set) callsAll.add(n);

const driftCases = cases.filter(c => c.fn && !(callsByCase.get(c.tag)?.has(c.fn)));
console.log(`declared-fn drift: ${driftCases.length}/${cases.length} cases declare an fn that was never called inside run()`);
if (driftCases.length) {
  for (const c of driftCases) {
    const actual = [...(callsByCase.get(c.tag) ?? [])].join(',') || '(none)';
    console.log(`    ${c.tag}  declared=${c.fn}  actual={${actual}}`);
  }
}

const exportedFns = Object.keys(realRt).filter(k => typeof realRt[k] === 'function').sort();
const touched = exportedFns.filter(f => callsAll.has(f));
const untouched = exportedFns.filter(f => !callsAll.has(f));
console.log(`runtime-export coverage: ${touched.length}/${exportedFns.length} (${percent(touched.length, exportedFns.length)}) touched by spec`);
if (untouched.length) {
  console.log('  not touched by any spec case:');
  for (const f of untouched) console.log('    ' + f);
}

// ----------------------------------------------------------------------
// Phase 2.1: e2e coverage (--e2e flag)
// ----------------------------------------------------------------------
const wantE2E = process.argv.includes('--e2e');
let e2eExit = 0;

if (wantE2E) {
  console.log('\n--- e2e coverage ---');
  const tmp = mkdtempSync(join(tmpdir(), 'yume-cover-'));
  const out = join(tmp, 'e2e-calls.json');

  await new Promise((resolve) => {
    const child = spawn('node', ['e2e.js'], {
      env: { ...process.env, YUME_COVER: '1', YUME_COVER_OUT: out },
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    child.on('exit', (code) => {
      e2eExit = code ?? 1;
      resolve();
    });
  });

  let e2eCalls;
  try {
    e2eCalls = new Map(JSON.parse(readFileSync(out, 'utf8')));
  } catch (e) {
    console.log('  could not read coverage output: ' + e.message);
    e2eCalls = new Map();
  }
  rmSync(tmp, { recursive: true, force: true });

  const e2eFns = new Set(e2eCalls.keys());
  const e2eTouched = exportedFns.filter(f => e2eFns.has(f));
  const e2eUntouched = exportedFns.filter(f => !e2eFns.has(f));
  console.log(`e2e fn coverage: ${e2eTouched.length}/${exportedFns.length} (${percent(e2eTouched.length, exportedFns.length)}) runtime fns called by e2e`);
  if (e2eUntouched.length) {
    console.log('  not called by e2e:');
    for (const f of e2eUntouched) console.log('    ' + f);
  }

  const specCasesUntouched = cases.filter(c => c.fn && !e2eFns.has(c.fn));
  const specCasesTouched = cases.length - specCasesUntouched.length;
  console.log(`e2e spec-case coverage (fn-level): ${specCasesTouched}/${cases.length} (${percent(specCasesTouched, cases.length)})`);
  console.log(`spec cases not reached by e2e (fn-level): ${specCasesUntouched.length}/${cases.length}`);
  if (specCasesUntouched.length) {
    console.log('  gaps (spec cases whose target fn is never called by E2E):');
    for (const c of specCasesUntouched) console.log('    ' + c.tag);
  }
}

if (fail > 0 || e2eExit !== 0) process.exit(1);
