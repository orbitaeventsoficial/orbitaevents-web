const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER||'orbita'}:${process.env.ADMIN_PASS||'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/admin/presupuestos', { waitUntil:'domcontentloaded', timeout:60000 });
  await page.waitForTimeout(4000);
  const r = await page.evaluate(() => {
    const out = [];
    const els = [...document.querySelectorAll('section, .ap-card, [class*="card"], table, thead, tr, [class*="kpi"], [class*="ap-"]')].slice(0,18);
    for (const el of els) {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)') out.push(`${el.tagName}.${(el.className||'').toString().slice(0,30)} → ${bg}`);
    }
    return out;
  });
  console.log(r.join('\n'));
  await browser.close();
})();
