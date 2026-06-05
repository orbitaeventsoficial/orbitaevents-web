import { test } from '@playwright/test';

const ADMIN_USER = process.env.ADMIN_USER || 'orbita';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Orbitaevents040120+++';
function authHeaders() {
  const encoded = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

test.describe('captura col·laboradors', () => {
  test.use({ extraHTTPHeaders: authHeaders() });

  test('pàgina collaborators amb catàleg de productes', async ({ page }) => {
    await page.goto('/admin/collaborators', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '.codex-captures/collaborators-page.png', fullPage: true });

    // Obre el formulari de producte del primer col·laborador si existeix
    const addBtn = page.locator('button', { hasText: '+ Producte' }).first();
    if (await addBtn.count() > 0) {
      await addBtn.scrollIntoViewIfNeeded();
      await addBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: '.codex-captures/collaborators-product-form.png', fullPage: true });
    }
  });
});
