const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await page.goto('http://localhost:3000/admin/leads/cmpwudznj00g3vigky4altclu', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.evaluate(() => document.scrollingElement.scrollTo(0, 99999));
  await page.waitForTimeout(500);
  const state = await page.evaluate(() => {
    const head = [...document.querySelectorAll('.fxd__econohead span')].find((s) => s.textContent.includes('Economia del bolo'));
    if (!head) return { present: false };
    const sec = head.closest('.fxd__econo');
    return { present: true, html: sec.textContent.replace(/\s+/g, ' ').trim().slice(0, 160) };
  });
  console.log(JSON.stringify(state, null, 2));
  await page.screenshot({ path: '.codex-captures/bolo-economia-empty.png' });
  await browser.close();
})();
