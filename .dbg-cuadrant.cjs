const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.5, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERR', e.message));
  page.on('response', (r) => { if (r.status() >= 500) console.log('HTTP', r.status(), r.url()); });
  // Cuadrant a 90 dies (l'event de Cristina és l'11 jul)
  await page.goto('http://localhost:3000/admin/cuadrant?days=90', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);
  await page.screenshot({ path: '.codex-captures/cuadrant.png', fullPage: true });
  // Repartiment del juliol
  await page.goto('http://localhost:3000/admin/cuadrant/repartiment?month=2026-07', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '.codex-captures/repartiment.png', fullPage: true });
  console.log('captures OK');
  await browser.close();
})();
