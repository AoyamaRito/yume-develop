// @yume-format: 1

export const __block = {
  "id": "coverage",
  "type": "verify",
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
      "hash": "419014a02f81d689f22e8bf4a8958ac87ef64a566b380d499e27b20bf92d7a8a",
      "prevHash": null,
      "content": "import inspector from 'node:inspector/promises';\nimport { pathToFileURL } from 'node:url';\n\n/**\n * Runs a given async function and collects precise V8 code coverage.\n * Filters the coverage to only include the target file.\n * \n * @param {Function} testFn The async function (e.g. E2E scenario) to run.\n * @param {string} targetFileUrl The file URL (import.meta.url) of the file to trace.\n * @returns {Promise<Array>} Coverage ranges for the target file.\n */\nexport async function runWithCoverage(testFn, targetFileUrl) {\n  const session = new inspector.Session();\n  session.connect();\n\n  await session.post('Profiler.enable');\n  await session.post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });\n\n  await testFn();\n\n  const { result } = await session.post('Profiler.takePreciseCoverage');\n  \n  await session.post('Profiler.stopPreciseCoverage');\n  await session.post('Profiler.disable');\n  session.disconnect();\n\n  // Find the coverage script corresponding to our target file\n  const scriptCoverage = result.find(r => r.url === targetFileUrl);\n  \n  if (!scriptCoverage) {\n    return [];\n  }\n\n  // Filter out the global wrapper block and keep only functions that belong to the file\n  return scriptCoverage.functions;\n}\n\n/**\n * A helper to format coverage ranges into a human/AI-readable text.\n * It identifies blocks of code (by character offset) that were NOT executed.\n */\nexport function analyzeCoverageGaps(functions, sourceText) {\n  const gaps = [];\n  for (const fn of functions) {\n    for (const range of fn.ranges) {\n      if (range.count === 0) {\n        // This specific block of code was never executed.\n        const snippet = sourceText.substring(range.startOffset, range.endOffset);\n        // We only care about meaningful code, skip empty or whitespace-only gaps\n        if (snippet.trim().length > 0) {\n           gaps.push({\n             functionName: fn.functionName || '(anonymous)',\n             start: range.startOffset,\n             end: range.endOffset,\n             snippet: snippet\n           });\n        }\n      }\n    }\n  }\n  return gaps;\n}",
      "ts": 1714000000000,
      "refs": [
        {
          "kind": "import",
          "target": "node:inspector/promises"
        },
        {
          "kind": "import",
          "target": "node:url"
        },
        {
          "kind": "calls",
          "target": "testFn"
        }
      ],
      "tags": [
        "verify",
        "coverage"
      ],
      "applyId": null
    }
  ]
};

// === HEAD ===
import inspector from 'node:inspector/promises';
import { pathToFileURL } from 'node:url';

/**
 * Runs a given async function and collects precise V8 code coverage.
 * Filters the coverage to only include the target file.
 * 
 * @param {Function} testFn The async function (e.g. E2E scenario) to run.
 * @param {string} targetFileUrl The file URL (import.meta.url) of the file to trace.
 * @returns {Promise<Array>} Coverage ranges for the target file.
 */
export async function runWithCoverage(testFn, targetFileUrl) {
  const session = new inspector.Session();
  session.connect();

  await session.post('Profiler.enable');
  await session.post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });

  await testFn();

  const { result } = await session.post('Profiler.takePreciseCoverage');
  
  await session.post('Profiler.stopPreciseCoverage');
  await session.post('Profiler.disable');
  session.disconnect();

  // Find the coverage script corresponding to our target file
  const scriptCoverage = result.find(r => r.url === targetFileUrl);
  
  if (!scriptCoverage) {
    return [];
  }

  // Filter out the global wrapper block and keep only functions that belong to the file
  return scriptCoverage.functions;
}

/**
 * A helper to format coverage ranges into a human/AI-readable text.
 * It identifies blocks of code (by character offset) that were NOT executed.
 */
export function analyzeCoverageGaps(functions, sourceText) {
  const gaps = [];
  for (const fn of functions) {
    for (const range of fn.ranges) {
      if (range.count === 0) {
        // This specific block of code was never executed.
        const snippet = sourceText.substring(range.startOffset, range.endOffset);
        // We only care about meaningful code, skip empty or whitespace-only gaps
        if (snippet.trim().length > 0) {
           gaps.push({
             functionName: fn.functionName || '(anonymous)',
             start: range.startOffset,
             end: range.endOffset,
             snippet: snippet
           });
        }
      }
    }
  }
  return gaps;
}
// === /HEAD ===
