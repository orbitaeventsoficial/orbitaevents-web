const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    extraHTTPHeaders: { Authorization: `Basic ${token}` },
  });
  const page = await ctx.newPage();
  page.on('console', (m) => console.log('PAGE:', m.text()));
  page.on('pageerror', (e) => console.log('PAGEERR:', e.message));

  const URL = 'http://localhost:3000/admin/bookings/new?leadId=cmpwudznj00g3vigky4altclu';
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000); // espera prefill

  // Buscar el camp d'ubicació (eventLocation). Provo diversos selectors.
  const locInput = page.locator('input').filter({ hasNot: page.locator('[type=checkbox]') });
  // Escric un valor reconeixible al camp "Ubicació". Busco per label proper o placeholder.
  const candidates = await page.locator('input[type="text"], input:not([type])').all();
  console.log('TOTAL inputs text:', candidates.length);

  // Marca: escriure a TOTS els inputs de text buits un valor de prova no, millor el d'ubicació.
  // Provem omplir el camp que contingui "ubicació"/"lloc" via label.
  let filled = false;
  for (const inp of candidates) {
    const val = await inp.inputValue().catch(() => '');
    const ph = await inp.getAttribute('placeholder').catch(() => '');
    const aria = await inp.getAttribute('aria-label').catch(() => '');
    const id = await inp.getAttribute('id').catch(() => '');
    if (/ubicaci|lloc|location/i.test(`${ph} ${aria} ${id}`)) {
      await inp.fill('ZONA DEPORTIVA COLLSACREU AUTOSAVE TEST');
      console.log(`OMPLERT camp ubicació (id=${id} ph=${ph} aria=${aria})`);
      filled = true;
      break;
    }
  }
  if (!filled) console.log('NO he trobat camp ubicació — llisto candidats:');
  if (!filled) for (const inp of candidates.slice(0, 15)) {
    console.log(' input id=', await inp.getAttribute('id'), 'ph=', await inp.getAttribute('placeholder'), 'aria=', await inp.getAttribute('aria-label'));
  }

  await page.waitForTimeout(1500); // deixar que debounce desi (600ms)

  // Comprovar què hi ha a localStorage
  const stored = await page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('orbita.autosave.')) out[k] = localStorage.getItem(k)?.slice(0, 200);
    }
    return out;
  });
  console.log('LOCALSTORAGE autosave:', JSON.stringify(stored, null, 2));

  await page.screenshot({ path: '.codex-captures/autosave-1-abans.png', fullPage: true });

  // RECARREGAR
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(11000); // prefill + restore

  // Llegir el valor del camp ubicació després de recarregar
  const after = await page.locator('input[type="text"], input:not([type])').all();
  let restoredVal = '(no trobat)';
  for (const inp of after) {
    const ph = await inp.getAttribute('placeholder').catch(() => '');
    const aria = await inp.getAttribute('aria-label').catch(() => '');
    const id = await inp.getAttribute('id').catch(() => '');
    if (/ubicaci|lloc|location/i.test(`${ph} ${aria} ${id}`)) {
      restoredVal = await inp.inputValue();
      break;
    }
  }
  console.log('VALOR UBICACIÓ DESPRÉS DE RECARREGAR:', JSON.stringify(restoredVal));

  const bannerVisible = await page.getByText(/esborrany/i).count();
  console.log('BANNER esborrany visible?:', bannerVisible > 0);

  await page.screenshot({ path: '.codex-captures/autosave-2-despres.png', fullPage: true });
  await browser.close();
  console.log('DONE');
})();
