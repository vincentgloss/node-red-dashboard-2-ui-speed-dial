// Editor and help texts in English and German, using the real Node-RED editor in Chrome.
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const { start } = require('./harness.cjs')

async function main () {
  const harness = await start('i18n')
  let browser
  const errors = []
  try {
    browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
    for (const [locale, expected] of [['en-US', { menu: 'Menu', actions: 'Actions', size: 'Size', help: 'Adds a floating PrimeVue action button', min: 'at least' }],
      ['de-DE', { menu: 'Menü', actions: 'Aktionen', size: 'Größe', help: 'Fügt einer Dashboard-Gruppe', min: 'mindestens' }]]) {
      const context = await browser.newContext({ locale, extraHTTPHeaders: { 'Accept-Language': locale } })
      const page = await context.newPage()
      page.on('pageerror', e => errors.push(e.message))
      await page.goto('http://127.0.0.1:1885/')
      await page.waitForFunction(() => window.RED?.nodes?.node('sd-test-dial'))
      await page.waitForTimeout(500)
      const decline = page.getByRole('button', { name: 'No, do not enable notifications', exact: true })
      if (await decline.count()) await decline.click()
      await page.evaluate(() => RED.editor.edit(RED.nodes.node('sd-test-dial')))
      await page.locator('#sd-schema-warning').waitFor({ state: 'hidden' })
      assert.equal((await page.locator('[data-pane="menu"]').innerText()).trim(), expected.menu, locale + ' tab label')
      assert.equal((await page.locator('[data-pane="actions"]').innerText()).trim(), expected.actions)
      await page.locator('[data-pane="button"]').click()
      assert.equal((await page.locator('[data-schema-key="size"] label').innerText()).trim(), expected.size)
      await page.locator('#sd-button-size').fill('5')
      await page.waitForFunction(() => document.querySelector('#node-dialog-ok').disabled)
      assert.match(await page.locator('#sd-validation-error').innerText(), new RegExp(expected.min), locale + ' validation message')
      assert.equal((await page.locator('[data-sd-i18n="fieldHelp"]').first().innerText()).trim().length > 0, true)
      assert.equal(await page.locator('[data-sd-i18n]:empty').count(), 0, 'untranslated element in ' + locale)
      await page.locator('#node-dialog-cancel').click()
      // The node help (sidebar) comes from nodes/locales/<lang>/ui-speed-dial.html.
      const help = await page.evaluate(async () => {
        const res = await fetch('nodes/node-red-dashboard-2-ui-speed-dial/ui-speed-dial', { headers: { Accept: 'text/html' } })
        return res.text()
      })
      assert.ok(help.includes(expected.help), locale + ' help text missing: ' + help.slice(0, 200))
      console.log('PASS editor and help language', locale)
      await context.close()
    }
    assert.deepEqual(errors, [])
  } finally {
    await browser?.close()
    await harness.stop()
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
