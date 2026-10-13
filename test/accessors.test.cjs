const test = require('node:test')
const assert = require('node:assert/strict')
const StateManager = require('../lib/state')
const { defaults } = require('../lib/protocol')
test('runtime rejects protocol and target accessors without executing them or changing state', () => {
  for (const key of ['payload', 'command', '_client']) {
    const manager = new StateManager(defaults())
    let calls = 0
    const msg = {payload:[]}
    Object.defineProperty(msg,key,{enumerable:true,get(){calls++;return key === 'payload' ? [{id:'injected',payload:1}] : 'reset'}})
    assert.throws(()=>manager.update(msg,true),/accessor/)
    assert.equal(calls,0)
    assert.deepEqual(manager.shared,defaults())
  }
  const manager = new StateManager(defaults())
  let calls = 0
  const client = {}
  Object.defineProperty(client,'socketId',{enumerable:true,get(){calls++;return 'fake'}})
  assert.throws(()=>manager.update({_client:client,payload:[]},true),/accessor/)
  assert.equal(calls,0)
})
