import { test, expect } from '@playwright/test';

const GOTO_OPTIONS = { waitUntil: 'domcontentloaded' as const, timeout: 60000 };

test.describe('Pàgines públiques — navegació i contingut', () => {
  // ═══════════ PÀGINES PRINCIPALS ═══════════

  const publicPages = [
    { path: '/ca', name: 'Home CA', mustContain: /dj|orbita|event/i },
    { path: '/es', name: 'Home ES', mustContain: /dj|orbita|event/i },
    { path: '/en', name: 'Home EN', mustContain: /dj|orbita|event/i },
    { path: '/ca/contacto', name: 'Contacte', mustContain: /contact/i },
    { path: '/ca/about', name: 'Sobre nosaltres', mustContain: /orbita|equip|sobre/i },
    { path: '/ca/faq', name: 'FAQ', mustContain: /preg|faq|freq/i },
    { path: '/ca/portfolio', name: 'Portfolio', mustContain: /portfolio|galeria|treballs/i },
  ];

  for (const pg of publicPages) {
    test(`${pg.name} (${pg.path}) carrega amb contingut`, async ({ page }) => {
      await page.goto(pg.path, GOTO_OPTIONS);

      const pageText = await page.textContent('body');
      expect(pageText).toMatch(pg.mustContain);
    });
  }

  // ═══════════ SERVEIS ═══════════

  const servicePages = [
    { path: '/ca/servicios/bodas', name: 'Bodes' },
    { path: '/ca/servicios/fiestas', name: 'Festes' },
    { path: '/ca/servicios/empresas', name: 'Empreses' },
    { path: '/ca/servicios/discomovil', name: 'Discomòvil' },
  ];

  for (const pg of servicePages) {
    test(`Servei ${pg.name} carrega`, async ({ page }) => {
      await page.goto(pg.path, GOTO_OPTIONS);

      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

      // Ha de tenir packs o CTA
      const pageText = await page.textContent('body');
      const hasContent = pageText?.toLowerCase().includes('pack') ||
        pageText?.toLowerCase().includes('preu') ||
        pageText?.toLowerCase().includes('price') ||
        pageText?.toLowerCase().includes('reserva');
      expect(hasContent).toBeTruthy();
    });
  }

  // ═══════════ LEGALS ═══════════

  const legalPages = [
    { path: '/ca/legal/privacidad', name: 'Privacitat' },
    { path: '/ca/legal/cookies', name: 'Cookies' },
    { path: '/ca/legal/aviso-legal', name: 'Avís legal' },
    { path: '/ca/legal/terminos', name: 'Termes' },
  ];

  for (const pg of legalPages) {
    test(`Legal ${pg.name} carrega`, async ({ page }) => {
      await page.goto(pg.path, GOTO_OPTIONS);

      const pageText = await page.textContent('body');
      expect(pageText?.length).toBeGreaterThan(100);
    });
  }

  // ═══════════ CONFIGURADOR ═══════════

  test('Configurador públic carrega', async ({ page }) => {
    await page.goto('/ca/configurador', GOTO_OPTIONS);

    // Ha de tenir selecció de servei o pack
    const pageText = await page.textContent('body');
    const hasConfigurator = pageText?.toLowerCase().includes('configura') ||
      pageText?.toLowerCase().includes('personalitza') ||
      pageText?.toLowerCase().includes('pack') ||
      pageText?.toLowerCase().includes('servei');
    expect(hasConfigurator).toBeTruthy();
  });

  // ═══════════ EXPERIÈNCIES ═══════════

  test('Experiències carrega', async ({ page }) => {
    await page.goto('/ca/experiencias', GOTO_OPTIONS);

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
  });

  // ═══════════ i18n ═══════════

  test('Canvi d\'idioma funciona', async ({ page }) => {
    await page.goto('/ca', GOTO_OPTIONS);

    // Busca selector d'idioma o link a versió ES
    const esLink = page.locator('a[href*="/es"]').first();
    if ((await esLink.count()) > 0) {
      await esLink.click();
      await page.waitForLoadState('domcontentloaded');

      expect(page.url()).toContain('/es');
    }
  });

  // ═══════════ 404 ═══════════

  test('Pàgina 404 mostra error amigable', async ({ page }) => {
    const res = await page.goto('/ca/paginaquenohiha', GOTO_OPTIONS);

    // Pot ser 404 o redirect
    if (res && res.status() === 404) {
      const pageText = await page.textContent('body');
      expect(pageText?.length).toBeGreaterThan(10);
    }
  });

  // ═══════════ RENDIMENT BÀSIC ═══════════

  test('Homepage carrega en menys de 10s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', GOTO_OPTIONS);
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(10000);
  });

  // ═══════════ ACCESSIBILITAT BÀSICA ═══════════

  test('Homepage té landmarks ARIA', async ({ page }) => {
    await page.goto('/', GOTO_OPTIONS);

    // Ha de tenir main o nav
    const main = page.locator('main, [role="main"]');
    const nav = page.locator('nav, [role="navigation"]');

    const hasMain = (await main.count()) > 0;
    const hasNav = (await nav.count()) > 0;

    expect(hasMain || hasNav).toBeTruthy();
  });

  test('Imatges tenen alt text', async ({ page }) => {
    await page.goto('/', GOTO_OPTIONS);

    const images = page.locator('img');
    const count = await images.count();

    let imagesWithAlt = 0;
    for (let i = 0; i < Math.min(count, 15); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      if (alt !== null) imagesWithAlt++;
    }

    // Almenys 80% de les imatges han de tenir alt
    const checkedCount = Math.min(count, 15);
    if (checkedCount > 0) {
      expect(imagesWithAlt / checkedCount).toBeGreaterThanOrEqual(0.8);
    }
  });
});
