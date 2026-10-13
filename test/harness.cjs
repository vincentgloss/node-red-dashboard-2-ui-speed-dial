const fs = require('node:fs')
const path = require('node:path')
const { execFileSync, spawn } = require('node:child_process')
const assert = require('node:assert/strict')
const dir = path.resolve(process.env.SD_TEST_ENV || '.test-env')
const npmCli = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')
function npm (args, cwd = process.cwd()) { return execFileSync(process.execPath, [npmCli, ...args], { cwd, encoding: 'utf8' }) }
function fixture () {
  const nodes = require('./fixture.cjs')()
  const dial = nodes.find(n => n.type === 'ui-speed-dial')
  const base = nodes.find(n => n.type === 'ui-base')
  const group = nodes.find(n => n.type === 'ui-group')
  nodes.push(
    { ...dial, id: 'sd-test-global', name: 'Global dial', scope: 'all', page: '', ui: base.id, button: { label: 'Global', position: 'top-left', offsetY: 72 }, menu: { mode: 'menu', direction: 'down' }, actions: [{ id: 'global', label: 'Global action', payload: 'true', payloadType: 'bool', icon: 'pi-globe' }] },
    { ...dial, id: 'sd-test-groupdial', name: 'Group dial', scope: 'group', page: '', group: group.id, width: 6, height: 4, order: 2, button: { label: 'Group', position: 'top-right', offsetX: 8, offsetY: 8 }, menu: { direction: 'down' }, actions: [{ id: 'group', label: 'Group action', payload: '123', payloadType: 'num', icon: 'pi-home' }] }
  )
  for (const node of nodes.filter(n => n.type === 'ui-speed-dial')) node.wires = [['sd-test-debug', 'sd-test-collect']]
  nodes.push(
    { id: 'sd-test-httpinput', type: 'http in', z: 'sd-test-flow', url: '/test/input', method: 'post', upload: false, wires: [['sd-test-inputfn']] },
    { id: 'sd-test-inputfn', type: 'function', z: 'sd-test-flow', name: 'Test input bridge', func: 'const update = msg.payload; node.send([update, {payload:{accepted:true},req:msg.req,res:msg.res}]); return null;', outputs: 2, wires: [[dial.id], ['sd-test-response']] },
    { id: 'sd-test-response', type: 'http response', z: 'sd-test-flow', statusCode: '', headers: {}, wires: [] },
    { id: 'sd-test-collect', type: 'function', z: 'sd-test-flow', name: 'Test output recorder', func: 'const out = global.get("sdOutputs") || []; out.push(msg); global.set("sdOutputs", out); return null;', outputs: 1, wires: [[]] },
    { id: 'sd-test-httpout', type: 'http in', z: 'sd-test-flow', url: '/test/outputs', method: 'get', upload: false, wires: [['sd-test-outfn']] },
    { id: 'sd-test-outfn', type: 'function', z: 'sd-test-flow', name: 'Read test outputs', func: 'msg.payload = global.get("sdOutputs") || []; return msg;', outputs: 1, wires: [['sd-test-response']] }
  )
  return nodes
}
async function waitFor (predicate, message, timeout = 15000) {
  const until = Date.now() + timeout
  while (Date.now() < until) { if (await predicate()) return; await new Promise(resolve => setTimeout(resolve, 100)) }
  throw new Error(message)
}
async function start (label, flowsOverride) {
  // First run on a fresh checkout: create the isolated Node-RED + Dashboard environment.
  if (!fs.existsSync(path.join(dir, 'node_modules/node-red/red.js'))) {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'speed-dial-isolated-test', private: true, version: '1.0.0', dependencies: { 'node-red': '5.0.8', '@flowfuse/node-red-dashboard': '1.33.0' } }))
    npm(['install', '--no-audit', '--no-fund'], dir)
  }
  fs.mkdirSync('test-results', { recursive: true })
  const pack = JSON.parse(npm(['pack', '--json', '--ignore-scripts']))[0]
  const packagePath = path.resolve(pack.filename)
  npm(['install', '--no-audit', '--no-fund', ...(process.env.SD_LEGACY_PEERS ? ['--legacy-peer-deps'] : []), packagePath], dir)
  const installed = JSON.parse(fs.readFileSync(path.join(dir, 'node_modules/node-red-dashboard-2-ui-speed-dial/package.json')))
  assert.equal(installed.version, '1.0.0')
  const flows = flowsOverride || fixture()
  fs.writeFileSync(path.join(dir, 'settings.js'), 'module.exports={uiPort:1885,uiHost:"127.0.0.1",flowFile:"flows.json",credentialSecret:false,editorTheme:{tours:false,palette:{catalogues:[]}},logging:{console:{level:"info"}}}\n')
  fs.writeFileSync(path.join(dir, 'flows.json'), JSON.stringify(flows))
  const server = spawn(process.env.SD_NODE || process.execPath, [path.join(dir, 'node_modules/node-red/red.js'), '--userDir', dir], { stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''; server.stdout.on('data', b => { log += b }); server.stderr.on('data', b => { log += b })
  try {
    await waitFor(async () => { try { return (await fetch(flowsOverride ? 'http://127.0.0.1:1885/flows' : 'http://127.0.0.1:1885/test/outputs')).ok } catch { return false } }, 'Node-RED failed to start: ' + log, 60000)
  } catch (e) { server.kill(); throw e }
  return { flows, packagePath, pack, getLog: () => log, stop: async () => {
    server.kill()
    await new Promise(resolve => server.once('exit', resolve))
    fs.writeFileSync(path.join('test-results', label + '-runtime.log'), log)
  } }
}
async function update (message) {
  const response = await fetch('http://127.0.0.1:1885/test/input', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) })
  assert.equal(response.status, 200)
}
async function outputs () { return (await fetch('http://127.0.0.1:1885/test/outputs')).json() }
module.exports = { start, waitFor, update, outputs, npm, fixture }
