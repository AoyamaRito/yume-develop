import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { askLLM } from './llm.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getHeadContent(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const headMatch = content.match(/\/\/ === HEAD ===\n([\s\S]*?)\n\/\/ === \/HEAD ===/);
    if (headMatch) {
      return headMatch[1];
    }
    return content;
  } catch (e) {
    throw new Error(`Failed to read file ${filePath}: ${e.message}`);
  }
}

export async function runReview(filePath) {
  console.log(`[Kantoku] Analyzing ${filePath}...`);
  const code = getHeadContent(filePath);

  const prompt = `
Please review the following JavaScript code. 
This code is from a .yume.js file in an AI-Native architecture.
Your task:
1. Identify any logic errors, architectural violations, or edge cases.
2. Propose specific E2E test cases that should be written to verify this code.

Code:
\`\`\`javascript
${code}
\`\`\`

Format your response clearly. Be objective and strict.
  `;

  const response = await askLLM(prompt, {
    systemInstruction: "You are an expert software reviewer and QA engineer."
  });

  console.log('\n=== Kantoku Review Report ===\n');
  console.log(response);
  console.log('\n=============================\n');
}

export async function runCheck(demoPath, scenarioPath) {
  console.log(`[Kantoku] Running eyes debugger for ${demoPath} with ${scenarioPath}...`);
  
  let output = '';
  try {
    const cmd = `node eyes.debugger.yume.js ${demoPath} ${scenarioPath}`;
    console.log(`> ${cmd}`);
    output = execSync(cmd, { cwd: resolve(__dirname, '..'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    console.log('Execution finished. Analyzing logs...');
  } catch (e) {
    console.log('Execution failed. Analyzing error logs...');
    output = e.stdout + '\n' + e.stderr;
  }

  // To prevent the prompt from being too large, we trim the output if necessary
  if (output.length > 50000) {
     output = output.slice(0, 25000) + '\n... [TRUNCATED] ...\n' + output.slice(-25000);
  }

  const prompt = `
I ran a visual/E2E test scenario using our 'eyes' debugger.
Here is the raw execution log and error output.
Your task:
1. Determine if the execution was successful or if it contains logic/runtime errors.
2. If there are errors, pinpoint the root cause based on the stack trace or log.
3. Suggest how to fix the underlying code.

Log Output:
\`\`\`text
${output}
\`\`\`
  `;

  const response = await askLLM(prompt, {
    systemInstruction: "You are an expert debugger and crash analyst."
  });

  console.log('\n=== Kantoku Eyes Analysis ===\n');
  console.log(response);
  console.log('\n=============================\n');
}
