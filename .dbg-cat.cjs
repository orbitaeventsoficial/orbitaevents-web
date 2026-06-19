const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  fs.mkdirSync('.codex-captures', { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 1400 },
    deviceScaleFactor: 1.5,
    extraHTTPHeaders: { Authorization: `Basic ${token}` },
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/admin/studio#sec-fitxes-tipus', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#sec-fitxes-tipus', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const sec = await page.$('#sec-fitxes-tipus');
  if (sec) { await sec.scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await sec.screenshot({ path: '.codex-captures/dbg-studio-20.png' }); }
  console.log('found', !!sec);
  await browser.close();
})();
