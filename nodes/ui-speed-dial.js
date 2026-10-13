'use strict'
const { schema, normalizeConfig, normalizeEditorActions } = require('../lib/protocol')
const StateManager = require('../lib/state')
module.exports = function (RED) {
  RED.httpAdmin.get('/ui-speed-dial/schema', RED.auth.needsPermission('ui-speed-dial.read'), (req, res) => res.json(schema))
  function SpeedDialNode (config) {
    RED.nodes.createNode(this, config)
    const node = this
    const scope = config.scope || 'page'
    try {
      if (!['group', 'page', 'all'].includes(scope)) throw new Error('Scope must be group, page, or all')
      const parent = RED.nodes.getNode(scope === 'group' ? config.group : scope === 'page' ? config.page : config.ui)
      if (!parent?.register) throw new Error('Select a Dashboard group, page, or UI base for the scope')
      const initial = normalizeConfig({ actions: normalizeEditorActions(config.actions || []), button: config.button || {}, menu: config.menu || {}, theme: config.theme || {} })
      const base = scope === 'all' ? parent : parent.getBase()
      const manager = new StateManager(initial)
      const widgetConfig = { ...config, scope, speedDialConfig: initial }
      for (const key of ['group', 'page', 'ui']) {
        if (key !== (scope === 'group' ? 'group' : scope === 'page' ? 'page' : 'ui')) widgetConfig[key] = ''
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
  RED.nodes.registerType('ui-speed-dial', SpeedDialNode)
}
