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
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

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

const prisma = new PrismaClient();

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

// Mapeig dir `[param]` → builder d'URL amb id real. Si el resolver torna null
// (taula buida), la ruta s'OMET amb avís (no és fallada: és manca de dades).
async function resolveTargets() {
  const first = async (fn) => { try { return (await fn())?.id ?? null; } catch { return null; } };
  const [booking, lead, customer, collaborator, inventory, pack, blogPost, faq, proposal, questionnaire] = await Promise.all([
    first(() => prisma.booking.findFirst({ select: { id: true } })),
    first(() => prisma.lead.findFirst({ select: { id: true } })),
    first(() => prisma.customer.findFirst({ select: { id: true } })),
    first(() => prisma.collaborator.findFirst({ select: { id: true } })),
    first(() => prisma.inventoryItem.findFirst({ select: { id: true } })),
    first(() => prisma.pack.findFirst({ select: { id: true } })),
    first(() => prisma.blogPost.findFirst({ select: { id: true } })),
    first(() => prisma.fAQ.findFirst({ select: { id: true } })),
    first(() => prisma.proposal.findFirst({ select: { id: true } })),
    first(() => prisma.questionnaireTemplate.findFirst({ select: { id: true } })),
  ]);
  // slug fix d'email-template (constant de domini, sempre vàlid)
  const def = [
    ['/admin/bookings/[id]', booking && `/admin/bookings/${booking}`],
    ['/admin/leads/[id]', lead && `/admin/leads/${lead}`],
    ['/admin/clientes/[id]', customer && `/admin/clientes/${customer}`],
    ['/admin/collaborators/[id]', collaborator && `/admin/collaborators/${collaborator}`],
    ['/admin/inventory/[id]', inventory && `/admin/inventory/${inventory}`],
    ['/admin/packs/[id]', pack && `/admin/packs/${pack}`],
    ['/admin/blog/edit/[id]', blogPost && `/admin/blog/edit/${blogPost}`],
    ['/admin/faq/[id]', faq && `/admin/faq/${faq}`],
    ['/admin/presupuestos/[id]', proposal && `/admin/presupuestos/${proposal}`],
    ['/admin/questionnaires/[id]', questionnaire && `/admin/questionnaires/${questionnaire}`],
    ['/admin/email-templates/[slug]', '/admin/email-templates/booking_confirmation'],
  ];
  return def;
}

const VIEWPORTS = [[1440, 'desktop'], [768, 'tablet'], [390, 'mobile']];

// Només executa el render quan s'invoca directament (no quan s'importa
// `COVERED_PARAM_ROUTES` des del guard de cobertura).
const INVOKED_DIRECTLY = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('smoke-render-detail.mjs');

async function run() {
  const targets = await resolveTargets();
  await prisma.$disconnect();

  const token = Buffer.from(
    `${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || ''}`,
  ).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { Authorization: `Basic ${token}` },
  });

  const failures = [];
  const skipped = [];
  let rendered = 0;
  for (const [label, url] of targets) {
    if (!url) { skipped.push(label); continue; }
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
  // Importat només per la constant de cobertura: tanca el client Prisma obert.
  prisma.$disconnect().catch(() => {});
}
