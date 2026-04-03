import { test, expect } from '@playwright/test';

const AUTH = 'orbita:Orbitaevents040120+++';

test.describe('Admin help — leads, clients, economia', () => {
  test.beforeEach(async ({ page }) => {
    const token = Buffer.from(AUTH).toString('base64');
    await page.setExtraHTTPHeaders({ Authorization: `Basic ${token}` });
    await page.addInitScript(() => {
      window.localStorage.setItem('orbita.admin.help-mode', '1');
      window.localStorage.setItem('orbita.admin.help-mode.seen', '1');
    });
  });

  test('leads pipeline data-help elements exist', async ({ page }) => {
    await page.goto('/admin/leads', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-help-title="Pipeline de leads"]').first()).toBeAttached({ timeout: 30000 });
    await expect(page.locator('[data-help-title="Filtres locals del pipeline"]').first()).toBeAttached({ timeout: 30000 });
    await expect(page.locator('[data-help-title="Resum del pipeline"]').first()).toBeAttached({ timeout: 30000 });
    await page.screenshot({ path: 'e2e/screenshots/admin-help-leads.png', fullPage: true });
  });

  test('clients page data-help elements exist', async ({ page }) => {
    await page.goto('/admin/clientes', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-help-title="Cercador de clients"]').first()).toBeAttached({ timeout: 30000 });
    await expect(
      page.locator([
        '[data-help-title="Filtres per prioritat"]',
        '[data-help-title="Taula de clients"]',
        '[data-help-title="Llistat mòbil de clients"]',
        '[data-help-title="Paginació de clients"]',
      ].join(', ')).first()
    ).toBeAttached({ timeout: 30000 });
    await page.screenshot({ path: 'e2e/screenshots/admin-help-clients.png', fullPage: true });
  });

  test('economia data-help elements exist', async ({ page }) => {
    await page.goto('/admin/economia', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-help-title="Pestanyes d\'economia"]').first()).toBeAttached({ timeout: 30000 });
    await page.screenshot({ path: 'e2e/screenshots/admin-help-economia.png', fullPage: true });
  });
});
