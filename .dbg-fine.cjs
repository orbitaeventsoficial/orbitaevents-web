const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  for (const v of [{n:'1080p',w:1920,h:1080},{n:'1440x900',w:1440,h:900},{n:'768',w:1366,h:768},{n:'1536x864',w:1536,h:864}]) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000/admin/leads/cmpwudznj00g3vigky4altclu', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);
    const m = await page.evaluate(() => {
      const de = document.documentElement;
      return { sh: de.scrollHeight, ch: de.clientHeight, ih: window.innerHeight, canScroll: de.scrollHeight > de.clientHeight };
    });
    console.log(`[${v.n}] scrollH=${m.sh} clientH=${m.ch} innerH=${m.ih} → ${m.canScroll ? 'SCROLL (+' + (m.sh - m.ch) + 'px)' : 'sense scroll'}`);
    await ctx.close();
  }
  await browser.close();
})();
