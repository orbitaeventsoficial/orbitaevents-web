const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const url = 'http://localhost:3000/admin/leads/cmpwudznj00g3vigky4altclu';
  const views = [
    { name: 'desktop', width: 1440, height: 1400 },
    { name: 'tablet', width: 820, height: 1180 },
    { name: 'mobile', width: 390, height: 1600 },
  ];
  for (const v of views) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log(`PAGEERR[${v.name}]`, e.message));
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);
    const footer = await page.$('.fxd__zenith-footer');
    const hasFooter = !!footer;
    const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    await page.screenshot({ path: `.codex-captures/lead-zenit-footer-${v.name}.png`, fullPage: true });
    console.log(`${v.name}: footer=${hasFooter} scrollW=${overflow.sw} clientW=${overflow.cw} overflow=${overflow.sw > overflow.cw}`);
    await ctx.close();
  }
  await browser.close();
})();
