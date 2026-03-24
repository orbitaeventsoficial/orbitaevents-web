// scripts/admin-audit.ts — Automated admin tour
// Run: npx playwright test scripts/admin-audit.ts --project=chromium
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const AUTH = 'orbita:Orbitaevents040120+++';
const ADMIN_PAGES = [
  // Pàgines que tenien spinner infinit — verificar que ara mostren error state
  '/admin/inventory',
  '/admin/pricing',
  '/admin/discount-codes',
  '/admin/features',
  '/admin/stats',
  '/admin/privacy',
  '/admin/clientes',
  '/admin/text-manager',
  '/admin/coverage',
  '/admin/blog',
];

const SCREENSHOT_DIR = 'scripts/admin-screenshots';

test.describe('Admin audit — full tour', () => {
  test.beforeEach(async ({ page }) => {
    // Set basic auth header
    const token = Buffer.from(AUTH).toString('base64');
    await page.setExtraHTTPHeaders({ Authorization: `Basic ${token}` });
  });

  for (const path of ADMIN_PAGES) {
    test(`${path}`, async ({ page }) => {
      const res = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const status = res?.status() ?? 0;

      // Esperar que el timeout de 15s salti i aparegui l'error state o el contingut real
      await page.waitForTimeout(18000);

      // Take screenshot
      const name = path.replace(/\//g, '_').replace(/^_/, '');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: true });

      // Collect console errors
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      // Check page loaded
      expect(status).toBeLessThan(500);

      // Check for visible error states in the page
      const errorBanners = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').count();
      const emptyStates = await page.locator('text=/no hay|no hi ha|empty|sense dades/i').count();

      // Check for broken images
      const brokenImages = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        return Array.from(imgs).filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
      });

      // Check for dead links (href="#" or empty)
      const deadLinks = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href="#"], a[href=""], a:not([href])');
        return Array.from(links).map(a => ({ text: a.textContent?.trim(), href: (a as HTMLAnchorElement).href }));
      });

      // Log findings
      console.log(JSON.stringify({
        page: path,
        status,
        errorBanners,
        emptyStates,
        brokenImages: brokenImages.length,
        brokenImageUrls: brokenImages.slice(0, 5),
        deadLinks: deadLinks.length,
        deadLinkSamples: deadLinks.slice(0, 5),
        consoleErrors: errors.slice(0, 5),
      }));
    });
  }
});
