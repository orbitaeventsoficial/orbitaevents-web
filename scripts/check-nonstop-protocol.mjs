#!/usr/bin/env node
// qa:nonstop-protocol - blinda que la regla de go continu no es perdi del protocol ni del pipeline.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const FILES = {
  claude: path.join(ROOT, 'CLAUDE.md'),
  protocol: path.join(ROOT, 'docs', 'protocol-producte-admin-ca.md'),
  runtimePolicy: path.join(ROOT, 'docs', 'agent-runtime-policy.json'),
  packageJson: path.join(ROOT, 'package.json'),
};

const REQUIRED_PROTOCOL_PHRASES = [
  'go actiu',
  'resposta final queda prohibida',
  'rellegir §6',
  'continuar automàticament',
];

function readText(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`falta el fitxer ${path.relative(ROOT, file).replace(/\\/g, '/')}`);
  }
  return fs.readFileSync(file, 'utf8');
}

function checkTextFile(label, file, requiredPhrases) {
  const text = readText(file).replace(/`/g, '');
  const missing = requiredPhrases.filter((phrase) => !text.includes(phrase));
  return missing.map((phrase) => `${label}: falta "${phrase}"`);
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
  if (scripts['qa:nonstop-protocol'] !== 'node scripts/check-nonstop-protocol.mjs') {
    errors.push('package.json: falta script "qa:nonstop-protocol" canònic');
  }
  if (!String(scripts['validate:core'] ?? '').includes('pnpm run qa:nonstop-protocol')) {
    errors.push('package.json: validate:core no executa "pnpm run qa:nonstop-protocol"');
  }
  return errors;
}

function checkRuntimePolicy(file) {
  const raw = readText(file);
  let policy;
  try {
    policy = JSON.parse(raw);
  } catch (error) {
    return [`agent-runtime-policy.json: JSON invàlid (${error.message})`];
  }

  const errors = [];
  if (policy.repository !== 'orbitaevents') {
    errors.push('agent-runtime-policy.json: repository ha de ser "orbitaevents"');
  }
  if (policy.defaultWorkspacePath !== 'D:\\orbitaevents') {
    errors.push('agent-runtime-policy.json: defaultWorkspacePath ha de ser "D:\\orbitaevents"');
  }
  if (policy.mode !== 'nonstop_until_end') {
    errors.push('agent-runtime-policy.json: mode ha de ser "nonstop_until_end"');
  }
  if (policy.defaultCommand !== 'go') {
    errors.push('agent-runtime-policy.json: defaultCommand ha de ser "go"');
  }
  if (policy.finalResponsePolicy?.afterGreenCutWithActionableBacklog !== 'forbidden') {
    errors.push('agent-runtime-policy.json: finalResponsePolicy.afterGreenCutWithActionableBacklog ha de ser "forbidden"');
  }

  const requiredAllowedWhen = [
    'no_actionable_backlog',
    'real_blocker_requires_human_decision',
    'owner_explicitly_requests_stop_or_report_only',
  ];
  const allowedWhen = new Set(policy.finalResponsePolicy?.allowedWhen ?? []);
  for (const value of requiredAllowedWhen) {
    if (!allowedWhen.has(value)) {
      errors.push(`agent-runtime-policy.json: falta allowedWhen "${value}"`);
    }
  }

  const requiredLoop = [
    'rereread_section_6',
    'select_next_seguent_or_pendent_critic',
    'continue_automatically_with_short_update',
  ];
  const loop = new Set(policy.requiredLoopAfterGreenCut ?? []);
  for (const value of requiredLoop) {
    if (!loop.has(value)) {
      errors.push(`agent-runtime-policy.json: falta requiredLoopAfterGreenCut "${value}"`);
    }
  }

  if (policy.canonicalGuard !== 'pnpm run qa:nonstop-protocol') {
    errors.push('agent-runtime-policy.json: canonicalGuard ha de ser "pnpm run qa:nonstop-protocol"');
  }

  return errors;
}

const errors = [
  ...checkTextFile('CLAUDE.md', FILES.claude, REQUIRED_PROTOCOL_PHRASES),
  ...checkTextFile('protocol', FILES.protocol, REQUIRED_PROTOCOL_PHRASES),
  ...checkRuntimePolicy(FILES.runtimePolicy),
  ...checkPackageJson(FILES.packageJson),
];

if (errors.length === 0) {
  console.log('[nonstop-protocol] OK — regla go nonstop present al protocol, JSON i validate:core');
  process.exit(0);
}

process.stderr.write(`[nonstop-protocol] FAIL — ${errors.length} incidència(es)\n`);
for (const error of errors) {
  process.stderr.write(`  ${error}\n`);
}
process.exit(1);
