#!/usr/bin/env node
/**
 * qa:smoke — verificació de RENDER i RESPONSIU real (no estàtica).
 *
 * Els 64 guards de validate:core són estàtics: llegeixen codi font, mai
 * renderitzen res. Aquest guard tanca aquest punt cec: descobreix TOTES les
 * pàgines admin estàtiques automàticament (les page.tsx d'app/admin, sense rutes
 * dinàmiques [param] — res hardcoded, la lliçó del punt cec #1093), als 3 breakpoints
 * (desktop/tablet/mòbil) i FALLA si troba:
 *   - status HTTP >= 400
 *   - error de runtime a la consola/pàgina
 *   - overflow horitzontal (responsiu trencat)
 *
 * Requereix dev server viu a localhost:3000. No va a validate:core (cal server);
 * és el guard que respon «els responsius que teòricament funcionen?».
 *
 * Ús: pnpm run qa:smoke            (admin)
 *     pnpm run qa:smoke -- --public (afegeix la web pública bàsica)
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

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

// Descobriment automàtic de rutes admin estàtiques (sense [param]).
function discoverStaticRoutes(dir, base, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('[')) continue; // ruta dinàmica → cal id real, fora del smoke estàtic
    if (entry.name.startsWith('_') || entry.name.startsWith('(')) continue;
    const full = path.join(dir, entry.name);
    const route = `${base}/${entry.name}`;
    if (fs.existsSync(path.join(full, 'page.tsx'))) out.push(route);
    discoverStaticRoutes(full, route, out);
  }
  return out;
}

const adminDir = path.join(ROOT, 'app', 'admin');
const routes = ['/admin', ...discoverStaticRoutes(adminDir, '/admin')];
if (process.argv.includes('--public')) {
  routes.push('/ca', '/ca/packs', '/ca/contacto', '/ca/servicios', '/ca/portfolio', '/ca/faq');
}

const VIEWPORTS = [[1440, 'desktop'], [768, 'tablet'], [390, 'mobile']];

(async () => {
  const token = Buffer.from(
    `${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || ''}`,
  ).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { Authorization: `Basic ${token}` },
  });

  const failures = [];
  for (const route of routes) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message.split('\n')[0].slice(0, 80)));
    for (const [w, name] of VIEWPORTS) {
      await page.setViewportSize({ width: w, height: 900 });
      try {
        const res = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1200);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
        if (res.status() >= 400) failures.push(`${route} [${name}] → HTTP ${res.status()}`);
        if (overflow) failures.push(`${route} [${name}] → overflow horitzontal`);
      } catch (e) {
        failures.push(`${route} [${name}] → ${e.message.slice(0, 60)}`);
      }
    }
    if (errors.length) failures.push(`${route} → runtime error: ${errors[0]}`);
    await page.close();
  }
  await browser.close();

  process.stdout.write(`[smoke] ${routes.length} rutes × ${VIEWPORTS.length} breakpoints verificades.\n`);
  if (failures.length) {
    process.stderr.write(`[smoke] FAIL: ${failures.length} problema(es) de render/responsiu:\n`);
    for (const f of failures) process.stderr.write(`  ${f}\n`);
    process.exit(1);
  }
  process.stdout.write('[smoke] OK: totes renderitzen sense errors, 0 overflow als 3 breakpoints.\n');
})();
