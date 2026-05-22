#!/usr/bin/env node
/**
 * audit:visual
 *
 * Recorre les pàgines clau de l'admin i el lloc públic, captura cadascuna
 * a desktop (1440x900) i mòbil (375x812), i genera un informe HTML amb
 * totes les imatges. Pensat per a una primera lectura visual ràpida del
 * sistema sencer.
 *
 * Ús: pnpm run audit:visual
 *
 * Requereix dev server actiu a http://localhost:3000.
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

// Carrega .env i .env.local manualment per garantir ADMIN_USER/ADMIN_PASS
async function loadEnv() {
  const candidates = ['.env.local', '.env'];
  for (const file of candidates) {
    try {
      const text = await fs.readFile(path.join(process.cwd(), file), 'utf8');
      for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq < 0) continue;
        const key = line.slice(0, eq).trim();
        let val = line.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = val;
      }
    } catch {}
  }
}

await loadEnv();

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'audit', 'screenshots');
const REPORT = path.join(ROOT, 'audit', 'visual-report.html');
const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const USER = process.env.ADMIN_USER || 'orbita';
const PASS = process.env.ADMIN_PASS || '';
const TOKEN = Buffer.from(`${USER}:${PASS}`).toString('base64');

if (!PASS) {
  console.error('ADMIN_PASS no definit (revisa .env.local).');
  process.exit(1);
}

const PAGES = [
  // Públic principal (català)
  { id: 'home-ca', url: '/ca', label: 'Home (CA)', auth: false, group: 'Públic' },
  { id: 'home-es', url: '/es', label: 'Home (ES)', auth: false, group: 'Públic' },
  { id: 'home-en', url: '/en', label: 'Home (EN)', auth: false, group: 'Públic' },
  { id: 'packs', url: '/ca/packs', label: 'Packs', auth: false, group: 'Públic' },
  { id: 'servicios-index', url: '/ca/servicios', label: 'Serveis (hub)', auth: false, group: 'Públic' },
  { id: 'serveis-bodas', url: '/ca/servicios/bodas', label: 'Servei · Bodes', auth: false, group: 'Públic' },
  { id: 'serveis-fiestas', url: '/ca/servicios/fiestas', label: 'Servei · Festes', auth: false, group: 'Públic' },
  { id: 'serveis-discomovil', url: '/ca/servicios/discomovil', label: 'Servei · Discomòbil', auth: false, group: 'Públic' },
  { id: 'serveis-empresas', url: '/ca/servicios/empresas', label: 'Servei · Empreses', auth: false, group: 'Públic' },
  { id: 'portfolio', url: '/ca/portfolio', label: 'Portfolio', auth: false, group: 'Públic' },
  { id: 'experiencias', url: '/ca/experiencias', label: 'Experiències', auth: false, group: 'Públic' },
  { id: 'configurador', url: '/ca/configurador', label: 'Configurador', auth: false, group: 'Públic' },
  { id: 'contacte', url: '/ca/contacto', label: 'Contacte', auth: false, group: 'Públic' },
  { id: 'opinions', url: '/ca/opiniones', label: 'Opinions', auth: false, group: 'Públic' },
  { id: 'about', url: '/ca/about', label: 'About', auth: false, group: 'Públic' },
  { id: 'faq', url: '/ca/faq', label: 'FAQ', auth: false, group: 'Públic' },
  { id: 'blog', url: '/ca/blog', label: 'Blog', auth: false, group: 'Públic' },
  { id: 'reservar', url: '/ca/reservar', label: 'Reservar', auth: false, group: 'Públic' },

  // Admin: workspaces principals
  { id: 'admin-dashboard', url: '/admin', label: 'Dashboard', auth: true, group: 'Admin' },
  { id: 'admin-leads', url: '/admin/leads', label: 'Leads', auth: true, group: 'Admin' },
  { id: 'admin-clientes', url: '/admin/clientes', label: 'Clientes', auth: true, group: 'Admin' },
  { id: 'admin-bookings', url: '/admin/bookings', label: 'Bookings', auth: true, group: 'Admin' },
  { id: 'admin-calendario', url: '/admin/calendario', label: 'Calendari', auth: true, group: 'Admin' },
  { id: 'admin-tasks', url: '/admin/tasks', label: 'Tasks', auth: true, group: 'Admin' },
  { id: 'admin-inbox', url: '/admin/inbox', label: 'Inbox', auth: true, group: 'Admin' },
  { id: 'admin-presupuestos', url: '/admin/presupuestos', label: 'Presupuestos', auth: true, group: 'Admin' },
  { id: 'admin-economia', url: '/admin/economia', label: 'Economia', auth: true, group: 'Admin' },
  { id: 'admin-reporting', url: '/admin/reporting', label: 'Reporting', auth: true, group: 'Admin' },
  { id: 'admin-packs', url: '/admin/packs', label: 'Packs', auth: true, group: 'Admin' },
  { id: 'admin-inventory', url: '/admin/inventory', label: 'Inventari', auth: true, group: 'Admin' },
  { id: 'admin-social', url: '/admin/social', label: 'Social', auth: true, group: 'Admin' },
  { id: 'admin-marketing', url: '/admin/marketing', label: 'Marketing', auth: true, group: 'Admin' },
  { id: 'admin-portfolio', url: '/admin/portfolio', label: 'Portfolio (admin)', auth: true, group: 'Admin' },
  { id: 'admin-emails', url: '/admin/emails', label: 'Emails', auth: true, group: 'Admin' },
  { id: 'admin-post-event', url: '/admin/post-event', label: 'Post-event', auth: true, group: 'Admin' },
  { id: 'admin-sales-ops', url: '/admin/sales-ops', label: 'Sales Ops', auth: true, group: 'Admin' },
  { id: 'admin-activity', url: '/admin/activity', label: 'Activity', auth: true, group: 'Admin' },
  { id: 'admin-manual', url: '/admin/manual', label: 'Manual', auth: true, group: 'Admin' },
  { id: 'admin-settings', url: '/admin/settings', label: 'Settings', auth: true, group: 'Admin' },
];

const VIEWPORTS = [
  { id: 'desktop', width: 1440, height: 900 },
  { id: 'mobile', width: 375, height: 812 },
];

async function gotoSafe(page, url) {
  // domcontentloaded és més fiable que networkidle a dev (mai s'atura per Sentry/HMR)
  return page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];
  let okCount = 0;
  let failCount = 0;

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      extraHTTPHeaders: { Authorization: `Basic ${TOKEN}` },
      userAgent: vp.id === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        : undefined,
      locale: 'ca-ES',
      // Bypass middleware si en dev s'usa una flag (no esperat però sense impacte si no)
    });

    let i = 0;
    for (const p of PAGES) {
      i++;
      const filename = `${p.id}__${vp.id}.png`;
      const filepath = path.join(OUT_DIR, filename);
      const url = `${BASE}${p.url}`;
      const start = Date.now();
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`console.error: ${msg.text().slice(0, 200)}`);
      });
      try {
        const res = await gotoSafe(page, url);
        const status = res?.status() ?? 0;
        // Espera animacions/lazy + render
        await page.waitForTimeout(p.auth ? 1500 : 1200);
        // Si admin retorna 401, mira si és per Set-Cookie missing — refresca amb header explícit
        await page.screenshot({ path: filepath, fullPage: true });
        const elapsed = Date.now() - start;
        results.push({ ...p, viewport: vp.id, status, ok: status >= 200 && status < 400, elapsed, file: filename, errors });
        if (status >= 200 && status < 400) okCount++; else failCount++;
        process.stdout.write(`[${vp.id} ${i.toString().padStart(2)}/${PAGES.length}] ${status} ${url} (${elapsed}ms)${errors.length ? ` · ${errors.length} js err` : ''}\n`);
      } catch (err) {
        const elapsed = Date.now() - start;
        results.push({ ...p, viewport: vp.id, status: 0, ok: false, elapsed, file: null, errors: [`navigation: ${err.message}`] });
        failCount++;
        process.stdout.write(`[${vp.id} ${i.toString().padStart(2)}/${PAGES.length}] ERR ${url}: ${err.message}\n`);
      } finally {
        await page.close();
      }
      // Throttle suau per evitar 429 a admin
      if (p.auth) await new Promise((r) => setTimeout(r, 400));
    }
    await ctx.close();
  }

  await browser.close();

  // Agrupa per pàgina i genera HTML
  const groupedByPage = {};
  for (const r of results) {
    if (!groupedByPage[r.id]) groupedByPage[r.id] = { label: r.label, url: r.url, group: r.group, byViewport: {} };
    groupedByPage[r.id].byViewport[r.viewport] = r;
  }
  // Ordena: Públic primer, Admin després
  const groups = ['Públic', 'Admin'];
  const sectionsHtml = groups.map((groupName) => {
    const pages = Object.entries(groupedByPage).filter(([, g]) => g.group === groupName);
    const items = pages.map(([id, g]) => {
      const cells = VIEWPORTS.map((vp) => {
        const r = g.byViewport[vp.id];
        if (!r) return `<td>—</td>`;
        const cls = r.ok ? 'ok' : 'fail';
        const img = r.file ? `<a href="./screenshots/${r.file}" target="_blank"><img src="./screenshots/${r.file}" alt="${id} ${vp.id}" loading="lazy" /></a>` : '<div class="missing">no img</div>';
        const errBlock = r.errors.length ? `<details class="errs"><summary>${r.errors.length} errors</summary><pre>${r.errors.slice(0, 12).map((e) => e.replace(/</g, '&lt;')).join('\n')}</pre></details>` : '';
        return `<td class="${cls}"><div class="meta">${vp.id} · <strong>${r.status || 'ERR'}</strong> · ${r.elapsed}ms</div>${img}${errBlock}</td>`;
      }).join('');
      return `<section><h2>${g.label}<small>${g.url}</small></h2><table><tr>${cells}</tr></table></section>`;
    }).join('\n');
    return `<div class="group"><h3>${groupName}</h3>${items}</div>`;
  }).join('\n');

  const html = `<!doctype html>
<html lang="ca"><head>
<meta charset="utf-8" />
<title>Auditoria visual · ${new Date().toISOString().slice(0,10)}</title>
<style>
  :root { color-scheme: dark; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; padding: 24px; background:#0b0e14; color:#e6e6f0; }
  h1 { margin: 0 0 8px; font-size: 22px; }
  h3 { margin: 24px 0 12px; color: #5da4ff; border-bottom: 1px solid #1d2434; padding-bottom: 6px; }
  .summary { display:flex; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
  .summary > div { padding: 10px 14px; border-radius: 8px; background:#171b27; }
  .summary .ok { color:#5dffa7; }
  .summary .fail { color:#ff7a8a; }
  section { margin: 16px 0; padding: 14px; background:#10131c; border-radius: 10px; border: 1px solid #222a3a; }
  section h2 { margin: 0 0 10px; font-size: 15px; display:flex; gap:12px; align-items:baseline; }
  section h2 small { color:#7c869c; font-weight: 400; font-size: 12px; }
  table { border-collapse: collapse; width: 100%; }
  td { vertical-align: top; padding: 8px; border:1px solid #1d2434; width: 50%; }
  td.fail { background:#2a1216; border-color:#5a1c25; }
  td.ok { background:#0f1a16; border-color:#1f3a2c; }
  td .meta { font-size: 12px; color:#9aa3b8; margin-bottom:6px; }
  td img { width: 100%; height: auto; border-radius: 6px; border:1px solid #222a3a; display: block; }
  td .missing { padding:24px; text-align:center; color:#ff7a8a; }
  details.errs { margin-top: 8px; }
  details.errs summary { color:#ffb86b; cursor:pointer; font-size:12px; }
  details.errs pre { background:#1a1010; padding:8px; border-radius:6px; max-height:200px; overflow:auto; font-size:11px; color:#ffd4d4; }
</style></head>
<body>
<h1>Auditoria visual Òrbita Events</h1>
<div class="summary">
  <div>Generat: <strong>${new Date().toLocaleString('ca-ES')}</strong></div>
  <div class="ok">OK: <strong>${okCount}</strong></div>
  <div class="fail">Fall: <strong>${failCount}</strong></div>
  <div>Pàgines: <strong>${PAGES.length}</strong> · viewports: <strong>${VIEWPORTS.length}</strong></div>
</div>
${sectionsHtml}
</body></html>`;
  await fs.mkdir(path.dirname(REPORT), { recursive: true });
  await fs.writeFile(REPORT, html, 'utf8');

  process.stdout.write(`\nGenerat: ${path.relative(ROOT, REPORT)}\n`);
  process.stdout.write(`OK: ${okCount} · Fall: ${failCount}\n`);
}

main().catch((err) => {
  console.error('audit:visual ha petat:', err);
  process.exit(1);
});
