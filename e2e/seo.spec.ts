import { test, expect } from '@playwright/test';

test.describe('SEO & Metadata', () => {
  test('homepage should have proper SEO meta tags', async ({ page }) => {
    await page.goto('/');

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);

    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDescription = page.locator('meta[property="og:description"]');

    await expect(ogTitle).toHaveAttribute('content', /.+/);
    await expect(ogDescription).toHaveAttribute('content', /.+/);
  });

  test('should have canonical URLs', async ({ page }) => {
    const pages = ['/', '/contacto', '/servicios/bodas'];

    for (const path of pages) {
      await page.goto(path);

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', /.+/);
    }
  });

  test('should have proper title tags', async ({ page }) => {
    const pages = [
      { path: '/', titlePattern: /òrbita events|dj|eventos/i },
      { path: '/contacto', titlePattern: /contact|contacto/i },
      { path: '/servicios/bodas', titlePattern: /bodas|boda|casaments|wedding/i },
    ];

    for (const { path, titlePattern } of pages) {
      await page.goto(path);
      await expect(page).toHaveTitle(titlePattern);
    }
  });

  test('should not have broken images on homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for images to load
    await page.waitForLoadState('domcontentloaded');

    // Get all images
    const images = page.locator('img');
    const imageCount = await images.count();

    // Check that images have src attributes
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      expect(src).toBeTruthy();
      expect(src).not.toBe('');
    }
  });
});
