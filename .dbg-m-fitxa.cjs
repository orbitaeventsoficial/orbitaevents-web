const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER||'orbita'}:${process.env.ADMIN_PASS||'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  for (const url of ['bookings/cmn3m5vfd002il4j1u2cbx00g','leads/cmpwudznj00g3vigky4altclu']) {
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000/admin/' + url, { waitUntil:'domcontentloaded', timeout:60000 });
    await page.waitForTimeout(4500);
    const ov = await page.evaluate(() => { const de=document.documentElement; return de.scrollWidth > de.clientWidth+2; });
    await page.screenshot({ path: `.codex-captures/dbg-m-fitxa-${url.split('/')[0]}.png` });
    console.log(`${ov?'⚠ OVERFLOW':'ok'} ${url.split('/')[0]}`); await page.close();
  }
  await browser.close();
})();
