#!/usr/bin/env node
// qa:dangerous-html - blinda dangerouslySetInnerHTML contra usos crus no justificats.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCOPES = ['app', 'lib'];
const SKIP_DIRS = new Set(['__tests__', 'node_modules', '.next', '.git', 'dist', 'out']);
const TEST_FILE_PATTERNS = ['.test.', '.spec.'];

const SAFE_PATTERNS = [
  'JSON.stringify(',
  'DOMPurify.sanitize(',
  't.raw(',
];

const ALLOWED_RAW_BY_FILE = new Map([
  ['app/[locale]/blog/[slug]/page.tsx', ['__html: html']],
  ['app/admin/layout.tsx', ['__html: customAdminCss']],
  ['app/[locale]/layout.tsx', ['__html: INTRO_BOOTSTRAP_SCRIPT']],
  ['app/components/legal/ConsentScripts.client.tsx', ['__html: `']],
  ['app/[locale]/gracias/page.tsx', ['__html: `']],
]);

function* walkDir(dir) {
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
      yield* walkDir(full);
    } else if (entry.isFile()) {
      if (!entry.name.endsWith('.tsx')) continue;
      if (TEST_FILE_PATTERNS.some((p) => entry.name.includes(p))) continue;
      yield full;
    }
  }
}

function isAllowedBlock(rel, block) {
  if (SAFE_PATTERNS.some((pattern) => block.includes(pattern))) return true;
  const allowed = ALLOWED_RAW_BY_FILE.get(rel) ?? [];
  return allowed.some((pattern) => block.includes(pattern));
}

function collectBlock(lines, startIndex) {
  const chunk = [];
  for (let i = startIndex; i < Math.min(lines.length, startIndex + 40); i++) {
    chunk.push(lines[i]);
    if (i > startIndex && lines[i].includes('}}')) break;
  }
  return chunk.join('\n');
}

const violations = [];
let filesChecked = 0;

for (const scope of SCOPES) {
  const scopeDir = path.join(ROOT, scope);
  if (!fs.existsSync(scopeDir)) continue;
  for (const file of walkDir(scopeDir)) {
    filesChecked++;
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const lines = fs.readFileSync(file, 'utf8').split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].includes('dangerouslySetInnerHTML')) continue;
      const block = collectBlock(lines, i);
      if (isAllowedBlock(rel, block)) continue;
      violations.push({ file: rel, line: i + 1, sample: lines[i].trim().slice(0, 120) });
    }
  }
}

if (violations.length === 0) {
  console.log(`[dangerous-html] OK: ${filesChecked} fitxers .tsx revisats, cap dangerouslySetInnerHTML cru no justificat.`);
  process.exit(0);
}

process.stderr.write(`[dangerous-html] FAIL — ${violations.length} ús(os) no justificat(s) de dangerouslySetInnerHTML\n`);
for (const violation of violations) {
  process.stderr.write(`  ${violation.file}:${violation.line}  ${violation.sample}\n`);
}
process.stderr.write(
  '  → Usa JSON.stringify per JSON-LD, DOMPurify.sanitize per HTML extern, t.raw només per copy controlat, o afegeix una allowlist explícita amb motiu.\n',
);
process.exit(1);
