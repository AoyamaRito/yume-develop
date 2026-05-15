// @yume-format: 1
export const __block = {
  "id": "eyes:debugger",
  "type": "module",
  "schemaVersion": 1,
  "runtime": { "name": "yume", "version": "002" },
  "api": ["runComaOkuri", "exportHtmlReplay"],
  "versions": []
};

// === HEAD ===
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { captureFrame } from './eyes.observation.yume.js';

/**
 * runComaOkuri: シナリオに従って demo をコマ送り実行し、全フレームの情報を収集する。
 */
export function runComaOkuri(demo, scenario, options = {}) {
  const dims = options.dims || { w: 800, h: 600 };
  let state = demo.initialState();
  const frames = [];

  // 初期フレーム
  frames.push({
    label: 'initial',
    ...captureFrame(demo, state, dims)
  });

  // 各イベントを実行
  for (const step of scenario) {
    state = demo.dispatch(state, step.evt);
    frames.push({
      label: step.label || 'event',
      ...captureFrame(demo, state, dims)
    });
  }

  return {
    id: `session-${Date.now()}`,
    dims,
    frames
  };
}

/**
 * exportHtmlReplay: フレームデータを埋め込んだ再生用 HTML を生成する。
 */
export function exportHtmlReplay(session, options = {}) {
  const title = options.title || `AI-Eyes Replay: ${session.id}`;
  const dataJson = JSON.stringify(session);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: sans-serif; background: #1a1a1a; color: #eee; margin: 0; display: flex; flex-direction: column; height: 100vh; }
    header { background: #333; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; }
    main { flex: 1; display: flex; overflow: hidden; }
    .canvas-container { flex: 1; display: flex; justify-content: center; align-items: center; background: #000; position: relative; }
    canvas { background: #fff; box-shadow: 0 0 20px rgba(0,0,0,0.5); max-width: 95%; max-height: 95%; object-fit: contain; }
    .sidebar { width: 350px; background: #222; border-left: 1px solid #444; display: flex; flex-direction: column; }
    .controls { padding: 15px; background: #333; border-top: 1px solid #444; display: flex; gap: 10px; align-items: center; }
    .frame-list { flex: 1; overflow-y: auto; padding: 10px; }
    .frame-item { padding: 8px; border-bottom: 1px solid #333; cursor: pointer; font-size: 13px; }
    .frame-item:hover { background: #333; }
    .frame-item.active { background: #444; border-left: 3px solid #007aff; }
    .state-view { height: 200px; background: #000; color: #0f0; font-family: monospace; font-size: 11px; padding: 10px; overflow: auto; border-top: 1px solid #444; white-space: pre-wrap; }
    button { background: #444; color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 4px; }
    button:hover { background: #555; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .slider { flex: 1; }
  </style>
</head>
<body>
  <header>
    <div><strong>AI-Eyes</strong> Coma-Okuri Replay</div>
    <div id="session-info">${session.id}</div>
  </header>
  <main>
    <div class="canvas-container">
      <canvas id="player-canvas" width="${session.dims.w}" height="${session.dims.h}"></canvas>
    </div>
    <div class="sidebar">
      <div class="frame-list" id="frame-list"></div>
      <div class="state-view" id="state-view"></div>
    </div>
  </main>
  <div class="controls">
    <button id="btn-play">Play</button>
    <button id="btn-prev">Prev</button>
    <button id="btn-next">Next</button>
    <input type="range" id="frame-slider" class="slider" min="0" max="${session.frames.length - 1}" value="0">
    <div id="frame-counter">0 / ${session.frames.length - 1}</div>
  </div>

  <script>
    const session = ${dataJson};
    const canvas = document.getElementById('player-canvas');
    const ctx = canvas.getContext('2d');
    const stateView = document.getElementById('state-view');
    const frameList = document.getElementById('frame-list');
    const btnPlay = document.getElementById('btn-play');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const slider = document.getElementById('frame-slider');
    const counter = document.getElementById('frame-counter');

    let currentFrameIdx = 0;
    let isPlaying = false;
    let playInterval = null;

    function renderFrame(idx) {
      currentFrameIdx = idx;
      const frame = session.frames[idx];
      
      // Update UI
      slider.value = idx;
      counter.innerText = idx + " / " + (session.frames.length - 1);
      stateView.innerText = JSON.stringify(frame.state, null, 2);
      
      // Highlight sidebar
      document.querySelectorAll('.frame-item').forEach((el, i) => {
        el.classList.toggle('active', i === idx);
      });

      // Execute draw_ops
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const op of frame.draw_ops) {
        const { method, args } = op;
        if (method === 'set') {
          // Property set
          ctx[args[0]] = args[1];
        } else if (typeof ctx[method] === 'function') {
          // Method call
          ctx[method](...args);
        }
      }
    }

    function initFrameList() {
      session.frames.forEach((f, i) => {
        const div = document.createElement('div');
        div.className = 'frame-item';
        div.innerText = i + ": " + f.label;
        div.onclick = () => {
          stop();
          renderFrame(i);
        };
        frameList.appendChild(div);
      });
    }

    function play() {
      if (isPlaying) return;
      isPlaying = true;
      btnPlay.innerText = 'Pause';
      playInterval = setInterval(() => {
        if (currentFrameIdx >= session.frames.length - 1) {
          stop();
        } else {
          renderFrame(currentFrameIdx + 1);
        }
      }, 500); // 2 fps for coma-okuri
    }

    function stop() {
      isPlaying = false;
      btnPlay.innerText = 'Play';
      clearInterval(playInterval);
    }

    btnPlay.onclick = () => isPlaying ? stop() : play();
    btnPrev.onclick = () => { stop(); if (currentFrameIdx > 0) renderFrame(currentFrameIdx - 1); };
    btnNext.onclick = () => { stop(); if (currentFrameIdx < session.frames.length - 1) renderFrame(currentFrameIdx + 1); };
    slider.oninput = (e) => { stop(); renderFrame(parseInt(e.target.value)); };

    initFrameList();
    renderFrame(0);
  </script>
</body>
</html>`;
}

// ============================================================
// CLI
// ============================================================
async function main() {
  const argv = process.argv;
  const demoPath = argv[2];
  const scenarioPath = argv[3];
  
  if (!demoPath || !scenarioPath) {
    console.log('Usage: node eyes.debugger.yume.js <demo.js> <scenario.js> [--out replay.html]');
    return;
  }

  const outPath = (argv.indexOf('--out') !== -1) ? argv[argv.indexOf('--out') + 1] : 'replay.html';

  const demo = await import(pathToFileURL(resolve(demoPath)));
  const scenarioModule = await import(pathToFileURL(resolve(scenarioPath)));
  const scenario = scenarioModule.scenario || scenarioModule.default;

  console.log(`Running Coma-Okuri Debugger...`);
  console.log(`  Demo: ${demoPath}`);
  console.log(`  Scenario: ${scenarioPath} (${scenario.length} steps)`);

  const session = runComaOkuri(demo, scenario);
  const html = exportHtmlReplay(session, { title: `Replay: ${basename(demoPath)}` });

  writeFileSync(outPath, html);
  console.log(`\nReplay log saved to: ${outPath}`);
  console.log(`Open this file in your browser to view the "video" log.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
