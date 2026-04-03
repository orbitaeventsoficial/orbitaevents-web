import { test, expect } from '@playwright/test';

const AUTH = 'orbita:Orbitaevents040120+++';

test.describe('Admin help — calendar and emails', () => {
  test.beforeEach(async ({ page }) => {
    const token = Buffer.from(AUTH).toString('base64');
    await page.setExtraHTTPHeaders({ Authorization: `Basic ${token}` });
    await page.addInitScript(() => {
      window.localStorage.setItem('orbita.admin.help-mode', '1');
      window.localStorage.setItem('orbita.admin.help-mode.seen', '1');
    });
  });

  test('calendar week data-help elements exist', async ({ page }) => {
    await page.goto('/admin/calendario?view=week', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-help-title="Navegació setmanal"]').first()).toBeAttached({ timeout: 30000 });
    await expect(page.locator('[data-help-title="Graella setmanal"]').first()).toBeAttached({ timeout: 30000 });
    await page.screenshot({ path: 'e2e/screenshots/admin-help-calendar-week.png', fullPage: true });
  });

  test('calendar day data-help elements exist', async ({ page }) => {
    await page.goto('/admin/calendario?view=day', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-help-title="Navegació diària"]').first()).toBeAttached({ timeout: 30000 });
    await expect(page.locator('[data-help-title="Timeline del dia"]').first()).toBeAttached({ timeout: 30000 });
    await page.screenshot({ path: 'e2e/screenshots/admin-help-calendar-day.png', fullPage: true });
  });

  test('emails data-help elements exist', async ({ page }) => {
    await page.goto('/admin/emails', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-help-title="Mètriques d\'emails"]').first()).toBeAttached({ timeout: 30000 });
    await expect(page.locator('[data-help-title="Accions manuals d\'email"]').first()).toBeAttached({ timeout: 30000 });
    await expect(page.locator('[data-help-title="Configuració d\'emails"]').first()).toBeAttached({ timeout: 30000 });
    await expect(page.locator('[data-help-title="Activitat recent d\'emails"]').first()).toBeAttached({ timeout: 30000 });
    await page.screenshot({ path: 'e2e/screenshots/admin-help-emails.png', fullPage: true });
  });
});



