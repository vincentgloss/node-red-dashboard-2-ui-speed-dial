'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const protocol = require('../lib/protocol');

const action = (id, payload = null, extra = {}) => ({ id, payload, ...extra });
const config = (actions = [action('one', { native: [1, true, null] })], extra = {}) => ({ actions, ...extra });

test('defaults are complete independent copies from schema defaults', () => {
  const first = protocol.defaults();
  assert.deepEqual(first.actions, []);
  assert.equal(first.button.icon, 'pi-plus');
  assert.equal(first.menu.mode, 'speed-dial');
  assert.equal(first.theme.zIndex, 2000);
  first.button.icon = 'changed';
  assert.equal(protocol.defaults().button.icon, 'pi-plus');
});

test('normalizes full actions and preserves native JSON payload values', () => {
  const input = config([
    action('string', 'hello'),
    action('number', 7),
    action('boolean', false),
    action('null', null),
    action('object', { nested: ['x', 2] }),
    action('array', [null, { ok: true }]),
  ], { button: { label: 'Run' }, extension: { retainedByCaller: true } });
  const normalized = protocol.normalizeConfig(input);
  assert.deepEqual(normalized.actions.map(({ payload }) => payload), ['hello', 7, false, null, { nested: ['x', 2] }, [null, { ok: true }]]);
  assert.equal(normalized.actions[0].icon, 'pi-circle');
  assert.equal(normalized.actions[0].visible, true);
  assert.equal(normalized.actions[0].topic, undefined);
  assert.equal(normalized.button.label, 'Run');
  assert.equal(normalized.menu.direction, 'up');
  assert.equal(Object.hasOwn(normalized, 'extension'), false);
});

test('converts editor payload text using exact scalar types', () => {
  const result = protocol.normalizeEditorActions([
    { id: 's', payloadType: 'str', payload: 'true' },
    { id: 'n', payloadType: 'num', payload: '12.5' },
    { id: 'b', payloadType: 'bool', payload: 'false' },
    { id: 'j', payloadType: 'json', payload: '{"items":[1,null]}' },
  ]);
  assert.deepEqual(result.map(({ payload }) => payload), ['true', 12.5, false, { items: [1, null] }]);
  assert.equal(Object.hasOwn(result[0], 'payloadType'), false);
});

test('rejects invalid editor scalars and incomplete or invalid actions', () => {
  for (const payload of ['01', '1x', '"3"', '1e999']) {
    assert.throws(() => protocol.normalizeEditorActions([action('x', payload, { payloadType: 'num' })]));
  }
  for (const payload of ['True', '0', ' true']) {
    assert.throws(() => protocol.normalizeEditorActions([action('x', payload, { payloadType: 'bool' })]));
  }
  assert.throws(() => protocol.normalizeEditorActions([action('x', '{', { payloadType: 'json' })]));
  assert.throws(() => protocol.normalizeActions([{ id: 'missing-payload' }]));
  assert.throws(() => protocol.normalizeActions([{ payload: 1 }]));
  assert.throws(() => protocol.normalizeActions([action('dup'), action('dup')]));
  assert.throws(() => protocol.normalizeActions([action('not valid')]));
  assert.throws(() => protocol.normalizeActions([action('x', 0, { mystery: true })]));
});

test('validates section types, allowed values, ranges, colors, and icons', () => {
  assert.throws(() => protocol.normalizeConfig(config(undefined, { button: { size: '56' } })));
  assert.throws(() => protocol.normalizeConfig(config(undefined, { button: { size: 10 } })));
  assert.throws(() => protocol.normalizeConfig(config(undefined, { menu: { direction: 'diagonal' } })));
  assert.throws(() => protocol.normalizeConfig(config(undefined, { theme: { background: 'red' } })));
  assert.throws(() => protocol.normalizeActions([action('x', null, { color: '#abcd' })]));
  assert.throws(() => protocol.normalizeActions([action('x', null, { icon: 'pi-Bars' })]));
  assert.throws(() => protocol.normalizeConfig(config(undefined, { button: { extra: true } })));
});

test('rejects non-JSON payloads, cycles, symbols, accessors, and prototypes', () => {
  const cycle = {};
  cycle.self = cycle;
  assert.throws(() => protocol.normalizeActions([action('cycle', cycle)]));
  assert.throws(() => protocol.normalizeActions([action('undefined', { value: undefined })]));
  assert.throws(() => protocol.normalizeActions([action('nan', NaN)]));
  assert.throws(() => protocol.normalizeActions([action('symbol', { [Symbol('x')]: 1 })]));
  const accessor = {};
  Object.defineProperty(accessor, 'secret', { enumerable: true, get() { throw new Error('getter called'); } });
  assert.throws(() => protocol.normalizeActions([action('accessor', accessor)]));
  assert.throws(() => protocol.normalizeActions([action('instance', new Date())]));
});

test('enforces action count, JSON byte, and depth limits', () => {
  assert.throws(() => protocol.normalizeActions(Array.from({ length: 101 }, (_, i) => action(`id${i}`))));
  assert.throws(() => protocol.normalizeActions([action('large', 'x'.repeat(262145))]));
  let nested = null;
  for (let i = 0; i < 33; i += 1) nested = [nested];
  assert.throws(() => protocol.normalizeActions([action('deep', nested)]));
});

test('message replacement and section updates return new configs without mutating inputs', () => {
  const current = protocol.normalizeConfig(config([action('old', 1)], { button: { label: 'Old' } }));
  const initial = protocol.normalizeConfig(config([action('initial', 0)]));
  const message = { payload: { actions: [action('new', { a: 1 })], button: { label: 'New' } }, _msgid: 'meta' };
  const beforeCurrent = structuredClone(current);
  const beforeMessage = structuredClone(message);
  const next = protocol.applyMessage(current, initial, message);
  assert.notEqual(next, current);
  assert.equal(next.actions[0].id, 'new');
  assert.equal(next.button.label, 'New');
  assert.equal(current.actions[0].id, 'old');
  assert.deepEqual(current, beforeCurrent);
  assert.deepEqual(message, beforeMessage);
});

test('applies patch and remove commands while preserving omitted payloads', () => {
  const current = protocol.normalizeConfig(config([action('one', { stay: true }), action('two', 2)]));
  const initial = protocol.defaults();
  const patched = protocol.applyMessage(current, initial, { command: 'patch', payload: [{ id: 'one', label: 'Updated' }] });
  assert.deepEqual(patched.actions[0].payload, { stay: true });
  assert.equal(patched.actions[0].label, 'Updated');
  assert.equal(current.actions[0].label, 'Action');
  const removed = protocol.applyMessage(patched, initial, { command: 'remove', payload: ['two'] });
  assert.deepEqual(removed.actions.map(({ id }) => id), ['one']);
});

test('message failures are atomic and reset ignores payload', () => {
  const current = protocol.normalizeConfig(config([action('one', 1)]));
  const initial = protocol.normalizeConfig(config([action('seed', { reset: true })], { menu: { mode: 'menu' } }));
  for (const message of [
    { command: 'patch', payload: [{ id: 'one', payload: undefined }] },
    { command: 'patch', payload: [{ id: 'one' }, { id: 'one', label: 'Again' }] },
    { command: 'patch', payload: [{ id: 'missing', label: 'No' }] },
    { command: 'remove', payload: ['missing'] },
    { command: 'replace', payload: { actions: [action('duplicate'), action('duplicate')] } },
    { command: 'unknown' },
    { command: 'replace', payload: [] },
    { command: undefined },
  ]) assert.throws(() => protocol.applyMessage(current, initial, message));
  const reset = protocol.applyMessage(current, initial, { command: 'reset', payload: { ignored: true } });
  assert.deepEqual(reset, initial);
  assert.notEqual(reset, initial);
  assert.deepEqual(current.actions.map(({ id }) => id), ['one']);
});

test('messages support an action array and reject unknown fields or oversized messages', () => {
  const current = protocol.normalizeConfig(config([action('old', 1)]));
  const initial = protocol.defaults();
  assert.deepEqual(protocol.applyMessage(current, initial, { payload: [action('new', null)] }).actions.map(({ id }) => id), ['new']);
  assert.throws(() => protocol.applyMessage(current, initial, { payload: { mystery: true } }));
  assert.throws(() => protocol.applyMessage(current, initial, { payload: { button: { size: 56, mystery: 1 } } }));
  assert.throws(() => protocol.applyMessage(current, initial, { largeMetadata: 'x'.repeat(262145), payload: [] }));
});

test('accepts a minimum button size of 11', () => {
  assert.equal(protocol.normalizeConfig(config(undefined, { button: { size: 11 } })).button.size, 11);
});

test('validates menu shape against direction atomically', () => {
  const base = protocol.normalizeConfig(config());
  assert.equal(base.menu.shape, 'linear');
  const quarter = protocol.applyMessage(base, base, { payload: { menu: { shape: 'quarter-circle', direction: 'up-left', radius: 90 } } });
  assert.equal(quarter.menu.direction, 'up-left');
  assert.equal(protocol.applyMessage(base, base, { payload: { menu: { shape: 'semi-circle', direction: 'left' } } }).menu.shape, 'semi-circle');
  assert.equal(protocol.applyMessage(base, base, { payload: { menu: { shape: 'circle' } } }).menu.shape, 'circle');
  // Changing only the shape leaves an incompatible direction behind: rejected, state untouched.
  assert.throws(() => protocol.applyMessage(base, base, { payload: { menu: { shape: 'quarter-circle' } } }), /direction/);
  assert.throws(() => protocol.applyMessage(quarter, base, { payload: { menu: { direction: 'up' } } }), /direction/);
  assert.throws(() => protocol.normalizeConfig(config(undefined, { menu: { shape: 'triangle' } })));
  assert.throws(() => protocol.normalizeConfig(config(undefined, { menu: { radius: 501 } })));
  assert.equal(quarter.menu.shape, 'quarter-circle');
});

test('accepts messages created in another vm realm (Node-RED function nodes)', () => {
  const vm = require('node:vm');
  const base = protocol.normalizeConfig(config());
  const msg = vm.runInNewContext("({ payload: { actions: [{ id: 'x', payload: { a: [1, null] } }], button: { label: 'L' } } })");
  const result = protocol.applyMessage(base, base, msg);
  assert.deepEqual(result.actions[0].payload, { a: [1, null] });
  assert.equal(result.button.label, 'L');
  assert.deepEqual([...protocol.applyMessage(base, base, vm.runInNewContext("({ payload: [{ id: 'y', payload: null }] })")).actions.map((a) => a.id)], ['y']);
  // Class instances are still rejected.
  assert.throws(() => protocol.applyMessage(base, base, vm.runInNewContext("({ payload: { button: new (class A {})() } })")));
  assert.throws(() => protocol.applyMessage(base, base, { payload: [{ id: 'z', payload: new Date() }] }));
});
