#!/usr/bin/env node
// qa:zenit-roadmap - si el canvi actual declara el roadmap Manolo, exigeix que el roadmap el contingui.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ROADMAP_NAME = 'MANOLO-ZENIT-RESET-TOTAL-1551.md';

const FILES = {
  protocol: fs.existsSync(path.join(ROOT, 'docs', 'admin-protocol.md'))
    ? path.join(ROOT, 'docs', 'admin-protocol.md')
    : path.join(ROOT, 'docs', 'protocol-producte-admin-ca.md'),
  roadmap: path.join(ROOT, 'docs', 'audit', ROADMAP_NAME),
  packageJson: path.join(ROOT, 'package.json'),
};

function readText(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} no trobat: ${path.relative(ROOT, filePath).replace(/\\/g, '/')}`);
  }
  return fs.readFileSync(filePath, 'utf8');
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
    entries.push({
      number,
      body: protocolSource.slice(start, next ? next.index : protocolSource.length),
    });
  }
  return entries;
}

function checkPackageJson(source) {
  const pkg = JSON.parse(source);
  const scripts = pkg.scripts ?? {};
  const errors = [];
  if (scripts['qa:zenit-roadmap'] !== 'node scripts/check-zenit-roadmap.mjs') {
    errors.push('package.json: falta script "qa:zenit-roadmap" canonic');
  }
  if (!String(scripts['validate:core'] ?? '').includes('pnpm run qa:zenit-roadmap')) {
    errors.push('package.json: validate:core no executa "pnpm run qa:zenit-roadmap"');
  }
  return errors;
}

const errors = [];

try {
  errors.push(...checkPackageJson(readText(FILES.packageJson, 'package.json')));
  const protocol = readText(FILES.protocol, 'protocol');
  const entries = extractChangeEntries(protocol);
  if (entries.length === 0) {
    errors.push('protocol: no hi ha Canvi #N');
  } else {
    const current = entries.reduce((max, entry) => entry.number > max.number ? entry : max, entries[0]);
    if (current.body.includes(ROADMAP_NAME)) {
      const roadmap = readText(FILES.roadmap, ROADMAP_NAME);
      if (!roadmap.includes(`#${current.number}`)) {
        errors.push(`${ROADMAP_NAME}: falta referencia al canvi actual #${current.number}`);
      }
    }
  }
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
}

if (errors.length === 0) {
  console.log('[zenit-roadmap] OK - roadmap Manolo sincronitzat quan el protocol el declara');
  process.exit(0);
}

process.stderr.write(`[zenit-roadmap] FAIL - ${errors.length} incidencia(es)\n`);
for (const error of errors) {
  process.stderr.write(`  ${error}\n`);
}
process.exit(1);
