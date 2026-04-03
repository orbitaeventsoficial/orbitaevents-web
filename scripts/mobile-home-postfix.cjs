const { chromium } = require('playwright');
const path = require('path');

async function waitStable(page, waitMs = 2800) {
  await page.waitForLoadState('domcontentloaded');
  try {
    await page.waitForLoadState('load', { timeout: 10000 });
  } catch {}
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
  const out = path.join(process.cwd(), '.codex-captures', 'public-responsive-audit-2026-03-31', 'mobile-home-postfix.png');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/ca', { waitUntil: 'domcontentloaded' });
  await waitStable(page);
  await dismissCookie(page);
  await page.screenshot({ path: out, fullPage: false });
  await context.close();
  await browser.close();
  console.log(out);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
