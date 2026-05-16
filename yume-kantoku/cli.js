import { askLLM } from './llm.js';
import { runReview, runCheck } from './commands.js';

const SYSTEM_INSTRUCTION = `
You are yume-kantoku, the objective validation and review agent for the yume-files ecosystem.
Your job is to review .yume.js files, generate E2E tests, and analyze browser errors.
You must be strictly objective, pointing out logic errors, missing tests, and architectural violations.
`;

async function main() {
  const command = process.argv[2];

  if (!command) {
    console.log('Usage: node cli.js <command> [args]');
    console.log('Commands:');
    console.log('  ping                         - Test LLM connectivity');
    console.log('  review <file.yume.js>        - Review a file and propose E2E tests');
    console.log('  check <demo.js> <scenario.js>- Run eyes.debugger and analyze logs');
    process.exit(1);
  }

  if (command === 'ping') {
    console.log('Pinging the LLM (testing connectivity)...');
    try {
      const response = await askLLM("Say 'Kantoku is online and ready.'", {
        systemInstruction: SYSTEM_INSTRUCTION,
      });
      console.log('Response:', response);
    } catch (e) {
      console.error('Ping failed.', e.message);
    }
    return;
  }

  if (command === 'review') {
    const file = process.argv[3];
    if (!file) {
      console.error('Error: Please specify a file to review.');
      process.exit(1);
    }
    await runReview(file);
    return;
  }

  if (command === 'check') {
    const demo = process.argv[3];
    const scenario = process.argv[4];
    if (!demo || !scenario) {
      console.error('Error: Please specify both demo and scenario files.');
      process.exit(1);
    }
    await runCheck(demo, scenario);
    return;
  }

  console.log(`Unknown command: ${command}`);
}

main().catch(console.error);
