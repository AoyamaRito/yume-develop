// examples/coma-scenario.js - Sample scenario for Coma-Okuri Debugger
export const scenario = [
  { label: 'Move to center', evt: { type: 'move', x: 400, y: 300 } },
  { label: 'Click to draw line', evt: { type: 'connect' } },
  { label: 'Move to bottom-right', evt: { type: 'move', x: 750, y: 550 } },
  { label: 'Move to top-left', evt: { type: 'move', x: 50, y: 50 } },
  { label: 'Reset', evt: { type: 'reset' } },
];
