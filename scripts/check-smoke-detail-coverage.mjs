#!/usr/bin/env node
/**
 * qa:smoke-detail-coverage — guard ESTÀTIC (va a validate:core, no cal server).
 *
 * `qa:smoke-detail` renderitza les rutes admin `[param]` amb ids reals, però el
 * seu mapeig és manual (`COVERED_PARAM_ROUTES`). Si algú afegeix una fitxa detall
 * nova (`/admin/foo/[id]`) i no l'afegeix al mapeig, quedaria fora del render
 * sense avís — el mateix punt cec que el #1138 va tapar, reobert silenciosament.
 *
 * Aquest guard descobreix totes les rutes `[param]` del filesystem i FALLA si
 * alguna no és a `COVERED_PARAM_ROUTES`. Així la cobertura del smoke-detail no es
 * pot degradar sense que CI ho canti.
 */
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { COVERED_PARAM_ROUTES } from './smoke-render-detail.mjs';

const ROOT = process.cwd();
const ADMIN = join(ROOT, 'app', 'admin');

// Descobreix dirs amb `page.tsx` que continguin un segment `[param]`.
function discoverParamRoutes(dir, base, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('_') || entry.name.startsWith('(')) continue;
    const full = join(dir, entry.name);
    const route = `${base}/${entry.name}`;
    if (existsSync(join(full, 'page.tsx')) && route.includes('[')) out.push(route);
    discoverParamRoutes(full, route, out);
  }
  return out;
}

const fsRoutes = discoverParamRoutes(ADMIN, '/admin').sort();
const covered = new Set(COVERED_PARAM_ROUTES);
const missing = fsRoutes.filter((r) => !covered.has(r));
const stale = [...covered].filter((r) => !fsRoutes.includes(r));

console.log(`[smoke-detail-coverage] ${fsRoutes.length} rutes [param] al FS · ${covered.size} cobertes.`);

if (missing.length) {
  console.error(`\n✗ ${missing.length} ruta(es) [param] SENSE cobertura a qa:smoke-detail:`);
  for (const r of missing) console.error(`  ${r}  → afegeix-la a COVERED_PARAM_ROUTES + resolver d'id a scripts/smoke-render-detail.mjs`);
  process.exit(1);
}
if (stale.length) {
  console.error(`\n✗ ${stale.length} entrada(es) de COVERED_PARAM_ROUTES que ja no existeixen al FS:`);
  for (const r of stale) console.error(`  ${r}  → elimina-la de scripts/smoke-render-detail.mjs`);
  process.exit(1);
}
console.log('✓ Totes les rutes [param] de l\'admin estan cobertes pel smoke-detail.');
