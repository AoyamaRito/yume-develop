#!/usr/bin/env node
// setup.js — bootstrap a new yume project outside yume-develop
//
// Usage:
//   node setup.js <target-dir>
//
// Creates:
//   <target-dir>/
//     yume/ver002.handle.yume.js   (runtime)
//     runYume.js                   (CLI entry)
//     starter.fn.yume.js           (minimal example)

import { mkdir, copyFile, writeFile, access } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

const STARTER = `// @yume-format: 1

export const __block = {
  "id": "starter",
  "type": "fn",
  "schemaVersion": 1,
  "runtime": { "name": "yume", "version": "002" },
  "versions": []
};

// === HEAD ===
// @tags: example
export function main() {
  return "hello from yume";
}

// === /HEAD ===
`;

const PACKAGE_JSON = JSON.stringify({
  name: "yume-project",
  version: "1.0.0",
  type: "module",
  private: true,
  scripts: {
    yume: "node runYume.js"
  }
}, null, 2);

const GITIGNORE = `yume/*.lock
yume/*.tmp
.DS_Store
`;

const README = `# Yume Project

This is a standalone yume-enabled project bootstrapped outside \`yume-develop\`.

## Quick Start

To read the code or design block's latest HEAD:
\`\`\`sh
node runYume.js starter.fn.yume.js show head --raw
\`\`\`

To check the history:
\`\`\`sh
node runYume.js starter.fn.yume.js history
\`\`\`

To manually record your changes (AI-free manual reconciliation):
\`\`\`sh
node runYume.js starter.fn.yume.js commit --note "your message"
\`\`\`

## Directory Structure

- \`starter.fn.yume.js\`: Your primary implementation block.
- \`runYume.js\`: The AI-Native CLI wrapper.
- \`yume/ver002.handle.yume.js\`: The pinned runtime engine for version control.
`;

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node setup.js <target-dir>');
    process.exit(1);
  }

  const dest = resolve(target);

  if (await exists(dest)) {
    console.error(`Error: ${dest} already exists`);
    process.exit(1);
  }

  await mkdir(join(dest, 'yume'), { recursive: true });

  await copyFile(
    join(HERE, 'runtimes', 'ver002.handle.yume.js'),
    join(dest, 'yume', 'ver002.handle.yume.js')
  );
  await copyFile(join(HERE, 'runYume.js'), join(dest, 'runYume.js'));
  await writeFile(join(dest, 'starter.fn.yume.js'), STARTER);
  await writeFile(join(dest, 'package.json'), PACKAGE_JSON);
  await writeFile(join(dest, '.gitignore'), GITIGNORE);
  await writeFile(join(dest, 'README.md'), README);

  // initial commit so the file has a valid version entry
  const rt = await import(pathToFileURL(join(dest, 'yume', 'ver002.handle.yume.js')).href);
  const starterUrl = pathToFileURL(join(dest, 'starter.fn.yume.js')).href;
  await rt.commitManual(starterUrl, { note: { text: 'initial', author: 'setup' } });

  console.log(`created yume project: ${dest}`);
  console.log(`  yume/ver002.handle.yume.js  (runtime engine)`);
  console.log(`  runYume.js                  (CLI tool)`);
  console.log(`  starter.fn.yume.js          (starter block)`);
  console.log(`  package.json                (ESM configuration)`);
  console.log(`  .gitignore                  (ignore temporary/lock files)`);
  console.log(`  README.md                   (quick-start guide)`);
  console.log(`\nTo get started, run:\n  cd ${target}\n  node runYume.js starter.fn.yume.js show head --raw`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
