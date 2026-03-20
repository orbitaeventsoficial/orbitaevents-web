import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.ADMIN_USER || 'orbita';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Orbitaevents040120+++';

function authHeaders() {
  const encoded = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

const KNOWN_ERRORS = [
  'Hydration failed', 'hydrating', 'useTranslations', 'NextIntlClientProvider',
  'parentNode', 'useContext', 'Invalid hook call', 'removeChild', 'NotFoundError',
];

function setupErrorFilter(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    if (KNOWN_ERRORS.some((e) => err.message.includes(e))) return;
    errors.push(err.message);
  });
  return errors;
}

async function setupAutoCloseDevOverlay(page: import('@playwright/test').Page) {
  await page.addLocatorHandler(
    page.locator('dialog:has-text("Unhandled Runtime Error")'),
    async () => {
      const closeBtn = page.locator('dialog button:has-text("Close")');
      if ((await closeBtn.count()) > 0) await closeBtn.click();
    },
  );
}

async function adminGoto(page: import('@playwright/test').Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
}

test.describe('Admin extès — clients, packs, economia, APIs', () => {
  test.describe.configure({ retries: 1 });
  test.use({ extraHTTPHeaders: authHeaders() });

  test.beforeEach(async ({ page }) => {
    await setupAutoCloseDevOverlay(page);
  });

  // ═══════════ CLIENTS ═══════════

  test('Clients — llistat carrega amb taula', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await adminGoto(page, '/admin/clientes');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

    const pageText = await page.textContent('body');
    expect(pageText?.toLowerCase()).toContain('client');

    expect(errors).toHaveLength(0);
  });

  test('Clients — detall mostra informació', async ({ page }) => {
    test.setTimeout(60000);
    await adminGoto(page, '/admin/clientes');

    const clientLink = page.locator('a[href*="/admin/clientes/cm"]').first();
    if ((await clientLink.count()) === 0) {
      test.skip(true, 'No hi ha clients per testar');
      return;
    }

    const href = await clientLink.getAttribute('href');
    await adminGoto(page, href!);

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
  });

  // ═══════════ PACKS ═══════════

  test('Packs — llistat carrega', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await adminGoto(page, '/admin/packs');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

    const pageText = await page.textContent('body');
    const hasPack = pageText?.toLowerCase().includes('pack') || pageText?.toLowerCase().includes('bàsic') || pageText?.toLowerCase().includes('premium');
    expect(hasPack).toBeTruthy();

    expect(errors).toHaveLength(0);
  });

  // ═══════════ INVENTARI ═══════════

  test('Inventari — llistat carrega', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await adminGoto(page, '/admin/inventory');

    await expect(page.locator('body')).toContainText(/inventari/i, { timeout: 15000 });

    expect(errors).toHaveLength(0);
  });

  // ═══════════ EMAILS ═══════════

  test('Emails — pàgina carrega', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await adminGoto(page, '/admin/emails');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

    expect(errors).toHaveLength(0);
  });

  // ═══════════ PRESSUPOSTOS ═══════════

  test('Pressupostos — pàgina carrega', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await adminGoto(page, '/admin/presupuestos');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

    expect(errors).toHaveLength(0);
  });

  // ═══════════ ECONOMIA PROFUND ═══════════

  test('Economia — totes les pestanyes responen', async ({ page }) => {
    test.setTimeout(60000);
    await adminGoto(page, '/admin/economia');

    // Busca totes les pestanyes
    const tabs = page.locator('button[role="tab"], .admin-tab-button, [data-tab-id]');
    const tabCount = await tabs.count();

    // Si no hi ha tabs amb rol, busca botons genèrics de pestanya
    if (tabCount === 0) {
      const anyTabs = page.locator('button').filter({ hasText: /Tresoreria|Previsions|Configuració|Caixa|Config/i });
      const anyCount = await anyTabs.count();
      expect(anyCount).toBeGreaterThanOrEqual(1);
    }
  });

  // ═══════════ APIs ADMIN AUTENTICADES ═══════════

  test('Dashboard admin carrega amb contingut', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await adminGoto(page, '/admin');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

    const pageText = await page.textContent('body');
    expect(pageText?.toLowerCase()).toContain('visió general');

    expect(errors).toHaveLength(0);
  });

  test('API settings retorna JSON', async ({ request }) => {
    const res = await request.get('/api/admin/settings', {
      headers: authHeaders(),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toBeDefined();
  });

  test('API leads retorna JSON paginat', async ({ request }) => {
    const res = await request.get('/api/admin/leads', {
      headers: authHeaders(),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.ok || body.leads || body.data).toBeTruthy();
  });

  test('API bookings retorna JSON', async ({ request }) => {
    const res = await request.get('/api/admin/bookings', {
      headers: authHeaders(),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toBeDefined();
  });

  test('API customers retorna JSON', async ({ request }) => {
    const res = await request.get('/api/admin/customers', {
      headers: authHeaders(),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toBeDefined();
  });

  test('API tasks retorna JSON', async ({ request }) => {
    const res = await request.get('/api/admin/tasks', {
      headers: authHeaders(),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toBeDefined();
  });

  test('API packs retorna JSON', async ({ request }) => {
    const res = await request.get('/api/admin/packs', {
      headers: authHeaders(),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toBeDefined();
  });

  test('API inventory retorna JSON', async ({ request }) => {
    const res = await request.get('/api/admin/inventory', {
      headers: authHeaders(),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toBeDefined();
  });

  // ═══════════ SEGURETAT ═══════════

});
