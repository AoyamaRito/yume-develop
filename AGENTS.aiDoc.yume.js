// @yume-format: 1

export const __block = {
  "id": "agents",
  "type": "aiDoc",
  "schemaVersion": 1,
  "runtime": {
    "name": "yume",
    "version": "002"
  },
  "api": [
    "commit",
    "history",
    "show",
    "validate",
    "exportMarkdown"
  ],
  "versions": [
    {
      "hash": "2868c468f3e728340029dd88ec151a70edadc368636541f3be13ece089ca35a6",
      "prevHash": null,
      "content": "// AGENTS.aiDoc.yume.js - REAL source for AGENTS.md\n// This file is the REAL (Axiom A3). AGENTS.md is a SHADOW.\n\nexport const Instructions = {\n  title: \"AI Agent Instructions for yume-develop\",\n  intro: \"This repository is the product-track workspace for the portable `.yume.js` file format and its co-located runtimes. It is intentionally self-contained: do not assume a sibling `yume-files` checkout is available at runtime.\",\n  startHere: [\n    \"Read `runAndReadMe.aiDoc.yume.js` first. It is the operational runbook for AI agents.\",\n    \"Use `README.md` for the human-facing overview and examples.\",\n    \"Use `BLOCKFILE.aiDoc.yume.js` only when exact format or runtime semantics are needed.\",\n    \"Use `examples/hello.fn.yume.js` as the smallest valid `.yume.js` sample.\"\n  ],\n  rules: [\n    { name: \"Dependency-Free\", detail: \"Keep the runtime dependency-free. Do not add npm dependencies unless the project deliberately changes that constraint.\" },\n    { name: \"Sniper Reading\", detail: \"`.yume.js` files are huge due to history. Do not `read_file` blindly. Use `node runYume.js <file>.yume.js show head --raw` to get clean HEAD source.\" },\n    { name: \"Eyes over Server\", detail: \"Use `ai-eyes` for structural verification of UI/3D logic instead of waiting for human visual confirmation.\" },\n    { name: \"REAL / SHADOW (A3)\", detail: \"Markdown files (*.md) are SHADOWs. Never edit them directly. Edit the corresponding *.aiDoc.yume.js (REAL) and export.\" },\n    { name: \"Strict Validation\", detail: \"Run `validate` and `refs-check .` after any structural change.\" }\n  ],\n  commonCommands: [\n    \"npm test\",\n    \"node runYume.js runAndReadMe.aiDoc.yume.js show head --raw\",\n    \"node runYume.js examples/hello.fn.yume.js refs-check .\",\n    \"node runYume.js <file>.yume.js commit --note \\\"why this change exists\\\"\"\n  ]\n};\n\nexport const exportMarkdown = () => {\n  let md = `# ${Instructions.title}\\n\\n${Instructions.intro}\\n\\n`;\n  \n  md += `## Start Here\\n\\n`;\n  md += Instructions.startHere.map(s => `1. ${s}`).join('\\n') + '\\n\\n';\n  \n  md += `## Project Rules\\n\\n`;\n  md += Instructions.rules.map(r => `- **${r.name}**: ${r.detail}`).join('\\n') + '\\n\\n';\n  \n  md += `## Common Commands\\n\\n\\`\\`\\`sh\\n`;\n  md += Instructions.commonCommands.join('\\n') + '\\n\\`\\`\\`\\n';\n  \n  return md;\n};\n",
      "ts": 1778951598743,
      "refs": [],
      "tags": [],
      "applyId": null
    }
  ],
  "notes": {
    "2868c468f3e728340029dd88ec151a70edadc368636541f3be13ece089ca35a6": [
      {
        "id": "note-2868c468f3e7",
        "ts": 1778951598743,
        "author": "ai",
        "kind": "repair",
        "text": "repair noncanonical __block JSON and align agent commands with runYume dispatcher"
      }
    ]
  }
};

// === HEAD ===
// AGENTS.aiDoc.yume.js - REAL source for AGENTS.md
// This file is the REAL (Axiom A3). AGENTS.md is a SHADOW.

export const Instructions = {
  title: "AI Agent Instructions for yume-develop",
  intro: "This repository is the product-track workspace for the portable `.yume.js` file format and its co-located runtimes. It is intentionally self-contained: do not assume a sibling `yume-files` checkout is available at runtime.",
  startHere: [
    "Read `runAndReadMe.aiDoc.yume.js` first. It is the operational runbook for AI agents.",
    "Use `README.md` for the human-facing overview and examples.",
    "Use `BLOCKFILE.aiDoc.yume.js` only when exact format or runtime semantics are needed.",
    "Use `examples/hello.fn.yume.js` as the smallest valid `.yume.js` sample."
  ],
  rules: [
    { name: "Dependency-Free", detail: "Keep the runtime dependency-free. Do not add npm dependencies unless the project deliberately changes that constraint." },
    { name: "Sniper Reading", detail: "`.yume.js` files are huge due to history. Do not `read_file` blindly. Use `node runYume.js <file>.yume.js show head --raw` to get clean HEAD source." },
    { name: "Eyes over Server", detail: "Use `ai-eyes` for structural verification of UI/3D logic instead of waiting for human visual confirmation." },
    { name: "REAL / SHADOW (A3)", detail: "Markdown files (*.md) are SHADOWs. Never edit them directly. Edit the corresponding *.aiDoc.yume.js (REAL) and export." },
    { name: "Strict Validation", detail: "Run `validate` and `refs-check .` after any structural change." }
  ],
  commonCommands: [
    "npm test",
    "node runYume.js runAndReadMe.aiDoc.yume.js show head --raw",
    "node runYume.js examples/hello.fn.yume.js refs-check .",
    "node runYume.js <file>.yume.js commit --note \"why this change exists\""
  ]
};

export const exportMarkdown = () => {
  let md = `# ${Instructions.title}\n\n${Instructions.intro}\n\n`;
  
  md += `## Start Here\n\n`;
  md += Instructions.startHere.map(s => `1. ${s}`).join('\n') + '\n\n';
  
  md += `## Project Rules\n\n`;
  md += Instructions.rules.map(r => `- **${r.name}**: ${r.detail}`).join('\n') + '\n\n';
  
  md += `## Common Commands\n\n\`\`\`sh\n`;
  md += Instructions.commonCommands.join('\n') + '\n\`\`\`\n';
  
  return md;
};

// === /HEAD ===
