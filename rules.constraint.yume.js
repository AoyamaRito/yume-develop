// @yume-format: 1

export const __block = {
  "id": "rules",
  "type": "constraint",
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
    },
    {
      "hash": "5ec00820b6a42f601588db58dd4183018d0f99d0468735a1da8b4fbff9a5fbbd",
      "prevHash": "cd5643c828056a311185bbc024743e5c09492bdb1d69eb6ba9bd6c7276e5b1ed",
      "content": "export function constraintBlock({ id, axes, values, derive, tags = [] }) {\n  if (typeof derive !== 'function') throw new Error('derive must be a function');\n  const worlds = [];\n  function* gen(idx, current) {\n    if (idx === axes.length) { yield current; return; }\n    const axis = axes[idx];\n    for (const v of values[axis]) yield* gen(idx + 1, { ...current, [axis]: v });\n  }\n  for (const w of gen(0, {})) {\n    const derived = derive(w) || {};\n    worlds.push({ ...w, ...derived });\n  }\n  return { id, type: 'constraint', content: JSON.stringify({ axes, values, worlds }), tags: ['constraint', ...tags] };\n}\n\nexport function evalConstraint(block, filter = {}) {\n  const data = JSON.parse(block.content);\n  if (!Array.isArray(data.worlds)) throw new Error('evalConstraint: constraint content must include materialized worlds');\n  const worlds = [];\n  for (const w of data.worlds) {\n    let pass = true; for (const [k, v] of Object.entries(filter)) if (!k.startsWith('_') && w[k] !== v) { pass = false; break; }\n    if (pass) worlds.push(w);\n  }\n  return worlds.length === 0 ? { _contradiction: true } : { _worlds: worlds.length, worlds };\n}\n",
      "ts": 1779711551605,
      "refs": [
        {
          "kind": "calls",
          "target": "Error"
        },
        {
          "kind": "calls",
          "target": "gen"
        },
        {
          "kind": "calls",
          "target": "derive"
        }
      ],
      "tags": [],
      "applyId": "apply-2026-05-25-82a5a610"
    },
    {
      "content": "// @tags: standalone constraint-folding\nexport function constraintBlock({ id, axes, values, derive, tags = [] }) {\n  if (typeof derive !== 'function') throw new Error('derive must be a function');\n  const worlds = [];\n  function* gen(idx, current) {\n    if (idx === axes.length) { yield current; return; }\n    const axis = axes[idx];\n    for (const v of values[axis]) yield* gen(idx + 1, { ...current, [axis]: v });\n  }\n  for (const w of gen(0, {})) {\n    const derived = derive(w) || {};\n    worlds.push({ ...w, ...derived });\n  }\n  return { id, type: 'constraint', content: JSON.stringify({ axes, values, worlds }), tags: ['constraint', ...tags] };\n}\n\nexport function evalConstraint(block, filter = {}) {\n  const data = JSON.parse(block.content);\n  if (!Array.isArray(data.worlds)) throw new Error('evalConstraint: constraint content must include materialized worlds');\n  const worlds = [];\n  for (const w of data.worlds) {\n    let pass = true; for (const [k, v] of Object.entries(filter)) if (!k.startsWith('_') && w[k] !== v) { pass = false; break; }\n    if (pass) worlds.push(w);\n  }\n  return worlds.length === 0 ? { _contradiction: true } : { _worlds: worlds.length, worlds };\n}\n",
      "ts": 1779867865774,
      "refs": [
        {
          "kind": "calls",
          "target": "Error"
        },
        {
          "kind": "calls",
          "target": "gen"
        },
        {
          "kind": "calls",
          "target": "derive"
        }
      ],
      "tags": [
        "standalone",
        "constraint-folding"
      ],
      "applyId": "apply-2026-05-27-a739180e",
      "hash": "4f34bdf760c623636589b6eab85f1f7f5a50bf881e33338ad7571b376a89418b",
      "prevHash": "5ec00820b6a42f601588db58dd4183018d0f99d0468735a1da8b4fbff9a5fbbd"
    }
  ],
  "notes": {
    "apply:apply-2026-05-25-82a5a610": [
      {
        "id": "n-5ee32241-0f61-4ebb-88dc-355c8a5b765d",
        "author": "human",
        "ts": 1779711551607,
        "text": "A9: materialize constraint worlds without runtime code generation"
      }
    ],
    "apply:apply-2026-05-27-a739180e": [
      {
        "id": "n-90d3ed05-42dd-472e-8da5-64b291fb09c9",
        "author": "human",
        "ts": 1779867865776,
        "text": "add @tags: standalone constraint-folding; migrate runtime to ver002"
      }
    ]
  }
};

// === HEAD ===
// @tags: standalone constraint-folding
export function constraintBlock({ id, axes, values, derive, tags = [] }) {
  if (typeof derive !== 'function') throw new Error('derive must be a function');
  const worlds = [];
  function* gen(idx, current) {
    if (idx === axes.length) { yield current; return; }
    const axis = axes[idx];
    for (const v of values[axis]) yield* gen(idx + 1, { ...current, [axis]: v });
  }
  for (const w of gen(0, {})) {
    const derived = derive(w) || {};
    worlds.push({ ...w, ...derived });
  }
  return { id, type: 'constraint', content: JSON.stringify({ axes, values, worlds }), tags: ['constraint', ...tags] };
}

export function evalConstraint(block, filter = {}) {
  const data = JSON.parse(block.content);
  if (!Array.isArray(data.worlds)) throw new Error('evalConstraint: constraint content must include materialized worlds');
  const worlds = [];
  for (const w of data.worlds) {
    let pass = true; for (const [k, v] of Object.entries(filter)) if (!k.startsWith('_') && w[k] !== v) { pass = false; break; }
    if (pass) worlds.push(w);
  }
  return worlds.length === 0 ? { _contradiction: true } : { _worlds: worlds.length, worlds };
}

// === /HEAD ===
