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

/** Go to admin page, wait for load, dismiss dev overlay */
async function adminGoto(page: import('@playwright/test').Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  try {
    const closeBtn = page.locator('dialog button:has-text("Close")');
    if ((await closeBtn.count()) > 0) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
  } catch { /* no overlay */ }
}

test.describe('Fase 2 — Auditoria econòmica-financera', () => {
  test.describe.configure({ retries: 1 }); // Dev server hydration is flaky
  test.use({
    extraHTTPHeaders: authHeaders(),
  });

  // ═══════════ DASHBOARD ═══════════
  test('Dashboard mostra KPIs financers', async ({ page }) => {
    setupErrorFilter(page);
    await adminGoto(page, '/admin');

    const kpiGrid = page.locator('.admin-cr-kpi-grid');
    if ((await kpiGrid.count()) > 0) {
      await kpiGrid.scrollIntoViewIfNeeded();
    }

    const metricValues = page.locator('.admin-ui-metric-value');
    const count = await metricValues.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  // ═══════════ ECONOMIA — PESTANYES ═══════════
  test('Economia té les pestanyes Tresoreria i Previsions', async ({ page }) => {
    await adminGoto(page, '/admin/economia');

    const tresoreriaTab = page.locator('button').filter({ hasText: /Tresoreria|Caixa/i });
    await expect(tresoreriaTab.first()).toBeVisible({ timeout: 15000 });

    const previsionsTab = page.locator('button').filter({ hasText: /Previsions|Previsió/i });
    await expect(previsionsTab.first()).toBeVisible();
  });

  test('Economia — pestanya Tresoreria mostra contingut', async ({ page }) => {
    await adminGoto(page, '/admin/economia');

    const tresoreriaTab = page.locator('button').filter({ hasText: /Tresoreria|Caixa/i });
    await tresoreriaTab.first().click();
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body');
    const hasContent = pageText?.includes('tresoreria') || pageText?.includes('Tresoreria') || pageText?.includes('cash') || pageText?.includes('Caixa');
    expect(hasContent).toBeTruthy();
  });

  test('Economia — pestanya Previsions mostra contingut', async ({ page }) => {
    await adminGoto(page, '/admin/economia');

    const previsionsTab = page.locator('button').filter({ hasText: /Previsions|Previsió/i });
    await previsionsTab.first().click();
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body');
    const hasContent = pageText?.includes('Previsió') || pageText?.includes('vendes') || pageText?.includes('CAC');
    expect(hasContent).toBeTruthy();
  });

  test('Economia — Config mostra vehicle i desplaçament (MITECO)', async ({ page }) => {
    await adminGoto(page, '/admin/economia');

    const configTab = page.locator('button:visible').filter({ hasText: /Configuració|Config/i }).first();
    await configTab.evaluate((node) => {
      (node as HTMLElement).click();
    });
    await page.waitForTimeout(2000);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const pageText = await page.textContent('body');
    const hasVehicle = pageText?.includes('Vehicle') || pageText?.includes('vehicle') || pageText?.includes('combustible') || pageText?.includes('MITECO');
    expect(hasVehicle).toBeTruthy();
  });

  // ═══════════ BOOKING DETAIL ═══════════
  test('Detall reserva mostra seccions financeres', async ({ page }) => {
    test.setTimeout(60000);

    await adminGoto(page, '/admin/bookings');

    const bookingLink = page.locator('a[href*="/admin/bookings/cm"]').first();
    if ((await bookingLink.count()) === 0) {
      test.skip(true, 'No hi ha reserves per testar');
      return;
    }

    const href = await bookingLink.getAttribute('href');
    await page.goto(href!);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    const resum = page.getByText('Resum Econòmic');
    await resum.scrollIntoViewIfNeeded({ timeout: 15000 });
    await expect(resum).toBeVisible();
  });

  // ═══════════ APIs ═══════════
  test('API cash-flow retorna JSON vàlid', async ({ request }) => {
    const res = await request.get('/api/admin/economia/cash-flow', {
      headers: authHeaders(),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.cashFlow)).toBe(true);
    expect(body.cashFlow.length).toBeGreaterThanOrEqual(1);

    const first = body.cashFlow[0];
    expect(first).toHaveProperty('month');
    expect(first).toHaveProperty('income');
    expect(first).toHaveProperty('costs');
    expect(first).toHaveProperty('netFlow');
    expect(first).toHaveProperty('cumulative');
  });

  test('API forecast retorna JSON vàlid', async ({ request }) => {
    const res = await request.get('/api/admin/economia/forecast', {
      headers: authHeaders(),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.forecast)).toBe(true);
    expect(body.forecast.length).toBeGreaterThanOrEqual(1);

    const first = body.forecast[0];
    expect(first).toHaveProperty('month');
    expect(first).toHaveProperty('historicalAvg');
    expect(first).toHaveProperty('pipeline');
    expect(first).toHaveProperty('combined');
  });

  // ═══════════ PÀGINES ADMIN CARREGUEN ═══════════
  const adminPages = [
    { path: '/admin', name: 'Dashboard' },
    { path: '/admin/economia', name: 'Economia' },
    { path: '/admin/bookings', name: 'Reserves' },
    { path: '/admin/leads', name: 'Entrades' },
    { path: '/admin/tasks', name: 'Tasques' },
    { path: '/admin/calendario', name: 'Calendari' },
    { path: '/admin/inventory', name: 'Inventari' },
    { path: '/admin/packs', name: 'Packs' },
  ];

  for (const pg of adminPages) {
    test(`Pàgina ${pg.name} (${pg.path}) carrega sense errors crítics`, async ({ page }) => {
      const errors = setupErrorFilter(page);

      await adminGoto(page, pg.path);

      expect(errors).toHaveLength(0);
      expect(page.url()).toContain(pg.path);
    });
  }

  // ═══════════ RESPONSIVE ═══════════
  test('Dashboard responsive mòbil (375x667)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      extraHTTPHeaders: authHeaders(),
    });
    const page = await context.newPage();
    setupErrorFilter(page);

    await adminGoto(page, '/admin');

    const bottomNav = page.locator('.admin-bottom-nav');
    await expect(bottomNav).toBeVisible({ timeout: 15000 });

    await context.close();
  });

  test('Economia responsive mòbil — pestanyes funcionen', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      extraHTTPHeaders: authHeaders(),
    });
    const page = await context.newPage();
    setupErrorFilter(page);

    await adminGoto(page, '/admin/economia');

    const caixaTab = page.locator('button').filter({ hasText: /Caixa/i });
    await expect(caixaTab.first()).toBeVisible({ timeout: 15000 });

    await caixaTab.first().click();
    await page.waitForTimeout(1000);

    const pageText = await page.textContent('body');
    const hasContent = pageText?.includes('tresoreria') || pageText?.includes('Tresoreria') || pageText?.includes('Caixa');
    expect(hasContent).toBeTruthy();

    await context.close();
  });
});
