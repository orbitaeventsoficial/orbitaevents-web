const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER||'orbita'}:${process.env.ADMIN_PASS||'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  for (const t of (process.argv[2]||'').split(',')) {
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000/admin/' + t, { waitUntil:'domcontentloaded', timeout:60000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `.codex-captures/dbg-mv-${t.replace(/\//g,'_')}.png` });
    console.log('ok', t); await page.close();
  }
  await browser.close();
})();
