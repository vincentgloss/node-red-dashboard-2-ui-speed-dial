const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { start, update, outputs, waitFor } = require('./harness.cjs')
const dashboard = 'http://127.0.0.1:1885/dashboard'
async function main () {
  const harness = await start('browser')
  let browser
  const errors = []; const remoteRequests = []
  const report = []
  function track (page, isDashboard = true) {
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    if (isDashboard) page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:1885')) remoteRequests.push(request.url()) })
  }
  const record = text => { report.push(text); console.log('PASS', text) }
  try {
    browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
    const contextA = await browser.newContext({viewport:{width:1280,height:800}})
    const contextB = await browser.newContext({viewport:{width:1280,height:800}})
    const a = await contextA.newPage(); const b = await contextB.newPage(); track(a);track(b)
    await a.goto(dashboard + '/first'); await b.goto(dashboard + '/first')
    await a.locator('.ff-speed-dial[data-widget="sd-test-dial"]').waitFor()
    await b.locator('.ff-speed-dial[data-widget="sd-test-dial"]').waitFor()
    assert.equal(await a.locator('.ff-speed-dial').count(),3)
    const dialA = a.locator('.ff-speed-dial[data-widget="sd-test-dial"]')
    const dialB = b.locator('.ff-speed-dial[data-widget="sd-test-dial"]')
    await a.waitForFunction(()=>document.fonts.check('20px ff-speed-dial-icons'))
    const icon = await dialA.locator('.pi-plus').evaluate(el=>getComputedStyle(el,'::before').content)
    assert.notEqual(icon,'none');assert.notEqual(icon,'normal')
    const ordinary = a.getByRole('button',{name:'Ordinary button',exact:true})
    const ordinaryStyle = await ordinary.evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color,font:getComputedStyle(el).fontFamily}))
    record('local PrimeVue SpeedDial and icon font render; page, global and group instances coexist')

    // Editor dialog, typedInput, schema validation, actual Save and Deploy.
    const editor = await contextA.newPage();track(editor, false)
    await editor.goto('http://127.0.0.1:1885/')
    await editor.waitForFunction(()=>window.RED?.nodes?.node('sd-test-dial'))
    await editor.waitForTimeout(500)
    const declineNotifications = editor.getByRole('button', { name: 'No, do not enable notifications', exact: true })
    if (await declineNotifications.count()) await declineNotifications.click()
    await editor.evaluate(()=>{window.__debugMessages=[];RED.comms.subscribe('debug',(topic,msg)=>window.__debugMessages.push(msg));RED.editor.edit(RED.nodes.node('sd-test-dial'))})
    await editor.locator('#sd-schema-warning').waitFor({state:'hidden'})
    assert.equal(await editor.evaluate(()=>RED.nodes.getType('ui-speed-dial').category),await editor.evaluate(()=>RED.nodes.getType('ui-button').category))
    await editor.locator('[data-pane="actions"]').click()
    assert.equal(await editor.locator('.sd-action').count(),2)
    await editor.locator('.sd-action').nth(1).locator('[data-action-key="id"]').fill('first')
    await editor.waitForFunction(()=>document.querySelector('#node-dialog-ok').disabled)
    await editor.locator('.sd-action').nth(1).locator('[data-action-key="id"]').fill('json')
    await editor.locator('.sd-action').first().locator('[data-action-key="label"]').fill('Editor action')
    await editor.evaluate(()=>{const p=$('.sd-action').first().find('.sd-payload');p.typedInput('type','json');p.typedInput('value','{broken');p.trigger('change')})
    await editor.waitForFunction(()=>document.querySelector('#node-dialog-ok').disabled)
    await editor.evaluate(()=>{
      const p=$('.sd-action').first().find('.sd-payload');p.typedInput('type','json');p.typedInput('value','{"from":"editor"}');p.trigger('change')
    })
    await editor.locator('[data-pane="menu"]').click()
    await editor.locator('#sd-menu-mode').selectOption('menu')
    assert.equal(await editor.locator('[data-schema-key="showLabels"]').isVisible(),false)
    await editor.locator('#sd-menu-mode').selectOption('speed-dial')
    const dirOptions=()=>editor.locator('#sd-menu-direction option').evaluateAll(o=>o.map(x=>x.value))
    assert.deepEqual(await dirOptions(),['up','down','left','right'])
    await editor.locator('#sd-menu-shape').selectOption('quarter-circle')
    assert.deepEqual(await dirOptions(),['up-left','up-right','down-left','down-right'].filter(d=>d==='up-left'))  // default position bottom-right
    await editor.locator('[data-pane="button"]').click()
    await editor.locator('#sd-button-position').selectOption('top-left')
    assert.deepEqual(await dirOptions(),['down-right'])
    await editor.locator('[data-pane="menu"]').click()
    await editor.locator('#sd-menu-shape').selectOption('semi-circle')
    assert.deepEqual(await dirOptions(),['down','right'])
    await editor.locator('#sd-menu-shape').selectOption('circle')
    assert.equal(await editor.locator('#sd-menu-direction').isVisible(),false)
    await editor.locator('#sd-menu-shape').selectOption('linear')
    await editor.locator('[data-pane="button"]').click()
    await editor.locator('#sd-button-position').selectOption('bottom-right')
    // Colour picker writes into the hex field and the field drives the picker.
    await editor.locator('#sd-button-background').locator('xpath=following-sibling::input[@type="color"]').evaluate(el=>{el.value='#ff0000';el.dispatchEvent(new Event('input',{bubbles:true}))})
    assert.equal(await editor.locator('#sd-button-background').inputValue(),'#ff0000')
    await editor.locator('#sd-button-background').fill('#00ff00')
    assert.equal(await editor.locator('#sd-button-background').locator('xpath=following-sibling::input[@type="color"]').inputValue(),'#00ff00')
    await editor.locator('#sd-button-background').locator('xpath=following-sibling::button').click()
    assert.equal(await editor.locator('#sd-button-background').inputValue(),'')
    await editor.locator('[data-pane="actions"]').click()
    assert.equal(await editor.locator('.sd-action').first().locator('input[type=color]').count()>=2,true)
    // Number reset buttons, collapsible and duplicable actions.
    await editor.locator('[data-pane="button"]').click()
    const sizeReset=editor.locator('#sd-button-size').locator('xpath=following-sibling::button[contains(@class,"sd-reset")]')
    assert.equal(await sizeReset.isVisible(),false)
    await editor.locator('#sd-button-size').fill('70')
    assert.equal(await sizeReset.isVisible(),true)
    await sizeReset.click()
    assert.equal(await editor.locator('#sd-button-size').inputValue(),'56')
    assert.equal(await sizeReset.isVisible(),false)
    await editor.locator('#sd-button-position').selectOption('center')
    assert.equal(await editor.locator('#sd-button-offsetX').isVisible(),false)
    await editor.locator('#sd-button-position').selectOption('bottom-right')
    await editor.locator('[data-pane="actions"]').click()
    const before=await editor.locator('.sd-action').count()
    await editor.locator('.sd-action').first().locator('.sd-copy').click()
    assert.equal(await editor.locator('.sd-action').count(),before+1)
    const copyId=await editor.locator('.sd-action').nth(1).locator('[data-action-key="id"]').inputValue()
    assert.match(copyId,/-copy$/)
    assert.equal(await editor.locator('.sd-action').nth(1).locator('[data-action-key="label"]').inputValue(),'Editor action')
    await editor.locator('.sd-action').nth(1).locator('.sd-copy').click()
    assert.match(await editor.locator('.sd-action').nth(2).locator('[data-action-key="id"]').inputValue(),/-copy-2$/)
    assert.equal(await editor.locator('#node-dialog-ok').isDisabled(),false)
    await editor.locator('.sd-action').first().locator('.sd-toggle').click()
    assert.equal(await editor.locator('.sd-action').first().locator('.sd-action-grid').isVisible(),false)
    await editor.locator('#sd-expand-all').click()
    assert.equal(await editor.locator('.sd-action').first().locator('.sd-action-grid').isVisible(),true)
    await editor.locator('#sd-collapse-all').click()
    assert.equal(await editor.locator('.sd-action-grid:visible').count(),0)
    await editor.locator('#sd-expand-all').click()
    for (const i of [2,1]) await editor.locator('#node-input-actions-list li').nth(i).locator('.red-ui-editableList-item-remove').click()
    await waitFor(async()=> (await editor.locator('.sd-action').count())===before,'duplicates were not removed')
    await editor.locator('#node-dialog-ok').click()
    const saved = await editor.evaluate(()=>RED.nodes.node('sd-test-dial').actions)
    assert.equal(saved[0].label,'Editor action');assert.equal(saved[0].payloadType,'json')
    await editor.locator('#red-ui-header-button-deploy').click()
    await waitFor(async()=>{
      const res=await fetch('http://127.0.0.1:1885/flows');const data=await res.json();return (Array.isArray(data)?data:data.flows).find(n=>n.id==='sd-test-dial')?.actions?.[0]?.label==='Editor action'
    },'editor deploy was not saved')
    await waitFor(async()=> (await dialA.locator('[data-action="first"]').getAttribute('aria-label'))==='Editor action','deployed action not present')
    record('editor schema, typedInput JSON, conditional fields, Save and Deploy')

    await dialA.locator('.ff-speed-dial-trigger').click()
    await dialA.getByRole('menuitem',{name:'Editor action',exact:true}).click()
    await waitFor(async()=> (await outputs()).some(msg=>msg.payload?.from==='editor'),'editor payload output missing')
    await editor.waitForFunction(()=>window.__debugMessages.some(msg=>msg.name==='speed dial output' || String(msg.msg||'').includes('editor')))
    assert.equal(await dialA.locator('.ff-speed-dial-overlay').count(),0)
    record('click yields typed server payload exactly once and reaches the actual Debug node')

    const baseline = (await outputs()).length
    await update({payload:{actions:[
      {id:'one',label:'One',icon:'pi-check',payload:{number:1},topic:'test'},
      {id:'off',label:'Disabled',icon:'pi-ban',payload:false,enabled:false},
      {id:'hidden',label:'Hidden',payload:null,visible:false},
      {id:'null',label:'Null action',icon:'pi-star',payload:null}
    ],menu:{mode:'menu',closeOnSelect:false,overlay:true,direction:'up'},theme:{mode:'dark'}}})
    await waitFor(async()=> (await dialA.getAttribute('data-mode'))==='menu' && (await dialB.getAttribute('data-mode'))==='menu','shared browser update failed')
    await dialA.locator('.ff-speed-dial-trigger').click()
    await dialA.getByRole('menuitem',{name:'One',exact:true}).click()
    await waitFor(async()=> (await outputs()).length===baseline+1,'action did not output once')
    assert.equal(await dialA.locator('.ff-speed-dial-overlay').count(),1)
    assert.equal(await dialA.getByRole('menuitem',{name:'Disabled',exact:true}).isDisabled(),true)
    assert.equal(await dialA.locator('[data-action="hidden"]').count(),0)
    await dialA.getByRole('menuitem',{name:'Null action',exact:true}).click()
    await waitFor(async()=> (await outputs()).length===baseline+2,'null action output missing')
    assert.equal((await outputs()).at(-1).payload,null)
    await dialA.locator('.ff-speed-dial-trigger').focus();await a.keyboard.press('Escape')
    assert.equal(await dialA.locator('.ff-speed-dial-trigger').getAttribute('aria-expanded'),'false')
    await dialA.locator('.ff-speed-dial-trigger').focus();await a.keyboard.press('ArrowDown')
    await a.waitForFunction(()=>document.activeElement?.dataset.action==='one')
    await a.keyboard.press('End');await a.waitForFunction(()=>document.activeElement?.dataset.action==='null')
    await a.keyboard.press('Home');await a.waitForFunction(()=>document.activeElement?.dataset.action==='one')
    await a.keyboard.press('Enter');await waitFor(async()=> (await outputs()).length===baseline+3,'keyboard click output missing')
    await a.keyboard.press('Escape')
    assert.equal(await dialA.locator('.ff-speed-dial-trigger').evaluate(el=>el===document.activeElement),true)
    await dialA.locator('.ff-speed-dial-trigger').click();await a.mouse.click(640,400)
    assert.equal(await dialA.locator('.ff-speed-dial-trigger').getAttribute('aria-expanded'),'false')
    assert.deepEqual(await ordinary.evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color,font:getComputedStyle(el).fontFamily})),ordinaryStyle)
    record('labelled menu, null payload, disabled/hidden actions, keep-open, outside/Escape, keyboard focus; other widget styles unchanged')

    // Learn the actual client metadata from a server-produced click, then target that browser.
    const target = (await outputs()).at(-1)._client
    await update({_client:target,payload:{actions:[{id:'private',label:'Private A',icon:'pi-lock',payload:'private'}],button:{label:'Private'}}})
    await waitFor(async()=> (await dialA.locator('[data-action="private"]').count())===1,'browser targeting failed')
    assert.equal(await dialB.locator('[data-action="private"]').count(),0)
    await update({payload:{button:{label:'Shared'}}})
    await waitFor(async()=> (await dialA.locator('[data-action="one"]').count())===1,'shared did not replace targeted snapshot')
    await a.reload();await a.locator('.ff-speed-dial[data-widget="sd-test-dial"] .ff-speed-dial-trigger').waitFor()
    await waitFor(async()=> (await dialA.locator('[data-action="one"]').count())===1,'reload did not restore shared snapshot')
    record('two browser clients, exclusive targeted update, broadcast clears overrides, reload restores shared snapshot')

    // Navigate through the Dashboard router (same browser/socket), not a hard reload.
    await dialA.locator('.ff-speed-dial-trigger').click()
    const routeLink = a.locator('a[href="/dashboard/second"]')
    const inView = async()=>routeLink.evaluate(el=>{const r=el.getBoundingClientRect();return r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight});
    if (!(await inView())) { const menuButton=a.getByRole('button',{name:/navigation|menu/i}).first();if(await menuButton.count())await menuButton.click() }
    await routeLink.evaluate(el=>el.click())
    await a.waitForURL('**/dashboard/second')
    await a.waitForFunction(()=>document.querySelectorAll('.ff-speed-dial').length===1)
    assert.equal(await a.locator('.ff-speed-dial-overlay').count(),0)
    await a.locator('a[href="/dashboard/first"]').evaluate(el=>el.click());await a.waitForURL('**/dashboard/first')
    await a.waitForFunction(()=>document.querySelectorAll('.ff-speed-dial').length===3)
    record('router page changes preserve a single global widget and remove page widgets/overlays without duplication')

    await a.setViewportSize({width:360,height:640})
    await a.emulateMedia({reducedMotion:'reduce'})
    await update({payload:{button:{label:'',position:'top-left',offsetX:4,offsetY:4},menu:{mode:'speed-dial',direction:'up',showLabels:true,closeOnSelect:true,overlay:false,duration:900},actions:Array.from({length:20},(_,i)=>({id:'mobile-'+i,label:'Mobile action '+i,icon:'pi-star',payload:i}))}})
    await waitFor(async()=> (await dialA.locator('[data-action="mobile-0"]').count())===1,'mobile update missing')
    await dialA.locator('.ff-speed-dial-trigger').click()
    await a.waitForFunction(()=>{
      const list=document.querySelector('[data-widget="sd-test-dial"] .ff-speed-dial-list');const r=list.getBoundingClientRect();return r.left>=7 && r.right<=innerWidth-7 && r.top>=7 && r.bottom<=innerHeight-7
    })
    assert.equal(await dialA.locator('.ff-speed-dial-list').evaluate(el=>getComputedStyle(el).transitionDuration),'0s')
    assert.equal(await dialA.getAttribute('data-direction'),'down')
    await dialA.locator('[data-action="mobile-19"]').scrollIntoViewIfNeeded();await dialA.locator('[data-action="mobile-19"]').click()
    await waitFor(async()=> (await outputs()).at(-1)?.payload===19,'mobile scrolled action output failed')
    await a.screenshot({path:'test-results/mobile.png',fullPage:true})
    record('360px mobile viewport, edge direction fallback, scrollable long action list, reduced motion')

    // Circle shapes: every item must sit on the radius around the trigger centre and stay on screen.
    const geometry = async () => dialA.evaluate(root=>{
      const t=root.querySelector('.ff-speed-dial-trigger').getBoundingClientRect();const c=[t.left+t.width/2,t.top+t.height/2]
      return [...root.querySelectorAll('.ff-speed-dial-action')].map(el=>{const r=el.getBoundingClientRect();return {d:Math.hypot(r.left+r.width/2-c[0],r.top+r.height/2-c[1]),x:r.left+r.width/2-c[0],y:r.top+r.height/2-c[1],inside:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}})
    })
    const shapes = [
      ['quarter-circle','down-right','top-left',24,24,(g)=>g.every(i=>i.x>=-1&&i.y>=-1)],
      ['semi-circle','down','top-left',120,24,(g)=>g.every(i=>i.y>=-1)],
      ['semi-circle','right','top-left',24,120,(g)=>g.every(i=>i.x>=-1)]
    ]
    for (const [shape,direction,position,ox,oy,check] of shapes) {
      await update({payload:{button:{position,offsetX:ox,offsetY:oy,size:40},menu:{shape,direction,radius:90,showLabels:false,duration:0},actions:Array.from({length:4},(_,i)=>({id:'r'+i,label:'R'+i,icon:'pi-star',payload:i}))}})
      await waitFor(async()=> (await dialA.locator('[data-action="r3"]').count())===1,'shape update missing')
      await dialA.locator('.ff-speed-dial-trigger').click()
      await waitFor(async()=> (await geometry()).length===4 && (await geometry()).every(i=>Math.abs(i.d-90)<2),shape+' '+direction+' radius mismatch '+JSON.stringify(await geometry()))
      const g=await geometry();assert.ok(g.every(i=>i.inside),shape+' item outside viewport');assert.ok(check(g),shape+' '+direction+' wrong side '+JSON.stringify(g))
      await dialA.locator('.ff-speed-dial-trigger').click()
    }
    await update({payload:{button:{position:'bottom-right',offsetX:4,offsetY:4,size:11},menu:{shape:'circle'}}})
    await dialA.locator('.ff-speed-dial-trigger').click()
    await waitFor(async()=> (await geometry()).every(i=>i.inside),'circle was not shifted into view')
    {const box=await dialA.locator('.ff-speed-dial-trigger').boundingBox();assert.ok(Math.abs(box.width-11)<1&&Math.abs(box.height-11)<1,'11px button is '+box.width+'x'+box.height)}
    await a.keyboard.press('Escape')
    await update({payload:{button:{position:'center',size:40},menu:{shape:'circle',radius:80}}})
    await waitFor(async()=> (await dialA.locator('.ff-speed-dial-trigger').boundingBox()).width===40,'center update missing')
    {const box=await dialA.locator('.ff-speed-dial-trigger').boundingBox();const vp=a.viewportSize()
     assert.ok(Math.abs(box.x+box.width/2-vp.width/2)<2&&Math.abs(box.y+box.height/2-vp.height/2)<2,'button not centred '+JSON.stringify(box))}
    await dialA.locator('.ff-speed-dial-trigger').click()
    await waitFor(async()=> (await geometry()).length===4 && (await geometry()).every(i=>Math.abs(i.d-80)<2&&i.inside),'centred circle wrong '+JSON.stringify(await geometry()))
    await a.keyboard.press('Escape')
    record('quarter/semi/circle shapes: radius, side, on-screen shift, 11px button')

    await update({payload:{button:{visible:false}}});await dialA.waitFor({state:'hidden'})
    await update({command:'reset'});await dialA.waitFor()
    await a.screenshot({path:'test-results/dashboard.png',fullPage:true})
    const currentCount = (await outputs()).length
    const flows = harness.flows.filter(node=>node.id!=='sd-test-dial')
    const deployed=await fetch('http://127.0.0.1:1885/flows',{method:'POST',headers:{'Content-Type':'application/json','Node-RED-Deployment-Type':'full'},body:JSON.stringify(flows)})
    assert.equal(deployed.status,204)
    await a.waitForFunction(()=>!document.querySelector('[data-widget="sd-test-dial"]'))
    assert.equal(await a.locator('.ff-speed-dial-overlay').count(),0)
    assert.equal((await outputs()).length,currentCount) // Deleting the widget by Deploy must not emit any output.
    assert.ok(currentCount>0)
    record('visibility/reset and deleting widget by Deploy clean up teleports/overlays')
    assert.deepEqual(errors,[])
    assert.deepEqual(remoteRequests,[])
    assert.doesNotMatch(harness.getLog(),/TypeError|Unhandled|MaxListenersExceeded|Invalid configuration/)
    record('no relevant browser/runtime errors and no external runtime resource requests')
  } finally {
    await browser?.close();await harness.stop()
    fs.writeFileSync('test-results/browser-report.json',JSON.stringify({passed:report,errors,remoteRequests},null,2))
  }
}
main().catch(error=>{console.error(error);process.exitCode=1})
