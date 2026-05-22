#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const LOCALES = ['ca', 'es', 'en'];
const MESSAGES_DIR = path.join(repoRoot, 'messages');
const LEGACY_ALLOWED_MISSING = [
  { keyPrefix: 'footerLinks.legal.', missing: ['es', 'en'] },
  { key: 'experiences.cta.badge', missing: ['es', 'en'] },
  { keyPrefix: 'testimonials.', missing: ['ca'] },
];

function collectLeafKeys(obj, prefix = '') {
  const keys = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const nested of collectLeafKeys(v, fullKey)) {
        keys.add(nested);
      }
    } else {
      keys.add(fullKey);
    }
  }
  return keys;
}

const keysByLocale = {};
for (const locale of LOCALES) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  keysByLocale[locale] = collectLeafKeys(content);
}

const allKeys = new Set();
for (const keys of Object.values(keysByLocale)) {
  for (const key of keys) allKeys.add(key);
}

const errors = [];
for (const key of [...allKeys].sort()) {
  const missing = LOCALES.filter((loc) => !keysByLocale[loc].has(key));
  if (missing.length > 0) {
    const allowed = LEGACY_ALLOWED_MISSING.some((entry) => {
      const keyMatches = entry.key ? entry.key === key : key.startsWith(entry.keyPrefix);
      return keyMatches && missing.every((loc) => entry.missing.includes(loc));
    });
    if (allowed) continue;
    errors.push({ key, missing });
  }
}

if (errors.length > 0) {
  console.error(
    `[i18n-keys-sync] FAIL: ${errors.length} clau(es) no sincronitzades entre fitxers de locale:`,
  );
  const preview = errors.slice(0, 30);
  for (const { key, missing } of preview) {
    console.error(`  "${key}" absent a: ${missing.join(', ')}`);
  }
  if (errors.length > 30) {
    console.error(`  ... i ${errors.length - 30} claus més`);
  }
  console.error(
    '\nTotes les claus de messages/*.json han de ser idèntiques als tres fitxers de locale.',
  );
  process.exit(1);
}

console.log(
  `[i18n-keys-sync] OK: ${allKeys.size} claus verificades — sincronitzades a ca, es i en.`,
);
