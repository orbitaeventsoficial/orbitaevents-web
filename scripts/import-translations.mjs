#!/usr/bin/env node
/**
 * Import translations from messages/*.json into the Translation table.
 * Safe to run multiple times (upserts by namespace+key+locale).
 */
import { readFile } from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const LOCALES = ['es', 'ca', 'en'];

function flattenObject(obj, prefix = '', result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      result[newKey] = String(value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          result[`${newKey}.${index}`] = String(item);
        } else if (item && typeof item === 'object') {
          flattenObject(item, `${newKey}.${index}`, result);
        }
      });
    } else if (value && typeof value === 'object') {
      flattenObject(value, newKey, result);
    }
  }
  return result;
}

function splitPath(pathValue) {
  const [namespace, ...rest] = pathValue.split('.');
  return { namespace, key: rest.join('.') };
}

async function loadJson(locale) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function importLocale(locale) {
  const data = await loadJson(locale);
  const flat = flattenObject(data);
  const entries = Object.entries(flat);

  let count = 0;
  const now = new Date();
  const batchSize = 100;

  console.log(`\n➡️  Importando ${locale} (${entries.length} textos)...`);

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    await prisma.$transaction(
      batch.map(([pathValue, value]) => {
        const { namespace, key } = splitPath(pathValue);
        if (!namespace) return prisma.$executeRaw`SELECT 1`;
        count += 1;
        return prisma.translation.upsert({
          where: {
            namespace_key_locale: { namespace, key, locale },
          },
          update: {
            value,
          },
          create: {
            namespace,
            key,
            locale,
            value,
            isAutoTranslated: false,
            lastManualEdit: now,
          },
        });
      })
    );
    console.log(`   - Lote ${batchNumber} OK (${Math.min(i + batchSize, entries.length)}/${entries.length})`);
  }

  return count;
}

async function run() {
  try {
    await prisma.$connect();
    let total = 0;
    for (const locale of LOCALES) {
      const count = await importLocale(locale);
      total += count;
      console.log(`✅ ${locale}: ${count} textos importados`);
    }
    console.log(`\n✅ Total importado: ${total}`);
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error('❌ Error importando traducciones:', error);
  process.exit(1);
});
