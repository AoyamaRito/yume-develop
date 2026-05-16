// @yume-format: 1

export const __block = {
  "id": "janken",
  "type": "fn",
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
      "hash": "a72b01718a2dac41c3d49d45c629b80bde1b1d4efb6798cdc4c52017277f6d52",
      "prevHash": null,
      "content": "// Author: 沖井広行 (Hiroyuki OKINOI) / Pen name: 蒼山りと (Aoyama Rito)\n// SPDX-License-Identifier: MIT\n\n// [ai_s_emblem:#high#logic Janken-Knowledge]\n// Constraint Library Prototype: 3-Player Janken\n// Not a calculator. Not a function. Knowledge with constraints.\n// One pure function. No state. No side effects.\nfunction janken(constraints = {}) {\n  const H = [\"G\", \"C\", \"P\"];\n  const BEATS = { G: \"C\", C: \"P\", P: \"G\" };\n  const PLAYERS = [\"A\", \"B\", \"C\"];\n\n  // --- The Knowledge: all 27 possible worlds ---\n  const allWorlds = [];\n  for (const a of H) for (const b of H) for (const c of H) {\n    const hands = { A: a, B: b, C: c };\n    const types = new Set([a, b, c]);\n    if (types.size !== 2) {\n      allWorlds.push({ A: a, B: b, C: c, result: \"draw\", winners: [] });\n    } else {\n      const [t1, t2] = [...types];\n      const winHand = BEATS[t1] === t2 ? t1 : t2;\n      const winners = PLAYERS.filter(p => hands[p] === winHand);\n      allWorlds.push({ A: a, B: b, C: c, result: \"win\", winners });\n    }\n  }\n\n  // --- Apply Constraints: filter possible worlds ---\n  let worlds = allWorlds;\n  for (const [k, v] of Object.entries(constraints)) {\n    if (PLAYERS.includes(k)) {\n      worlds = worlds.filter(w => w[k] === v);\n    } else if (k === \"result\") {\n      worlds = worlds.filter(w => w.result === v);\n    } else if (k === \"winner\") {\n      worlds = worlds.filter(w => w.winners.includes(v));\n    } else if (k === \"winners\") {\n      worlds = worlds.filter(w =>\n        w.winners.length === v.length && v.every(x => w.winners.includes(x))\n      );\n    }\n  }\n\n  // --- Express: what remains ---\n  if (worlds.length === 0) {\n    return { _contradiction: true, _message: \"No world satisfies these constraints.\" };\n  }\n\n  const VARS = [\"A\", \"B\", \"C\", \"result\", \"winners\"];\n  const ser = x => JSON.stringify(x);\n  const determined = {};\n  const freeVars = [];\n\n  for (const v of VARS) {\n    const unique = [...new Set(worlds.map(w => ser(w[v])))];\n    if (unique.length === 1) {\n      determined[v] = JSON.parse(unique[0]);\n    } else {\n      freeVars.push(v);\n    }\n  }\n\n  if (freeVars.length === 0) {\n    return { _worlds: 1, ...determined };\n  }\n\n  const relations = {};\n\n  for (const v of freeVars) {\n    const others = freeVars.filter(f => f !== v);\n    if (others.length === 0) {\n      relations[v] = [...new Set(worlds.map(w => ser(w[v])))].map(s => JSON.parse(s));\n      continue;\n    }\n\n    const groups = {};\n    for (const w of worlds) {\n      const key = others.map(f => `${f}=${ser(w[f])}`).join(\", \");\n      if (!groups[key]) groups[key] = new Set();\n      groups[key].add(ser(w[v]));\n    }\n\n    const reversed = {};\n    for (const [cond, vals] of Object.entries(groups)) {\n      const valKey = [...vals].sort().join(\"|\");\n      if (!reversed[valKey]) reversed[valKey] = [];\n      reversed[valKey].push(cond);\n    }\n\n    const when = {};\n    for (const [valKey, conds] of Object.entries(reversed)) {\n      const vals = valKey.split(\"|\").map(s => JSON.parse(s));\n      const value = vals.length === 1 ? vals[0] : vals;\n      for (const c of conds) {\n        when[c] = value;\n      }\n    }\n\n    relations[v] = { depends_on: others, when };\n  }\n\n  return { _worlds: worlds.length, ...determined, ...relations };\n}\n// [/ai_s_emblem: Janken-Knowledge]\n\n// [ai_s_emblem:#mid#draw Demo]\nfunction demo() {\n  const line = (s) => console.log(`\\n${\"=\".repeat(60)}\\n${s}\\n${\"=\".repeat(60)}`);\n  const show = (label, constraints) => {\n    console.log(`\\n--- ${label} ---`);\n    console.log(`constrain(${JSON.stringify(constraints)})`);\n    console.log(\"→\", JSON.stringify(janken(constraints), null, 2));\n  };\n\n  line(\"Constraint Library Prototype: 3-Player Janken\");\n\n  // Forward: fix hands, get result\n  show(\"No constraints (raw knowledge)\", {});\n  show(\"Fix A only\", { A: \"G\" });\n  show(\"Fix A and B\", { A: \"G\", B: \"C\" });\n  show(\"Fix all three\", { A: \"G\", B: \"C\", C: \"P\" });\n  show(\"Fix all three (A wins)\", { A: \"G\", B: \"C\", C: \"C\" });\n\n  // Reverse: fix result, get hands\n  show(\"Reverse: who draws?\", { result: \"draw\" });\n  show(\"Reverse: A must win\", { winner: \"A\" });\n  show(\"Reverse: A wins with Rock\", { winner: \"A\", A: \"G\" });\n\n  // Contradiction\n  show(\"Contradiction: A=G but A must lose to B=P and C=P?\",\n    { A: \"G\", B: \"P\", C: \"P\", winner: \"A\" });\n\n  // Recursive: constrain the constrained\n  line(\"Recursive constraining\");\n  console.log(\"\\nStep 1: Only know A plays Rock\");\n  const r1 = janken({ A: \"G\" });\n  console.log(\"→\", r1._worlds, \"possible worlds\");\n\n  console.log(\"\\nStep 2: Now also know B plays Scissors\");\n  const r2 = janken({ A: \"G\", B: \"C\" });\n  console.log(\"→\", r2._worlds, \"possible worlds\");\n  console.log(\"→\", JSON.stringify(r2, null, 2));\n\n  console.log(\"\\nStep 3: Now also know C plays Paper\");\n  const r3 = janken({ A: \"G\", B: \"C\", C: \"P\" });\n  console.log(\"→\", r3._worlds, \"possible worlds\");\n  console.log(\"→\", JSON.stringify(r3, null, 2));\n}\n\n\nexport { janken };\n// [/ai_s_emblem: Demo]\n",
      "ts": 1778788882039,
      "refs": [
        {
          "kind": "calls",
          "target": "Set"
        },
        {
          "kind": "calls",
          "target": "ser"
        },
        {
          "kind": "calls",
          "target": "janken"
        },
        {
          "kind": "calls",
          "target": "line"
        },
        {
          "kind": "calls",
          "target": "show"
        }
      ],
      "tags": [],
      "applyId": null
    }
  ]
};

// === HEAD ===
// Author: 沖井広行 (Hiroyuki OKINOI) / Pen name: 蒼山りと (Aoyama Rito)
// SPDX-License-Identifier: MIT

// [ai_s_emblem:#high#logic Janken-Knowledge]
// Constraint Library Prototype: 3-Player Janken
// Not a calculator. Not a function. Knowledge with constraints.
// One pure function. No state. No side effects.
function janken(constraints = {}) {
  const H = ["G", "C", "P"];
  const BEATS = { G: "C", C: "P", P: "G" };
  const PLAYERS = ["A", "B", "C"];

  // --- The Knowledge: all 27 possible worlds ---
  const allWorlds = [];
  for (const a of H) for (const b of H) for (const c of H) {
    const hands = { A: a, B: b, C: c };
    const types = new Set([a, b, c]);
    if (types.size !== 2) {
      allWorlds.push({ A: a, B: b, C: c, result: "draw", winners: [] });
    } else {
      const [t1, t2] = [...types];
      const winHand = BEATS[t1] === t2 ? t1 : t2;
      const winners = PLAYERS.filter(p => hands[p] === winHand);
      allWorlds.push({ A: a, B: b, C: c, result: "win", winners });
    }
  }

  // --- Apply Constraints: filter possible worlds ---
  let worlds = allWorlds;
  for (const [k, v] of Object.entries(constraints)) {
    if (PLAYERS.includes(k)) {
      worlds = worlds.filter(w => w[k] === v);
    } else if (k === "result") {
      worlds = worlds.filter(w => w.result === v);
    } else if (k === "winner") {
      worlds = worlds.filter(w => w.winners.includes(v));
    } else if (k === "winners") {
      worlds = worlds.filter(w =>
        w.winners.length === v.length && v.every(x => w.winners.includes(x))
      );
    }
  }

  // --- Express: what remains ---
  if (worlds.length === 0) {
    return { _contradiction: true, _message: "No world satisfies these constraints." };
  }

  const VARS = ["A", "B", "C", "result", "winners"];
  const ser = x => JSON.stringify(x);
  const determined = {};
  const freeVars = [];

  for (const v of VARS) {
    const unique = [...new Set(worlds.map(w => ser(w[v])))];
    if (unique.length === 1) {
      determined[v] = JSON.parse(unique[0]);
    } else {
      freeVars.push(v);
    }
  }

  if (freeVars.length === 0) {
    return { _worlds: 1, ...determined };
  }

  const relations = {};

  for (const v of freeVars) {
    const others = freeVars.filter(f => f !== v);
    if (others.length === 0) {
      relations[v] = [...new Set(worlds.map(w => ser(w[v])))].map(s => JSON.parse(s));
      continue;
    }

    const groups = {};
    for (const w of worlds) {
      const key = others.map(f => `${f}=${ser(w[f])}`).join(", ");
      if (!groups[key]) groups[key] = new Set();
      groups[key].add(ser(w[v]));
    }

    const reversed = {};
    for (const [cond, vals] of Object.entries(groups)) {
      const valKey = [...vals].sort().join("|");
      if (!reversed[valKey]) reversed[valKey] = [];
      reversed[valKey].push(cond);
    }

    const when = {};
    for (const [valKey, conds] of Object.entries(reversed)) {
      const vals = valKey.split("|").map(s => JSON.parse(s));
      const value = vals.length === 1 ? vals[0] : vals;
      for (const c of conds) {
        when[c] = value;
      }
    }

    relations[v] = { depends_on: others, when };
  }

  return { _worlds: worlds.length, ...determined, ...relations };
}
// [/ai_s_emblem: Janken-Knowledge]

// [ai_s_emblem:#mid#draw Demo]
function demo() {
  const line = (s) => console.log(`\n${"=".repeat(60)}\n${s}\n${"=".repeat(60)}`);
  const show = (label, constraints) => {
    console.log(`\n--- ${label} ---`);
    console.log(`constrain(${JSON.stringify(constraints)})`);
    console.log("→", JSON.stringify(janken(constraints), null, 2));
  };

  line("Constraint Library Prototype: 3-Player Janken");

  // Forward: fix hands, get result
  show("No constraints (raw knowledge)", {});
  show("Fix A only", { A: "G" });
  show("Fix A and B", { A: "G", B: "C" });
  show("Fix all three", { A: "G", B: "C", C: "P" });
  show("Fix all three (A wins)", { A: "G", B: "C", C: "C" });

  // Reverse: fix result, get hands
  show("Reverse: who draws?", { result: "draw" });
  show("Reverse: A must win", { winner: "A" });
  show("Reverse: A wins with Rock", { winner: "A", A: "G" });

  // Contradiction
  show("Contradiction: A=G but A must lose to B=P and C=P?",
    { A: "G", B: "P", C: "P", winner: "A" });

  // Recursive: constrain the constrained
  line("Recursive constraining");
  console.log("\nStep 1: Only know A plays Rock");
  const r1 = janken({ A: "G" });
  console.log("→", r1._worlds, "possible worlds");

  console.log("\nStep 2: Now also know B plays Scissors");
  const r2 = janken({ A: "G", B: "C" });
  console.log("→", r2._worlds, "possible worlds");
  console.log("→", JSON.stringify(r2, null, 2));

  console.log("\nStep 3: Now also know C plays Paper");
  const r3 = janken({ A: "G", B: "C", C: "P" });
  console.log("→", r3._worlds, "possible worlds");
  console.log("→", JSON.stringify(r3, null, 2));
}


export { janken };
// [/ai_s_emblem: Demo]

// === /HEAD ===
