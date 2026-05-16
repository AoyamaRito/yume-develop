import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import { askLLM } from './llm.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * agent-player.js:
 *   - Runs a yume demo in a real browser.
 *   - Uses LLM (Gemini) to autonomously decide the next action.
 *   - Captures screenshots for each autonomous step.
 */

async function main() {
  const argv = process.argv;
  const demoPath = resolve(argv[2] || '../headless-demo.fn.yume.js');
  const outDir = resolve(argv[3] || './agent-screenshots');
  const maxSteps = parseInt(argv[4] || '5', 10);

  console.log(`[Agent-Player] Starting autonomous session...`);
  console.log(`  Demo: ${basename(demoPath)}`);
  console.log(`  Max Steps: ${maxSteps}`);

  mkdirSync(outDir, { recursive: true });

  // Read demo source code to give context to the LLM
  const demoSource = readFileSync(demoPath, 'utf8');

  // Setup local server
  const app = express();
  const port = 4000 + Math.floor(Math.random() * 1000);
  const rootDir = resolve(dirname(demoPath));
  app.use(express.static(resolve(rootDir, '..')));
  app.use((req, res, next) => {
    if (req.path.endsWith('.yume.js')) res.setHeader('Content-Type', 'application/javascript');
    next();
  });

  app.get('/', (req, res) => {
    const relDemoPath = basename(dirname(demoPath)) + '/' + basename(demoPath);
    res.send(`
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Agent Player Harness</title>
    <style>body{margin:0;background:#111;display:grid;place-items:center;height:100vh;}canvas{background:#fff;box-shadow:0 0 20px rgba(0,0,0,0.5);}</style>
    </head>
    <body>
      <canvas id="canvas" width="800" height="600"></canvas>
      <script type="module">
        import demoModule from '/${relDemoPath}';
        const demo = demoModule.default || demoModule;
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const dims = { w: canvas.width, h: canvas.height };
        let state = demo.initialState();
        window.__yume = {
          getState: () => state,
          render: () => { ctx.clearRect(0, 0, dims.w, dims.h); demo.render(ctx, state, dims); },
          dispatch: (evt) => { state = demo.dispatch(state, evt); window.__yume.render(); }
        };
        window.__yume.render();
        window.__yume_ready = true;
      </script>
    </body>
    </html>
    `);
  });

  const server = app.listen(port);
  const baseUrl = `http://localhost:${port}`;

  const browser = await chromium.launch({ headless: false });
  const page = await (await browser.newContext({ viewport: { width: 800, height: 600 } })).newPage();

  try {
    await page.goto(baseUrl);
    await page.waitForFunction(() => window.__yume_ready);

    for (let step = 0; step <= maxSteps; step++) {
      const seq = String(step).padStart(3, '0');
      
      // 1. Observe: Get current state from browser
      const currentState = await page.evaluate(() => window.__yume.getState());
      console.log(`\n[Step ${seq}] Current State:`, JSON.stringify(currentState));

      // Capture screenshot of current state
      const screenshotPath = join(outDir, `${seq}-state.png`);
      await page.screenshot({ path: screenshotPath });

      if (step === maxSteps) break;

      // 2. Think: Ask LLM for the next event
      const prompt = `
You are an autonomous AI tester. You are controlling a web application.
Based on the current state and the application's source code, decide the next event to dispatch.

Goal: Explore the application's features and try to reach interesting states. Be creative.

Current Application State:
${JSON.stringify(currentState, null, 2)}

Application Logic (Source Code):
\`\`\`javascript
${demoSource}
\`\`\`

Instructions:
1. Analyze the 'dispatch' function in the source code to see what 'type' of events are handled.
2. Choose one event and provide it in RAW JSON format. 
3. DO NOT provide any explanation, only the JSON object.

Example Output:
{"type": "move", "x": 150, "y": 250}
`;

      console.log(`[Step ${seq}] Thinking...`);
      const llmResponse = await askLLM(prompt, {
        systemInstruction: "You output ONLY valid JSON for an event object."
      });

      let nextEvent;
      try {
        // Clean up markdown if LLM included it
        const jsonOnly = llmResponse.replace(/```json\n?|\n?```/g, '').trim();
        nextEvent = JSON.parse(jsonOnly);
        console.log(`[Step ${seq}] AI decided to dispatch:`, JSON.stringify(nextEvent));
      } catch (e) {
        console.error(`[Step ${seq}] AI returned invalid JSON:`, llmResponse);
        break;
      }

      // 3. Act: Dispatch the event
      await page.evaluate((evt) => window.__yume.dispatch(evt), nextEvent);
      
      // Wait for visual update
      await page.waitForTimeout(1000);
    }

    console.log(`\n[Agent-Player] Autonomous session complete. Screenshots: ${outDir}`);

  } catch (err) {
    console.error('Error during agent playback:', err);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
    server.close();
  }
}

main().catch(console.error);
