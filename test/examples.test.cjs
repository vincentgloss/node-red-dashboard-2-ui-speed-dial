'use strict';
// Runs every function node of the reference flow and feeds its output into the real protocol.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const protocol = require('../lib/protocol');
const flow = require('../examples/speed-dial-input-reference.json');

const dial = flow.find((n) => n.type === 'ui-speed-dial');
const initial = protocol.normalizeConfig({ actions: protocol.normalizeEditorActions(dial.actions), button: dial.button, menu: dial.menu, theme: dial.theme });
const groups = Object.fromEntries(flow.filter((n) => n.type === 'group').map((g) => [g.id, g.name]));

test('reference flow has consistent wiring', () => {
  const ids = new Set(flow.map((n) => n.id));
  assert.equal(ids.size, flow.length);
  for (const n of flow) for (const out of n.wires || []) for (const id of out) assert.ok(ids.has(id), `${n.name}: dangling wire ${id}`);
  for (const n of flow.filter((x) => x.type === 'link out')) for (const id of n.links) assert.ok(ids.has(id));
  for (const g of flow.filter((x) => x.type === 'group')) for (const id of g.nodes) assert.ok(ids.has(id));
});

test('every valid function node produces a message the protocol accepts, every invalid one is rejected', () => {
  let checked = 0;
  for (const fn of flow.filter((n) => n.type === 'function' && n.name !== 'remember client')) {
    const section = groups[fn.g][0];
    const ctx = new Map();
    const flowCtx = new Map([['lastClient', { socketId: 's1', clientId: 'c1' }]]);
    const sandbox = { context: { get: (k) => ctx.get(k), set: (k, v) => ctx.set(k, v) }, flow: { get: (k) => flowCtx.get(k) }, node: { warn() {}, status() {} } };
    for (let run = 0; run < 14; run += 1) {
      const out = vm.runInNewContext(`(function(msg){${fn.func}})`, sandbox)({ payload: Date.now(), _msgid: 'x' });
      if (out === null || fn.name.startsWith('invalid: target')) continue;
      const { _client, ...rest } = out;
      checked += 1;
      if (section === '7') assert.throws(() => protocol.applyMessage(initial, initial, rest), undefined, fn.name);
      else assert.doesNotThrow(() => protocol.applyMessage(initial, initial, rest), fn.name);
    }
  }
  assert.ok(checked > 80);
});
