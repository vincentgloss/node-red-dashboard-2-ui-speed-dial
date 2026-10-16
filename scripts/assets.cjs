const fs = require('node:fs')
const path = require('node:path')
fs.mkdirSync('ui', { recursive: true })
const source = fs.readFileSync('node_modules/primeicons/primeicons.css', 'utf8')
const rules = source.match(/\.pi-[\w-]+:before\s*\{[^}]*\}/g) || []
const css = '@font-face{font-family:ff-speed-dial-icons;font-display:block;src:url("../node_modules/primeicons/fonts/primeicons.woff2") format("woff2")}\n' +
  '.ff-speed-dial .pi{font-family:ff-speed-dial-icons;font-style:normal;font-weight:normal;line-height:1;display:inline-block;-webkit-font-smoothing:antialiased}\n' +
  rules.map(rule => '.ff-speed-dial ' + rule).join('\n')
fs.writeFileSync('ui/icons.css', css)
// Icon names and code points for the editor's icon picker (sorted by name).
const icons = {}
for (const rule of rules) {
  const match = /\.(pi-[\w-]+):before\s*\{\s*content:\s*"\\([0-9a-fA-F]+)"/.exec(rule)
  if (match) icons[match[1]] = match[2].toLowerCase()
}
fs.writeFileSync('lib/icons.json', JSON.stringify(Object.fromEntries(Object.entries(icons).sort(([a], [b]) => a.localeCompare(b)))) + '\n')
// After the Vite build (which empties resources/): the icon font for the editor and the exact upstream notices.
if (process.argv.includes('--post')) {
  fs.copyFileSync('node_modules/primeicons/fonts/primeicons.woff2', 'resources/primeicons.woff2')
  const packages = ['primevue', 'primeicons', '@primevue/core', '@primevue/icons', '@primeuix/styled', '@primeuix/styles', '@primeuix/utils']
  const notices = packages.map(name => {
    const dir = path.join('node_modules', name)
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json')))
    const license = fs.readdirSync(dir).find(file => /^license(?:\.|$)/i.test(file))
    return `\n=== ${name} ${pkg.version} (${pkg.license}) ===\n` + (license ? fs.readFileSync(path.join(dir, license), 'utf8') : `License: ${pkg.license}\n`)
  }).join('\n')
  fs.writeFileSync('resources/THIRD-PARTY-NOTICES.txt', notices)
}
