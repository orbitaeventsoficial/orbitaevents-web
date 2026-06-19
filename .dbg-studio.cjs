const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER||'orbita'}:${process.env.ADMIN_PASS||'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1400 }, deviceScaleFactor: 1.2, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/admin/studio', { waitUntil:'domcontentloaded', timeout:60000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '.codex-captures/dbg-studio.png', fullPage: false });
  console.log('ok'); await browser.close();
})();
