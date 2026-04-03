const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const outDir = 'D:/orbitaevents/.codex-captures/mobile-fix-2026-04-03-v2';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/ca?intro=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(120);
  await page.screenshot({ path: path.join(outDir, 'home-mobile-intro-early.png'), fullPage: false });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(outDir, 'home-mobile-intro-portal.png'), fullPage: false });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(outDir, 'home-mobile-after-intro.png'), fullPage: false });
  await page.goto('http://localhost:3000/ca', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  await page.waitForTimeout(5000);
  for (const label of ['Acceptar', 'Aceptar', 'Accept', 'D’acord']) {
    const btn = page.getByRole('button', { name: label }).first();
    try {
      if (await btn.isVisible({ timeout: 500 })) {
        await btn.click({ timeout: 1000 });
        await page.waitForTimeout(400);
        break;
      }
    } catch {}
  }
  await page.screenshot({ path: path.join(outDir, 'home-mobile-stable.png'), fullPage: false });
  await context.close();
  await browser.close();
})();
