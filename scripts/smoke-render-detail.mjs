#!/usr/bin/env node
/**
 * qa:smoke-detail — RENDER de les rutes admin DINÀMIQUES (`[param]`).
 *
 * `qa:smoke` (smoke-render.mjs) descobreix automàticament les pàgines admin
 * ESTÀTIQUES però SALTA les `[param]` perquè calen ids reals (vegeu el seu
 * comentari de capçalera). Resultat: les fitxes més riques i pesades de l'admin
 * (booking/lead/client/inventory/pack detall…) MAI es renderitzaven a CI/local.
 *
 * Aquest guard tapa el punt cec: resol un id real per Prisma per a cada model,
 * mapeja cada dir `[param]` a la seva URL i renderitza als 3 breakpoints,
 * FALLA amb status>=400, overflow horitzontal o error de runtime.
 *
 * Requereix dev server viu a localhost:3000 i accés a la BD (mateix que qa:smoke).
 * No va a validate:core (cal server + BD). Ús: pnpm run qa:smoke-detail
 */
const DIRECT_INVOCATION = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('smoke-render-detail.mjs');

const fs = await import('node:fs');
const path = await import('node:path');
const { createRequire } = await import('node:module');

const ROOT = process.cwd();
const BASE = process.env.SMOKE_BASE || 'http://localhost:3000';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      for (const line of fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
        if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    } catch { /* opcional */ }
  }
}
loadEnv();

/**
 * Rutes `[param]` cobertes per aquest smoke (font única). El guard estàtic
 * `check-smoke-detail-coverage.mjs` compara aquesta llista amb el filesystem i
 * falla si apareix una ruta `[param]` nova sense cobertura — així el punt cec
 * no es reobre silenciosament quan algú afegeix una fitxa detall.
 */
export const COVERED_PARAM_ROUTES = [
  '/admin/bookings/[id]',
  '/admin/leads/[id]',
  '/admin/clientes/[id]',
  '/admin/collaborators/[id]',
  '/admin/inventory/[id]',
  '/admin/packs/[id]',
  '/admin/blog/edit/[id]',
  '/admin/faq/[id]',
  '/admin/presupuestos/[id]',
  '/admin/questionnaires/[id]',
  '/admin/email-templates/[slug]',
];

const DATA_TARGETS = [
  ['/admin/bookings/[id]', 'bookings', (id) => `/admin/bookings/${id}`],
  ['/admin/leads/[id]', 'leads', (id) => `/admin/leads/${id}`],
  ['/admin/clientes/[id]', 'customers', (id) => `/admin/clientes/${id}`],
  ['/admin/collaborators/[id]', 'collaborators', (id) => `/admin/collaborators/${id}`],
  ['/admin/inventory/[id]', 'inventory_items', (id) => `/admin/inventory/${id}`],
  ['/admin/packs/[id]', 'packs', (id) => `/admin/packs/${id}`],
  ['/admin/blog/edit/[id]', 'blog_posts', (id) => `/admin/blog/edit/${id}`],
  ['/admin/faq/[id]', 'faqs', (id) => `/admin/faq/${id}`],
  ['/admin/presupuestos/[id]', 'proposals', (id) => `/admin/presupuestos/${id}`],
  ['/admin/questionnaires/[id]', 'questionnaire_templates', (id) => `/admin/questionnaires/${id}`],
];

// Mapeig dir `[param]` → builder d'URL amb id real. Si el resolver torna null
// (taula buida), la ruta s'OMET amb avís (no és fallada: és manca de dades).
export async function resolveTargets() {
  const require = createRequire(import.meta.url);
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const targets = [];
  try {
    for (const [label, table, buildUrl] of DATA_TARGETS) {
      const result = await client.query(`SELECT id FROM ${table} LIMIT 1`);
      const id = result.rows[0]?.id ?? null;
      targets.push([label, id ? buildUrl(id) : null]);
    }
  } finally {
    await client.end();
  }

  return [
    ...targets,
    ['/admin/email-templates/[slug]', '/admin/email-templates/booking_confirmation'],
  ];
}

const VIEWPORTS = [[1440, 'desktop'], [768, 'tablet'], [390, 'mobile']];

// Només executa el render quan s'invoca directament (no quan s'importa
// `COVERED_PARAM_ROUTES` des del guard de cobertura).
const INVOKED_DIRECTLY = DIRECT_INVOCATION;

async function run() {
  const targets = await resolveTargets();

  const token = Buffer.from(
    `${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || ''}`,
  ).toString('base64');
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { Authorization: `Basic ${token}` },
  });

  const failures = [];
  const skipped = [];
  const allowedEmpty = new Set(['/admin/questionnaires/[id]']);
  let rendered = 0;
  for (const [label, url] of targets) {
    if (!url) {
      skipped.push(label);
      if (!allowedEmpty.has(label)) failures.push(`${label} -> sense id de dades de prova`);
      continue;
    }
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message.split('\n')[0].slice(0, 80)));
    for (const [w, name] of VIEWPORTS) {
      await page.setViewportSize({ width: w, height: 900 });
      try {
        const res = await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForTimeout(1500);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
        if (res.status() >= 400) failures.push(`${label} [${name}] → HTTP ${res.status()}`);
        if (overflow) failures.push(`${label} [${name}] → overflow horitzontal`);
      } catch (e) {
        failures.push(`${label} [${name}] → ${e.message.slice(0, 60)}`);
      }
    }
    if (errors.length) failures.push(`${label} → runtime error: ${errors[0]}`);
    rendered++;
    await page.close();
  }
  await browser.close();

  process.stdout.write(`[smoke-detail] ${rendered} rutes [param] × ${VIEWPORTS.length} breakpoints verificades.\n`);
  if (skipped.length) process.stdout.write(`[smoke-detail] ${skipped.length} omeses (taula buida): ${skipped.join(', ')}\n`);
  if (failures.length) {
    process.stderr.write(`[smoke-detail] FAIL: ${failures.length} problema(es):\n`);
    for (const f of failures) process.stderr.write(`  ${f}\n`);
    process.exit(1);
  }
  process.stdout.write('[smoke-detail] OK: totes renderitzen sense errors, 0 overflow als 3 breakpoints.\n');
}

if (INVOKED_DIRECTLY) {
  run();
} else {
  // Importat només per la constant de cobertura: no obre cap connexió Prisma.
}
