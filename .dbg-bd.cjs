const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER||'orbita'}:${process.env.ADMIN_PASS||'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/admin/bookings/cmn3m5vfd002il4j1u2cbx00g', { waitUntil:'domcontentloaded', timeout:60000 });
  await page.waitForTimeout(5000);
  const r = await page.evaluate(() => {
    const el = document.querySelector('.bd__root');
    if (!el) return 'NO bd__root';
    const cs = getComputedStyle(el);
    const inline = cs.getPropertyValue('background-color');
    const axc = cs.getPropertyValue('--ax-canvas').trim();
    const oac = cs.getPropertyValue('--o-admin-canvas').trim();
    // quin element té el fons negre? puja per ancestres
    let chain = [];
    let n = el;
    for (let i=0;i<5 && n;i++){ chain.push(`${n.tagName}.${(n.className||'').toString().slice(0,25)}=${getComputedStyle(n).backgroundColor}`); n = n.parentElement; }
    return { bdBg: inline, axCanvas: axc, oAdminCanvas: oac, chain };
  });
  console.log(JSON.stringify(r,null,2));
  await browser.close();
})();
