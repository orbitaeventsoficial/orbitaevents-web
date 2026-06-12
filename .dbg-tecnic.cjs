const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 2, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE-ERR', m.text()); });
  await page.goto('http://localhost:3000/admin/leads/cmpwudznj00g3vigky4altclu', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);

  // Obre tots els grups del catàleg de proveïdors i clica el primer producte amb "Animació" (duu tècnic)
  const summaries = await page.$$('.fxd__zenith-main summary');
  for (const s of summaries) {
    const t = (await s.innerText()).toLowerCase();
    if (t.includes('serveis de')) { await s.click().catch(() => {}); }
  }
  await page.waitForTimeout(500);
  const before = await page.$$eval('.fxd__zenith-main .nb__sl-row', (r) => r.length);
  // Clica un producte que dugui tècnic (Animació…)
  const items = await page.$$('.fxd__zenith-main .nb__cfg-item');
  let clicked = '';
  for (const it of items) {
    const name = (await it.innerText());
    if (/animaci/i.test(name)) { await it.click(); clicked = name.replace(/\s+/g, ' ').trim(); break; }
  }
  await page.waitForTimeout(800);
  const rows = await page.$$eval('.fxd__zenith-main .nb__sl-row', (rr) => rr.map((r) => r.innerText.replace(/\s+/g, ' ').trim()));
  const hasPayer = await page.$$eval('.fxd__zenith-main .nb__sl-payer', (s) => s.map((x) => x.value + ':' + x.options[x.selectedIndex]?.text));
  console.log('clicked:', clicked);
  console.log('rows abans:', before, '→ després:', rows.length);
  rows.forEach((r, i) => console.log(`  [${i}] ${r}`));
  console.log('selectors tècnic:', JSON.stringify(hasPayer));
  await page.screenshot({ path: '.codex-captures/lead-tecnic.png', fullPage: true });
  await browser.close();
})();
