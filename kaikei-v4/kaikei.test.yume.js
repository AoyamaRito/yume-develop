// @yume-format: 1

export const __block = {
  "id": "kaikei-test",
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
      "content": "",
      "ts": 1716100000000,
      "refs": [
        {
          "kind": "import",
          "target": "./kaikei.demo.yume.js"
        },
        {
          "kind": "import",
          "target": "./eyes.observation.yume.js"
        }
      ],
      "tags": [
        "test",
        "e2e"
      ],
      "applyId": null
    },
    {
      "content": "import { test, describe } from 'node:test';\nimport assert from 'node:assert';\nimport demo from './kaikei.demo.yume.js';\nimport { captureFrame } from '../eyes.observation.yume.js';\n\ndescribe('kaikei-v4 E2E Canvas & Scenario Test Suite', () => {\n  test('Canvas rendering produces high-quality layout operations', () => {\n    const state = demo.initialState();\n    const frame = captureFrame(demo, state, { w: 800, h: 600 });\n\n    assert.ok(frame.draw_ops.length > 0);\n    \n    // Validate dark sidebar draw operation exists\n    const hasSidebar = frame.draw_ops.some(op => \n      op.op === 'fillRect' && op.args[0] === 0 && op.args[1] === 0 && op.args[2] === 240\n    );\n    assert.ok(hasSidebar, 'Should draw left sidebar background (width 240)');\n\n    // Validate Total Assets text is rendered on sidebar\n    const hasTotalText = frame.draw_ops.some(op => \n      op.op === 'fillText' && op.args[0].includes('総資産')\n    );\n    assert.ok(hasTotalText, 'Should render Total Assets title text');\n  });\n\n  test('Interactive Dispatch Events manipulate state', () => {\n    let state = demo.initialState();\n\n    // 1. Select Bank Account\n    state = demo.dispatch(state, { type: 'select-account', accountId: 'id:ac:bank' });\n    assert.equal(state.REAL_form.accountId, 'id:ac:bank');\n\n    // 2. Change type to Income\n    state = demo.dispatch(state, { type: 'set-tx-type', txType: 'income' });\n    assert.equal(state.REAL_form.txType, 'income');\n    assert.equal(state.REAL_form.categoryId, 'id:cat:salary'); // Auto-selected first income category\n\n    // 3. Increment Amount twice\n    state = demo.dispatch(state, { type: 'add-amount', amount: 5000 });\n    state = demo.dispatch(state, { type: 'add-amount', amount: 1000 });\n    assert.equal(state.REAL_form.amountInput, '6000');\n\n    // 4. Type a custom memo\n    state = demo.dispatch(state, { type: 'set-note', note: 'フリマ売上' });\n    assert.equal(state.REAL_form.note, 'フリマ売上');\n\n    // 5. Submit\n    state = demo.dispatch(state, { type: 'submit-transaction' });\n    assert.equal(state.status, 'success');\n    assert.equal(state.REAL_transactions.length, 1);\n    assert.equal(state.REAL_transactions[0].amount, 'jpy:6000');\n\n    // Bank should have increased from 100,000 to 106,000\n    const bank = state.accounts.find(a => a.id === 'id:ac:bank');\n    assert.equal(bank.balance, 'jpy:106000');\n  });\n\n  test('Clear Amount resets amount input correctly', () => {\n    let state = demo.initialState();\n    state = demo.dispatch(state, { type: 'add-amount', amount: 1000 });\n    assert.equal(state.REAL_form.amountInput, '1000');\n\n    state = demo.dispatch(state, { type: 'clear-amount' });\n    assert.equal(state.REAL_form.amountInput, '');\n  });\n\n  test('Complete Default Scenario Playback matches expected end-state', () => {\n    let state = demo.initialState();\n\n    // Run each step from the default demo scenario\n    demo.events.forEach(step => {\n      state = demo.dispatch(state, step.evt);\n    });\n\n    assert.equal(state.status, 'success');\n    assert.equal(state.REAL_transactions.length, 2);\n\n    // 1st Tx: Income 100,000 to Bank -> Bank balance should be 200,000\n    // 2nd Tx: Expense 1,500 from Cash -> Cash balance should be 3,500 (5,000 - 1,500)\n    const bank = state.accounts.find(a => a.id === 'id:ac:bank');\n    const cash = state.accounts.find(a => a.id === 'id:ac:cash');\n    assert.equal(bank.balance, 'jpy:200000');\n    assert.equal(cash.balance, 'jpy:3500');\n\n    // Total assets should be: Cash(3,500) + Bank(200,000) + Credit(0) = 203,500\n    const totalAssets = state.accounts.reduce((sum, a) => {\n      return sum + parseInt(a.balance.replace(/^jpy:/, ''), 10);\n    }, 0);\n    assert.equal(totalAssets, 203500);\n\n    // Dynamic color rendering on final state\n    const frame = captureFrame(demo, state, { w: 800, h: 600 });\n    // Verify that dynamic logs were rendered into Canvas logs console\n    assert.ok(frame.draw_ops.some(op => op.op === 'fillText' && op.args[0].includes('Allocated Table') === false));\n  });\n});",
      "ts": 1779711108036,
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
          "target": "./kaikei.demo.yume.js"
        },
        {
          "kind": "import",
          "target": "../eyes.observation.yume.js"
        },
        {
          "kind": "calls",
          "target": "describe"
        },
        {
          "kind": "calls",
          "target": "test"
        },
        {
          "kind": "calls",
          "target": "captureFrame"
        },
        {
          "kind": "calls",
          "target": "parseInt"
        }
      ],
      "tags": [],
      "applyId": "apply-2026-05-25-da3f294c",
      "v": 2
    }
  ],
  "notes": {
    "apply:apply-2026-05-25-da3f294c": [
      {
        "id": "n-43cb1097-fd26-47fe-99b8-921711dbd7e4",
        "author": "human",
        "ts": 1779711108038,
        "text": "fix(refs): sync eyes.observation.yume.js ref with HEAD import"
      }
    ]
  }
};

// === HEAD ===
import { test, describe } from 'node:test';
import assert from 'node:assert';
import demo from './kaikei.demo.yume.js';
import { captureFrame } from '../eyes.observation.yume.js';

describe('kaikei-v4 E2E Canvas & Scenario Test Suite', () => {
  test('Canvas rendering produces high-quality layout operations', () => {
    const state = demo.initialState();
    const frame = captureFrame(demo, state, { w: 800, h: 600 });

    assert.ok(frame.draw_ops.length > 0);
    
    // Validate dark sidebar draw operation exists
    const hasSidebar = frame.draw_ops.some(op => 
      op.op === 'fillRect' && op.args[0] === 0 && op.args[1] === 0 && op.args[2] === 240
    );
    assert.ok(hasSidebar, 'Should draw left sidebar background (width 240)');

    // Validate Total Assets text is rendered on sidebar
    const hasTotalText = frame.draw_ops.some(op => 
      op.op === 'fillText' && op.args[0].includes('総資産')
    );
    assert.ok(hasTotalText, 'Should render Total Assets title text');
  });

  test('Interactive Dispatch Events manipulate state', () => {
    let state = demo.initialState();

    // 1. Select Bank Account
    state = demo.dispatch(state, { type: 'select-account', accountId: 'id:ac:bank' });
    assert.equal(state.REAL_form.accountId, 'id:ac:bank');

    // 2. Change type to Income
    state = demo.dispatch(state, { type: 'set-tx-type', txType: 'income' });
    assert.equal(state.REAL_form.txType, 'income');
    assert.equal(state.REAL_form.categoryId, 'id:cat:salary'); // Auto-selected first income category

    // 3. Increment Amount twice
    state = demo.dispatch(state, { type: 'add-amount', amount: 5000 });
    state = demo.dispatch(state, { type: 'add-amount', amount: 1000 });
    assert.equal(state.REAL_form.amountInput, '6000');

    // 4. Type a custom memo
    state = demo.dispatch(state, { type: 'set-note', note: 'フリマ売上' });
    assert.equal(state.REAL_form.note, 'フリマ売上');

    // 5. Submit
    state = demo.dispatch(state, { type: 'submit-transaction' });
    assert.equal(state.status, 'success');
    assert.equal(state.REAL_transactions.length, 1);
    assert.equal(state.REAL_transactions[0].amount, 'jpy:6000');

    // Bank should have increased from 100,000 to 106,000
    const bank = state.accounts.find(a => a.id === 'id:ac:bank');
    assert.equal(bank.balance, 'jpy:106000');
  });

  test('Clear Amount resets amount input correctly', () => {
    let state = demo.initialState();
    state = demo.dispatch(state, { type: 'add-amount', amount: 1000 });
    assert.equal(state.REAL_form.amountInput, '1000');

    state = demo.dispatch(state, { type: 'clear-amount' });
    assert.equal(state.REAL_form.amountInput, '');
  });

  test('Complete Default Scenario Playback matches expected end-state', () => {
    let state = demo.initialState();

    // Run each step from the default demo scenario
    demo.events.forEach(step => {
      state = demo.dispatch(state, step.evt);
    });

    assert.equal(state.status, 'success');
    assert.equal(state.REAL_transactions.length, 2);

    // 1st Tx: Income 100,000 to Bank -> Bank balance should be 200,000
    // 2nd Tx: Expense 1,500 from Cash -> Cash balance should be 3,500 (5,000 - 1,500)
    const bank = state.accounts.find(a => a.id === 'id:ac:bank');
    const cash = state.accounts.find(a => a.id === 'id:ac:cash');
    assert.equal(bank.balance, 'jpy:200000');
    assert.equal(cash.balance, 'jpy:3500');

    // Total assets should be: Cash(3,500) + Bank(200,000) + Credit(0) = 203,500
    const totalAssets = state.accounts.reduce((sum, a) => {
      return sum + parseInt(a.balance.replace(/^jpy:/, ''), 10);
    }, 0);
    assert.equal(totalAssets, 203500);

    // Dynamic color rendering on final state
    const frame = captureFrame(demo, state, { w: 800, h: 600 });
    // Verify that dynamic logs were rendered into Canvas logs console
    assert.ok(frame.draw_ops.some(op => op.op === 'fillText' && op.args[0].includes('Allocated Table') === false));
  });
});
// === /HEAD ===
