const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER||'orbita'}:${process.env.ADMIN_PASS||'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1400 }, deviceScaleFactor: 1.2, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  // primer client de la llista
  await page.goto('http://localhost:3000/admin/clientes', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  const firstRow = await page.$('a[href*="/admin/clientes/"]');
  if (firstRow) { await firstRow.click(); await page.waitForTimeout(4000); }
  await page.screenshot({ path: '.codex-captures/dbg-client-fitxa.png', fullPage: true });
  console.log('ok', page.url());
  await browser.close();
})();
