import { test, expect, type Page } from '@playwright/test';

const GOTO_OPTIONS = { waitUntil: 'domcontentloaded' as const, timeout: 60000 };

type MobileFooterMode = 'visible' | 'absent' | 'skip';

const ROUTES: Array<{ path: string; name: string; mobileBottomNav: boolean; mobileFooter: MobileFooterMode }> = [
  { path: '/ca', name: 'home', mobileBottomNav: true, mobileFooter: 'skip' },
  { path: '/ca/packs', name: 'packs', mobileBottomNav: true, mobileFooter: 'visible' },
  { path: '/ca/servicios', name: 'servicios', mobileBottomNav: true, mobileFooter: 'visible' },
  { path: '/ca/contacto', name: 'contacto', mobileBottomNav: false, mobileFooter: 'absent' },
];

async function dismissCookieBanner(page: Page) {
  const acceptButton = page.getByRole('button', { name: /acceptar-ho tot|aceptar todo|accept all/i }).first();
  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click();
    await page.waitForTimeout(250);
  }
}

async function hasVisibleBottomNav(page: Page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('nav')).some((el) => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.height >= 48 && rect.top >= window.innerHeight - 180 && rect.bottom <= window.innerHeight + 24;
    });
  });
}

test.describe('Responsive public layout smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('orbita-intro-seen', 'true');
      sessionStorage.setItem('orbita-mobile-intro-seen', 'true');
    });
  });

  for (const route of ROUTES) {
    test(`mobile smoke: ${route.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route.path, GOTO_OPTIONS);
      await page.waitForTimeout(1200);
      await dismissCookieBanner(page);

      await expect(page.locator('header').first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator('main').locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
      await expect.poll(() => hasVisibleBottomNav(page)).toBe(route.mobileBottomNav);

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);

      if (route.mobileFooter === 'visible') {
        await expect(page.locator('#footer')).toBeVisible({ timeout: 15000 });
      }

      if (route.mobileFooter === 'absent') {
        await expect(page.locator('#footer')).toHaveCount(0);
      }
    });

    test(`tablet smoke: ${route.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 834, height: 1194 });
      await page.goto(route.path, GOTO_OPTIONS);
      await page.waitForTimeout(1200);
      await dismissCookieBanner(page);

      await expect(page.locator('header').first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator('main').locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
      await expect.poll(() => hasVisibleBottomNav(page)).toBe(false);

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);
      await expect(page.locator('#footer')).toBeVisible({ timeout: 15000 });
    });
  }
});
