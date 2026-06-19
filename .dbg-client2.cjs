const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER||'orbita'}:${process.env.ADMIN_PASS||'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport:{width:1280,height:1500}, deviceScaleFactor:1.2, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/admin/clientes', { waitUntil:'domcontentloaded', timeout:60000 });
  await page.waitForTimeout(3000);
  const href = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a')].find(x => /\/admin\/clientes\/[a-z0-9]{8,}/.test(x.getAttribute('href')||''));
    return a ? a.getAttribute('href') : null;
  });
  if (href) { await page.goto('http://localhost:3000'+href, { waitUntil:'domcontentloaded', timeout:60000 }); await page.waitForTimeout(5000); await page.screenshot({ path: '.codex-captures/dbg-client-fitxa.png', fullPage: true }); console.log('ok', href); }
  else console.log('no href');
  await browser.close();
})();
