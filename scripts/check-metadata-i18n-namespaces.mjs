#!/usr/bin/env node
/**
 * qa:metadata-i18n-namespaces
 * Verifica que tots els namespace: '...' usats en getTranslations() a app/[locale]/
 * existeixin com a objectes vàlids en els 3 fitxers de locale (ca.json, es.json, en.json).
 * Protegeix §6.12: evitar que una neteja d'i18n trenqui SEO o metadata per locale.
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const LOCALES = ['ca', 'es', 'en'];
const APP_LOCALE_DIR = path.join(repoRoot, 'app', '[locale]');
const MESSAGES_DIR = path.join(repoRoot, 'messages');

const jsonByLocale = {};
for (const locale of LOCALES) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  jsonByLocale[locale] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveNamespace(json, namespace) {
  const parts = namespace.split('.');
  let current = json;
  for (const part of parts) {
    if (current === null || typeof current !== 'object' || !(part in current)) {
      return false;
    }
    current = current[part];
  }
  return current !== null && typeof current === 'object';
}

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

const namespaceToFiles = new Map();
for (const file of walkDir(APP_LOCALE_DIR)) {
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(/namespace:\s*['"]([^'"]+)['"]/g)) {
    const ns = match[1];
    if (!namespaceToFiles.has(ns)) namespaceToFiles.set(ns, []);
    namespaceToFiles.get(ns).push(path.relative(repoRoot, file));
  }
}

const errors = [];
for (const [ns] of [...namespaceToFiles].sort()) {
  const missing = LOCALES.filter((locale) => !resolveNamespace(jsonByLocale[locale], ns));
  if (missing.length > 0) {
    errors.push({ namespace: ns, missing, files: namespaceToFiles.get(ns) });
  }
}

if (errors.length > 0) {
  console.error(
    `[metadata-i18n-namespaces] FAIL: ${errors.length} namespace(es) absent(s) o invàlid(s) en algun locale:`,
  );
  for (const { namespace, missing, files } of errors) {
    console.error(`  "${namespace}" absent/invàlid a: ${missing.join(', ')}`);
    console.error(`    usat a: ${files.slice(0, 3).join(', ')}${files.length > 3 ? ` +${files.length - 3} més` : ''}`);
  }
  process.exit(1);
}

console.log(
  `[metadata-i18n-namespaces] OK: ${namespaceToFiles.size} namespace(s) verificat(s) en ca/es/en`,
);
