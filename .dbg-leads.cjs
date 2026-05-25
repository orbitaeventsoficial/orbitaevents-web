const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const shot = async (page, name) => {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `.codex-captures/leads-${name}.png`, fullPage: true });
    console.log('OK', name);
  };

  // Desktop
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await page.goto('http://localhost:3000/studio-lab/leads', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await shot(page, 'desktop-calendari');

  // Pipeline view
  await page.getByRole('button', { name: 'Pipeline' }).click();
  await shot(page, 'desktop-pipeline');

  // Back to calendar, open a lead detail
  await page.getByRole('button', { name: 'Calendari' }).click();
  await page.waitForTimeout(300);
  // click first lead cell in the calendar
  await page.locator('.fx__cell.is-lead').first().click();
  await page.waitForTimeout(400);
  await shot(page, 'desktop-fitxa');

  await ctx.close();

  // Mobile
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const mpage = await mctx.newPage();
  mpage.on('pageerror', (e) => console.log('PAGEERR-M', e.message));
  await mpage.goto('http://localhost:3000/studio-lab/leads', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await shot(mpage, 'mobile-calendari');
  await mpage.locator('.fx__cell.is-lead').first().click();
  await shot(mpage, 'mobile-fitxa');
  await mctx.close();

  await browser.close();
  console.log('ALL DONE');
})();
