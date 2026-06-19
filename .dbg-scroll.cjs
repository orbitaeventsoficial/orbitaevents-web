const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  for (const v of [{n:'1080p',w:1920,h:1080},{n:'1440x900',w:1440,h:900},{n:'768',w:1366,h:768}]) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000/admin/leads/cmpwudznj00g3vigky4altclu', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);
    const r = await page.evaluate(() => {
      const sel = ['.fxd__fullpage', '.fxd__zenith', '.fxd__rail--left', '.fxd__zenith-main', '.nb__cfg-bolo', '.nb__cfg-cat'];
      const out = {};
      for (const s of sel) {
        const el = document.querySelector(s);
        if (el) out[s] = el.scrollHeight > el.clientHeight + 1 ? `SCROLL (+${el.scrollHeight - el.clientHeight}px)` : 'ok';
      }
      out['_page'] = document.documentElement.scrollHeight > window.innerHeight + 1 ? 'PAGE SCROLL' : 'ok';
      return out;
    });
    console.log(`\n[${v.n} ${v.w}x${v.h}]`);
    for (const [k, val] of Object.entries(r)) console.log(`  ${val === 'ok' ? '·' : '⚠'} ${k}: ${val}`);
    await ctx.close();
  }
  await browser.close();
})();
