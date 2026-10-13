// Compatibility matrix: installs a given Node-RED / Dashboard pair into an isolated directory and runs the
// real-runtime integration test (and optionally the browser test) against it.
//   [SD_NODE=/path/to/node] node test/compat.cjs <node-red> <dashboard> [--browser]
// SD_NODE selects the Node.js binary that runs Node-RED (the test scripts and npm keep using the current Node.js).
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync, spawnSync } = require('node:child_process')
const [nodeRed, dashboard, ...flags] = process.argv.slice(2)
if (!nodeRed || !dashboard) { console.error('usage: node test/compat.cjs <node-red> <dashboard> [--browser]'); process.exit(2) }
const dir = path.resolve('.test-env-compat', `nr${nodeRed}-db${dashboard}`)
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'speed-dial-compat', private: true, version: '1.0.0', dependencies: { 'node-red': nodeRed, '@flowfuse/node-red-dashboard': dashboard } }))
const npmCli = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')
execFileSync(process.execPath, [npmCli, 'install', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'ignore' })
const installed = name => JSON.parse(fs.readFileSync(path.join(dir, 'node_modules', name, 'package.json'))).version
const runtime = process.env.SD_NODE ? execFileSync(process.env.SD_NODE, ['-v'], { encoding: 'utf8' }).trim() : process.version
console.log(`Node (Node-RED runtime) ${runtime}, Node-RED ${installed('node-red')}, Dashboard ${installed('@flowfuse/node-red-dashboard')}, Vue ${installed('vue')}`)
let failed = false
for (const script of ['integration.cjs', ...(flags.includes('--browser') ? ['browser.cjs'] : [])]) {
  const result = spawnSync(process.execPath, [path.join(__dirname, script)], { env: { ...process.env, SD_TEST_ENV: dir, SD_LEGACY_PEERS: '1' }, encoding: 'utf8' })
  const lines = (result.stdout + result.stderr).split('\n').filter(l => /^(PASS|FAIL)|Error|expected|actual/.test(l))
  console.log(`  ${script}: ${result.status === 0 ? 'OK' : 'FAILED'}`)
  if (result.status !== 0) { failed = true; console.log(lines.slice(0, 8).map(l => '    ' + l.slice(0, 240)).join('\n')) }
}
process.exitCode = failed ? 1 : 0
