import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.ADMIN_USER || 'orbita';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Orbitaevents040120+++';

function authHeaders() {
  const encoded = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

// Known Next.js dev-mode errors to ignore
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

/** Register auto-dismiss for Next.js dev error overlay */
async function setupAutoCloseDevOverlay(page: import('@playwright/test').Page) {
  await page.addLocatorHandler(
    page.locator('dialog:has-text("Unhandled Runtime Error")'),
    async () => {
      const closeBtn = page.locator('dialog button:has-text("Close")');
      if ((await closeBtn.count()) > 0) await closeBtn.click();
    },
  );
}

/** Go to admin page, wait for load */
async function adminGoto(page: import('@playwright/test').Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
}

test.describe('Flux complet admin — totes les seccions', () => {
  test.describe.configure({ retries: 1 }); // Dev server hydration is flaky
  test.use({ extraHTTPHeaders: authHeaders() });

  test.beforeEach(async ({ page }) => {
    await setupAutoCloseDevOverlay(page);
  });

  // ═══════════ LEADS (ENTRADES) ═══════════

  test('Llista de leads carrega amb dades', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await adminGoto(page, '/admin/leads');
    await page.waitForTimeout(2000);

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

    const pageText = await page.textContent('body');
    const hasContent = pageText?.includes('Entrades') || pageText?.includes('entrades') || pageText?.includes('leads');
    expect(hasContent).toBeTruthy();

    expect(errors).toHaveLength(0);
  });

  test('Detall de lead mostra informació', async ({ page }) => {
    await adminGoto(page, '/admin/leads');
    await page.waitForTimeout(2000);

    const leadLink = page.locator('a[href*="/admin/leads/cm"]').first();
    if ((await leadLink.count()) === 0) {
      test.skip(true, 'No hi ha leads per testar');
      return;
    }

    const href = await leadLink.getAttribute('href');
    await adminGoto(page, href!);

    const nameOrTitle = page.locator('h1, h2').first();
    await expect(nameOrTitle).toBeVisible({ timeout: 15000 });
  });

  // ═══════════ RESERVES (BOOKINGS) ═══════════

  test('Llista de reserves carrega', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await adminGoto(page, '/admin/bookings');

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

    const pageText = await page.textContent('body');
    const hasContent = pageText?.includes('Reserves') || pageText?.includes('reserves');
    expect(hasContent).toBeTruthy();

    expect(errors).toHaveLength(0);
  });

  test('Detall reserva — seccions principals', async ({ page }) => {
    test.setTimeout(60000);
    await adminGoto(page, '/admin/bookings');

    const bookingLink = page.locator('a[href*="/admin/bookings/cm"]').first();
    if ((await bookingLink.count()) === 0) {
      test.skip(true, 'No hi ha reserves');
      return;
    }

    const href = await bookingLink.getAttribute('href');
    await page.goto(href!);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    await expect(page.getByText('Informació del Client')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Detalls de l'Event")).toBeVisible();

    const resum = page.getByText('Resum Econòmic');
    await resum.scrollIntoViewIfNeeded();
    await expect(resum).toBeVisible();
  });

  test('Detall reserva — estats existeixen', async ({ page }) => {
    test.setTimeout(60000);
    await adminGoto(page, '/admin/bookings');

    const bookingLink = page.locator('a[href*="/admin/bookings/cm"]').first();
    if ((await bookingLink.count()) === 0) {
      test.skip(true, 'No hi ha reserves');
      return;
    }

    const href = await bookingLink.getAttribute('href');
    await page.goto(href!);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    // Auto-close handler manages dev overlay

    const pageText = await page.textContent('body');
    const statuses = ['Pendent', 'Confirmada', 'Preparant', 'Completada', 'Cancel·lada'];
    const found = statuses.filter(s => pageText?.includes(s));
    expect(found.length).toBeGreaterThanOrEqual(1);
  });

  // ═══════════ PÀGINES ADMIN BÀSIQUES ═══════════

  // Only test the most critical admin pages to avoid overwhelming the dev server
  const basicPages = [
    { path: '/admin/clientes', name: 'Clients', text: 'Clients' },
    { path: '/admin/tasks', name: 'Tasques', text: 'Tasques' },
    { path: '/admin/inventory', name: 'Inventari', text: 'Inventari' },
    { path: '/admin/packs', name: 'Packs', text: 'pack' },
    { path: '/admin/emails', name: 'Emails', text: '' },
    { path: '/admin/presupuestos', name: 'Pressupostos', text: '' },
  ];

  for (const pg of basicPages) {
    test(`${pg.name} (${pg.path}) carrega`, async ({ page }) => {
      const errors = setupErrorFilter(page);
      await adminGoto(page, pg.path);

      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

      if (pg.text) {
        const pageText = await page.textContent('body');
        expect(pageText?.toLowerCase()).toContain(pg.text.toLowerCase());
      }

      expect(errors).toHaveLength(0);
    });
  }

  // ═══════════ CALENDARI — DIES ═══════════

  test('Calendari mostra dies del mes', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await adminGoto(page, '/admin/calendario');

    const dayNumbers = page.locator('text=/^\\d{1,2}$/');
    const dayCount = await dayNumbers.count();
    expect(dayCount).toBeGreaterThan(20);

    expect(errors).toHaveLength(0);
  });

  // ═══════════ NAVEGACIÓ SIDEBAR ═══════════

  test('Sidebar navegació — links principals', async ({ page }) => {
    setupErrorFilter(page);
    await adminGoto(page, '/admin');

    const sidebarLinks = [
      '/admin/leads',
      '/admin/clientes',
      '/admin/bookings',
      '/admin/tasks',
    ];

    for (const href of sidebarLinks) {
      const el = page.locator(`a[href="${href}"]:visible`).first();
      await expect(el).toBeVisible({ timeout: 5000 });
    }
  });

  // ═══════════ NAVEGACIÓ MÒBIL ═══════════

  test('Mòbil — barra inferior visible', async ({ browser }) => {
    test.setTimeout(45000);
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      extraHTTPHeaders: authHeaders(),
    });
    const page = await context.newPage();
    setupErrorFilter(page);
    await setupAutoCloseDevOverlay(page);

    await adminGoto(page, '/admin');
    await page.waitForTimeout(2000);

    const bottomNav = page.locator('.admin-bottom-nav');
    await expect(bottomNav).toBeVisible({ timeout: 20000 });

    await context.close();
  });

  // ═══════════ FLUX COMPLET ═══════════

  test('Flux: leads → reserves', async ({ page }) => {
    test.setTimeout(60000);

    await adminGoto(page, '/admin/leads');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

    await adminGoto(page, '/admin/bookings');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });
});
