'use strict'
const { schema, normalizeConfig, normalizeEditorActions } = require('../lib/protocol')
const StateManager = require('../lib/state')
const icons = require('../lib/icons.json')
const fs = require('node:fs')
const path = require('node:path')
// Material Design Icons as the installed Dashboard ships them (names, code points and font), read once on demand.
let mdi
function loadMdi () {
  if (mdi !== undefined) return mdi
  mdi = null
  try {
    const assets = path.join(path.dirname(require.resolve('@flowfuse/node-red-dashboard/package.json')), 'dist', 'assets')
    const files = fs.readdirSync(assets)
    const font = files.find(file => /^materialdesignicons-webfont-.*\.woff2$/.test(file))
    for (const file of files.filter(file => file.endsWith('.css'))) {
      const css = fs.readFileSync(path.join(assets, file), 'utf8')
      const names = {}
      for (const match of css.matchAll(/\.(mdi-[a-z0-9-]+):before\{content:"([^"]+)"\}/gu)) names[match[1]] = match[2].codePointAt(0).toString(16)
      if (font && Object.keys(names).length) { mdi = { icons: names, font: path.join(assets, font) }; break }
    }
  } catch (error) { mdi = null }
  return mdi
}
module.exports = function (RED) {
  // Fallback for editors whose settings predate the node install; the editor normally reads RED.settings.uiSpeedDialSchema.
  RED.httpAdmin.get('/ui-speed-dial/schema', RED.auth.needsPermission('ui-speed-dial.read'), (req, res) => res.json(schema))
  RED.httpAdmin.get('/ui-speed-dial/mdi-icons', RED.auth.needsPermission('ui-speed-dial.read'), (req, res) => {
    const set = loadMdi()
    if (!set) return res.status(404).json({ error: 'Material Design Icons not found in @flowfuse/node-red-dashboard' })
    res.json(set.icons)
  })
  // Loaded by an @font-face rule in the editor, which cannot send the admin token; the file is the public MDI font.
  RED.httpAdmin.get('/ui-speed-dial/mdi.woff2', (req, res) => {
    const set = loadMdi()
    if (!set) return res.sendStatus(404)
    res.sendFile(set.font, { maxAge: '7d', headers: { 'Content-Type': 'font/woff2' } })
  })
  function SpeedDialNode (config) {
    RED.nodes.createNode(this, config)
    const node = this
    // scope = where it is registered: one group, one page, selected pages or all pages of a dashboard.
    // "pages" registers on the dashboard like "all" and filters by page in the browser.
    const scope = config.scope || 'page'
    const refKey = scope === 'group' ? 'group' : scope === 'page' ? 'page' : 'ui'
    try {
      if (!['group', 'page', 'pages', 'all'].includes(scope)) throw new Error('Scope must be group, page, pages, or all')
      const pages = scope === 'pages' ? (Array.isArray(config.pages) ? config.pages.filter(id => typeof id === 'string' && id) : []) : []
      if (scope === 'pages' && !pages.length) throw new Error('Select at least one page')
      const parent = RED.nodes.getNode(config[refKey])
      if (!parent?.register) throw new Error('Select a Dashboard group, page, or UI base for the scope')
      const initial = normalizeConfig({ actions: normalizeEditorActions(config.actions || []), button: config.button || {}, menu: config.menu || {}, theme: config.theme || {} })
      const base = refKey === 'ui' ? parent : parent.getBase()
      const manager = new StateManager(initial)
      const placement = scope === 'group' ? 'group' : config.placement === 'header' ? 'header' : 'float'
      const widgetConfig = { ...config, scope, placement, pages, speedDialConfig: initial }
      for (const key of ['group', 'page', 'ui']) {
        if (key !== refKey) widgetConfig[key] = ''
      }
      delete widgetConfig.actions
      const evts = {
        beforeSend (msg) {
          try {
            const update = manager.update(msg, base.acceptsClientConfig.includes(node.type))
            if (!update.targeted) return update
            for (const { c, next } of update.pending) {
              base.emit('msg-input:' + node.id, { speedDialConfig: next, _client: { socketId: c.conn.id, ...(update.target.clientId ? { clientId: update.target.clientId } : {}) } }, node)
            }
            return {}
          } catch (error) { error.type = 'warn'; throw error }
        },
        onInput (msg) {
          if (msg.speedDialConfig) base.stores.data.save(base, node, msg)
        },
        onChange (context, value, conn) {
          if (manager.closed) return
          if (value?.type === 'load') {
            manager.connect(conn)
            conn.emit('speed-dial:state:' + node.id, { speedDialConfig: manager.effective(conn) })
            return
          }
          const msg = manager.click(conn, value)
          if (!msg) return
          if (base.includeClientData && context?._client) msg._client = RED.util.cloneMessage(context._client)
          node.send(msg)
        }
      }
      base.stores.data.clear(node.id)
      base.stores.data.save(base, node, { speedDialConfig: initial })
      if (scope === 'group') parent.register(node, widgetConfig, evts)
      else if (scope === 'page') parent.register(null, node, widgetConfig, evts)
      else parent.register(null, null, node, widgetConfig, evts)
      node.on('close', () => manager.close())
      node.status({ fill: 'green', shape: 'dot', text: `${initial.actions.length} actions` })
    } catch (error) {
      node.error(error.message)
      node.status({ fill: 'red', shape: 'ring', text: 'Invalid configuration' })
    }
  }
  // Exported to the editor as RED.settings.uiSpeedDialSchema / uiSpeedDialIcons, available as soon as the editor opens.
  RED.nodes.registerType('ui-speed-dial', SpeedDialNode, {
    settings: {
      uiSpeedDialSchema: { value: schema, exportable: true },
      uiSpeedDialIcons: { value: icons, exportable: true }
    }
  })
}
