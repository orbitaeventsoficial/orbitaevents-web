const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1500 }, deviceScaleFactor: 1.2, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/admin/economia', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
  for (const label of ['Cobraments','Rendibilitat','Tresoreria','Configuració']) {
    try {
      await page.getByRole('tab', { name: new RegExp(label, 'i') }).click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `.codex-captures/dbg-eco-${label.toLowerCase().replace(/[^a-z]/g,'')}.png`, fullPage: true });
      console.log('ok', label);
    } catch (e) { console.log('ERR', label, String(e).slice(0,60)); }
  }
  await browser.close();
})();
