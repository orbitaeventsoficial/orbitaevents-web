const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  for (const v of [{n:'900',h:900},{n:'768',h:768}]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: v.h }, deviceScaleFactor: 1, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000/admin/leads/cmpwudznj00g3vigky4altclu', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);
    const r = await page.evaluate(() => {
      const h = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : 0; };
      const sum = h('.ap-detail-bar') + h('.fxd__hd') + h('.fxd__zenith') + h('.fxd__zenith-footer');
      return { bar: h('.ap-detail-bar'), header: h('.fxd__hd'), zenith: h('.fxd__zenith'), footer: h('.fxd__zenith-footer'), sum, win: window.innerHeight };
    });
    console.log(`[${v.n}] barra=${r.bar} header=${r.header} zenith=${r.zenith} footer=${r.footer} | suma=${r.sum} vs win=${r.win} → folgança=${r.win - r.sum}px`);
    await ctx.close();
  }
  await browser.close();
})();
