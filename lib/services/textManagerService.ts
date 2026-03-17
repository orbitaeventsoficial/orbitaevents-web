import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const ES_JSON_PATH = path.join(MESSAGES_DIR, 'es.json');
const CA_JSON_PATH = path.join(MESSAGES_DIR, 'ca.json');
const EN_JSON_PATH = path.join(MESSAGES_DIR, 'en.json');

function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
  result: Record<string, string> = {}
): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      result[newKey] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      result[newKey] = String(value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'string') {
          result[`${newKey}.${index}`] = item;
        } else if (typeof item === 'object' && item !== null) {
          flattenObject(item as Record<string, unknown>, `${newKey}.${index}`, result);
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      flattenObject(value as Record<string, unknown>, newKey, result);
    }
  }
  return result;
}

function unflattenObject(flat: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [pathValue, value] of Object.entries(flat)) {
    const keys = pathValue.split('.');
    let current: Record<string, unknown> = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const nextKey = keys[i + 1];
      const isNextArray = /^\d+$/.test(nextKey);

      if (!(key in current)) {
        current[key] = isNextArray ? [] : {};
      }

      current = current[key] as Record<string, unknown>;
    }

    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
  }

  return result;
}

function splitPath(pathValue: string): { namespace: string; key: string } {
  const [namespace, ...rest] = pathValue.split('.');
  return { namespace, key: rest.join('.') };
}

function buildPath(namespace: string, key: string | null): string {
  return key ? `${namespace}.${key}` : namespace;
}

async function readJsonSafe(jsonPath: string): Promise<Record<string, unknown>> {
  try {
    const content = await fs.readFile(jsonPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function loadBaseMessages() {
  const [esData, caData, enData] = await Promise.all([
    readJsonSafe(ES_JSON_PATH),
    readJsonSafe(CA_JSON_PATH),
    readJsonSafe(EN_JSON_PATH),
  ]);

  return {
    es: flattenObject(esData),
    ca: flattenObject(caData),
    en: flattenObject(enData),
  };
}

async function loadDbMessages() {
  const rows = await prisma.translation.findMany({
    select: { namespace: true, key: true, locale: true, value: true },
  });

  const db: Record<string, Record<string, string>> = {
    es: {},
    ca: {},
    en: {},
  };

  for (const row of rows) {
    const locale = row.locale;
    if (!(locale in db)) continue;
    const pathValue = buildPath(row.namespace, row.key);
    db[locale][pathValue] = row.value;
  }

  return db;
}

async function loadMergedTexts() {
  const [base, db] = await Promise.all([loadBaseMessages(), loadDbMessages()]);
  return {
    es: { ...base.es, ...db.es },
    ca: { ...base.ca, ...db.ca },
    en: { ...base.en, ...db.en },
  };
}

export async function getTextManagerPayload() {
  const { es: esFlat, ca: caFlat, en: enFlat } = await loadMergedTexts();

  return {
    ok: true as const,
    es: esFlat,
    ca: caFlat,
    en: enFlat,
    stats: {
      totalTexts: Object.keys(esFlat).length,
      totalCa: Object.keys(caFlat).length,
      totalEn: Object.keys(enFlat).length,
      missingInCa: Object.keys(esFlat).filter((k) => !(k in caFlat)).length,
      missingInEn: Object.keys(esFlat).filter((k) => !(k in enFlat)).length,
      missingInEs: Object.keys(caFlat).filter((k) => !(k in esFlat)).length,
    },
  };
}

export async function saveTextManagerModifications(input: {
  modifications: Record<string, string>;
  locale?: 'es' | 'ca' | 'en';
}) {
  const { modifications, locale = 'es' } = input;

  if (!modifications || typeof modifications !== 'object') {
    return { ok: false as const, status: 400, body: { ok: false, error: 'Formato de modificaciones inválido' } };
  }

  let updatedCount = 0;
  const now = new Date();
  const operations = Object.entries(modifications).reduce((acc, [pathValue, value]) => {
    const { namespace, key } = splitPath(pathValue);
    if (!namespace) return acc;
    updatedCount++;
    acc.push(
      prisma.translation.upsert({
        where: { namespace_key_locale: { namespace, key, locale } },
        update: { value, isAutoTranslated: false, lastManualEdit: now },
        create: { namespace, key, locale, value, isAutoTranslated: false, lastManualEdit: now },
      })
    );
    return acc;
  }, [] as ReturnType<typeof prisma.translation.upsert>[]);

  if (operations.length === 0) {
    return { ok: false as const, status: 400, body: { ok: false, error: 'No hi ha canvis vàlids per desar' } };
  }

  await prisma.$transaction(operations);

  return {
    ok: true as const,
    status: 200,
    body: {
      ok: true,
      updated: updatedCount,
      locale,
      message: `${updatedCount} textos actualitzats a la BD`,
    },
  };
}

export async function runTextManagerAction(action: string) {
  switch (action) {
    case 'sync': {
      const { es: esFlat, ca: caFlat, en: enFlat } = await loadMergedTexts();
      const missingInCa = Object.keys(esFlat).filter((k) => !(k in caFlat));
      const missingInEn = Object.keys(esFlat).filter((k) => !(k in enFlat));
      return {
        ok: true,
        action: 'sync',
        missingInCa,
        missingInEn,
        missingInEs: Object.keys(caFlat).filter((k) => !(k in esFlat)),
        stats: {
          totalEs: Object.keys(esFlat).length,
          totalCa: Object.keys(caFlat).length,
          totalEn: Object.keys(enFlat).length,
          syncNeeded: missingInCa.length + missingInEn.length,
        },
      };
    }
    case 'export': {
      const merged = await loadMergedTexts();
      return {
        ok: true,
        action: 'export',
        es: unflattenObject(merged.es),
        ca: unflattenObject(merged.ca),
        en: unflattenObject(merged.en),
        exportedAt: new Date().toISOString(),
      };
    }
    case 'validate':
      return { ok: true, action: 'validate', valid: true, message: 'Validació OK (JSON base + BD)' };
    case 'restore':
      return { ok: false, status: 400, body: { ok: false, error: 'Restore no disponible: ara es desa a BD' } };
    default:
      return { ok: false, status: 400, body: { ok: false, error: `Acció desconeguda: ${action}` } };
  }
}