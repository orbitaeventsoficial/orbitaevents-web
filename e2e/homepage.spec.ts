import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('orbita-intro-seen', 'true');
      sessionStorage.setItem('orbita-mobile-intro-seen', 'true');
    });
  });

  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Òrbita Events/i);

    // Check critical elements are visible
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');

    // Check main navigation links exist
    const contactLink = page.getByRole('link', { name: /contacto|contacte/i });
    await expect(contactLink).toBeVisible();

    const servicesLink = page.getByRole('link', { name: /servicios|serveis/i });
    await expect(servicesLink).toBeVisible();
  });

  test('should display services grid', async ({ page }) => {
    await page.goto('/');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Check that services are displayed
    const servicesSection = page.locator('text=/bodas|bodis|empresas/i').first();
    await expect(servicesSection).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should load on mobile
    await expect(page).toHaveTitle(/Òrbita Events/i);

    // Mobile header should be present
    const mobileHeader = page.locator('header').first();
    await expect(mobileHeader).toBeVisible({ timeout: 15000 });
  });
});
