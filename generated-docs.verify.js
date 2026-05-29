import { readFile, writeFile } from 'node:fs/promises';

const mode = process.argv.includes('--write') ? 'write' : 'check';

const [
  agents,
  readme,
  bible,
] = await Promise.all([
  import('./AGENTS.aiDoc.yume.js'),
  import('./README.aiDoc.yume.js'),
  import('./bible.aiDoc.yume.js'),
]);

// AGENTS.md / GEMINI.md は SHADOW stub (本文は AGENTS.aiDoc.yume.js)。
// README.md は人間向け overview。BIBLE.md は公理 archive。それ以外の onboarding/manual 系 SHADOW は廃止。
const generatedDocs = [
  ['AGENTS.md', agents.exportMarkdown()],
  ['GEMINI.md', agents.exportGeminiMarkdown()],
  ['README.md', readme.exportMarkdown()],
  ['BIBLE.md', bible.Kernel.exportMarkdown()],
];

const mismatches = [];

for (const [path, expected] of generatedDocs) {
  if (mode === 'write') {
    await writeFile(path, expected, 'utf8');
    console.log(`generated ${path}`);
    continue;
  }

  let actual = '';
  try {
    actual = await readFile(path, 'utf8');
  } catch (error) {
    mismatches.push(`${path}: ${error.message}`);
    continue;
  }

  if (actual !== expected) mismatches.push(path);
}

if (mode === 'check') {
  if (mismatches.length > 0) {
    console.error(`generated-docs: mismatch in ${mismatches.join(', ')}`);
    process.exit(1);
  }
  console.log(`generated-docs: ok (${generatedDocs.length} files)`);
}
