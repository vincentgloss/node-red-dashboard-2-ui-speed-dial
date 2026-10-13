'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const registerNode = require('../nodes/ui-speed-dial');

const editorAction = (id, payload, extra = {}) => ({ id, payloadType: 'json', payload: JSON.stringify(payload), ...extra });

function makeHarness({ scope = 'group', includeClientData = false, acceptsClientConfig = true, actions = [editorAction('run', { server: true }, { topic: 'trusted/topic' })] } = {}) {
  const saved = [];
  const cleared = [];
  const emitted = [];
  const registrations = [];
  const httpRoutes = [];
  const sent = [];
  const errors = [];
  const statuses = [];
  const base = {
    includeClientData,
    acceptsClientConfig: acceptsClientConfig ? ['ui-speed-dial'] : [],
    stores: { data: {
      clear(id) { cleared.push(id); },
      save(_base, node, msg) { saved.push({ node, msg: structuredClone(msg) }); },
    } },
    emit(name, msg, node) { emitted.push({ name, msg: structuredClone(msg), node }); },
  };
  const parent = Object.assign({}, base, {
    register(...args) { registrations.push(args); },
    getBase() { return base; },
  });
  const nodeById = new Map([['group-id', parent], ['page-id', parent], ['ui-id', parent]]);
  let Constructor;
  const RED = {
    httpAdmin: { get(...args) { httpRoutes.push(args); } },
    auth: { needsPermission: (permission) => permission },
    nodes: {
      registerType(name, constructor) { assert.equal(name, 'ui-speed-dial'); Constructor = constructor; },
      createNode(node, config) {
        Object.setPrototypeOf(node, EventEmitter.prototype);
        Object.assign(node, new EventEmitter());
        node.id = 'speed-dial-node';
        node.type = 'ui-speed-dial';
        node.sent = sent;
        node.send = (msg) => sent.push(structuredClone(msg));
        node.error = (message) => errors.push(message);
        node.status = (status) => statuses.push(status);
        node._config = config;
      },
      getNode(id) { return nodeById.get(id); },
    },
    util: { cloneMessage: (msg) => structuredClone(msg) },
  };
  registerNode(RED);
  const config = {
    scope,
    group: 'group-id',
    page: 'page-id',
    ui: 'ui-id',
    actions,
  };
  const node = new Constructor(config);
  const evts = registrations[0]?.[registrations[0].length - 1];
  return { node, evts, base, parent, saved, cleared, emitted, registrations, httpRoutes, sent, errors, statuses, config };
}

function fakeSocket(id, clientId) {
  const conn = new EventEmitter();
  conn.id = id;
  conn.handshake = { query: { clientId } };
  const emitted = [];
  conn.emit = function (name, value) {
    emitted.push({ name, value: structuredClone(value) });
    return EventEmitter.prototype.emit.call(this, name, value);
  };
  conn.emitted = emitted;
  return conn;
}

test('registers group, page, and all scopes with only the active reference', () => {
  for (const [scope, active] of [['group', 'group'], ['page', 'page'], ['all', 'ui']]) {
    const harness = makeHarness({ scope });
    assert.equal(harness.errors.length, 0);
    assert.equal(harness.registrations.length, 1);
    const args = harness.registrations[0];
    const widgetConfig = args[args.length - 2];
    assert.equal(widgetConfig.scope, scope);
    for (const key of ['group', 'page', 'ui']) assert.equal(widgetConfig[key], key === active ? `${key}-id` : '');
    if (scope === 'group') assert.equal(args[0], harness.node);
    if (scope === 'page') assert.equal(args[0], null);
    if (scope === 'all') assert.deepEqual(args.slice(0, 2), [null, null]);
  }
});

test('clears and saves the normalized initial config and input does not send output', () => {
  const harness = makeHarness();
  assert.deepEqual(harness.cleared, ['speed-dial-node']);
  assert.equal(harness.saved.length, 1);
  assert.equal(harness.saved[0].msg.speedDialConfig.actions[0].payload.server, true);
  assert.equal(Object.hasOwn(harness.saved[0].msg.speedDialConfig.actions[0], 'payloadType'), false);
  harness.evts.onInput({ payload: 'regular input' });
  assert.deepEqual(harness.sent, []);
  assert.equal(harness.saved.length, 1);
});

test('click output uses the server action and includes only trusted preprocessed client context', () => {
  const harness = makeHarness({ includeClientData: true });
  const trusted = { socketId: 'server-socket', clientId: 'server-client' };
  harness.evts.onChange({ _client: trusted }, { action: 'run', payload: 'forged', _client: { socketId: 'forged' } }, fakeSocket('s1', 'browser'));
  assert.deepEqual(harness.sent, [{
    payload: { server: true }, action: 'run', topic: 'trusted/topic', _client: trusted,
  }]);
  harness.sent.length = 0;
  const withoutForwarding = makeHarness({ includeClientData: false });
  withoutForwarding.evts.onChange({ _client: trusted }, { action: 'run', payload: 'forged' }, fakeSocket('s2', 'browser'));
  assert.deepEqual(withoutForwarding.sent, [{ payload: { server: true }, action: 'run', topic: 'trusted/topic' }]);
});

test('load handshakes send state without producing output, with client data enabled or disabled', () => {
  for (const includeClientData of [false, true]) {
    const harness = makeHarness({ includeClientData });
    const conn = fakeSocket(`socket-${includeClientData}`, 'browser');
    const context = { _client: { socketId: 'trusted-socket', clientId: 'trusted-client' } };
    const result = harness.evts.onChange(context, { type: 'load' }, conn);
    assert.equal(result, undefined);
    assert.deepEqual(conn.emitted, [{
      name: 'speed-dial:state:speed-dial-node',
      value: { speedDialConfig: harness.saved[0].msg.speedDialConfig },
    }]);
    assert.deepEqual(harness.sent, []);
    assert.equal(harness.saved.length, 1);
  }
});

test('invalid beforeSend updates throw a warn without saving or emitting', () => {
  const harness = makeHarness();
  assert.throws(() => harness.evts.beforeSend({ command: 'patch', payload: [{ id: 'missing', label: 'No' }] }), (error) => {
    assert.equal(error.type, 'warn');
    return /Unknown action id/.test(error.message);
  });
  assert.equal(harness.saved.length, 1);
  assert.deepEqual(harness.emitted, []);
  const accepted = harness.evts.beforeSend({ payload: [{ id: 'next', payload: 'ok' }] });
  assert.equal(accepted.speedDialConfig.actions[0].id, 'next');
  assert.equal(harness.saved.length, 1);
});

test('targeted updates emit only to matching sockets and never store a global config', () => {
  const harness = makeHarness();
  const first = fakeSocket('socket-1', 'browser');
  const second = fakeSocket('socket-2', 'browser');
  harness.evts.onChange({}, { type: 'load' }, first);
  harness.evts.onChange({}, { type: 'load' }, second);
  first.emitted.length = 0;
  second.emitted.length = 0;
  const result = harness.evts.beforeSend({
    _client: { socketId: 'socket-1' },
    command: 'patch',
    payload: [{ id: 'run', label: 'Targeted' }],
  });
  assert.deepEqual(result, {});
  assert.equal(harness.emitted.length, 1);
  assert.equal(harness.emitted[0].name, 'msg-input:speed-dial-node');
  assert.equal(harness.emitted[0].msg._client.socketId, 'socket-1');
  assert.equal(harness.emitted[0].msg.speedDialConfig.actions[0].label, 'Targeted');
  assert.equal(harness.saved.length, 1);
  harness.evts.onInput(result);
  assert.equal(harness.saved.length, 1);
});

test('closed handlers cannot reload state or emit clicks', () => {
  const harness = makeHarness();
  const conn = fakeSocket('socket-1', 'browser');
  harness.node.emit('close');
  harness.evts.onChange({}, { type: 'load' }, conn);
  harness.evts.onChange({}, { action: 'run' }, conn);
  assert.deepEqual(conn.emitted, []);
  assert.deepEqual(harness.sent, []);
});
