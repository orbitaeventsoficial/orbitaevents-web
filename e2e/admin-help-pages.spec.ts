import { test, expect } from '@playwright/test';

const AUTH = 'orbita:Orbitaevents040120+++';

test.describe('Admin help pages', () => {
  test.beforeEach(async ({ page }) => {
    const token = Buffer.from(AUTH).toString('base64');
    await page.setExtraHTTPHeaders({ Authorization: `Basic ${token}` });
    await page.addInitScript(() => {
      window.localStorage.setItem('orbita.admin.help-mode', '1');
      window.localStorage.setItem('orbita.admin.help-mode.seen', '1');
    });
  });

  test('help bubble /admin/bookings?view=kanban', async ({ page }) => {
    await page.goto('/admin/bookings?view=kanban', { waitUntil: 'domcontentloaded' });
    const target = page.locator('[data-help-title="Mètriques de reserves"]').first();
    await expect(target).toBeVisible({ timeout: 15000 });
    await target.hover();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-help-tooltip-panel="true"]')).toContainText('Cada targeta resumeix quantes reserves hi ha en cada estat');
    await page.screenshot({ path: 'e2e/screenshots/admin-help-bookings.png', fullPage: true });
  });
});
