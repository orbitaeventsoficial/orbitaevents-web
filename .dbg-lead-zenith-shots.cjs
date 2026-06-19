const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  fs.mkdirSync('.codex-captures', { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    extraHTTPHeaders: { Authorization: `Basic ${token}` },
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/admin/leads/cmpwudznj00g3vigky4altclu', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForSelector('.fxd__zenith-main .nb__cfg', { timeout: 60000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: '.codex-captures/lead-zenith-base-1440x900.png', fullPage: false });

  const firstProvider = await page.$('.fxd__zenith-main .nb__cfg-grp--provider > summary');
  if (firstProvider) {
    await firstProvider.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: '.codex-captures/lead-zenith-provider-open-1440x900.png', fullPage: false });
  }

  const metrics = await page.evaluate(() => ({
    scrollH: document.documentElement.scrollHeight,
    clientH: document.documentElement.clientHeight,
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  console.log(JSON.stringify(metrics, null, 2));

  await browser.close();
})();
