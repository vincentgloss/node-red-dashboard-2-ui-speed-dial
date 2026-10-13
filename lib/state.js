'use strict'
const { applyMessage } = require('./protocol')
const copy = value => JSON.parse(JSON.stringify(value))
function ownValue (object, key) {
  const descriptor = Object.getOwnPropertyDescriptor(object, key)
  if (!descriptor) return undefined
  if (!Object.hasOwn(descriptor, 'value')) throw new Error(`${key} must be a data field, not an accessor`)
  return descriptor.value
}
class StateManager {
  constructor (initial) {
    this.initial = copy(initial)
    this.shared = copy(initial)
    this.clients = new Map()
    this.closed = false
  }
  connect (conn) {
    if (this.closed) return
    if (!this.clients.has(conn.id)) {
      const disconnected = () => this.disconnect(conn.id)
      this.clients.set(conn.id, { conn, disconnected, config: null })
      conn.once('disconnect', disconnected)
    }
  }
  disconnect (socketId) {
    const client = this.clients.get(socketId)
    if (client) client.conn.off('disconnect', client.disconnected)
    this.clients.delete(socketId)
  }
  effective (conn) { return this.clients.get(conn.id)?.config || this.shared }
  update (msg, acceptsClientConfig) {
    const client = ownValue(msg, '_client')
    const target = {}
    if (client !== undefined) {
      if (!client || typeof client !== 'object' || Array.isArray(client)) throw new Error('_client must be an object')
      for (const key of ['socketId', 'clientId']) {
        if (Object.hasOwn(client, key)) {
          const value = ownValue(client, key)
          if (typeof value !== 'string' || !value.trim()) throw new Error(`_client.${key} must be a nonempty string`)
          target[key] = value
        }
      }
      if (!Object.keys(target).length && Object.keys(client).length) throw new Error('Targeting requires _client.socketId or _client.clientId; user-only targeting is unsupported')
    }
    const targeted = Object.keys(target).length > 0
    const input = {}
    if (Object.hasOwn(msg, 'command')) input.command = ownValue(msg, 'command')
    if (Object.hasOwn(msg, 'payload') && input.command !== 'reset') input.payload = ownValue(msg, 'payload')
    if (!targeted) {
      const next = applyMessage(this.shared, this.initial, input)
      this.shared = next
      for (const client of this.clients.values()) client.config = null
      return { speedDialConfig: copy(next) }
    }
    if (!acceptsClientConfig) throw new Error('Enable ui-speed-dial in Dashboard Client Data / Accept Client Data before targeting')
    const matches = [...this.clients.values()].filter(({ conn }) =>
      (!target.socketId || target.socketId === conn.id) &&
      (!target.clientId || target.clientId === conn.handshake?.query?.clientId))
    if (!matches.length) throw new Error('No connected speed dial client matches the target; wait for the widget to load')
    const pending = matches.map(c => ({ c, next: applyMessage(c.config || this.shared, this.initial, input) }))
    for (const { c, next } of pending) c.config = next
    return { targeted: true, pending, target }
  }
  click (conn, value) {
    if (this.closed || !value || typeof value !== 'object' || typeof value.action !== 'string') return null
    const config = this.effective(conn)
    const action = config.actions.find(action => action.id === value.action)
    if (!config.button.visible || !config.button.enabled || !action?.visible || !action.enabled) return null
    const msg = { payload: copy(action.payload), action: action.id }
    if (Object.hasOwn(action, 'topic')) msg.topic = action.topic
    return msg
  }
  close () {
    this.closed = true
    for (const id of this.clients.keys()) this.disconnect(id)
  }
}
module.exports = StateManager
