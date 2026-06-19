const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER||'orbita'}:${process.env.ADMIN_PASS||'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1500 }, deviceScaleFactor: 1.2, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  const resp = await page.goto('http://localhost:3000/admin/presupuestos', { waitUntil:'domcontentloaded', timeout:60000 });
  console.log('status', resp&&resp.status());
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '.codex-captures/dbg-presupuestos.png', fullPage: true });
  console.log('pageerrors', errs.length, errs.slice(0,2).join(' | '));
  await browser.close();
})();
