import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { askLLM } from './llm.js';
import express from 'express';

/**
 * yume-swarm.js:
 *   - Runs multiple autonomous LLM agents in parallel.
 *   - Each agent has a distinct "persona" and operates its own browser context.
 *   - Used for chaos testing and multi-user simulation.
 */

const PERSONAS = [
  {
    name: "Alice (Normal User)",
    color: "#2563eb", // blue
    instruction: "You are a normal, well-behaved user. You explore features slowly and methodically. You try to draw a nice shape."
  },
  {
    name: "Bob (Chaotic User)",
    color: "#dc2626", // red
    instruction: "You are an impatient and chaotic user. You jump to extreme coordinates (0 or 800) and spam actions. You trigger resets often."
  },
  {
    name: "Charlie (Explorer)",
    color: "#16a34a", // green
    instruction: "You are a curious explorer. You only move in small, incremental steps from your current position. You never reset."
  }
];

async function main() {
  const argv = process.argv;
  const demoPath = resolve(argv[2] || '../headless-demo.fn.yume.js');
  const outDir = resolve(argv[3] || './swarm-screenshots');
  const numAgents = Math.min(parseInt(argv[4] || '3', 10), PERSONAS.length);
  const maxSteps = 5;

  console.log(`[Swarm] Starting Multi-Agent Simulation with ${numAgents} agents...`);
  
  mkdirSync(outDir, { recursive: true });
  const demoSource = readFileSync(demoPath, 'utf8');

  // Server setup
  const app = express();
  const port = 5000 + Math.floor(Math.random() * 1000);
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
    <head><meta charset="UTF-8"><title>Swarm Harness</title>
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

  // Create agents
  const agents = [];
  for (let i = 0; i < numAgents; i++) {
    const persona = PERSONAS[i];
    const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
    const page = await context.newPage();
    
    // Position windows across the screen so we can see them if headless: false
    // (Playwright doesn't easily let us position native OS windows, but it's fine)
    
    agents.push({
      id: i,
      persona,
      context,
      page
    });
  }

  try {
    // Initialize all pages
    console.log(`[Swarm] Initializing ${numAgents} browser contexts...`);
    await Promise.all(agents.map(async (agent) => {
      await agent.page.goto(baseUrl);
      await agent.page.waitForFunction(() => window.__yume_ready);
    }));

    // Run swarm simulation
    console.log(`[Swarm] Simulation begins.`);
    
    // We run them concurrently
    await Promise.all(agents.map(async (agent) => {
      for (let step = 0; step <= maxSteps; step++) {
        const seq = String(step).padStart(3, '0');
        const prefix = `[Agent ${agent.id} | ${agent.persona.name.split(' ')[0]}]`;

        const currentState = await agent.page.evaluate(() => window.__yume.getState());
        
        // Capture individual agent screenshot
        const screenshotPath = join(outDir, `Agent${agent.id}-Step${seq}.png`);
        await agent.page.screenshot({ path: screenshotPath });

        if (step === maxSteps) break;

        const prompt = `
You are an autonomous AI tester participating in a swarm simulation.
Persona: ${agent.persona.instruction}

Your Goal: Based on your persona and the current application state, decide the next single action to take.

Current Application State:
${JSON.stringify(currentState, null, 2)}

Application Logic (Source Code):
\`\`\`javascript
${demoSource}
\`\`\`

Instructions:
1. Adhere strictly to your persona's behavioral traits.
2. Choose one event to dispatch to the application.
3. Provide ONLY the RAW JSON object for the event. No markdown, no explanations.

Example format:
{"type": "move", "x": 100, "y": 100}
`;

        console.log(`${prefix} Thinking (Step ${seq})...`);
        
        let nextEvent;
        try {
          const llmResponse = await askLLM(prompt, {
            systemInstruction: "Output ONLY valid JSON for an event object."
          });
          const jsonOnly = llmResponse.replace(/```json\n?|\n?```/g, '').trim();
          nextEvent = JSON.parse(jsonOnly);
        } catch (e) {
          console.error(`${prefix} Invalid JSON response. Skipping step.`);
          continue;
        }

        console.log(`${prefix} Dispatching:`, JSON.stringify(nextEvent));
        await agent.page.evaluate((evt) => window.__yume.dispatch(evt), nextEvent);
        
        // Stagger delays to simulate real user network chaos
        const chaosDelay = 500 + Math.random() * 1500;
        await agent.page.waitForTimeout(chaosDelay);
      }
    }));

    console.log(`\n[Swarm] Multi-Agent session complete. Screenshots saved to: ${outDir}`);

  } catch (err) {
    console.error('Error during swarm playback:', err);
  } finally {
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
    server.close();
  }
}

main().catch(console.error);
