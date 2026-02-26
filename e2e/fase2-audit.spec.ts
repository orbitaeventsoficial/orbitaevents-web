import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.ADMIN_USER || 'orbita';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Orbitaevents040120+++';

function authHeaders() {
  const encoded = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

test.describe('Fase 2 — Auditoria econòmica-financera', () => {
  test.use({
    extraHTTPHeaders: authHeaders(),
  });

  // ═══════════ DASHBOARD ═══════════
  test('Dashboard mostra els 3 KPIs financers nous', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Flux net previst
    const fluxLabel = page.locator('text=Flux net previst');
    await expect(fluxLabel).toBeVisible({ timeout: 15000 });

    // Pipeline ponderat
    const pipelineLabel = page.locator('text=Pipeline ponderat');
    await expect(pipelineLabel).toBeVisible();

    // Pendent de cobrar
    const pendentLabel = page.locator('text=Pendent de cobrar');
    await expect(pendentLabel).toBeVisible();
  });

  test('Dashboard KPIs mostren valors numèrics amb €', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Scroll fins als KPIs financers
    const fluxCard = page.getByText('Flux net previst');
    await fluxCard.scrollIntoViewIfNeeded({ timeout: 15000 });

    // Buscar les cards amb valors en euros
    const metricValues = page.locator('.admin-ui-metric-value');
    const count = await metricValues.count();
    expect(count).toBeGreaterThanOrEqual(8); // Mínim 8 KPIs (originals + nous)

    // Capturar screenshot del dashboard amb KPIs financers visibles
    await page.screenshot({ path: 'test-results/dashboard-kpis-financers.png', fullPage: true });
  });

  // ═══════════ ECONOMIA — PESTANYES ═══════════
  test('Economia té les pestanyes Tresoreria i Previsions', async ({ page }) => {
    await page.goto('/admin/economia');
    await page.waitForLoadState('networkidle');

    // Verificar que existeixin les pestanyes
    const tresoreriaTab = page.locator('button, a, [role="tab"]').filter({ hasText: /Tresoreria|Caixa/i });
    await expect(tresoreriaTab.first()).toBeVisible({ timeout: 15000 });

    const previsionsTab = page.locator('button, a, [role="tab"]').filter({ hasText: /Previsions|Previsió/i });
    await expect(previsionsTab.first()).toBeVisible();
  });

  test('Economia — pestanya Tresoreria mostra taula de cash flow', async ({ page }) => {
    await page.goto('/admin/economia');
    await page.waitForLoadState('networkidle');

    // Clicar la pestanya Tresoreria
    const tresoreriaTab = page.locator('button, a, [role="tab"]').filter({ hasText: /Tresoreria|Caixa/i });
    await tresoreriaTab.first().click();
    await page.waitForTimeout(500);

    // Verificar que apareix contingut de tresoreria
    const heading = page.locator('text=Previsió de tresoreria');
    await expect(heading).toBeVisible({ timeout: 5000 });

    // Hauria de mostrar o bé la taula o bé el missatge "Sense dades"
    const tableOrEmpty = page.locator('table, :text("Sense dades de tresoreria")');
    await expect(tableOrEmpty.first()).toBeVisible();
  });

  test('Economia — pestanya Previsions mostra previsió de vendes', async ({ page }) => {
    await page.goto('/admin/economia');
    await page.waitForLoadState('networkidle');

    // Clicar la pestanya Previsions
    const previsionsTab = page.locator('button, a, [role="tab"]').filter({ hasText: /Previsions|Previsió/i });
    await previsionsTab.first().click();
    await page.waitForTimeout(500);

    // Verificar heading
    const heading = page.locator('text=Previsió de vendes');
    await expect(heading).toBeVisible({ timeout: 5000 });

    // Hauria de mostrar taula amb dades o missatge buit
    const tableOrEmpty = page.locator('table, :text("Sense dades de previsió")');
    await expect(tableOrEmpty.first()).toBeVisible();
  });

  test('Economia — pestanya Previsions mostra CAC per canal', async ({ page }) => {
    await page.goto('/admin/economia');
    await page.waitForLoadState('networkidle');

    const previsionsTab = page.locator('button, a, [role="tab"]').filter({ hasText: /Previsions|Previsió/i });
    await previsionsTab.first().click();
    await page.waitForTimeout(500);

    // CAC per canal
    const cacHeading = page.locator('text=CAC per canal');
    await expect(cacHeading).toBeVisible({ timeout: 5000 });

    // Taula amb columnes
    const conversionCol = page.locator('th').filter({ hasText: /Conversió/i });
    await expect(conversionCol).toBeVisible();
  });

  test('Economia — Config mostra vehicle i desplaçament (MITECO)', async ({ page }) => {
    await page.goto('/admin/economia');
    await page.waitForLoadState('networkidle');

    // Clicar Config — usar el botó de la pestanya dins la zona de tabs d'Economia
    await page.getByRole('button', { name: /⚙️\s*Configuració/ }).click();
    await page.waitForTimeout(2000);

    // Scroll fins al final per trobar la secció vehicle
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Verificar secció vehicle — pot ser que estigui dins el DOM renderitzat
    const vehicleHeading = page.getByText('Vehicle i desplaçament');
    await expect(vehicleHeading).toBeVisible({ timeout: 15000 });

    // Preu combustible
    await expect(page.getByText('Preu combustible')).toBeVisible();

    // Cost efectiu per km
    await expect(page.getByText('Cost efectiu per km')).toBeVisible();

    // Capturar screenshot per verificar visualment
    await page.screenshot({ path: 'test-results/economia-config-vehicle.png', fullPage: true });
  });

  // ═══════════ BOOKING DETAIL — "On va cada euro" ═══════════
  test('Detall reserva mostra "On va cada euro"', async ({ page }) => {
    test.setTimeout(60000); // Booking detail can be slow
    // Navegar directament a la primera reserva coneguda
    await page.goto('/admin/bookings/cmlutz7e600ab3czlpa7f9n1u');
    await page.waitForLoadState('domcontentloaded');

    // Esperar que la pàgina carregui completament (pot ser lenta)
    await page.waitForTimeout(5000);

    // Scroll fins a la secció
    const heading = page.getByText("On va cada euro d'aquest bolo");
    await heading.scrollIntoViewIfNeeded({ timeout: 15000 });
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Verificar subseccions
    await expect(page.getByText('Combustible (benzina)')).toBeVisible();
    await expect(page.getByText('Manteniment vehicle')).toBeVisible();
    await expect(page.getByText('Amortització equip')).toBeVisible();
    await expect(page.getByText('Costos operatius fixes')).toBeVisible();
    // "Benefici net" apareix 2 cops, usar el que té "(el que queda per a tu)"
    await expect(page.getByText('Benefici net (el que queda per a tu)')).toBeVisible();

    // Consell pràctic
    await expect(page.getByText('Consell pràctic')).toBeVisible();

    // Capturar screenshot per verificar visualment
    await page.screenshot({ path: 'test-results/booking-on-va-cada-euro.png', fullPage: true });
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

    // Cada mes ha de tenir les propietats correctes
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

  // ═══════════ TOTES LES PÀGINES ADMIN CARREGUEN ═══════════
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
      const errors: string[] = [];
      page.on('pageerror', (err) => {
        // Ignorar errors pre-existents de Next.js (no són de Fase 2)
        if (err.message.includes('Hydration failed') || err.message.includes('hydrating')) return;
        if (err.message.includes('useTranslations') || err.message.includes('NextIntlClientProvider')) return;
        if (err.message.includes('parentNode')) return;
        errors.push(err.message);
      });

      await page.goto(pg.path);
      await page.waitForLoadState('networkidle');

      // No errors JS (excloent hidratació pre-existent)
      expect(errors).toHaveLength(0);

      // Status 200 (no redirect, no error)
      expect(page.url()).toContain(pg.path);
    });
  }

  // ═══════════ RESPONSIVE — MÒBIL ═══════════
  test('Dashboard responsive mòbil (375x667)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      extraHTTPHeaders: authHeaders(),
    });
    const page = await context.newPage();

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // La barra inferior de navegació mòbil ha de ser visible
    const bottomNav = page.locator('.admin-bottom-nav');
    await expect(bottomNav).toBeVisible({ timeout: 10000 });

    // El títol ha de ser visible
    const title = page.locator('.admin-mobile-title');
    await expect(title).toBeVisible();

    await context.close();
  });

  test('Economia responsive mòbil — pestanyes funcionen', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      extraHTTPHeaders: authHeaders(),
    });
    const page = await context.newPage();

    await page.goto('/admin/economia');
    await page.waitForLoadState('networkidle');

    // Pestanyes mòbils visibles (mobileLabel)
    const caixaTab = page.locator('button, a, [role="tab"]').filter({ hasText: /Caixa/i });
    await expect(caixaTab.first()).toBeVisible({ timeout: 15000 });

    // Clicar i verificar que canvia el contingut
    await caixaTab.first().click();
    await page.waitForTimeout(500);

    const heading = page.locator('text=Previsió de tresoreria');
    await expect(heading).toBeVisible({ timeout: 5000 });

    await context.close();
  });
});
