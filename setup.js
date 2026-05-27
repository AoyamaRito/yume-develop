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

  // initial commit so the file has a valid version entry
  const rt = await import(pathToFileURL(join(dest, 'yume', 'ver002.handle.yume.js')).href);
  const starterUrl = pathToFileURL(join(dest, 'starter.fn.yume.js')).href;
  await rt.commitManual(starterUrl, { note: { text: 'initial', author: 'setup' } });

  console.log(`created: ${dest}`);
  console.log(`  yume/ver002.handle.yume.js`);
  console.log(`  runYume.js`);
  console.log(`  starter.fn.yume.js`);
  console.log(`\nrun: node runYume.js starter.fn.yume.js show head --raw`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
