const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  fs.mkdirSync('.codex-captures', { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1500 }, deviceScaleFactor: 1.2, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const targets = (process.argv[2] || 'reporting,sales-ops,analytics').split(',');
  for (const t of targets) {
    const page = await ctx.newPage();
    try {
      await page.goto('http://localhost:3000/admin/' + t, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2200);
      await page.screenshot({ path: `.codex-captures/dbg-${t.replace(/\//g,'_')}.png`, fullPage: true });
      console.log('ok', t);
    } catch (e) { console.log('ERR', t, String(e).slice(0,80)); }
    await page.close();
  }
  await browser.close();
})();
