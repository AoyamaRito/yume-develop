import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createVirtualCanvas, summarizeOps } from '../../virtual-canvas.module.yume.js';
import { captureFrame, runSession } from '../../eyes.observation.yume.js';
import demo, { dispatch, events, initialState } from '../../headless-demo.fn.yume.js';

test('VirtualCanvas records state writes and draw calls', () => {
  const canvas = createVirtualCanvas(320, 240);
  const ctx = canvas.getContext('2d');

  assert.equal(canvas.width, 320);
  assert.equal(canvas.height, 240);
  assert.equal(canvas.getContext('webgl'), null);

  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1, 2);
  ctx.lineTo(3, 4);
  ctx.stroke();
  ctx.fillText('hello', 5, 6);

  assert.deepEqual(ctx.ops.slice(0, 2), [
    { op: 'set', prop: 'fillStyle', value: '#ffffff' },
    { op: 'set', prop: 'lineWidth', value: 2 },
  ]);
  assert.ok(ctx.ops.some(op => op.op === 'lineTo' && op.args[0] === 3 && op.args[1] === 4));

  const summary = summarizeOps(ctx.ops);
  assert.equal(summary.total, ctx.ops.length);
  assert.equal(summary.byOp.set, 2);
  assert.equal(summary.byOp.stroke, 1);
  assert.equal(summary.byOp.fillText, 1);
});

test('VirtualCanvas save and restore round-trip drawing state', () => {
  const ctx = createVirtualCanvas().getContext('2d');

  ctx.strokeStyle = '#111111';
  ctx.save();
  ctx.strokeStyle = '#222222';
  assert.equal(ctx.strokeStyle, '#222222');
  ctx.restore();

  assert.equal(ctx.strokeStyle, '#111111');
  const summary = summarizeOps(ctx.ops);
  assert.equal(summary.byOp.save, 1);
  assert.equal(summary.byOp.restore, 1);
});

test('VirtualCanvas serializes gradients as readable draw-op tokens', () => {
  const ctx = createVirtualCanvas().getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 10, 10);
  gradient.addColorStop(0, '#000000');
  gradient.addColorStop(1, '#ffffff');
  ctx.fillStyle = gradient;

  const created = ctx.ops.find(op => op.op === 'createLinearGradient');
  const fillSet = ctx.ops.find(op => op.op === 'set' && op.prop === 'fillStyle');

  assert.ok(created.id.startsWith('lg_'));
  assert.deepEqual(fillSet.value, { gradient: created.id });
  assert.equal(summarizeOps(ctx.ops).byOp['gradient.addColorStop'], 2);
});

test('headless demo dispatch is pure and handles known events', () => {
  const start = initialState();
  const moved = dispatch(start, { type: 'move', x: 200, y: 150 });
  const connected = dispatch(moved, { type: 'connect' });
  const unknown = dispatch(connected, { type: 'noop' });
  const reset = dispatch(connected, { type: 'reset' });

  assert.deepEqual(start, { point: { x: 100, y: 100 }, trail: [], drawLine: false });
  assert.notEqual(moved, start);
  assert.deepEqual(moved.point, { x: 200, y: 150 });
  assert.deepEqual(moved.trail, [{ x: 200, y: 150 }]);
  assert.equal(connected.drawLine, true);
  assert.equal(unknown, connected);
  assert.deepEqual(reset, initialState());
});

test('captureFrame returns cloned state and structured draw operation summary', () => {
  const state = {
    point: { x: 120, y: 80 },
    trail: [{ x: 40, y: 40 }, { x: 120, y: 80 }],
    drawLine: true,
  };
  const frame = captureFrame(demo, state, { w: 160, h: 120 });

  assert.deepEqual(frame.dims, { w: 160, h: 120 });
  assert.deepEqual(frame.state, state);
  assert.notEqual(frame.state, state);
  assert.notEqual(frame.state.point, state.point);
  frame.state.point.x = 999;
  assert.equal(state.point.x, 120);

  assert.equal(frame.summary.total, frame.draw_ops.length);
  assert.equal(frame.summary.byOp.fillRect, 1);
  assert.ok(frame.summary.byOp.fillText >= 2);
  assert.ok(frame.draw_ops.some(op => op.op === 'arc' && op.args[0] === 120 && op.args[1] === 80));
});

test('runSession creates a linked observation graph for the default demo scenario', () => {
  const { graph, finalState, sessionId } = runSession(demo, {
    sessionId: 'eyes-test-session',
    dims: { w: 160, h: 120 },
  });

  assert.equal(sessionId, 'eyes-test-session');
  assert.equal(graph.verify().ok, true);
  assert.equal(graph.all().length, 1 + events.length + events.length + 1);
  assert.equal(graph.byType('session').length, 1);
  assert.equal(graph.byType('tx').length, events.length);
  assert.equal(graph.byType('snapshot').length, events.length + 1);

  const session = graph.get('eyes-test-session');
  const firstSnap = graph.get('eyes-test-session_snap_001');
  const firstTx = graph.get('eyes-test-session_tx_0001');
  const secondSnap = graph.get('eyes-test-session_snap_002');

  assert.equal(session.children.length, events.length * 2 + 1);
  assert.equal(session.children[0], 'eyes-test-session_snap_001');
  assert.equal(firstSnap.refs[0].kind, 'observes');
  assert.equal(firstSnap.refs[0].target, 'eyes-test-session');
  assert.deepEqual(firstTx.content.events, [events[0].evt]);
  assert.ok(secondSnap.refs.some(ref => ref.kind === 'after' && ref.target === firstTx.id));
  assert.deepEqual(finalState, initialState());
});

test('runSession respects snapshot:false for silent transactions', () => {
  const { graph, finalState } = runSession(demo, {
    sessionId: 'eyes-test-silent',
    events: [
      { label: 'silent-move', evt: { type: 'move', x: 1, y: 2 }, snapshot: false },
    ],
  });

  assert.equal(graph.byType('session').length, 1);
  assert.equal(graph.byType('tx').length, 1);
  assert.equal(graph.byType('snapshot').length, 1);
  assert.deepEqual(finalState.point, { x: 1, y: 2 });
});
