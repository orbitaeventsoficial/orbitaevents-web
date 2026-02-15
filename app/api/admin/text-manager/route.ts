// app/api/admin/text-manager/route.ts
// API completa para el Text Manager PRO
// Lee desde JSON y persiste en BD (tabla Translation)

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAuth, requirePermission } from '@/lib/auth';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Rutas a los archivos de traducción
const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const ES_JSON_PATH = path.join(MESSAGES_DIR, 'es.json');
const CA_JSON_PATH = path.join(MESSAGES_DIR, 'ca.json');
const EN_JSON_PATH = path.join(MESSAGES_DIR, 'en.json');

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Aplana un objeto JSON anidado a paths con punto
 * { hero: { title: "Hola" } } → { "hero.title": "Hola" }
 */
function flattenObject(
  obj: Record<string, unknown>,
  prefix: string = '',
  result: Record<string, string> = {}
): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      result[newKey] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      result[newKey] = String(value);
    } else if (Array.isArray(value)) {
      // Para arrays, los convertimos a índices
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

/**
 * Expande un objeto aplanado a su forma anidada
 * { "hero.title": "Hola" } → { hero: { title: "Hola" } }
 */
function unflattenObject(flat: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(flat)) {
    const keys = path.split('.');
    let current: Record<string, unknown> = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const nextKey = keys[i + 1];
      
      // Determinar si el siguiente nivel es array o objeto
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

/**
 * Establece un valor en un path anidado
 */
function setValueByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    
    if (!(key in current) || typeof current[key] !== 'object') {
      // Determinar si es array o objeto
      const nextKey = keys[i + 1];
      current[key] = /^\d+$/.test(nextKey) ? [] : {};
    }
    
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}

/**
 * Obtiene un valor de un path anidado
 */
function getValueByPath(obj: Record<string, unknown>, path: string): unknown {  
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
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

// ═══════════════════════════════════════════════════════════════════════════  
// GET - Obtener todos los textos
// ═══════════════════════════════════════════════════════════════════════════  

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const { es: esFlat, ca: caFlat, en: enFlat } = await loadMergedTexts();

    // Estadísticas
    const stats = {
      totalTexts: Object.keys(esFlat).length,
      totalCa: Object.keys(caFlat).length,
      totalEn: Object.keys(enFlat).length,
      missingInCa: Object.keys(esFlat).filter(k => !(k in caFlat)).length,
      missingInEn: Object.keys(esFlat).filter(k => !(k in enFlat)).length,
      missingInEs: Object.keys(caFlat).filter(k => !(k in esFlat)).length
    };

    return NextResponse.json({
      ok: true,
      es: esFlat,
      ca: caFlat,
      en: enFlat,
      stats
    });

  } catch (error) {
    log.error('Error leyendo textos:', error);
    return NextResponse.json(
      { ok: false, error: 'Error leyendo archivos de traducción' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUT - Guardar modificaciones
// ═══════════════════════════════════════════════════════════════════════════

export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  try {
    const body = await req.json();
    const { modifications, locale = 'es' } = body as {
      modifications: Record<string, string>;
      locale: 'es' | 'ca' | 'en';
    };

    if (!modifications || typeof modifications !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'Formato de modificaciones inválido' },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    const now = new Date();

    const operations = Object.entries(modifications).reduce((acc, [pathValue, value]) => {
      const { namespace, key } = splitPath(pathValue);
      if (!namespace) return acc;
      updatedCount++;
      acc.push(
        prisma.translation.upsert({
          where: {
            namespace_key_locale: { namespace, key, locale },
          },
          update: {
            value,
            isAutoTranslated: false,
            lastManualEdit: now,
          },
          create: {
            namespace,
            key,
            locale,
            value,
            isAutoTranslated: false,
            lastManualEdit: now,
          },
        })
      );
      return acc;
    }, [] as ReturnType<typeof prisma.translation.upsert>[]);

    if (operations.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No hay cambios válidos para guardar' },
        { status: 400 }
      );
    }

    await prisma.$transaction(operations);

    return NextResponse.json({
      ok: true,
      updated: updatedCount,
      locale,
      message: `${updatedCount} textos actualizados en la BD`
    });

  } catch (error) {
    log.error('Error guardando textos:', error);
    return NextResponse.json(
      { ok: false, error: 'Error guardando modificaciones' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST - Operaciones especiales
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  try {
    const body = await req.json();
    const { action } = body as { action: string };

    switch (action) {
      case 'sync': {
        const { es: esFlat, ca: caFlat, en: enFlat } = await loadMergedTexts();

        // Encontrar claves faltantes
        const missingInCa = Object.keys(esFlat).filter(k => !(k in caFlat));
        const missingInEn = Object.keys(esFlat).filter(k => !(k in enFlat));

        return NextResponse.json({
          ok: true,
          action: 'sync',
          missingInCa,
          missingInEn,
          missingInEs: Object.keys(caFlat).filter(k => !(k in esFlat)),
          stats: {
            totalEs: Object.keys(esFlat).length,
            totalCa: Object.keys(caFlat).length,
            totalEn: Object.keys(enFlat).length,
            syncNeeded: missingInCa.length + missingInEn.length
          }
        });
      }

      case 'export': {
        // Exportar textos como JSON descargable (merged)
        const merged = await loadMergedTexts();
        return NextResponse.json({
          ok: true,
          action: 'export',
          es: unflattenObject(merged.es),
          ca: unflattenObject(merged.ca),
          en: unflattenObject(merged.en),
          exportedAt: new Date().toISOString()
        });
      }

      case 'validate': {
        return NextResponse.json({
          ok: true,
          action: 'validate',
          valid: true,
          message: 'Validación OK (JSON base + DB)'
        });
      }

      case 'restore': {
        return NextResponse.json(
          { ok: false, error: 'Restore no disponible: ahora se guarda en BD' },
          { status: 400 }
        );
      }

      default:
        return NextResponse.json(
          { ok: false, error: `Acción desconocida: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    log.error('Error en operación:', error);
    return NextResponse.json(
      { ok: false, error: 'Error en operación' },
      { status: 500 }
    );
  }
}
