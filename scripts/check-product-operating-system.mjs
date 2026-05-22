#!/usr/bin/env node
// qa:product-operating-system - blinda que la narrativa mare de §6.1 segueixi connectada a manual i Dashboard.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const FILES = {
  doc: path.join(ROOT, 'docs', 'product-operating-system-ca.md'),
  protocol: path.join(ROOT, 'docs', 'protocol-producte-admin-ca.md'),
  adminManual: path.join(ROOT, 'lib', 'constants', 'adminManual.ts'),
  dashboardService: path.join(ROOT, 'lib', 'services', 'adminOperatingCycleService.ts'),
  packageJson: path.join(ROOT, 'package.json'),
};

const REQUIRED_DOC_PHRASES = [
  'Frase de sistema',
  'Cicle únic',
  'Captar demanda',
  'Qualificar i negociar',
  'Pressupostar amb marge',
  'Executar reserva',
  'Cobrar i controlar',
  'Reactivar i generar recurrència',
  'Cada pantalla nova ha d’encaixar en un pas del cicle',
  'El manual /admin/manual és la vista operativa d’aquest sistema',
  'El zenit no és afegir més mòduls',
];

const REQUIRED_PROTOCOL_PHRASES = [
  '## 6.1 Fonaments de producte',
  'docs/product-operating-system-ca.md',
  'Canvi #606',
  'Canvi #668',
  'Canvi #680',
  'FET residual',
];

const REQUIRED_MANUAL_PHRASES = [
  'ADMIN_MANUAL_OPERATING_FLOW',
  "step: '01'",
  "step: '02'",
  "step: '03'",
  "step: '04'",
  "step: '05'",
  "step: '06'",
  'ADMIN_MANUAL_OPERATING_GATES',
  'ADMIN_MANUAL_OPERATING_HANDOFFS',
  'ADMIN_MANUAL_OPERATING_STEP_CHECKLIST',
  'ADMIN_MANUAL_OPERATING_EVIDENCE',
];

const REQUIRED_DASHBOARD_PHRASES = [
  'ADMIN_MANUAL_OPERATING_FLOW',
  'buildDashboardOperatingCycle',
  'return ADMIN_MANUAL_OPERATING_FLOW.map',
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
  if (scripts['qa:product-operating-system'] !== 'node scripts/check-product-operating-system.mjs') {
    errors.push('package.json: falta script "qa:product-operating-system" canònic');
  }
  if (!String(scripts['validate:core'] ?? '').includes('pnpm run qa:product-operating-system')) {
    errors.push('package.json: validate:core no executa "pnpm run qa:product-operating-system"');
  }
  return errors;
}

let errors = [];
try {
  errors = [
    ...checkTextFile('product operating system', FILES.doc, REQUIRED_DOC_PHRASES),
    ...checkTextFile('protocol', FILES.protocol, REQUIRED_PROTOCOL_PHRASES),
    ...checkTextFile('manual admin', FILES.adminManual, REQUIRED_MANUAL_PHRASES),
    ...checkTextFile('dashboard', FILES.dashboardService, REQUIRED_DASHBOARD_PHRASES),
    ...checkPackageJson(FILES.packageJson),
  ];
} catch (error) {
  errors = [error.message];
}

if (errors.length === 0) {
  console.log('[product-operating-system] OK — narrativa §6.1 present, connectada al manual, Dashboard i validate:core');
  process.exit(0);
}

process.stderr.write(`[product-operating-system] FAIL — ${errors.length} incidència(es)\n`);
for (const error of errors) {
  process.stderr.write(`  ${error}\n`);
}
process.exit(1);
