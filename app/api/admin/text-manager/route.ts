// app/api/admin/text-manager/route.ts
// API completa para el Text Manager PRO
// Lee/escribe a los archivos JSON de traducción

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Rutas a los archivos de traducción
const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const ES_JSON_PATH = path.join(MESSAGES_DIR, 'es.json');
const CA_JSON_PATH = path.join(MESSAGES_DIR, 'ca.json');

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

// ═══════════════════════════════════════════════════════════════════════════
// GET - Obtener todos los textos
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    // Leer ambos archivos JSON
    const [esContent, caContent] = await Promise.all([
      fs.readFile(ES_JSON_PATH, 'utf-8'),
      fs.readFile(CA_JSON_PATH, 'utf-8').catch(() => '{}')
    ]);

    const esData = JSON.parse(esContent);
    const caData = JSON.parse(caContent);

    // Aplanar ambos objetos
    const esFlat = flattenObject(esData);
    const caFlat = flattenObject(caData);

    // Estadísticas
    const stats = {
      totalTexts: Object.keys(esFlat).length,
      totalCa: Object.keys(caFlat).length,
      missingInCa: Object.keys(esFlat).filter(k => !(k in caFlat)).length,
      missingInEs: Object.keys(caFlat).filter(k => !(k in esFlat)).length
    };

    return NextResponse.json({
      ok: true,
      es: esFlat,
      ca: caFlat,
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
  try {
    const body = await req.json();
    const { modifications, locale = 'es' } = body as {
      modifications: Record<string, string>;
      locale: 'es' | 'ca';
    };

    if (!modifications || typeof modifications !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'Formato de modificaciones inválido' },
        { status: 400 }
      );
    }

    const jsonPath = locale === 'es' ? ES_JSON_PATH : CA_JSON_PATH;

    // Leer archivo actual
    const content = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(content);

    // Aplicar modificaciones
    let updatedCount = 0;
    for (const [path, value] of Object.entries(modifications)) {
      setValueByPath(data, path, value);
      updatedCount++;
    }

    // Crear backup antes de guardar
    const backupPath = path.join(MESSAGES_DIR, `${locale}.backup.json`);
    await fs.writeFile(backupPath, content, 'utf-8');

    // Guardar archivo modificado
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');

    return NextResponse.json({
      ok: true,
      updated: updatedCount,
      locale,
      message: `${updatedCount} textos actualizados en ${locale}.json`,
      backupCreated: true
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
  try {
    const body = await req.json();
    const { action } = body as { action: string };

    switch (action) {
      case 'sync': {
        // Sincronizar claves entre ES y CA
        const [esContent, caContent] = await Promise.all([
          fs.readFile(ES_JSON_PATH, 'utf-8'),
          fs.readFile(CA_JSON_PATH, 'utf-8')
        ]);

        const esData = JSON.parse(esContent);
        const caData = JSON.parse(caContent);

        const esFlat = flattenObject(esData);
        const caFlat = flattenObject(caData);

        // Encontrar claves faltantes en CA
        const missingInCa = Object.keys(esFlat).filter(k => !(k in caFlat));

        return NextResponse.json({
          ok: true,
          action: 'sync',
          missingInCa,
          missingInEs: Object.keys(caFlat).filter(k => !(k in esFlat)),
          stats: {
            totalEs: Object.keys(esFlat).length,
            totalCa: Object.keys(caFlat).length,
            syncNeeded: missingInCa.length
          }
        });
      }

      case 'export': {
        // Exportar textos como JSON descargable
        const [esContent, caContent] = await Promise.all([
          fs.readFile(ES_JSON_PATH, 'utf-8'),
          fs.readFile(CA_JSON_PATH, 'utf-8')
        ]);

        return NextResponse.json({
          ok: true,
          action: 'export',
          es: JSON.parse(esContent),
          ca: JSON.parse(caContent),
          exportedAt: new Date().toISOString()
        });
      }

      case 'validate': {
        // Validar estructura de JSONs
        const [esContent, caContent] = await Promise.all([
          fs.readFile(ES_JSON_PATH, 'utf-8'),
          fs.readFile(CA_JSON_PATH, 'utf-8')
        ]);

        try {
          JSON.parse(esContent);
          JSON.parse(caContent);

          return NextResponse.json({
            ok: true,
            action: 'validate',
            valid: true,
            message: 'Ambos JSONs son válidos'
          });
        } catch (parseError) {
          return NextResponse.json({
            ok: false,
            action: 'validate',
            valid: false,
            error: parseError instanceof Error ? parseError.message : 'Error de parsing'
          });
        }
      }

      case 'restore': {
        // Restaurar desde backup
        const { locale = 'es' } = body as { locale: 'es' | 'ca' };
        const jsonPath = locale === 'es' ? ES_JSON_PATH : CA_JSON_PATH;
        const backupPath = path.join(MESSAGES_DIR, `${locale}.backup.json`);

        try {
          const backupContent = await fs.readFile(backupPath, 'utf-8');
          await fs.writeFile(jsonPath, backupContent, 'utf-8');

          return NextResponse.json({
            ok: true,
            action: 'restore',
            locale,
            message: `Restaurado ${locale}.json desde backup`
          });
        } catch {
          return NextResponse.json(
            { ok: false, error: 'No se encontró archivo de backup' },
            { status: 404 }
          );
        }
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
