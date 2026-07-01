#!/usr/bin/env node
/**
 * qa:admin-mode-prefix
 * Verifica que tots els selectors CSS admin (app/admin/**.css, escanejats
 * dinàmicament) utilitzen `html.admin-mode` com a prefix.
 *
 * Raó: CLAUDE.md exigeix que "Tots els CSS admin requereixen html.admin-mode
 * com a prefix" per garantir que les regles admin no afecten la web pública.
 * La classe admin-mode s'afegeix a document.documentElement via useEffect
 * a app/admin/layout.tsx. Un selector sense prefix (o un `:root { --at-* }`)
 * es filtraria a la web pública.
 *
 * Parsing robust:
 *   - Els comentaris de bloc es neutralitzen (preservant salts de línia) per no
 *     confondre claus/comes comentades ni emmascarar violacions.
 *   - Cada llista de selectors es talla per comes de primer nivell (ignorant
 *     comes dins (), [], '' o ""), de manera que CADA selector d'un grup
 *     multilínia es valida, no només el que porta la `{`.
 *
 * Excepcions estructurals (no són selectors, no requereixen prefix):
 *   - @keyframes  → els passos from/to/% interiors no porten prefix
 *   - @media / @supports / @layer / @container → els selectors INTERIORS
 *     sí que es validen
 *   - @font-face / @page / @property / @import / @charset → no contenen
 *     selectors
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// Tots els CSS sota app/admin/** han de tenir el prefix canònic `html.admin-mode`
// (CLAUDE.md §Selector canònic). Abans el guard només mirava 2 fitxers — punt cec
// que amagava centenars de regles sense prefix a leads/inbox/clientes/etc. i
// provocava CSS que es barrejava en navegar entre pantalles admin (#1093).
function collectAdminCss(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectAdminCss(full, out);
    else if (entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}
const ADMIN_CSS_FILES = collectAdminCss(path.join(ROOT, 'app', 'admin'));

// Baseline de deute conegut (selectors sense prefix que ja existien). El guard
// BLOQUEJA noves violacions; les de la baseline es redueixen incrementalment amb
// verificació visual (moltes zones són TANCAT CHARLIE). Format: "rel:linia: sel".
const BASELINE_PATH = path.join(ROOT, 'scripts', 'admin-mode-prefix-allowlist.txt');
function loadBaseline() {
  try {
    return new Set(
      fs.readFileSync(BASELINE_PATH, 'utf8')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#')),
    );
  } catch {
    return new Set();
  }
}

const REQUIRED_PREFIX = 'html.admin-mode';

function lineNumberAt(text, index) {
  let line = 1;
  const limit = Math.min(index, text.length);
  for (let i = 0; i < limit; i++) {
    if (text[i] === '\n') line++;
  }
  return line;
}

// Split a selector list on top-level commas only — commas inside (), [], '' or
// "" belong to :is()/:where()/:not() or attribute values and must not split.
function splitTopLevelCommas(selectorList) {
  const parts = [];
  let buf = '';
  let paren = 0;
  let bracket = 0;
  let quote = null;
  for (let i = 0; i < selectorList.length; i++) {
    const c = selectorList[i];
    if (quote) {
      buf += c;
      if (c === quote && selectorList[i - 1] !== '\\') quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      buf += c;
      continue;
    }
    if (c === '(') paren++;
    else if (c === ')') paren = Math.max(0, paren - 1);
    else if (c === '[') bracket++;
    else if (c === ']') bracket = Math.max(0, bracket - 1);
    if (c === ',' && paren === 0 && bracket === 0) {
      parts.push(buf);
      buf = '';
      continue;
    }
    buf += c;
  }
  parts.push(buf);
  return parts;
}

function scanFile(filePath, rel) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  // Blank out block comments while preserving newlines + length: brace/comma
  // parsing is not fooled by commented-out CSS and line numbers stay accurate.
  const content = raw.replace(/\/\*[\s\S]*?\*\//g, (m) =>
    m.replace(/[^\n]/g, ' '),
  );

  const violations = [];
  let depth = 0;
  let preludeStart = 0;
  let inKeyframes = false;
  let keyframesEnterDepth = -1;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];

    if (ch === '{') {
      const prelude = content.slice(preludeStart, i);
      const trimmed = prelude.trim();

      if (inKeyframes) {
        // from / to / 50% keyframe selectors — no prefix expected.
      } else if (trimmed.startsWith('@')) {
        if (/^@keyframes\b/i.test(trimmed)) {
          inKeyframes = true;
          keyframesEnterDepth = depth;
        }
        // @media/@supports/@layer/@container: inner rules still validated.
        // @font-face/@page/@property: declarations only, no nested selectors.
      } else if (trimmed.length > 0) {
        let segOffset = 0;
        for (const segment of splitTopLevelCommas(prelude)) {
          const segTrim = segment.trim();
          if (segTrim.length > 0 && !segTrim.startsWith(REQUIRED_PREFIX)) {
            const lead = segment.length - segment.trimStart().length;
            const abs = preludeStart + segOffset + lead;
            violations.push(`${rel}:${lineNumberAt(content, abs)}: ${segTrim}`);
          }
          segOffset += segment.length + 1; // +1 for the top-level comma
        }
      }

      depth++;
      preludeStart = i + 1;
    } else if (ch === '}') {
      depth--;
      if (inKeyframes && depth <= keyframesEnterDepth) {
        inKeyframes = false;
        keyframesEnterDepth = -1;
      }
      preludeStart = i + 1;
    } else if (ch === ';') {
      // Statement terminator (@import/@charset or a declaration): reset the
      // prelude so it can't bleed into the next selector list.
      preludeStart = i + 1;
    }
  }

  return violations;
}

const allViolations = [];

for (const file of ADMIN_CSS_FILES) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (!fs.existsSync(file)) {
    process.stderr.write(`[admin-mode-prefix] WARN: fitxer no trobat: ${rel}\n`);
    continue;
  }
  allViolations.push(...scanFile(file, rel));
}

// Mode generació de baseline: `node check-admin-mode-prefix.mjs --write-baseline`
if (process.argv.includes('--write-baseline')) {
  const header = '# Baseline de deute CSS admin sense prefix html.admin-mode.\n' +
    '# El guard BLOQUEJA noves violacions; aquestes es redueixen amb verificació visual.\n' +
    '# Generat per --write-baseline. NO afegir entrades a mà.\n';
  fs.writeFileSync(BASELINE_PATH, header + allViolations.join('\n') + '\n');
  console.log(`[admin-mode-prefix] baseline escrita: ${allViolations.length} entrades a ${path.relative(ROOT, BASELINE_PATH)}`);
  process.exit(0);
}

const baseline = loadBaseline();
const newViolations = allViolations.filter((v) => !baseline.has(v));
// Entrades de baseline que ja no existeixen (deute pagat) → s'han de netejar.
const allSet = new Set(allViolations);
const staleBaseline = [...baseline].filter((b) => !allSet.has(b));

if (newViolations.length > 0) {
  process.stderr.write(
    `[admin-mode-prefix] FAIL: ${newViolations.length} selector(s) NOU(S) sense prefix html.admin-mode:\n`,
  );
  for (const v of newViolations) {
    process.stderr.write(`  ${v}\n`);
  }
  process.stderr.write(
    '\nTots els selectors CSS sota app/admin/** han de començar amb\n' +
      '`html.admin-mode` per no barrejar-se entre pantalles admin ni filtrar.\n' +
      'Excepcions estructurals (no són selectors): @keyframes, @media,\n' +
      '@supports, @layer, @font-face i altres at-rules.\n',
  );
  process.exit(1);
}

if (staleBaseline.length > 0) {
  process.stderr.write(
    `[admin-mode-prefix] FAIL: ${staleBaseline.length} entrada(es) stale a la baseline (deute ja pagat).\n` +
      'Regenera-la: node scripts/check-admin-mode-prefix.mjs --write-baseline\n',
  );
  for (const v of staleBaseline) process.stderr.write(`  ${v}\n`);
  process.exit(1);
}

console.log(
  `[admin-mode-prefix] OK: 0 violacions noves a ${ADMIN_CSS_FILES.length} CSS admin ` +
    `(${baseline.size} de deute conegut a reduir).`,
);
