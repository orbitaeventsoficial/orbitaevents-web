#!/usr/bin/env node
// qa:manolo-boundary - Manolo es criteri expert, no permis implicit per schema/API/BD.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const GUARD_FROM_CHANGE = 1755;

const FILES = {
  claude: path.join(ROOT, 'CLAUDE.md'),
  protocol: fs.existsSync(path.join(ROOT, 'docs', 'admin-protocol.md'))
    ? path.join(ROOT, 'docs', 'admin-protocol.md')
    : path.join(ROOT, 'docs', 'protocol-producte-admin-ca.md'),
  executive: path.join(ROOT, 'docs', 'protocol-executiu.md'),
  packageJson: path.join(ROOT, 'package.json'),
};

const REQUIRED_BOUNDARY_PHRASES = [
  'Manolo no autoritza schema',
  'Manolo no autoritza migracions',
  'Manolo no autoritza endpoints',
  'autorització explícita del propietari',
];

const RESTRICTED_CHANGE_PATTERN = /\b(schema|migraci[oó]ns?|endpoint|API|BD|base de dades|Railway|prisma\/schema\.prisma|prisma\\schema\.prisma|PATCH\s+\/api|route handler)\b/i;
const MANOLO_PATTERN = /\bManolo\b/i;
const AUTHORIZATION_PATTERN = /-\s*Autoritzaci[oó]\s+expl[ií]cita\s+propietari:/i;

const SKIP_DIRS = new Set(['.git', '.next', 'node_modules', 'dist', 'build', 'coverage']);

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function readText(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`falta el fitxer ${rel(file)}`);
  }
  return fs.readFileSync(file, 'utf8').normalize('NFC');
}

function checkTextFile(label, file) {
  const text = readText(file).replace(/`/g, '');
  return REQUIRED_BOUNDARY_PHRASES
    .filter((phrase) => !text.includes(phrase))
    .map((phrase) => `${label}: falta "${phrase}"`);
}

function extractChangeEntries(protocolSource) {
  const entries = [];
  const regex = /^### Canvi #(\d+)\b.*$/gm;
  let match;
  while ((match = regex.exec(protocolSource)) !== null) {
    const number = Number.parseInt(match[1], 10);
    const start = match.index;
    const nextRegex = /^### Canvi #\d+\b.*$/gm;
    nextRegex.lastIndex = regex.lastIndex;
    const next = nextRegex.exec(protocolSource);
    entries.push({ number, body: protocolSource.slice(start, next ? next.index : protocolSource.length) });
  }
  return entries;
}

function checkProtocolChanges(protocolSource) {
  const errors = [];
  for (const entry of extractChangeEntries(protocolSource)) {
    if (entry.number < GUARD_FROM_CHANGE) continue;
    if (!MANOLO_PATTERN.test(entry.body)) continue;
    if (!RESTRICTED_CHANGE_PATTERN.test(entry.body)) continue;
    if (!AUTHORIZATION_PATTERN.test(entry.body)) {
      errors.push(`Canvi #${entry.number}: Manolo + schema/API/BD/migracio requereix "- Autorització explícita propietari:"`);
    }
  }
  return errors;
}

function checkPackageJson(file) {
  const raw = readText(file);
  let pkg;
  try {
    pkg = JSON.parse(raw);
  } catch (error) {
    return [`package.json: JSON invalid (${error.message})`];
  }

  const scripts = pkg.scripts ?? {};
  const errors = [];
  if (scripts['qa:manolo-boundary'] !== 'node scripts/check-manolo-boundary.mjs') {
    errors.push('package.json: falta script "qa:manolo-boundary" canonic');
  }
  if (!String(scripts['validate:core'] ?? '').includes('pnpm run qa:manolo-boundary')) {
    errors.push('package.json: validate:core no executa "pnpm run qa:manolo-boundary"');
  }
  return errors;
}

function collectDebugResidues(dir) {
  const residues = [];
  if (!fs.existsSync(dir)) return residues;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) residues.push(...collectDebugResidues(full));
      continue;
    }
    if (/^\.dbg-.*\.(?:cjs|mjs|js|ts|tsx)$/.test(entry.name)) {
      residues.push(rel(full));
    }
  }
  return residues;
}

const errors = [];

try {
  errors.push(...checkTextFile('CLAUDE.md', FILES.claude));
  errors.push(...checkTextFile('protocol', FILES.protocol));
  errors.push(...checkTextFile('protocol-executiu', FILES.executive));
  errors.push(...checkProtocolChanges(readText(FILES.protocol)));
  errors.push(...checkPackageJson(FILES.packageJson));
  const debugResidues = collectDebugResidues(ROOT);
  if (debugResidues.length > 0) {
    errors.push(`fitxers debug versionables prohibits: ${debugResidues.join(', ')}`);
  }
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
}

if (errors.length === 0) {
  console.log('[manolo-boundary] OK - Manolo blindat contra schema/API/BD sense autoritzacio explicita');
  process.exit(0);
}

process.stderr.write(`[manolo-boundary] FAIL - ${errors.length} incidencia(es)\n`);
for (const error of errors) {
  process.stderr.write(`  ${error}\n`);
}
process.exit(1);
