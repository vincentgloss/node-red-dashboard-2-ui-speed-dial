'use strict';

const schema = require('./schema.json');

const sections = ['button', 'menu', 'theme'];
const idPattern = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/;
// Icons: PrimeIcons (pi-…, bundled), Material Design Icons (mdi-…, loaded by the Dashboard) or an image.
// Images are http(s) or root-relative URLs, or small base64 data URLs; quotes, brackets and spaces are excluded
// because the value ends up in a CSS url().
const iconPattern = /^(?:pi|mdi)-[a-z0-9-]+$/;
const iconUrlPattern = /^(?:https?:\/\/|\/)[^\s"'()\\<>]{1,2047}$/;
const iconDataPattern = /^data:image\/(?:svg\+xml|png|gif|webp|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;

function isIcon(value) {
  if (typeof value !== 'string') return false;
  if (value === '' || iconPattern.test(value) || iconUrlPattern.test(value)) return true;
  return value.length <= schema.limits.iconImageChars && iconDataPattern.test(value);
}
const colorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function fail(message) {
  throw new Error(message);
}

// Messages produced by function nodes come from another vm realm, so the prototypes are compared
// structurally (root Object.prototype / Array.prototype of any realm) instead of by identity.
function isRootObjectPrototype(proto) {
  return proto !== null && typeof proto === 'object' && Object.getPrototypeOf(proto) === null && Object.hasOwn(proto, 'hasOwnProperty');
}

function isPlainArrayPrototype(proto) {
  return proto === Array.prototype || (proto !== null && Array.isArray(proto) && isRootObjectPrototype(Object.getPrototypeOf(proto)));
}

function isRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || isRootObjectPrototype(proto);
}

function validateJson(value, path = '$', depth = 0, seen = new Set()) {
  if (depth > schema.limits.jsonDepth) fail(`${path} exceeds the maximum JSON depth`);
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail(`${path} must contain only finite numbers`);
    return;
  }
  if (typeof value !== 'object') fail(`${path} is not a JSON value`);
  if (seen.has(value)) fail(`${path} contains a cycle`);
  seen.add(value);

  if (Array.isArray(value)) {
    if (!isPlainArrayPrototype(Object.getPrototypeOf(value))) fail(`${path} must be a plain array`);
    if (Object.getOwnPropertySymbols(value).length) fail(`${path} must not contain symbol keys`);
    const names = Object.getOwnPropertyNames(value);
    if (names.length !== value.length + 1 || names.some((key) => key !== 'length' && !/^(0|[1-9]\d*)$/.test(key))) {
      fail(`${path} must be a plain array`);
    }
    for (let i = 0; i < value.length; i += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
      if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) fail(`${path}[${i}] must be a JSON value`);
      validateJson(descriptor.value, `${path}[${i}]`, depth + 1, seen);
    }
  } else {
    if (!isRecord(value)) fail(`${path} must be a plain object`);
    if (Object.getOwnPropertySymbols(value).length) fail(`${path} must not contain symbol keys`);
    for (const key of Object.getOwnPropertyNames(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) fail(`${path}.${key} must be a JSON value`);
      validateJson(descriptor.value, `${path}.${key}`, depth + 1, seen);
    }
  }
  seen.delete(value);
}

function checkJson(value, label) {
  validateJson(value, label);
  let serialized;
  try {
    serialized = JSON.stringify(value);
  } catch (error) {
    fail(`${label} cannot be serialized as JSON`);
  }
  if (Buffer.byteLength(serialized, 'utf8') > schema.limits.jsonBytes) {
    fail(`${label} exceeds the maximum JSON size`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaults() {
  const result = { actions: [] };
  for (const section of sections) {
    result[section] = Object.fromEntries(Object.entries(schema[section]).map(([key, field]) => [key, field.default]));
  }
  return result;
}

function validateField(value, field, path) {
  switch (field.type) {
    case 'string':
      if (typeof value !== 'string') fail(`${path} must be a string`);
      if (field.max !== undefined && value.length > field.max) fail(`${path} exceeds ${field.max} characters`);
      break;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) fail(`${path} must be a finite number`);
      if (field.min !== undefined && value < field.min) fail(`${path} must be at least ${field.min}`);
      if (field.max !== undefined && value > field.max) fail(`${path} must be at most ${field.max}`);
      break;
    case 'boolean':
      if (typeof value !== 'boolean') fail(`${path} must be a boolean`);
      break;
    case 'enum':
      if (!field.values.includes(value)) fail(`${path} must be one of: ${field.values.join(', ')}`);
      break;
    case 'icon':
      if (!isIcon(value)) fail(`${path} must be empty, an icon name (pi-… or mdi-…), an image URL or a small image data URL`);
      break;
    case 'color':
      if (typeof value !== 'string' || (value !== '' && !colorPattern.test(value))) fail(`${path} must be empty or a 3, 6, or 8 digit hex color`);
      break;
    case 'id':
      if (typeof value !== 'string' || !idPattern.test(value)) fail(`${path} is not a valid action id`);
      break;
    case 'badge':
      // Counter on the main button: a finite number or a short text; '' and 0 hide it.
      if (typeof value === 'number') { if (!Number.isFinite(value)) fail(`${path} must be a finite number or a short text`); }
      else if (typeof value !== 'string' || value.length > field.max) fail(`${path} must be a number or a text of at most ${field.max} characters`);
      break;
    case 'json':
      // The containing value is checked as JSON before schema validation.
      break;
    default:
      fail(`Unsupported schema type: ${field.type}`);
  }
}

function checkGeometry(menu, path = 'menu') {
  const allowed = schema.geometry.directions[menu.shape];
  // "auto" is resolved in the browser from the button position, so it fits every shape.
  if (menu.direction !== 'auto' && allowed.length && !allowed.includes(menu.direction)) {
    fail(`${path}.direction "${menu.direction}" is not valid for shape "${menu.shape}" (use: ${allowed.join(', ')}); change both fields in the same message`);
  }
}

function normalizeSection(input, name, base) {
  if (input === undefined) {
    const output = clone(base || Object.fromEntries(Object.entries(schema[name]).map(([key, field]) => [key, field.default])));
    if (name === 'menu') checkGeometry(output);
    return output;
  }
  if (!isRecord(input)) fail(`${name} must be an object`);
  const output = clone(base || Object.fromEntries(Object.entries(schema[name]).map(([key, field]) => [key, field.default])));
  for (const [key, value] of Object.entries(input)) {
    const field = schema[name][key];
    if (!field) fail(`Unknown ${name} field: ${key}`);
    validateField(value, field, `${name}.${key}`);
    output[key] = clone(value);
  }
  if (name === 'menu') checkGeometry(output);
  return output;
}

function normalizeActions(actions) {
  checkJson(actions, 'actions');
  if (!Array.isArray(actions)) fail('actions must be an array');
  if (actions.length > schema.limits.actions) fail(`actions may contain at most ${schema.limits.actions} items`);
  const ids = new Set();
  return actions.map((action, index) => {
    const path = `actions[${index}]`;
    if (!isRecord(action)) fail(`${path} must be an object`);
    for (const key of Object.keys(action)) {
      if (!Object.hasOwn(schema.action, key)) fail(`Unknown ${path} field: ${key}`);
    }
    if (!Object.hasOwn(action, 'id')) fail(`${path}.id is required`);
    if (!Object.hasOwn(action, 'payload')) fail(`${path}.payload is required`);
    validateField(action.id, schema.action.id, `${path}.id`);
    if (ids.has(action.id)) fail(`Duplicate action id: ${action.id}`);
    ids.add(action.id);
    const output = {};
    for (const [key, field] of Object.entries(schema.action)) {
      if (Object.hasOwn(action, key)) {
        validateField(action[key], field, `${path}.${key}`);
        output[key] = clone(action[key]);
      } else if (Object.hasOwn(field, 'default')) {
        output[key] = field.default;
      } else if (field.required) {
        fail(`${path}.${key} is required`);
      }
    }
    return output;
  });
}

function normalizeConfig(editorConfig) {
  if (!isRecord(editorConfig)) fail('config must be an object');
  checkJson(editorConfig, 'config');
  const result = { actions: normalizeActions(editorConfig.actions) };
  for (const section of sections) result[section] = normalizeSection(editorConfig[section], section);
  checkJson(result, 'config');
  return result;
}

function normalizeEditorActions(actions) {
  checkJson(actions, 'editor actions');
  if (!Array.isArray(actions)) fail('actions must be an array');
  const converted = actions.map((action, index) => {
    if (!isRecord(action)) fail(`actions[${index}] must be an object`);
    const result = { ...action };
    if (Object.hasOwn(action, 'payloadType')) {
      const type = action.payloadType;
      if (typeof action.payload !== 'string') fail(`actions[${index}].payload must be text when payloadType is set`);
      if (type === 'str') result.payload = action.payload;
      else if (type === 'num') {
        let parsed;
        try { parsed = JSON.parse(action.payload); } catch { fail(`actions[${index}].payload is not a valid number`); }
        if (typeof parsed !== 'number' || !Number.isFinite(parsed)) fail(`actions[${index}].payload is not a valid number`);
        result.payload = parsed;
      } else if (type === 'bool') {
        if (action.payload !== 'true' && action.payload !== 'false') fail(`actions[${index}].payload must be true or false`);
        result.payload = action.payload === 'true';
      } else if (type === 'json') {
        try { result.payload = JSON.parse(action.payload); } catch { fail(`actions[${index}].payload is not valid JSON`); }
      } else fail(`actions[${index}].payloadType is invalid`);
      delete result.payloadType;
    }
    return result;
  });
  return normalizeActions(converted);
}

function validatePartialAction(patch, index) {
  if (!isRecord(patch)) fail(`payload[${index}] must be an object`);
  for (const key of Object.keys(patch)) if (!Object.hasOwn(schema.action, key)) fail(`Unknown payload[${index}] field: ${key}`);
  if (!Object.hasOwn(patch, 'id')) fail(`payload[${index}].id is required`);
  validateField(patch.id, schema.action.id, `payload[${index}].id`);
  for (const [key, value] of Object.entries(patch)) {
    if (key !== 'id') validateField(value, schema.action[key], `payload[${index}].${key}`);
  }
}

function applyMessage(current, initial, msg) {
  checkJson(current, 'current config');
  checkJson(initial, 'initial config');
  checkJson(msg, 'message');
  if (!isRecord(msg)) fail('message must be an object');
  const base = normalizeConfig(current);
  const initialConfig = normalizeConfig(initial);

  if (Object.hasOwn(msg, 'command')) {
    if (msg.command === 'reset') return clone(initialConfig);
    if (msg.command === 'patch') {
      if (!Array.isArray(msg.payload)) fail('patch payload must be an array');
      const byId = new Map(base.actions.map((action) => [action.id, action]));
      const patched = new Map();
      for (let index = 0; index < msg.payload.length; index += 1) {
        const patch = msg.payload[index];
        validatePartialAction(patch, index);
        if (!byId.has(patch.id)) fail(`Unknown action id: ${patch.id}`);
        if (patched.has(patch.id)) fail(`Duplicate patch id: ${patch.id}`);
        patched.set(patch.id, { ...byId.get(patch.id), ...clone(patch) });
      }
      const result = { ...base, actions: normalizeActions(base.actions.map((action) => patched.get(action.id) || action)) };
      checkJson(result, 'config');
      return result;
    }
    if (msg.command === 'remove') {
      if (!Array.isArray(msg.payload)) fail('remove payload must be an array');
      const removeIds = new Set();
      for (const id of msg.payload) {
        if (typeof id !== 'string') fail('remove payload entries must be strings');
        if (removeIds.has(id)) fail(`Duplicate remove id: ${id}`);
        removeIds.add(id);
        if (!base.actions.some((action) => action.id === id)) fail(`Unknown action id: ${id}`);
      }
      const result = { ...base, actions: base.actions.filter((action) => !removeIds.has(action.id)) };
      checkJson(result, 'config');
      return result;
    }
    fail(`Unknown command: ${String(msg.command)}`);
  }

  const payload = msg.payload;
  if (Array.isArray(payload)) {
    const result = { ...base, actions: normalizeActions(payload) };
    checkJson(result, 'config');
    return result;
  }
  if (!isRecord(payload)) fail('message payload must be an array or object');
  for (const key of Object.keys(payload)) if (!['actions', ...sections].includes(key)) fail(`Unknown payload field: ${key}`);
  const result = { ...base };
  if (Object.hasOwn(payload, 'actions')) result.actions = normalizeActions(payload.actions);
  for (const section of sections) {
    if (Object.hasOwn(payload, section)) result[section] = normalizeSection(payload[section], section, base[section]);
  }
  checkJson(result, 'config');
  return result;
}

module.exports = { schema, defaults, normalizeConfig, applyMessage, normalizeActions, normalizeEditorActions };
