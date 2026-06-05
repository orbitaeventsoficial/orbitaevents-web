#!/usr/bin/env node
// qa:visual-identity-bridge - blinda que el pont visual de §6.11 no quedi només com a memòria documental.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const FILES = {
  bridge: path.join(ROOT, 'docs', 'visual-identity-bridge-ca.md'),
  protocol: fs.existsSync(path.join(ROOT, 'docs', 'admin-protocol.md'))
    ? path.join(ROOT, 'docs', 'admin-protocol.md')
    : path.join(ROOT, 'docs', 'protocol-producte-admin-ca.md'),
  packageJson: path.join(ROOT, 'package.json'),
};

const REQUIRED_BRIDGE_PHRASES = [
  "Pont d'identitat visual",
  'admin, web pública i mòduls nous',
  'La web pública ven confiança',
  "L'admin governa decisions",
  'CTA principal',
  'Checklist abans d\'afegir o redissenyar',
  'coherència visual d\'Òrbita es governa per funció',
];

const REQUIRED_PROTOCOL_PHRASES = [
  '§6.11 UX / Visual / Marca',
  'FET residual**',
  'identitat visual coherent entre admin, web pública i mòduls nous',
  'docs/visual-identity-bridge-ca.md',
  'Canvi #605',
  'Canvi #681',
];

function relative(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function readText(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`falta el fitxer ${relative(file)}`);
  }
  return fs.readFileSync(file, 'utf8').replace(/`/g, '');
}

function checkTextFile(label, file, requiredPhrases) {
  const text = readText(file);
  return requiredPhrases
    .filter((phrase) => !text.includes(phrase))
    .map((phrase) => `${label}: falta "${phrase}"`);
}

function checkPackageJson(file) {
  const raw = readText(file);
  let pkg;
  try {
    pkg = JSON.parse(raw);
  } catch (error) {
    return [`package.json: JSON invàlid (${error.message})`];
  }

  const scripts = pkg.scripts ?? {};
  const errors = [];
  if (scripts['qa:visual-identity-bridge'] !== 'node scripts/check-visual-identity-bridge.mjs') {
    errors.push('package.json: falta script "qa:visual-identity-bridge" canònic');
  }
  if (!String(scripts['validate:core'] ?? '').includes('pnpm run qa:visual-identity-bridge')) {
    errors.push('package.json: validate:core no executa "pnpm run qa:visual-identity-bridge"');
  }
  return errors;
}

let errors = [];
try {
  errors = [
    ...checkTextFile('pont visual', FILES.bridge, REQUIRED_BRIDGE_PHRASES),
    ...checkTextFile('protocol', FILES.protocol, REQUIRED_PROTOCOL_PHRASES),
    ...checkPackageJson(FILES.packageJson),
  ];
} catch (error) {
  errors = [error.message];
}

if (errors.length === 0) {
  console.log('[visual-identity-bridge] OK — pont visual §6.11 present i protegit per validate:core');
  process.exit(0);
}

process.stderr.write(`[visual-identity-bridge] FAIL — ${errors.length} incidència(es)\n`);
for (const error of errors) {
  process.stderr.write(`  ${error}\n`);
}
process.exit(1);
