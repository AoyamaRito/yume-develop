// @yume-format: 1

export const __block = {
  "id": "rules",
  "type": "constraint",
  "schemaVersion": 1,
  "runtime": {
    "name": "yume",
    "version": "001"
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
    "tags"
  ],
  "versions": [
    {
      "hash": "cd5643c828056a311185bbc024743e5c09492bdb1d69eb6ba9bd6c7276e5b1ed",
      "prevHash": null,
      "content": "export function constraintBlock({ id, axes, values, derive, tags = [] }) {\n  if (typeof derive !== 'function') throw new Error('derive must be a function');\n  return { id, type: 'constraint', content: JSON.stringify({ axes, values, derive: derive.toString() }), tags: ['constraint', ...tags] };\n}\n\nexport function evalConstraint(block, filter = {}) {\n  const data = JSON.parse(block.content), { axes, values } = data;\n  const derive = new Function('combo', `return (${data.derive})(combo);`);\n  function* gen(idx, current) {\n    if (idx === axes.length) { yield current; return; }\n    const axis = axes[idx]; for (const v of values[axis]) yield* gen(idx + 1, { ...current, [axis]: v });\n  }\n  const worlds = [];\n  for (const w of gen(0, {})) {\n    const derived = derive(w) || {}, merged = { ...w, ...derived };\n    let pass = true; for (const [k, v] of Object.entries(filter)) if (!k.startsWith('_') && merged[k] !== v) { pass = false; break; }\n    if (pass) worlds.push(merged);\n  }\n  return worlds.length === 0 ? { _contradiction: true } : { _worlds: worlds.length, worlds };\n}\n",
      "ts": 1778786873259,
      "refs": [],
      "tags": [],
      "applyId": null
    }
  ]
};

// === HEAD ===
export function constraintBlock({ id, axes, values, derive, tags = [] }) {
  if (typeof derive !== 'function') throw new Error('derive must be a function');
  return { id, type: 'constraint', content: JSON.stringify({ axes, values, derive: derive.toString() }), tags: ['constraint', ...tags] };
}

export function evalConstraint(block, filter = {}) {
  const data = JSON.parse(block.content), { axes, values } = data;
  const derive = new Function('combo', `return (${data.derive})(combo);`);
  function* gen(idx, current) {
    if (idx === axes.length) { yield current; return; }
    const axis = axes[idx]; for (const v of values[axis]) yield* gen(idx + 1, { ...current, [axis]: v });
  }
  const worlds = [];
  for (const w of gen(0, {})) {
    const derived = derive(w) || {}, merged = { ...w, ...derived };
    let pass = true; for (const [k, v] of Object.entries(filter)) if (!k.startsWith('_') && merged[k] !== v) { pass = false; break; }
    if (pass) worlds.push(merged);
  }
  return worlds.length === 0 ? { _contradiction: true } : { _worlds: worlds.length, worlds };
}

// === /HEAD ===

// === BOOT ===
if (import.meta.url === `file://${process.argv[1]}`) {
  const path = __block.runtime.path ?? `./runtimes/ver${__block.runtime.version}.handle.yume.js`;
  const rt = await import(path);
  await rt.cli(import.meta.url, __block, process.argv);
}
// === /BOOT ===
