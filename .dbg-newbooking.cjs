const { chromium } = require('playwright');
(async () => {
  const USER = process.env.ADMIN_USER || 'orbita';
  const PASS = process.env.ADMIN_PASS || 'Orbitaevents040120+++';
  const token = Buffer.from(`${USER}:${PASS}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1600 },
    deviceScaleFactor: 1,
    extraHTTPHeaders: { Authorization: `Basic ${token}` },
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await page.goto('http://localhost:3000/admin/bookings/new?leadId=cmpwudznj00g3vigky4altclu', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: '.codex-captures/newbooking-cristina.png', fullPage: true });
  console.log('OK newbooking');
  await browser.close();
})();
