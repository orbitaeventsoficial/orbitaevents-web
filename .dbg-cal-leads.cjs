const { chromium } = require('playwright');
(async () => {
  const USER = process.env.ADMIN_USER || 'orbita';
  const PASS = process.env.ADMIN_PASS || 'Orbitaevents040120+++';
  const token = Buffer.from(`${USER}:${PASS}`).toString('base64');
  const browser = await chromium.launch();
  const shot = async (page, name) => {
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `.codex-captures/cal-leads-${name}.png`, fullPage: true });
    console.log('OK', name);
  };

  // Desktop
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    extraHTTPHeaders: { Authorization: `Basic ${token}` },
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await page.goto('http://localhost:3000/admin/leads', { waitUntil: 'networkidle', timeout: 60000 });
  await shot(page, 'desktop');
  await ctx.close();

  // Mobile
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    extraHTTPHeaders: { Authorization: `Basic ${token}` },
  });
  const mpage = await mctx.newPage();
  mpage.on('pageerror', (e) => console.log('PAGEERR-M', e.message));
  await mpage.goto('http://localhost:3000/admin/leads', { waitUntil: 'networkidle', timeout: 60000 });
  await shot(mpage, 'mobile');
  await mctx.close();

  await browser.close();
  console.log('ALL DONE');
})();
