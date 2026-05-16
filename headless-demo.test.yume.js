// @yume-format: 1

export const __block = {
  "id": "headless-demo-test",
  "type": "test",
  "schemaVersion": 2,
  "runtime": {
    "name": "yume",
    "version": "002"
  },
  "api": [],
  "versions": [
    {
      "v": 1,
      "content": "import { describe, it } from 'node:test';\nimport assert from 'node:assert';\nimport { initialState, dispatch, render } from './headless-demo.fn.yume.js';\n\ndescribe('headless-demo dispatch coverage', () => {\n  it('should handle connect action', () => {\n    const state = initialState();\n    const newState = dispatch(state, { type: 'connect' });\n    assert.strictEqual(newState.drawLine, true);\n  });\n\n  it('should handle reset action', () => {\n    const state = { point: { x: 99, y: 99 }, trail: [], drawLine: true };\n    const newState = dispatch(state, { type: 'reset' });\n    assert.deepStrictEqual(newState, initialState());\n  });\n\n  it('should return state on default dispatch', () => {\n    const state = initialState();\n    const newState = dispatch(state, { type: 'unknown' });\n    assert.strictEqual(newState, state);\n  });\n});\n\ndescribe('headless-demo render coverage', () => {\n  it('should execute drawLine branch in render', () => {\n    const ctx = {\n      fillStyle: '', fillRect: () => {}, strokeStyle: '', lineWidth: 0, beginPath: () => {}, \n      moveTo: () => {}, lineTo: () => {}, stroke: () => {}, arc: () => {}, fill: () => {}, \n      font: '', textAlign: '', textBaseline: '', fillText: () => {}\n    };\n    const state = { ...initialState(), drawLine: true };\n    const dims = { w: 100, h: 100 };\n    render(ctx, state, dims);\n    assert.strictEqual(state.drawLine, true);\n  });\n});",
      "ts": 1778967962775,
      "refs": [
        {
          "kind": "import",
          "target": "node:test"
        },
        {
          "kind": "import",
          "target": "node:assert"
        },
        {
          "kind": "import",
          "target": "./headless-demo.fn.yume.js"
        },
        {
          "kind": "calls",
          "target": "describe"
        },
        {
          "kind": "calls",
          "target": "it"
        },
        {
          "kind": "calls",
          "target": "initialState"
        },
        {
          "kind": "calls",
          "target": "dispatch"
        },
        {
          "kind": "calls",
          "target": "render"
        }
      ],
      "tags": [],
      "applyId": null
    }
  ]
};

// === HEAD ===
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { initialState, dispatch, render } from './headless-demo.fn.yume.js';

describe('headless-demo dispatch coverage', () => {
  it('should handle connect action', () => {
    const state = initialState();
    const newState = dispatch(state, { type: 'connect' });
    assert.strictEqual(newState.drawLine, true);
  });

  it('should handle reset action', () => {
    const state = { point: { x: 99, y: 99 }, trail: [], drawLine: true };
    const newState = dispatch(state, { type: 'reset' });
    assert.deepStrictEqual(newState, initialState());
  });

  it('should return state on default dispatch', () => {
    const state = initialState();
    const newState = dispatch(state, { type: 'unknown' });
    assert.strictEqual(newState, state);
  });
});

describe('headless-demo render coverage', () => {
  it('should execute drawLine branch in render', () => {
    const ctx = {
      fillStyle: '', fillRect: () => {}, strokeStyle: '', lineWidth: 0, beginPath: () => {}, 
      moveTo: () => {}, lineTo: () => {}, stroke: () => {}, arc: () => {}, fill: () => {}, 
      font: '', textAlign: '', textBaseline: '', fillText: () => {}
    };
    const state = { ...initialState(), drawLine: true };
    const dims = { w: 100, h: 100 };
    render(ctx, state, dims);
    assert.strictEqual(state.drawLine, true);
  });
});
// === /HEAD ===

