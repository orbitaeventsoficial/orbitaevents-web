const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER||'orbita'}:${process.env.ADMIN_PASS||'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const url = 'http://localhost:3000/admin/leads/cmr1xh7la0000ug7dj4jnihjr';

  // Desktop full page
  const ctx1 = await browser.newContext({ viewport: { width: 1440, height: 1000 }, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const p1 = await ctx1.newPage();
  await p1.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p1.waitForTimeout(15000);
  await p1.screenshot({ path: 'D:/orbitaevents/.codex-captures/manolo-lead-desktop-full.png', fullPage: true });
  await ctx1.close();

  // Mobile 375
  const ctx2 = await browser.newContext({ viewport: { width: 375, height: 812 }, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const p2 = await ctx2.newPage();
  await p2.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p2.waitForTimeout(15000);
  await p2.screenshot({ path: 'D:/orbitaevents/.codex-captures/manolo-lead-mobile-full.png', fullPage: true });
  await ctx2.close();

  console.log('ok');
  await browser.close();
})();
