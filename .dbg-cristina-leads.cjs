const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  fs.mkdirSync('.codex-captures', { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1600 }, deviceScaleFactor: 1.25, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  const resp = await page.goto('http://localhost:3000/admin/leads/cmpwudznj00g3vigky4altclu', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('status', resp && resp.status());
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '.codex-captures/dbg-cristina-leads.png', fullPage: true });
  console.log('captured; pageerrors=', errs.length);
  await browser.close();
})();
