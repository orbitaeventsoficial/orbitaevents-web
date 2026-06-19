const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER||'orbita'}:${process.env.ADMIN_PASS||'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  for (const t of (process.argv[2]||'').split(',')) {
    const page = await ctx.newPage();
    try {
      await page.goto('http://localhost:3000/admin/' + t, { waitUntil:'domcontentloaded', timeout:60000 });
      await page.waitForTimeout(4000);
      // detecta overflow horitzontal
      const overflow = await page.evaluate(() => {
        const de = document.documentElement;
        return { scrollW: de.scrollWidth, clientW: de.clientWidth, overflows: de.scrollWidth > de.clientWidth + 2 };
      });
      await page.screenshot({ path: `.codex-captures/dbg-m-${t.replace(/\//g,'_')}.png`, fullPage: true });
      console.log(`${overflow.overflows?'⚠ OVERFLOW':'ok'} ${t} (scroll ${overflow.scrollW} vs ${overflow.clientW})`);
    } catch (e) { console.log('ERR', t, String(e).slice(0,50)); }
    await page.close();
  }
  await browser.close();
})();
