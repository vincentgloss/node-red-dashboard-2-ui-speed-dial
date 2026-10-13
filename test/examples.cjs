// Deploys examples/speed-dial-input-reference.json into the isolated test runtime and triggers its inject nodes.
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const { start, waitFor } = require('./harness.cjs')
const flow = require('../examples/speed-dial-input-reference.json')

async function main () {
  const harness = await start('examples', flow)
  let browser
  const errors = []
  try {
    browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
    const page = await (await browser.newContext({ viewport: { width: 1000, height: 800 } })).newPage()
    page.on('pageerror', e => errors.push(e.message))
    page.on('response', r => { if (r.status() >= 400 && !/favicon\.svg$/.test(r.url())) errors.push(r.status() + ' ' + r.url()) })
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()) })
    await page.goto('http://127.0.0.1:1885/speed-dial-reference/reference')
    const dial = page.locator('.ff-speed-dial')
    await dial.waitFor({ timeout: 8000 }).catch(async e => { console.log(harness.getLog().slice(-300)); console.log(await page.locator('body').innerText()); throw e })
    const inject = async name => {
      const node = flow.find(n => n.type === 'inject' && n.name === name)
      assert.ok(node, 'missing inject ' + name)
      const res = await fetch('http://127.0.0.1:1885/inject/' + node.id, { method: 'POST' })
      assert.equal(res.status, 200, name)
    }
    const items = () => dial.locator('.ff-speed-dial-action').count()
    await waitFor(async () => (await items()) === 3, 'initial actions missing')

    await inject('Preset: full circle in the center')
    await waitFor(async () => (await items()) === 6 && (await dial.getAttribute('data-shape')) === 'circle', 'circle preset not applied ' + (await items()) + ' ' + (await dial.getAttribute('data-shape')) + harness.getLog().slice(-600))
    const box = await dial.locator('.ff-speed-dial-trigger').boundingBox()
    assert.ok(Math.abs(box.x + box.width / 2 - 500) < 2 && Math.abs(box.y + box.height / 2 - 400) < 2, 'circle button is not centered')

    await inject('All payload types')
    await waitFor(async () => (await items()) === 9, 'payload types not applied')
    await inject('invalid: duplicate action ids')
    await inject('invalid: shape/direction mismatch')
    await waitFor(async () => /Duplicate action id: dup/.test(harness.getLog()) && /not valid for shape/.test(harness.getLog()), 'warnings missing')
    assert.equal(await items(), 9, 'an invalid message changed the dial')

    await inject('reset to editor configuration')
    await waitFor(async () => (await items()) === 3 && (await dial.getAttribute('data-shape')) === 'linear', 'reset not applied')
    await inject('patch: label, icon, tooltip')
    await waitFor(async () => (await dial.locator('[data-action="two"]').getAttribute('aria-label')) === 'Second (patched)', 'patch not applied')
    await inject('remove: one action')
    await waitFor(async () => (await items()) === 2, 'remove not applied')
    await inject('Empty list (removes all)')
    await waitFor(async () => (await items()) === 0, 'empty list not applied')
    await inject('reset to editor configuration')
    await waitFor(async () => (await items()) === 3, 'second reset not applied')

    // Targeting: click once so the flow learns the client, then change only this tab.
    await dial.locator('.ff-speed-dial-trigger').click()
    await dial.locator('[data-action="one"]').click()
    await waitFor(async () => /socketId/.test(JSON.stringify(await (await fetch('http://127.0.0.1:1885/context/flow/' + flow[0].id)).json())), 'client was not remembered ' + JSON.stringify(await (await fetch('http://127.0.0.1:1885/context/flow/' + flow[0].id)).json()))
    const other = await (await browser.newContext()).newPage()
    await other.goto('http://127.0.0.1:1885/speed-dial-reference/reference')
    await other.locator('.ff-speed-dial').waitFor()
    await inject('target: this browser tab (socketId)')
    await waitFor(async () => (await dial.locator('[data-action="only-me"]').count()) === 1, 'targeted update missing')
    assert.equal(await other.locator('[data-action="only-me"]').count(), 0, 'targeted update leaked to another client')
    await inject('broadcast: update everybody')
    await waitFor(async () => (await dial.locator('[data-action="only-me"]').count()) === 0 && (await dial.locator('[data-action="one"]').count()) === 1, 'broadcast did not clear the override')

    assert.deepEqual(errors, [])
    assert.doesNotMatch(harness.getLog(), /TypeError|Unhandled|Invalid configuration|Error: /)
    console.log('PASS reference flow: deploys, reference flow deployed, replace/patch/remove/reset, invalid messages rejected, targeting')
  } finally {
    await browser?.close()
    await harness.stop()
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
