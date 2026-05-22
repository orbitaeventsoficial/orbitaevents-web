#!/usr/bin/env node
// qa:admin-no-mailto - evita que l'admin torni a obrir clients de correu locals en lloc del redactor canònic.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ADMIN_DIR = path.join(ROOT, 'app', 'admin');
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SKIP_PARTS = new Set(['node_modules', '.next', 'dist', 'coverage', '__tests__']);

function normalize(file) {
  return file.replace(/\\/g, '/');
}

function shouldSkip(file) {
  const normalized = normalize(file);
  return normalized
    .split('/')
    .some((part) => SKIP_PARTS.has(part))
    || /\.test\.[tj]sx?$/.test(normalized)
    || /\.spec\.[tj]sx?$/.test(normalized);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (shouldSkip(fullPath)) continue;
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const findings = [];
for (const file of walk(ADMIN_DIR)) {
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (line.includes('mailto:')) {
      findings.push({
        file: normalize(path.relative(ROOT, file)),
        line: index + 1,
        text: line.trim(),
      });
    }
  });
}

if (findings.length === 0) {
  console.log(`[admin-no-mailto] OK: ${walk(ADMIN_DIR).length} fitxers admin revisats, cap mailto:.`);
  process.exit(0);
}

process.stderr.write(`[admin-no-mailto] FAIL: ${findings.length} mailto: detectat(s) dins app/admin\n`);
for (const finding of findings) {
  process.stderr.write(`  ${finding.file}:${finding.line} ${finding.text}\n`);
}
process.stderr.write('  Usa el redactor canònic de /admin/inbox/compose amb customerId o leadId.\n');
process.exit(1);
