#!/usr/bin/env node
// qa:email-send-observability - cap SMTP directe fora del core sense EmailSend durable.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'lib'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_PARTS = new Set(['node_modules', '.next', 'dist', 'coverage', '__tests__']);
const CORE_EMAIL_FILE = 'lib/email.ts';

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

function activeSource(source) {
  return source
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
    })
    .join('\n');
}

const findings = [];
let scanned = 0;

for (const dir of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    scanned += 1;
    const relative = normalize(path.relative(ROOT, file));
    if (relative === CORE_EMAIL_FILE) continue;

    const source = activeSource(fs.readFileSync(file, 'utf8'));
    if (!/\bsendEmail\s*\(/.test(source)) continue;

    const hasSnapshot = /\brecordEmailSend\s*\(/.test(source);
    const hasResult = /\bupdateEmailSendResult\s*\(/.test(source);
    if (!hasSnapshot || !hasResult) {
      findings.push({
        file: relative,
        hasSnapshot,
        hasResult,
      });
    }
  }
}

if (findings.length === 0) {
  console.log(`[email-send-observability] OK: ${scanned} fitxers revisats; cap sendEmail() sense EmailSend observable.`);
  process.exit(0);
}

process.stderr.write(`[email-send-observability] FAIL: ${findings.length} sendEmail() directe(s) sense contracte EmailSend complet\n`);
for (const finding of findings) {
  const missing = [
    !finding.hasSnapshot ? 'recordEmailSend()' : null,
    !finding.hasResult ? 'updateEmailSendResult()' : null,
  ].filter(Boolean).join(' + ');
  process.stderr.write(`  ${finding.file}: falta ${missing}\n`);
}
process.stderr.write('  Regla Manolo: abans del SMTP cal EmailSend.htmlBody; després del SMTP cal resultat SMTP/IMAP persistent.\n');
process.exit(1);
