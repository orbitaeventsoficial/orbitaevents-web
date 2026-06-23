#!/usr/bin/env node
/**
 * qa:no-canonical-reimpl — detecta REIMPLEMENTACIÓ de lògica canònica.
 *
 * Els altres guards veuen sintaxi (hex, dialogs, splits) però NO duplicació
 * SEMÀNTICA: quan algú reescriu una fórmula/parser que ja viu a la capa canònica.
 * Això és el que va deixar `parseBudget` duplicat 6 cops i marges inline 5 cops
 * sense que cap guard ho cacés (#1086, #1088). Aquest guard tanca aquell buit:
 * per cada peça canònica consolidada, bloqueja que es torni a reimplementar fora
 * del seu únic lloc legítim.
 *
 * Cada regla: un patró que NOMÉS hauria d'aparèixer al fitxer canònic. Si surt
 * en un altre lloc → reimplementació → falla. Patrons triats per ser precisos
 * (0 falsos positius sobre el codi actual, que ja està consolidat).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'lib'].map((d) => path.join(ROOT, d));

// Regles de canon. `pattern`: regex de la reimplementació. `canonicalFile`: l'únic
// fitxer on el patró és legítim. `use`: què s'ha d'usar en comptes de reimplementar.
const RULES = [
  {
    name: 'parseBudget',
    pattern: /replace\(\s*\/\[\^\\d\.,\]/,
    canonicalFile: 'lib/constants/index.ts',
    use: "importa `parseBudgetAmount` de '@/lib/constants'",
  },
  {
    name: 'marge-inline (cost ratio)',
    pattern: /\*\s*(?:config\.|PROFITABILITY_MODEL_DEFAULTS\.)?(?:packCostRatio|extraCostRatio|extraHourCostRatio)\b/,
    canonicalFile: 'lib/services/costEngine.ts',
    use: "usa `computeDirectCostBreakdown` o `computeBookingFinancialSummary` del costEngine",
  },
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.|\.spec\./.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(d));
const violations = [];

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  for (const rule of RULES) {
    if (rel === rule.canonicalFile) continue; // és el lloc legítim
    lines.forEach((line, i) => {
      // ignora comentaris d'una línia
      const code = line.replace(/\/\/.*$/, '');
      if (rule.pattern.test(code)) {
        violations.push({ rel, line: i + 1, rule });
      }
    });
  }
}

if (violations.length > 0) {
  process.stderr.write(
    `[no-canonical-reimpl] FAIL: ${violations.length} reimplementació(ns) de lògica canònica:\n`,
  );
  for (const v of violations) {
    process.stderr.write(`  ${v.rel}:${v.line} — reimplementa «${v.rule.name}». ${v.rule.use}.\n`);
  }
  process.stderr.write(
    '\nCada peça canònica viu a UN sol lloc. No la reescriguis: importa-la.\n',
  );
  process.exit(1);
}

console.log(`[no-canonical-reimpl] OK: ${RULES.length} canòniques protegides, 0 reimplementacions.`);
