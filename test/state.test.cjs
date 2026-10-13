'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const StateManager = require('../lib/state');
const { normalizeConfig, defaults } = require('../lib/protocol');

const action = (id, payload = null, extra = {}) => ({ id, payload, ...extra });
const makeConfig = (actions, sections = {}) => normalizeConfig({ actions, ...sections });
const socket = (id, clientId) => {
  const conn = new EventEmitter();
  conn.id = id;
  conn.handshake = { query: { clientId } };
  const emitted = [];
  conn.emit = function (name, value) {
    emitted.push({ name, value });
    return EventEmitter.prototype.emit.call(this, name, value);
  };
  conn.emitted = emitted;
  return conn;
};

test('targets a socket, a clientId, and the socket/clientId combination', () => {
  const initial = makeConfig([action('shared', 'base')]);
  const manager = new StateManager(initial);
  const first = socket('s1', 'browser-a');
  const second = socket('s2', 'browser-a');
  const third = socket('s3', 'browser-b');
  for (const conn of [first, second, third]) manager.connect(conn);

  manager.update({ _client: { socketId: 's1' }, payload: [action('one', 1)] }, true);
  manager.update({ _client: { clientId: 'browser-a' }, payload: [action('both', 2)] }, true);
  assert.deepEqual(manager.effective(first).actions.map(({ id }) => id), ['both']);
  assert.deepEqual(manager.effective(second).actions.map(({ id }) => id), ['both']);
  assert.deepEqual(manager.effective(third).actions.map(({ id }) => id), ['shared']);

  manager.update({ _client: { socketId: 's2', clientId: 'browser-a' }, payload: [action('combo', 3)] }, true);
  assert.deepEqual(manager.effective(first).actions.map(({ id }) => id), ['both']);
  assert.deepEqual(manager.effective(second).actions.map(({ id }) => id), ['combo']);
});

test('a multi-socket targeted patch is atomic when one matching snapshot lacks an id', () => {
  const shared = makeConfig([action('a', 1), action('b', 2)]);
  const manager = new StateManager(shared);
  const first = socket('s1', 'same-client');
  const second = socket('s2', 'same-client');
  manager.connect(first);
  manager.connect(second);

  manager.update({ _client: { socketId: 's1' }, payload: [action('a', 10)] }, true);
  const beforeFirst = manager.effective(first);
  const beforeSecond = manager.effective(second);
  assert.throws(() => manager.update({
    _client: { clientId: 'same-client' },
    command: 'patch',
    payload: [{ id: 'b', label: 'Updated' }],
  }, true), /Unknown action id/);
  assert.deepEqual(manager.effective(first), beforeFirst);
  assert.deepEqual(manager.effective(second), beforeSecond);
});

test('broadcast updates clear every client override', () => {
  const manager = new StateManager(makeConfig([action('base', 0)]));
  const first = socket('s1', 'a');
  const second = socket('s2', 'b');
  manager.connect(first);
  manager.connect(second);
  manager.update({ _client: { socketId: 's1' }, payload: [action('local-one', 1)] }, true);
  manager.update({ _client: { socketId: 's2' }, payload: [action('local-two', 2)] }, true);
  const shared = manager.update({ payload: [action('broadcast', 3)] }, false);
  assert.deepEqual(shared.speedDialConfig.actions.map(({ id }) => id), ['broadcast']);
  assert.equal(manager.clients.get('s1').config, null);
  assert.equal(manager.clients.get('s2').config, null);
  assert.equal(manager.effective(first), manager.shared);
  assert.equal(manager.effective(second), manager.shared);
});

test('disconnect clears the override and reconnect starts from shared state', () => {
  const manager = new StateManager(makeConfig([action('base', 0)]));
  const conn = socket('s1', 'browser');
  manager.connect(conn);
  manager.update({ _client: { socketId: 's1' }, payload: [action('private', 1)] }, true);
  assert.equal(conn.listenerCount('disconnect'), 1);
  conn.emit('disconnect');
  assert.equal(manager.clients.has('s1'), false);
  assert.equal(conn.listenerCount('disconnect'), 0);

  manager.connect(conn);
  assert.deepEqual(manager.effective(conn).actions.map(({ id }) => id), ['base']);
  assert.equal(conn.listenerCount('disconnect'), 1);
});

test('clicks use a cloned server payload and server topic, ignoring browser payload data', () => {
  const sourcePayload = { nested: [1, { safe: true }] };
  const manager = new StateManager(makeConfig([action('run', sourcePayload, { topic: 'server/topic' })]));
  const conn = socket('s1', 'browser');
  manager.connect(conn);
  const msg = manager.click(conn, { action: 'run', payload: 'forged', topic: 'forged/topic', _client: { socketId: 'forged' } });
  assert.deepEqual(msg, { payload: sourcePayload, action: 'run', topic: 'server/topic' });
  assert.notEqual(msg.payload, sourcePayload);
  msg.payload.nested[1].safe = false;
  assert.equal(sourcePayload.nested[1].safe, true);
});

test('click rejects hidden or disabled actions and hidden or disabled buttons', () => {
  const base = { actions: [action('hidden', 1, { visible: false }), action('disabled', 2, { enabled: false }), action('ok', 3)] };
  const cases = [
    { ...base, button: { visible: false } },
    { ...base, button: { enabled: false } },
  ];
  for (const value of cases) {
    const manager = new StateManager(makeConfig(value.actions, { button: value.button }));
    const conn = socket('s1', 'browser');
    manager.connect(conn);
    assert.equal(manager.click(conn, { action: 'ok' }), null);
  }
  const manager = new StateManager(makeConfig(base.actions));
  const conn = socket('s1', 'browser');
  manager.connect(conn);
  assert.equal(manager.click(conn, { action: 'hidden' }), null);
  assert.equal(manager.click(conn, { action: 'disabled' }), null);
  assert.equal(manager.click(conn, { action: 'missing' }), null);
});

test('managers keep shared and targeted state independent', () => {
  const initial = makeConfig([action('base', 0)]);
  const first = new StateManager(initial);
  const second = new StateManager(initial);
  const conn = socket('same-socket-id', 'same-client');
  first.connect(conn);
  second.connect(conn);
  first.update({ _client: { socketId: conn.id }, payload: [action('first-only', 1)] }, true);
  second.update({ payload: [action('second-shared', 2)] }, false);
  assert.deepEqual(first.effective(conn).actions.map(({ id }) => id), ['first-only']);
  assert.deepEqual(second.effective(conn).actions.map(({ id }) => id), ['second-shared']);
});

test('close removes disconnect listeners and prevents later connections', () => {
  const manager = new StateManager(defaults());
  const conn = socket('s1', 'browser');
  manager.connect(conn);
  assert.equal(conn.listenerCount('disconnect'), 1);
  manager.close();
  assert.equal(conn.listenerCount('disconnect'), 0);
  assert.equal(manager.clients.size, 0);
  manager.connect(conn);
  assert.equal(manager.clients.size, 0);
  assert.equal(conn.listenerCount('disconnect'), 0);
  assert.equal(manager.click(conn, { action: 'anything' }), null);
});
