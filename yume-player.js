import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import express from 'express';

async function main() {
  const argv = process.argv;
  const demoPath = resolve(argv[2]);
  const scenarioPath = resolve(argv[3]);
  const outDir = (argv.indexOf('--outdir') !== -1) ? resolve(argv[argv.indexOf('--outdir') + 1]) : resolve('screenshots');

  if (!demoPath || !scenarioPath) {
    console.log('Usage: node yume-player.js <demo.js> <scenario.js> [--outdir screenshots]');
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });

  const app = express();
  const port = 3000 + Math.floor(Math.random() * 1000);
  const rootDir = resolve(dirname(demoPath));
  
  // yume-develop フォルダ全体を静的配信（相対インポートを解決するため）
  app.use(express.static(resolve(rootDir, '..')));

  app.use((req, res, next) => {
    if (req.path.endsWith('.yume.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    next();
  });

  // 一時ファイルを作らずに、ルートアクセス時に動的にハーネスHTMLを返す
  app.get('/', (req, res) => {
    // 配信ルートからの相対パスを計算
    const relDemoPath = basename(dirname(demoPath)) + '/' + basename(demoPath);
    
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Yume Player Harness</title>
      <style>
        body { margin: 0; background: #f0f0f0; overflow: hidden; display: grid; place-items: center; height: 100vh; }
        canvas { background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #ddd; }
      </style>
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
          render: () => {
            ctx.clearRect(0, 0, dims.w, dims.h);
            demo.render(ctx, state, dims);
          },
          // ここが入力（イベント）の流し込み口
          dispatch: (evt) => {
            state = demo.dispatch(state, evt);
            window.__yume.render();
          }
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

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    recordVideo: { dir: outDir, size: { width: 800, height: 600 } },
    viewport: { width: 800, height: 600 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[Browser] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.error(`[Browser Error] ${error.message}`));

  try {
    await page.goto(baseUrl);
    await page.waitForFunction(() => window.__yume_ready);

    const scenarioModule = await import(pathToFileURL(scenarioPath).href);
    const scenario = scenarioModule.scenario || scenarioModule.default;

    console.log(`Starting playback...`);
    console.log(`  Demo: ${basename(demoPath)}`);
    console.log(`  Scenario: ${basename(scenarioPath)} (${scenario.length} steps)`);

    const FRAME_DELAY = 1000;

    await page.screenshot({ path: join(outDir, '000-initial.png') });
    console.log(`  [000] Captured initial state`);
    await page.waitForTimeout(FRAME_DELAY);

    for (let i = 0; i < scenario.length; i++) {
      const step = scenario[i];
      const seq = String(i + 1).padStart(3, '0');
      
      // Node.js側からブラウザ内の `window.__yume.dispatch` を呼び出して入力を流し込む
      await page.evaluate((evt) => window.__yume.dispatch(evt), step.evt);
      
      const label = (step.label || 'step').replace(/\s+/g, '-');
      const screenshotPath = join(outDir, `${seq}-${label}.png`);
      await page.screenshot({ path: screenshotPath });
      
      console.log(`  [${seq}] Dispatched: ${JSON.stringify(step.evt)} -> Captured`);
      await page.waitForTimeout(FRAME_DELAY);
    }

    await page.waitForTimeout(1000);
    await context.close();
    const videoPath = await page.video().path();
    const finalVideoPath = join(outDir, `${basename(demoPath).replace('.yume.js', '').replace('.js', '')}-replay.webm`);
    import('fs').then(fs => fs.renameSync(videoPath, finalVideoPath));
    console.log(`\nPlayback complete.`);
    console.log(`  Screenshots: ${outDir}`);
    console.log(`  Video: ${finalVideoPath}`);

  } catch (err) {
    console.error('Error during playback:', err);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(console.error);
