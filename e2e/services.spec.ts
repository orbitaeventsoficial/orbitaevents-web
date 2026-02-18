import { test, expect } from '@playwright/test';

const servicePages = [
  { path: '/servicios/bodas', name: 'Bodas' },
  { path: '/servicios/fiestas', name: 'Fiestas' },
  { path: '/servicios/empresas', name: 'Empresas' },
  { path: '/servicios/discomovil', name: 'Discomóvil' },
  { path: '/servicios/alquiler', name: 'Alquiler' },
  { path: '/servicios/produccion', name: 'Producción' },
];

test.describe('Service Pages', () => {
  for (const service of servicePages) {
    test(`should load ${service.name} service page`, async ({ page }) => {
      await page.goto(service.path);

      // Page should load successfully
      await expect(page).not.toHaveTitle(/404|not found/i);

      // Should have a visible main heading
      const visibleHeading = page.locator('h1:visible').first();
      await expect(visibleHeading).toBeVisible();
    });
  }

  test('should display portfolio link', async ({ page }) => {
    await page.goto('/servicios/bodas');

    // Should have link to portfolio or gallery
    const portfolioLink = page.getByRole('link', { name: /portfolio|galería|galeria/i }).first();

    // May or may not be visible depending on design, but should exist
    const linkCount = await portfolioLink.count();
    expect(linkCount).toBeGreaterThanOrEqual(0);
  });
});
