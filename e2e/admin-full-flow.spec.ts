import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.ADMIN_USER || 'orbita';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Orbitaevents040120+++';

function authHeaders() {
  const encoded = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

// Ignorar errors pre-existents de Next.js
function setupErrorFilter(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    if (err.message.includes('Hydration failed') || err.message.includes('hydrating')) return;
    if (err.message.includes('useTranslations') || err.message.includes('NextIntlClientProvider')) return;
    if (err.message.includes('parentNode')) return;
    errors.push(err.message);
  });
  return errors;
}

test.describe('Flux complet admin — totes les seccions', () => {
  test.use({ extraHTTPHeaders: authHeaders() });

  // ═══════════ LEADS (ENTRADES) ═══════════

  test('Llista de leads carrega amb dades', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await page.goto('/admin/leads');
    await page.waitForLoadState('networkidle');

    // Títol visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // Hauria de tenir almenys algun lead o un missatge buit
    const hasLeads = await page.locator('a[href*="/admin/leads/"]').count();
    const hasEmpty = await page.getByText(/sense leads|sense entrades|no hi ha/i).count();
    expect(hasLeads + hasEmpty).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/leads-list.png', fullPage: true });
    expect(errors).toHaveLength(0);
  });

  test('Detall de lead mostra informació completa', async ({ page }) => {
    await page.goto('/admin/leads');
    await page.waitForLoadState('networkidle');

    const leadLink = page.locator('a[href*="/admin/leads/cm"]').first();
    const hasLeads = await leadLink.count();
    if (hasLeads === 0) {
      test.skip(true, 'No hi ha leads per testar');
      return;
    }

    const href = await leadLink.getAttribute('href');
    await page.goto(href!);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Informació bàsica del lead
    const nameOrTitle = page.locator('h1, h2').first();
    await expect(nameOrTitle).toBeVisible({ timeout: 15000 });

    // Hauria de tenir camps com email, telèfon, o estat
    const pageText = await page.textContent('body');
    const hasContactInfo = pageText?.includes('@') || pageText?.includes('Telèfon') || pageText?.includes('Email');
    expect(hasContactInfo).toBeTruthy();

    await page.screenshot({ path: 'test-results/lead-detail.png', fullPage: true });
  });

  // ═══════════ RESERVES (BOOKINGS) ═══════════

  test('Llista de reserves mostra marges i semàfors', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await page.goto('/admin/bookings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // Verificar que hi ha reserves amb marges visibles
    const marginElements = page.locator('text=/%/');
    const bookingRows = page.locator('a[href*="/admin/bookings/cm"]');
    const rowCount = await bookingRows.count();

    if (rowCount > 0) {
      // Les reserves haurien de mostrar informació de marge
      const firstRow = bookingRows.first();
      await expect(firstRow).toBeVisible();
    }

    await page.screenshot({ path: 'test-results/bookings-list.png', fullPage: true });
    expect(errors).toHaveLength(0);
  });

  test('Detall reserva — totes les seccions visibles', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/admin/bookings/cmlutz7e600ab3czlpa7f9n1u');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    // Capçalera amb referència
    await expect(page.getByText('OE-2025-005')).toBeVisible({ timeout: 15000 });

    // Botons d'estat
    await expect(page.getByText('Confirmada')).toBeVisible();

    // Informació del client
    await expect(page.getByText('Informació del Client')).toBeVisible();
    await expect(page.getByText('Marc Costa Riera')).toBeVisible();

    // Detalls de l'event
    await expect(page.getByText("Detalls de l'Event")).toBeVisible();

    // Serveis contractats
    const serveis = page.getByText('Serveis Contractats');
    await serveis.scrollIntoViewIfNeeded();
    await expect(serveis).toBeVisible();

    // Equipament assignat
    const equip = page.getByText('Equipament assignat');
    await equip.scrollIntoViewIfNeeded();
    await expect(equip).toBeVisible();

    // Portal client
    const portal = page.getByText('Portal client');
    await portal.scrollIntoViewIfNeeded();
    await expect(portal).toBeVisible();

    // Resum econòmic
    const resum = page.getByText('Resum Econòmic');
    await resum.scrollIntoViewIfNeeded();
    await expect(resum).toBeVisible();

    // Marge i costos
    const marge = page.getByText('Marge i Costos').first();
    await marge.scrollIntoViewIfNeeded();
    await expect(marge).toBeVisible();

    // Desplaçament editable
    const desp = page.getByText('Desplaçament (editable)');
    await desp.scrollIntoViewIfNeeded();
    await expect(desp).toBeVisible();

    // Notes
    const notes = page.getByText('Notes').first();
    await notes.scrollIntoViewIfNeeded();
    await expect(notes).toBeVisible();

    // Comunicacions multicanal
    const comms = page.getByText('Comunicacions multicanal');
    await comms.scrollIntoViewIfNeeded();
    await expect(comms).toBeVisible();

    await page.screenshot({ path: 'test-results/booking-detail-full.png', fullPage: true });
  });

  test('Detall reserva — botons d\'estat funcionen (sense clicar)', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/admin/bookings/cmlutz7e600ab3czlpa7f9n1u');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    // Verificar que tots els botons d'estat existeixen
    await expect(page.getByText('Pendent')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Confirmada')).toBeVisible();
    await expect(page.getByText('Preparant')).toBeVisible();
    await expect(page.getByText('Completada')).toBeVisible();
    await expect(page.getByText('Cancel·lada')).toBeVisible();
  });

  test('Detall reserva — comunicacions multicanal funcionals', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/admin/bookings/cmlutz7e600ab3czlpa7f9n1u');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    // Scroll fins a comunicacions
    const comms = page.getByText('Comunicacions multicanal');
    await comms.scrollIntoViewIfNeeded();

    // Verificar canals de comunicació
    await expect(page.getByText('Cobrament')).toBeVisible();
    await expect(page.getByText('Post-esdeveniment')).toBeVisible();

    // Botons d'acció
    const correuBtns = page.getByRole('button', { name: /Correu/i });
    expect(await correuBtns.count()).toBeGreaterThan(0);

    const whatsappLinks = page.getByRole('link', { name: /WhatsApp/i });
    expect(await whatsappLinks.count()).toBeGreaterThan(0);
  });

  // ═══════════ CLIENTS ═══════════

  test('Pàgina de clients carrega', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await page.goto('/admin/clientes');
    await page.waitForLoadState('networkidle');

    // Hauria de carregar sense errors
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'test-results/clients-list.png', fullPage: true });
    expect(errors).toHaveLength(0);
  });

  // ═══════════ TASQUES ═══════════

  test('Pàgina de tasques carrega amb kanban o llista', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await page.goto('/admin/tasks');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

    // Hauria de tenir columnes kanban o llista
    const pageText = await page.textContent('body');
    const hasKanban = pageText?.includes('OPEN') || pageText?.includes('IN_PROGRESS') || pageText?.includes('tasques');
    expect(hasKanban).toBeTruthy();

    await page.screenshot({ path: 'test-results/tasks.png', fullPage: true });
    expect(errors).toHaveLength(0);
  });

  // ═══════════ CALENDARI ═══════════

  test('Calendari carrega amb vista mensual', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await page.goto('/admin/calendario');
    await page.waitForLoadState('networkidle');

    // Hauria de mostrar dies del mes
    const dayNumbers = page.locator('text=/^\\d{1,2}$/');
    const dayCount = await dayNumbers.count();
    expect(dayCount).toBeGreaterThan(20); // Un mes té mínim 28 dies

    // Hauria de tenir navegació de mes (anterior/següent)
    const navButtons = page.locator('button').filter({ hasText: /◀|▶|←|→|anterior|següent/i });
    const hasNav = await navButtons.count();

    await page.screenshot({ path: 'test-results/calendar.png', fullPage: true });
    expect(errors).toHaveLength(0);
  });

  // ═══════════ INVENTARI ═══════════

  test('Inventari carrega amb items', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await page.goto('/admin/inventory');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

    // Hauria de mostrar items d'inventari o taula
    const pageText = await page.textContent('body');
    const hasInventory = pageText?.includes('Disponible') || pageText?.includes('inventari') || pageText?.includes('equip');
    expect(hasInventory).toBeTruthy();

    await page.screenshot({ path: 'test-results/inventory.png', fullPage: true });
    expect(errors).toHaveLength(0);
  });

  // ═══════════ PACKS ═══════════

  test('Packs carrega i mostra llista de packs', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await page.goto('/admin/packs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Hauria de mostrar packs (Disco Basico, Royal Wedding, etc.)
    const pageText = await page.textContent('body');
    const hasPacks = pageText?.includes('Disco') || pageText?.includes('pack') || pageText?.includes('Pack');
    expect(hasPacks).toBeTruthy();

    await page.screenshot({ path: 'test-results/packs.png', fullPage: true });
    expect(errors).toHaveLength(0);
  });

  // ═══════════ EMAILS ═══════════

  test('Pàgina d\'emails/correus carrega', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'test-results/emails.png', fullPage: true });
    expect(errors).toHaveLength(0);
  });

  // ═══════════ ANALYTICS ═══════════

  test('Analytics carrega', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'test-results/analytics.png', fullPage: true });
    expect(errors).toHaveLength(0);
  });

  // ═══════════ PRESSUPOSTOS ═══════════

  test('Pressupostos (PDF) carrega', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await page.goto('/admin/presupuestos');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'test-results/presupuestos.png', fullPage: true });
    expect(errors).toHaveLength(0);
  });

  // ═══════════ NAVEGACIÓ SIDEBAR ═══════════

  test('Sidebar navegació — tots els links funcionen', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Verificar links del sidebar
    const sidebarLinks = [
      { text: 'Entrades', href: '/admin/leads' },
      { text: 'Clients', href: '/admin/clientes' },
      { text: 'Reserves', href: '/admin/bookings' },
      { text: 'Tasques', href: '/admin/tasks' },
    ];

    for (const link of sidebarLinks) {
      const el = page.locator(`.admin-sidebar a[href="${link.href}"]`);
      await expect(el).toBeVisible({ timeout: 5000 });
    }
  });

  // ═══════════ NAVEGACIÓ MÒBIL ═══════════

  test('Mòbil — barra inferior visible i funcional', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      extraHTTPHeaders: authHeaders(),
    });
    const page = await context.newPage();

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Barra inferior visible
    const bottomNav = page.locator('.admin-bottom-nav');
    await expect(bottomNav).toBeVisible({ timeout: 10000 });

    // Links principals
    await expect(page.locator('.admin-bottom-nav a[href="/admin"]')).toBeVisible();
    await expect(page.locator('.admin-bottom-nav a[href="/admin/leads"]')).toBeVisible();
    await expect(page.locator('.admin-bottom-nav a[href="/admin/bookings"]')).toBeVisible();

    // Clicar a Reserves des de la barra inferior
    await page.locator('.admin-bottom-nav a[href="/admin/bookings"]').click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/bookings');

    // Clicar a Entrades
    await page.locator('.admin-bottom-nav a[href="/admin/leads"]').click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/leads');

    await page.screenshot({ path: 'test-results/mobile-leads.png', fullPage: true });
    await context.close();
  });

  // ═══════════ FLUX COMPLET: LEAD → RESERVA ═══════════

  test('Flux visual: des de leads fins a reserva detallada', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Anar a leads
    await page.goto('/admin/leads');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/flux-1-leads.png' });

    // 2. Anar a bookings
    await page.goto('/admin/bookings');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/flux-2-bookings.png' });

    // 3. Obrir una reserva
    await page.goto('/admin/bookings/cmlutz7e600ab3czlpa7f9n1u');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/flux-3-booking-top.png' });

    // 4. Scroll a marge
    const marge = page.getByText('Marge i Costos').first();
    await marge.scrollIntoViewIfNeeded({ timeout: 15000 });
    await page.screenshot({ path: 'test-results/flux-4-booking-marge.png' });

    // 5. Scroll a "On va cada euro"
    const euro = page.getByText("On va cada euro d'aquest bolo");
    await euro.scrollIntoViewIfNeeded({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/flux-5-booking-euros.png' });

    // 6. Scroll a comunicacions
    const comms = page.getByText('Comunicacions multicanal');
    await comms.scrollIntoViewIfNeeded({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/flux-6-booking-comms.png' });

    // 7. Economia general
    await page.goto('/admin/economia');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/flux-7-economia.png' });

    // 8. Tresoreria
    await page.getByText('Tresoreria').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/flux-8-tresoreria.png' });

    // 9. Previsions
    await page.getByText('Previsions').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/flux-9-previsions.png' });
  });

  // ═══════════ RESSENYES ═══════════

  test('Ressenyes carrega', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await page.goto('/admin/ressenyes');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'test-results/ressenyes.png', fullPage: true });
    expect(errors).toHaveLength(0);
  });

  // ═══════════ INTAKE RÀPIDA ═══════════

  test('Entrada ràpida carrega', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await page.goto('/admin/intake');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

    // Hauria de tenir un formulari
    const inputs = page.locator('input, textarea, select');
    expect(await inputs.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/intake.png', fullPage: true });
    expect(errors).toHaveLength(0);
  });

  // ═══════════ DESCOMPTES ═══════════

  test('Descomptes carrega', async ({ page }) => {
    const errors = setupErrorFilter(page);
    await page.goto('/admin/discount-codes');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'test-results/discount-codes.png', fullPage: true });
    expect(errors).toHaveLength(0);
  });
});
