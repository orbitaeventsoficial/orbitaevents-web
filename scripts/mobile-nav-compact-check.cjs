const { chromium } = require('playwright');
const path = require('path');
async function waitStable(page, waitMs) {
  await page.waitForLoadState('domcontentloaded');
  try { await page.waitForLoadState('load', { timeout: 10000 }); } catch {}
  await page.waitForTimeout(waitMs);
}
async function dismissCookie(page) {
  for (const label of ['Acceptar', 'Aceptar', 'Accept', 'D’acord']) {
    const btn = page.getByRole('button', { name: label }).first();
    try {
      if (await btn.isVisible({ timeout: 800 })) {
        await btn.click({ timeout: 1000 });
        await page.waitForTimeout(400);
        return;
      }
    } catch {}
  }
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const routes = [
    { name: 'mobile-servicios-compact-nav', url: 'http://localhost:3000/ca/servicios', wait: 2600 },
    { name: 'mobile-packs-compact-nav', url: 'http://localhost:3000/ca/packs', wait: 2400 },
    { name: 'mobile-portfolio-compact-nav', url: 'http://localhost:3000/ca/portfolio', wait: 2400 }
  ];
  for (const route of routes) {
    await page.goto(route.url, { waitUntil: 'domcontentloaded' });
    await waitStable(page, route.wait);
    await dismissCookie(page);
    await page.screenshot({ path: path.join(process.cwd(), '.codex-captures', 'public-responsive-audit-2026-03-31', `${route.name}.png`), fullPage: false });
  }
  await context.close();
  await browser.close();
})();
