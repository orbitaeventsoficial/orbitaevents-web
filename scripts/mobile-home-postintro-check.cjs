const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true });
  await context.addInitScript(() => {
    try { window.sessionStorage.setItem('orbita-mobile-intro-seen', 'true'); } catch {}
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/ca', { waitUntil: 'domcontentloaded' });
  try { await page.waitForLoadState('load', { timeout: 10000 }); } catch {}
  await page.waitForTimeout(3200);
  for (const label of ['Acceptar', 'Aceptar', 'Accept', 'D’acord']) {
    const btn = page.getByRole('button', { name: label }).first();
    try {
      if (await btn.isVisible({ timeout: 800 })) {
        await btn.click({ timeout: 1000 });
        await page.waitForTimeout(400);
        break;
      }
    } catch {}
  }
  const out = path.join(process.cwd(), '.codex-captures', 'public-responsive-audit-2026-03-31', 'mobile-home-postintro-v2.png');
  await page.screenshot({ path: out, fullPage: false });
  await context.close();
  await browser.close();
  console.log(out);
})();
