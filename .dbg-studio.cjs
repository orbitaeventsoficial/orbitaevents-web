const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  await page.goto('http://localhost:3000/studio', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);

  await page.screenshot({ path: '.codex-captures/studio-full.png', fullPage: true });

  const ids = ['marca','paleta','tipografia','spacing','iconografia','actius','botons','inputs','cards','estats','alertes','responsive','layout','veu','comunicacions','pdfs'];
  for (const id of ids) {
    const el = await page.$(`#sec-${id}`);
    if (el) await el.screenshot({ path: `.codex-captures/studio-${id}.png` });
  }
  console.log('OK captures done');
  await browser.close();
})();
