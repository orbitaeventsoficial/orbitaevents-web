#!/usr/bin/env node
/**
 * qa:no-admin-toFixed-currency
 * Verifica que cap component admin ni servei usi `.toFixed(N)€`,
 * `.toLocaleString(...)€` o `.toLocaleString(...) + '€'` per formatar imports
 * monetaris sense passar pel helper centralitzat `formatCurrencyExact` o
 * `formatCurrency` de `lib/constants`.
 *
 * Raó: CLAUDE.md exigeix que "Dates, moneda, locale i formats passen per
 * helpers centralitzats". `.toFixed()` usa el punt decimal anglès; i
 * `.toLocaleString(...)€` no garanteix 2 dècimes ni l'espai Intl abans del €.
 * Per imports exactes en cèntims: `formatCurrencyExact()`.
 * Per imports rodons (0 dècimes): `formatCurrency()`.
 *
 * Patrons detectats a fitxers .tsx/.ts de app/admin/ i lib/services/:
 *   - .toFixed(2)}€               →  formatCurrencyExact(value)
 *   - .toFixed(2)} €              →  formatCurrencyExact(value)
 *   - .toFixed(0)}€               →  formatCurrency(value)
 *   - .toLocaleString(...)€       →  formatCurrencyExact(value)
 *   - .toLocaleString(...) + '€'  →  formatCurrencyExact(value)
 *   - .toFixed(2) + '€'          →  formatCurrencyExact(value)
 *   - Math.round(value)} €       →  formatCurrency(value)
 *   - Math.floor(value)} €       →  formatCurrency(value)
 *
 * NO detectat (acceptable — valors per unitat, no imports):
 *   - .toFixed(2)} €/km      (taxa vehicular)
 *   - .toFixed(3)} €/L       (taxa combustible)
 *   - .toFixed(1)}%          (percentatges)
 *
 * Excepcions tècniques:
 *   app/admin/canvas/                        — editor visual
 *   app/admin/email-templates/               — HTML d'email
 *   lib/services/documentService.ts          — HTML de pressupost/PDF
 *   lib/services/executiveReportDispatchService.ts — HTML d'informe executiu
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = [
  path.join(ROOT, 'app', 'admin'),
  path.join(ROOT, 'lib', 'services'),
];
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '__tests__']);

const ALLOWLIST_PREFIXES = [
  path.join(ROOT, 'app', 'admin', 'canvas'),
  path.join(ROOT, 'app', 'admin', 'email-templates'),
  path.join(ROOT, 'lib', 'services', 'documentService.ts'),
  path.join(ROOT, 'lib', 'services', 'executiveReportDispatchService.ts'),
];

// Matches currency formatting that bypasses centralized helpers:
//   a) .toFixed(N) or .toLocaleString(...) + optional } + whitespace + € (NOT /€)
//   b) .toFixed(N) or .toLocaleString(...) + '€' / "€" (concatenation)
//   c) Math.round/floor/ceil/trunc(...) + } + whitespace + € (template interpolation)
const CURRENCY_EUR_RE = /(?:\.(toFixed\(\d+\)|toLocaleString\([^)]*\))(?:\s*}?\s*€(?!\/)|\s*\+\s*['"]€['"])|Math\.(round|floor|ceil|trunc)\([^)]+\)\s*}\s*€(?!\/))/;

function isAllowlisted(filePath) {
  return ALLOWLIST_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function* walkTs(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkTs(full);
    } else if (entry.isFile() && (full.endsWith('.tsx') || full.endsWith('.ts'))) {
      yield full;
    }
  }
}

const violations = [];

for (const scanDir of SCAN_DIRS) {
  if (!fs.existsSync(scanDir)) continue;
  for (const file of walkTs(scanDir)) {
    if (isAllowlisted(file)) continue;
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('//')) continue;
      if (CURRENCY_EUR_RE.test(line)) {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        violations.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(
    `[no-admin-toFixed-currency] FAIL: ${violations.length} toFixed+€/toLocaleString+€ detectat(s):\n`,
  );
  for (const v of violations) {
    process.stderr.write(`  ${v}\n`);
  }
  process.stderr.write(
    '\nSubstitueix per helpers de lib/constants:' +
    '\n  value.toFixed(2)}€               →  {formatCurrencyExact(value)}' +
    '\n  value.toFixed(0)}€               →  {formatCurrency(value)}' +
    "\n  value.toLocaleString(...)€       →  {formatCurrencyExact(value)}" +
    "\n  value.toLocaleString(...) + '€'  →  formatCurrencyExact(value)" +
    '\n  Math.round(value)} €            →  {formatCurrency(value)}\n',
  );
  process.exit(1);
}

console.log('[no-admin-toFixed-currency] OK: cap toFixed+€ ni toLocaleString+€ directe detectat a app/admin/ ni lib/services/.');
