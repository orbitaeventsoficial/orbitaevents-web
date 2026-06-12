const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 2, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/admin/leads/cmpwudznj00g3vigky4altclu', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  const el = await page.$('.fxd__zenith-footer');
  if (el) await el.screenshot({ path: '.codex-captures/lead-foot-zoom.png' });
  console.log(el ? 'OK footer' : 'NO footer');
  await browser.close();
})();
