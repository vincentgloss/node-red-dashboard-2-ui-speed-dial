const { io } = require('socket.io-client')
const assert = require('node:assert/strict')
const { start, update, outputs, waitFor } = require('./harness.cjs')
async function main () {
  const harness = await start('integration')
  const sockets = []
  function client (clientId) {
    const socket = io('http://127.0.0.1:1885', { path: '/dashboard/socket.io', query: { clientId }, transports: ['polling', 'websocket'] })
    socket.on('connect_error', error => console.error('Dashboard socket connection:', error.message, error.description?.message))
    socket.on('speed-dial:state:sd-test-dial', msg => { socket.snapshot = msg.speedDialConfig })
    socket.on('msg-input:sd-test-dial', msg => { if (msg.speedDialConfig) socket.snapshot = msg.speedDialConfig })
    sockets.push(socket)
    return socket
  }
  async function load (socket) {
    await waitFor(() => socket.connected, 'socket connection failed')
    socket.emit('widget-change', 'sd-test-dial', { type: 'load' })
    await waitFor(() => socket.snapshot, 'widget state missing')
  }
  try {
    const a = client('client-a'); const b = client('client-b')
    await load(a); await load(b)
    const payloads = ['text', 42, false, {nested:{ok:true}}, [1,'two'], null]
    await update({ payload: payloads.map((payload,i)=>({id:'p'+i,payload,label:'Payload '+i,topic:'t'+i})) })
    await waitFor(()=>a.snapshot.actions[0]?.id==='p0' && b.snapshot.actions[0]?.id==='p0','shared replacement failed')
    assert.equal((await outputs()).length, 0)
    for (let i=0;i<payloads.length;i++) a.emit('widget-change','sd-test-dial',{action:'p'+i,payload:'FORGED',_client:{socketId:b.id}})
    await waitFor(async()=> (await outputs()).length===6, 'click output failed')
    for (const [i,msg] of (await outputs()).entries()) {
      assert.deepEqual(msg.payload,payloads[i]);assert.equal(msg.action,'p'+i);assert.equal(msg.topic,'t'+i);assert.equal(msg._client.socketId,a.id)
    }
    await update({command:'patch',payload:[{id:'p0',enabled:false},{id:'p1',visible:false}]})
    await waitFor(()=>!a.snapshot.actions[0].enabled,'disabled not synced')
    for (const action of ['p0','p1','unknown']) a.emit('widget-change','sd-test-dial',{action})
    await new Promise(r=>setTimeout(r,150)); assert.equal((await outputs()).length,6)
    const before = JSON.stringify(a.snapshot)
    await update({command:'patch',payload:[{id:'p2',label:'MUTATED'},{id:'missing',payload:1}]})
    await new Promise(r=>setTimeout(r,150)); assert.equal(JSON.stringify(a.snapshot),before)
    await update({_client:{socketId:a.id},payload:[{id:'private',payload:{private:true}}]})
    await waitFor(()=>a.snapshot.actions[0]?.id==='private','socket target failed');assert.equal(b.snapshot.actions[0].id,'p0')
    a.emit('widget-change','sd-test-dial',{action:'private'});b.emit('widget-change','sd-test-dial',{action:'private'})
    await waitFor(async()=> (await outputs()).length===7,'targeted action click failed')
    assert.deepEqual((await outputs())[6].payload,{private:true})
    await update({_client:{clientId:'client-b'},payload:{button:{label:'Only B'}}})
    await waitFor(()=>b.snapshot.button.label==='Only B','clientId target failed');assert.notEqual(a.snapshot.button.label,'Only B')
    a.emit('widget-change','sd-test-dial',{type:'load'});await new Promise(r=>setTimeout(r,150));assert.equal(a.snapshot.actions[0].id,'private')
    await update({payload:{menu:{mode:'menu'}}})
    await waitFor(()=>a.snapshot.actions[0]?.id==='p0' && b.snapshot.button.label==='Actions','broadcast failed to clear overrides')
    await update({command:'remove',payload:['p5']})
    await waitFor(()=>a.snapshot.actions.length===5,'remove failed')
    await update({command:'remove',payload:['p0','missing']});await new Promise(r=>setTimeout(r,150));assert.equal(a.snapshot.actions.length,5)
    await update({_client:{socketId:a.id},payload:[{id:'temp',payload:null}]});await waitFor(()=>a.snapshot.actions[0]?.id==='temp','target before reconnect failed')
    a.disconnect();const a2=client('client-a');await load(a2);assert.equal(a2.snapshot.actions[0].id,'p0')
    await update({command:'reset'})
    await waitFor(()=>a2.snapshot.actions[0]?.id==='first' && b.snapshot.actions[0]?.id==='first','reset failed')
    assert.equal((await outputs()).length,7)
    assert.match(harness.getLog(),/Unknown action id: missing/)
    console.log('PASS real-runtime integration: native types, atomic errors, trusted clicks, no configuration outputs, targeting, shared reset, reconnect')
  } finally {for(const s of sockets)s.disconnect();await harness.stop()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
