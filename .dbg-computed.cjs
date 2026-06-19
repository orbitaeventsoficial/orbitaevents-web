const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER||'orbita'}:${process.env.ADMIN_PASS||'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/admin/bookings/cmn3m5vfd002il4j1u2cbx00g', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  const data = await page.evaluate(() => {
    const out = [];
    // tokens clau
    const rs = getComputedStyle(document.documentElement);
    for (const t of ['--o-admin-elevated','--o-admin-panel','--o-admin-raised','--ax-elevated','--ax-fill-2','--ax-info-bg','--ax-panel']) {
      out.push(`TOKEN ${t} = ${rs.getPropertyValue(t).trim()}`);
    }
    // backgrounds reals de cards grans
    const els = [...document.querySelectorAll('section, .ap-card, [class*="card"], [class*="panel"], [class*="bd__"]')].slice(0, 12);
    for (const el of els) {
      const c = getComputedStyle(el).backgroundColor;
      if (c && c !== 'rgba(0, 0, 0, 0)') out.push(`${el.className.toString().slice(0,40)} → ${c}`);
    }
    return out;
  });
  console.log(data.join('\n'));
  await browser.close();
})();
