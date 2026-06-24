#!/usr/bin/env node
/**
 * Guard de canon visual admin (Òrbita Events).
 * Detecta els patrons no-canònics que es repeteixen pàgina a pàgina i que el
 * llenguatge carbó+or de Cristina prohibeix. Advisori per defecte; amb --strict
 * surt amb codi !=0 si troba P0/P1 (botó-void, blau/violeta de superfície,
 * blanc/negre absolut).
 *
 * Ús: node scripts/check-admin-canon.mjs [--strict] [--list]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const ADMIN = join(ROOT, 'app', 'admin');
const STRICT = process.argv.includes('--strict');
const LIST = process.argv.includes('--list');

// Fitxers/zones exemptes (color = contingut, no chrome)
const EXEMPT = [
  'css-manager',        // editor de temes: hex = dada editable
  'email-templates',    // HTML d'email: estils inline obligatoris
  'CanvasEditorClient', // editor gràfic: color = disseny de l'usuari
  'PresupuestoPdfStudio', // editor de PDF/paper
];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name.endsWith('.tsx')) acc.push(p);
  }
  return acc;
}

const RULES = [
  {
    id: 'boto-void',
    sev: 'P1',
    desc: 'Botó/Link amb padding+text-white SENSE fons ni .ap-btn → invisible sobre carbó',
    // className amb px-/py- i text-white però sense bg-/ap-btn/admin-tone-bg
    test: (line) =>
      /(<button|<Link|<a)\b/.test(line) === false && false, // placeholder, es fa per className a sota
  },
];

// Detecció basada en className (multilinha simplificada: per línia)
const patterns = [
  {
    id: 'blau-superficie',
    sev: 'P1',
    re: /\b(bg|border|text)-(cyan|sky|blue|indigo|violet|fuchsia|purple)-\d/,
    desc: 'Blau/violeta (canon = carbó+or; ni superfície ni text de marca)',
  },
  {
    id: 'blanc-negre-absolut',
    sev: 'P1',
    re: /\b(bg-white|text-black)\b(?!\/)/,
    desc: 'Blanc/negre absolut (bg-white sòlid / text-black) — prohibit',
  },
  {
    id: 'tipografia-black',
    sev: 'P2',
    re: /\btext-(2xl|3xl|4xl)\b[^"']*\bfont-black\b|\bfont-black\b[^"']*\btext-(2xl|3xl|4xl)\b/,
    desc: 'Tipografia text-{2xl..}+font-black (usar var(--display))',
  },
  // ── Deute monocapa (P3, informatiu): mètriques de progrés cap a 0. NO bloquegen
  //    (strict només talla amb P1), però es compten a cada passada per veure baixar.
  {
    id: 'superficie-adhoc',
    sev: 'P3',
    re: /\bbg-white\/\[0\.0[0-9]\]/,
    desc: 'Superfície ad-hoc bg-white/[0.0x] (usar bg-[var(--panel)] o .ap-card)',
  },
  {
    id: 'font-px',
    sev: 'P3',
    re: /\btext-\[[0-9]+px\]/,
    desc: 'Mida de font en px (usar token --o-text-* quan n\'hi ha)',
  },
  // Nota: `.admin-card-glass` ja NO és violació — des de #1011 la classe es
  // redefineix amb selector viu + superfície carbó canònica (admin-theme.css).
];

// Botó-void: className amb (rounded|px-|py-) i text-white però sense bg-/ap-btn/admin-tone-bg/border-
function isBtnVoid(cls) {
  if (!/text-white(?![\/-])/.test(cls)) return false;
  if (!/(rounded|px-\d|py-\d)/.test(cls)) return false;
  if (/(bg-|ap-btn|admin-tone-bg|admin-tone-text)/.test(cls)) return false;
  return true;
}

const files = walk(ADMIN);
const hits = [];

for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  if (EXEMPT.some((e) => rel.includes(e))) continue;
  const src = readFileSync(f, 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    // comentaris #NNN no compten com a hex
    for (const p of patterns) {
      if (p.re.test(line)) hits.push({ rel, ln: i + 1, id: p.id, sev: p.sev, desc: p.desc });
    }
    // botó-void: extreu className="..."
    const m = line.match(/className=("([^"]*)"|`([^`]*)`)/);
    if (m) {
      const cls = m[2] || m[3] || '';
      if (isBtnVoid(cls)) {
        hits.push({ rel, ln: i + 1, id: 'boto-void', sev: 'P1', desc: 'Botó-void: text-white + padding sense fons (usar .ap-btn)' });
      }
    } else {
      // Botó-void en CONST/string (#1133): abans el guard només mirava
      // className="...", deixant escapar `const X = '...text-white...'` que
      // després s'aplica via className={X}. Escanegem literals de línies SENSE
      // className= (les const/ternari de classes viuen separades de l'ús).
      // Només strings SENSE interpolació `${...}`: si interpola, el fons pot
      // venir de la variable (p.ex. variant `${styles.button}`) → no és void.
      const strs = line.match(/'[^']*'|"[^"]*"|`[^`]*`/g) || [];
      if (strs.some((s) => !s.includes('${') && isBtnVoid(s.slice(1, -1)))) {
        hits.push({ rel, ln: i + 1, id: 'boto-void', sev: 'P1', desc: 'Botó-void en const/string: text-white + padding sense fons (usar .ap-btn)' });
      }
    }
  });
}

const bySev = hits.reduce((a, h) => ((a[h.sev] = (a[h.sev] || 0) + 1), a), {});
const byId = hits.reduce((a, h) => ((a[h.id] = (a[h.id] || 0) + 1), a), {});

console.log(`\nGuard canon admin: ${hits.length} troballes`);
console.log('Per severitat:', JSON.stringify(bySev));
console.log('Per patró:', JSON.stringify(byId));

if (LIST) {
  for (const h of hits.sort((a, b) => a.sev.localeCompare(b.sev) || a.rel.localeCompare(b.rel))) {
    console.log(`  [${h.sev}] ${h.rel}:${h.ln} · ${h.id}`);
  }
}

const p1 = hits.filter((h) => h.sev === 'P1').length;
if (STRICT && p1 > 0) {
  console.error(`\n✗ ${p1} violacions P1 (botó-void / blau / blanc-negre). Eradica-les abans de continuar.`);
  process.exit(1);
}
console.log(p1 === 0 ? '✓ Sense P1.' : `⚠ ${p1} P1 pendents (advisori).`);
