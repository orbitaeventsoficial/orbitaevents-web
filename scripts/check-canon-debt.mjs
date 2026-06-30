#!/usr/bin/env node
/**
 * check-canon-debt.mjs — GUARD RATCHET de canonització.
 *
 * Erradicació de soca-rel del CSS propi (sistemes `xx__`) cap a 0. Mesura tot el
 * deute (classes BEM locals `xx__`) per fitxer i el compara amb un baseline.
 *
 * REGLA: el deute NOMÉS pot baixar. Si un fitxer té MÉS `xx__` que el baseline
 * (s'ha afegit codi propi nou), el guard FALLA. Quan es neteja una pàgina, es
 * regenera el baseline amb `--update` i el llistó baixa per sempre.
 *
 * Objectiu final: baseline a 0 → tot l'admin és canònic (`.ap-*` + AdminPage).
 *
 * Ús:
 *   node scripts/check-canon-debt.mjs            → verifica (falla si puja)
 *   node scripts/check-canon-debt.mjs --update   → regenera baseline (després de netejar)
 *   node scripts/check-canon-debt.mjs --report   → informe de deute per sistema
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ADMIN_DIR = path.join(ROOT, 'app', 'admin');
const BASELINE = path.join(__dirname, 'canon-debt-baseline.json');

// Prefixos CANÒNICS permesos (NO són deute). La resta de `xx__` és codi propi a erradicar.
// `ax` = shell oficial del layout admin (.ax-root/.ax__workspace/.ax__page/.ax__error,
// la carcassa definida a layout.tsx + admin-shell.css). És infraestructura canònica, no
// deute de pàgina — per això s'accepta com a prefix canònic.
const CANONICAL = new Set(['ap', 'adm', 'ax']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

function rel(f) {
  return path.relative(ROOT, f).split(path.sep).join('/');
}

/** Compta usos de classes BEM locals `xx__yyy` per fitxer (exclou canòniques). */
function countDebt() {
  const perFile = {};
  const perPrefix = {};
  for (const f of walk(ADMIN_DIR)) {
    const s = fs.readFileSync(f, 'utf8');
    const matches = s.match(/\b([a-z][a-z0-9]{1,4})__[a-z0-9-]+/g) || [];
    let n = 0;
    for (const m of matches) {
      const prefix = m.split('__')[0];
      if (CANONICAL.has(prefix)) continue;
      n++;
      perPrefix[prefix] = (perPrefix[prefix] || 0) + 1;
    }
    if (n > 0) perFile[rel(f)] = n;
  }
  return { perFile, perPrefix };
}

const args = process.argv.slice(2);
const { perFile, perPrefix } = countDebt();
const total = Object.values(perFile).reduce((a, b) => a + b, 0);

if (args.includes('--report')) {
  const sorted = Object.entries(perPrefix).sort((a, b) => b[1] - a[1]);
  console.log('═══ DEUTE DE CANONITZACIÓ (classes pròpies xx__ a erradicar) ═══\n');
  console.log('Sistema | usos restants');
  sorted.forEach(([p, n]) => console.log('  ' + p.padEnd(6) + '| ' + n));
  console.log('\nTOTAL deute: ' + total + ' usos en ' + Object.keys(perFile).length + ' fitxers');
  process.exit(0);
}

if (args.includes('--update')) {
  fs.writeFileSync(BASELINE, JSON.stringify({ total, perFile }, null, 2) + '\n');
  console.log('[canon-debt] baseline actualitzat → total=' + total + ' usos.');
  process.exit(0);
}

// Verificació (ratchet): el deute no pot pujar respecte al baseline.
if (!fs.existsSync(BASELINE)) {
  console.error('[canon-debt] No hi ha baseline. Genera amb: node scripts/check-canon-debt.mjs --update');
  process.exit(1);
}
const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
const regressions = [];
for (const [file, n] of Object.entries(perFile)) {
  const baseN = base.perFile[file] || 0;
  if (n > baseN) regressions.push({ file, n, baseN });
}
// Fitxers nous amb xx__ que no eren al baseline = codi propi nou
for (const { file, n, baseN } of regressions) {
  if (baseN === 0) console.error(`[canon-debt] ✖ NOU codi propi a ${file}: ${n} classes xx__ (prohibit — usa .ap-*)`);
  else console.error(`[canon-debt] ✖ REGRESSIÓ a ${file}: ${n} xx__ (baseline ${baseN})`);
}

if (regressions.length > 0) {
  console.error(`\n[canon-debt] FALLA: el deute de canonització ha PUJAT. Tot element nou ha de ser canònic (.ap-*), mai xx__.`);
  console.error(`Si has NETEJAT una pàgina (deute baixa), regenera el baseline: node scripts/check-canon-debt.mjs --update`);
  process.exit(1);
}

const delta = base.total - total;
console.log(`[canon-debt] OK — deute ${total} (baseline ${base.total}${delta > 0 ? `, −${delta} netejats ✓` : ''}). Objectiu: 0.`);
process.exit(0);
