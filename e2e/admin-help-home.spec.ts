import { test, expect } from '@playwright/test';

const AUTH = 'orbita:Orbitaevents040120+++';

test.describe('Admin help home', () => {
  test.beforeEach(async ({ page }) => {
    const token = Buffer.from(AUTH).toString('base64');
    await page.setExtraHTTPHeaders({ Authorization: `Basic ${token}` });
    await page.addInitScript(() => {
      window.localStorage.setItem('orbita.admin.help-mode', '1');
      window.localStorage.setItem('orbita.admin.help-mode.seen', '1');
    });
  });

  test('captures home help bubbles', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Òrbita Events' })).toBeVisible();

    const targets = [
      { selector: '[data-help-title="Inbox (IMAP)"]', text: 'Centralitza els correus entrants', file: 'admin-home-help-inbox.png' },
      { selector: '[data-help-title="Objectiu mensual d\'ingressos"]', text: 'Resumeix quant has facturat aquest mes', file: 'admin-home-help-objectiu.png' },
      { selector: '[data-help-title="Pilot automàtic d\'avui"]', text: 'És una ruta guiada per a un usuari novell', file: 'admin-home-help-pilot.png' },
      { selector: '[data-help-title="Centre de comandament"]', text: 'Permet moure estats clau de leads i reserves', file: 'admin-home-help-command.png' },
      { selector: '[data-help-title="Auditoria recent"]', text: 'Mostra les últimes accions administratives registrades', file: 'admin-home-help-audit.png' },
    ];

    for (const target of targets) {
      const locator = page.locator(target.selector).first();
      await expect(locator).toBeVisible({ timeout: 15000 });
      const box = await locator.boundingBox();
      expect(box).not.toBeNull();
      await locator.hover();
      await page.waitForTimeout(500);
      await expect(page.locator('[data-help-tooltip-panel="true"]')).toContainText(target.text);
      await page.screenshot({ path: `e2e/screenshots/${target.file}`, fullPage: true });
    }
  });
});

