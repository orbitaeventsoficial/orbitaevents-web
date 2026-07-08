const { chromium } = require('playwright');

(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  const url = 'http://localhost:3000/admin/leads/cmr1xh7la0000ug7dj4jnihjr';
  const results = [];
  const check = (name, ok) => { results.push(`${ok ? 'OK ' : 'FAIL'} ${name}`); };

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('#lead-repartiment', { timeout: 60000 });

  // 1. Estat inicial: pendent de validar
  const validarBtn = page.getByRole('button', { name: 'Validar pacte' });
  check('botó «Validar pacte» visible', await validarBtn.isVisible());
  const dossierBtn = page.getByRole('button', { name: 'Crear dossier' });
  check('«Crear dossier» NO primari (pendent)', !((await dossierBtn.getAttribute('class')) || '').includes('ap-btn--primary'));
  check('microcopy mana validar', await page.getByText('Valida el pacte amb el partner; el dossier és el pas següent.').isVisible());

  // 2. Validar
  await validarBtn.click();
  await page.waitForSelector('button:has-text("Desfer validació")', { timeout: 20000 });
  check('apareix «Desfer validació»', true);
  check('capçalera diu «validat el …»', await page.getByText(/^validat el /).isVisible());
  check('«Crear dossier» primari (validat)', (((await dossierBtn.getAttribute('class')) || '').includes('ap-btn--primary')));
  check('rail diu «Pacte validat»', await page.getByText('Pacte validat', { exact: true }).isVisible());
  await page.screenshot({ path: '.codex-captures/manolo-pacte-validat.png', fullPage: false });

  // 3. Persistència real: recàrrega → l'estat ve del servidor
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#lead-repartiment', { timeout: 60000 });
  check('persistit després de recarregar', await page.getByRole('button', { name: 'Desfer validació' }).isVisible());

  // 4. Restaurar l'estat original del lead (BD real: no deixem rastre de prova)
  await page.getByRole('button', { name: 'Desfer validació' }).click();
  await page.waitForSelector('button:has-text("Validar pacte")', { timeout: 20000 });
  check('desfer torna a estat pendent', true);

  console.log(results.join('\n'));
  const failed = results.filter((r) => r.startsWith('FAIL')).length;
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
