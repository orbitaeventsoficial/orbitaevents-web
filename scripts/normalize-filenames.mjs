#!/usr/bin/env node

/**
 * SCRIPT DE NORMALIZACIÓN DE NOMBRES DE ARCHIVOS
 *
 * Corrige automáticamente nombres de archivos en /public/img/ y /public/videos/
 * para que cumplan con las convenciones:
 * - Todo en minúsculas
 * - Sin espacios (reemplazados por guiones)
 * - Sin acentos ni caracteres especiales
 * - Extensiones en minúsculas
 *
 * Uso:
 *   node scripts/normalize-filenames.mjs          # Renombrar archivos
 *   node scripts/normalize-filenames.mjs --dry-run # Ver cambios sin aplicar
 *
 * @author Manolo - Arquitecto Digital
 */

import { readdir, rename } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Directorios a procesar
const DIRS_TO_PROCESS = [
  'public/img',
  'public/videos',
];

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

/**
 * Normaliza un nombre de archivo a kebab-case
 */
function normalizeFilename(filename) {
  const ext = extname(filename);
  const nameWithoutExt = basename(filename, ext);

  // Mapa de caracteres con acentos a sin acentos
  const accentMap = {
    'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ã': 'a', 'å': 'a',
    'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
    'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
    'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'õ': 'o',
    'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
    'ñ': 'n', 'ç': 'c',
    'Á': 'a', 'À': 'a', 'Ä': 'a', 'Â': 'a', 'Ã': 'a', 'Å': 'a',
    'É': 'e', 'È': 'e', 'Ë': 'e', 'Ê': 'e',
    'Í': 'i', 'Ì': 'i', 'Ï': 'i', 'Î': 'i',
    'Ó': 'o', 'Ò': 'o', 'Ö': 'o', 'Ô': 'o', 'Õ': 'o',
    'Ú': 'u', 'Ù': 'u', 'Ü': 'u', 'Û': 'u',
    'Ñ': 'n', 'Ç': 'c',
  };

  let normalized = nameWithoutExt
    // Remover acentos
    .split('')
    .map(char => accentMap[char] || char)
    .join('')
    // Convertir a minúsculas
    .toLowerCase()
    // Reemplazar espacios, guiones bajos y puntos por guiones
    .replace(/[\s_\.]+/g, '-')
    // Remover caracteres especiales (solo permitir a-z, 0-9, -)
    .replace(/[^a-z0-9-]/g, '')
    // Reemplazar múltiples guiones consecutivos por uno solo
    .replace(/-+/g, '-')
    // Remover guiones al inicio y final
    .replace(/^-+|-+$/g, '');

  // Normalizar extensión (minúsculas)
  const normalizedExt = ext.toLowerCase();

  return normalized + normalizedExt;
}

/**
 * Procesa todos los archivos en un directorio recursivamente
 */
async function processDirectory(dirPath, stats = { processed: 0, renamed: 0, errors: 0 }) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Procesar subdirectorios recursivamente
        await processDirectory(fullPath, stats);
      } else if (entry.isFile()) {
        // Procesar archivo
        const normalizedName = normalizeFilename(entry.name);

        stats.processed++;

        if (normalizedName !== entry.name) {
          const newPath = join(dirPath, normalizedName);

          if (DRY_RUN) {
            console.log(`${colors.yellow}[DRY RUN]${colors.reset} ${colors.cyan}${entry.name}${colors.reset} → ${colors.green}${normalizedName}${colors.reset}`);
            stats.renamed++;
          } else {
            try {
              await rename(fullPath, newPath);
              console.log(`${colors.green}✓${colors.reset} Renombrado: ${colors.cyan}${entry.name}${colors.reset} → ${colors.green}${normalizedName}${colors.reset}`);
              stats.renamed++;
            } catch (error) {
              console.error(`${colors.red}✗${colors.reset} Error renombrando ${entry.name}: ${error.message}`);
              stats.errors++;
            }
          }
        } else if (VERBOSE) {
          console.log(`${colors.green}✓${colors.reset} Ya correcto: ${entry.name}`);
        }
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Directorio no existe, no es un error crítico
      if (VERBOSE) {
        console.log(`${colors.yellow}⚠${colors.reset} Directorio no existe: ${dirPath}`);
      }
    } else {
      console.error(`${colors.red}✗${colors.reset} Error procesando ${dirPath}: ${error.message}`);
      stats.errors++;
    }
  }

  return stats;
}

/**
 * Main
 */
async function main() {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}  ÒRBITA EVENTS - Normalización de Archivos${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  if (DRY_RUN) {
    console.log(`${colors.yellow}Modo DRY RUN activado - No se renombrarán archivos${colors.reset}\n`);
  }

  const stats = { processed: 0, renamed: 0, errors: 0 };

  // Procesar cada directorio
  for (const dir of DIRS_TO_PROCESS) {
    const fullPath = join(process.cwd(), dir);
    console.log(`${colors.cyan}Procesando:${colors.reset} ${dir}\n`);
    await processDirectory(fullPath, stats);
    console.log('');
  }

  // Resumen
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.green}RESUMEN${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`Archivos procesados: ${stats.processed}`);
  console.log(`Archivos renombrados: ${colors.green}${stats.renamed}${colors.reset}`);
  if (stats.errors > 0) {
    console.log(`Errores: ${colors.red}${stats.errors}${colors.reset}`);
  }
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  if (DRY_RUN && stats.renamed > 0) {
    console.log(`${colors.yellow}Para aplicar los cambios, ejecuta sin --dry-run:${colors.reset}`);
    console.log(`node scripts/normalize-filenames.mjs\n`);
  }

  if (stats.errors > 0) {
    process.exit(1);
  }
}

// Ejecutar
main().catch(error => {
  console.error(`${colors.red}Error fatal:${colors.reset}`, error);
  process.exit(1);
});
