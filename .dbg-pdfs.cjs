const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const AUTH = 'Basic ' + Buffer.from('orbita:Orbitaevents040120+++').toString('base64');
const OUT = path.join(__dirname, '.codex-captures');

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const DOCS = [
  { id: 'pressupost', label: 'Pressupost' },
  { id: 'contracte',  label: 'Contracte' },
  { id: 'cataleg',    label: 'Catàleg' },
  { id: 'informe',    label: 'Informe' },
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    extraHTTPHeaders: { Authorization: AUTH },
    viewport: { width: 1400, height: 1100 },
    deviceScaleFactor: 2,
  });

  for (const doc of DOCS) {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/admin/studio`, { waitUntil: 'networkidle', timeout: 30000 });

    // Clica el botó del document
    const btn = page.locator(`.o-pdf-switch button`, { hasText: doc.label }).first();
    await btn.click();
    await page.waitForTimeout(3000);

    // Scroll a la zona del PDF
    await page.evaluate(() => {
      const wrap = document.querySelector('.o-pdfdoc-wrap');
      if (wrap) wrap.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(500);

    // Captura el wrap del PDF
    const wrap = page.locator('.o-pdfdoc-wrap').first();
    const file = path.join(OUT, `pdf-${doc.id}.png`);
    await wrap.screenshot({ path: file });
    console.log('OK', doc.id);
    await page.close();
  }

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
