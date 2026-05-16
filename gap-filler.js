import fs from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runWithCoverage, analyzeCoverageGaps } from './coverage.verify.yume.js';
import { runSession } from './eyes.observation.yume.js';
import demo from './headless-demo.fn.yume.js';
import { askLLM } from './yume-kantoku/llm.js';
import { parseBlock, extractRefsAndTags, serializeBlock } from './runtimes/ver002.handle.yume.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const targetFileUrl = pathToFileURL('./headless-demo.fn.yume.js').href;
const sourceText = fs.readFileSync('./headless-demo.fn.yume.js', 'utf8');
const V2_FORMAT_EXAMPLE = `\
// @yume-format: 1

export const __block = {
  "id": "hello",
  "type": "fn",
  "schemaVersion": 2,
  "runtime": { "name": "yume", "version": "002" },
  "api": [],
  "versions": [
    { "v": 1, "content": "export function hello(name) {\\n  return \`hello, \${name}!\`;\\n}", "ts": 1714000000000, "refs": [], "tags": [], "applyId": null }
  ]
};

// === HEAD ===
export function hello(name) {
  return \`hello, \${name}!\`;
}
// === /HEAD ===`;
const OUTPUT_FILE = resolve(__dirname, 'headless-demo.test.yume.js');

async function main() {
  console.log("1. Running E2E Scenario and collecting coverage...");

  const partialEvents = demo.events.slice(0, 2);
  const testScenario = async () => {
    runSession(demo, { dims: { w: 400, h: 300 }, events: partialEvents });
  };

  const coverageFunctions = await runWithCoverage(testScenario, targetFileUrl);
  const gaps = analyzeCoverageGaps(coverageFunctions, sourceText);

  if (gaps.length === 0) {
    console.log("Coverage is 100%. No gaps to fill.");
    return;
  }

  console.log(`Found ${gaps.length} coverage gaps.`);
  console.log("2. Asking LLM to generate gap-filling tests...\n");

  const prompt = buildPrompt(gaps);
  const response = await askLLM(prompt, {
    systemInstruction: "You output ONLY a valid .yume.js file. No explanations. No markdown fences. Output the raw file content starting with // @yume-format: 1"
  });

  const code = extractCode(response);
  if (!code) {
    console.error("LLM returned no extractable .yume.js content. Raw response:\n", response);
    process.exit(1);
  }

  const bootstrapped = bootstrapBlock(code);
  fs.writeFileSync(OUTPUT_FILE, bootstrapped + '\n');
  console.log(`3. Written and bootstrapped: ${OUTPUT_FILE}`);
}

function buildPrompt(gaps) {
  let prompt = `# Gap Filler Task\n\n`;
  prompt += `You are an AI tasked with achieving 100% code coverage.\n`;
  prompt += `An E2E test was run but certain branches were not executed.\n\n`;

  prompt += `## .yume.js format reference (follow this exactly)\n`;
  prompt += `\`\`\`javascript\n${V2_FORMAT_EXAMPLE}\n\`\`\`\n\n`;

  prompt += `## Target File: headless-demo.fn.yume.js\n`;
  prompt += `\`\`\`javascript\n${sourceText}\n\`\`\`\n\n`;

  prompt += `## Unexecuted Snippets (Gaps)\n`;
  gaps.forEach((gap, i) => {
    prompt += `### Gap ${i + 1} in \`${gap.functionName}\`\n`;
    prompt += `\`\`\`javascript\n${gap.snippet}\n\`\`\`\n\n`;
  });

  prompt += `## Instructions\n`;
  prompt += `Output a complete .yume.js file named headless-demo.test.yume.js with:\n`;
  prompt += `- id: "headless-demo-test", type: "test", schemaVersion: 2\n`;
  prompt += `- runtime: { name: "yume", version: "002" }, api: [], versions: []\n`;
  prompt += `- HEAD region containing node:test + node:assert unit tests\n`;
  prompt += `- Each test imports from './headless-demo.fn.yume.js' and triggers the gap snippets\n`;
  prompt += `Output the raw file only. No markdown, no explanation.\n`;

  return prompt;
}

function bootstrapBlock(source) {
  const parsed = parseBlock(source);
  const { refs, tags } = extractRefsAndTags(parsed.head);
  parsed.block.schemaVersion = 2;
  parsed.block.runtime = { name: 'yume', version: '002' };
  parsed.block.versions = [{
    v: 1,
    content: parsed.head,
    ts: Date.now(),
    refs,
    tags,
    applyId: null,
  }];
  return serializeBlock(parsed);
}

function extractCode(response) {
  // フォーマットマーカーで始まる場合はそのまま使う
  const trimmed = response.trim();
  if (trimmed.startsWith('// @yume-format: 1')) return trimmed;

  // ```javascript ... ``` または ``` ... ``` ブロックを抽出
  const fenceMatch = trimmed.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
  if (fenceMatch && fenceMatch[1].includes('// @yume-format: 1')) return fenceMatch[1].trim();

  return null;
}

main().catch(console.error);
