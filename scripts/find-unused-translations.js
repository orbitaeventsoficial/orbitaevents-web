#!/usr/bin/env node
/**
 * Script para encontrar traducciones NO USADAS en el código
 *
 * Busca todas las claves en messages/*.json y verifica si se usan
 * en archivos .tsx/.ts del proyecto
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}🔍 Buscando traducciones no usadas...${colors.reset}\n`);

// 1. Leer todos los archivos de traducción
const messagesDir = path.join(__dirname, '..', 'messages');
const esPath = path.join(messagesDir, 'es.json');
const esData = JSON.parse(fs.readFileSync(esPath, 'utf-8'));

// 2. Aplanar el objeto para obtener todas las claves
function flattenObject(obj, prefix = '', result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      result[newKey] = value;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flattenObject(value, newKey, result);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          flattenObject(item, `${newKey}.${index}`, result);
        }
      });
    }
  }
  return result;
}

const allKeys = flattenObject(esData);
const totalKeys = Object.keys(allKeys).length;

console.log(`📊 Total de traducciones: ${colors.yellow}${totalKeys}${colors.reset}\n`);

// 3. Buscar qué claves se usan en el código
console.log(`${colors.cyan}🔎 Analizando uso en el código...${colors.reset}\n`);

const unusedKeys = [];
const usedKeys = [];
let checkedCount = 0;

for (const [key, value] of Object.entries(allKeys)) {
  checkedCount++;

  // Mostrar progreso cada 100 claves
  if (checkedCount % 100 === 0) {
    process.stdout.write(`\r⏳ Verificadas: ${checkedCount}/${totalKeys}`);
  }

  // Buscar la clave en archivos .tsx/.ts (excluyendo node_modules, .next, etc.)
  // Usamos grep recursivo para buscar la clave en el código
  try {
    // Escapar caracteres especiales para grep
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Buscar tanto la clave completa como las partes individuales
    // Ejemplos: t('hero.title'), tLang('hero.title'), useTranslations('hero')
    const searchPatterns = [
      `t\\(['"\`]${escapedKey}['"\`]\\)`,
      `tLang\\(['"\`]${escapedKey}['"\`]\\)`,
      `useTranslations\\(['"\`]${key.split('.')[0]}['"\`]\\)`,
    ];

    let found = false;
    for (const pattern of searchPatterns) {
      try {
        execSync(
          `grep -r -l "${pattern}" --include="*.tsx" --include="*.ts" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist app/ 2>nul`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
        found = true;
        break;
      } catch (err) {
        // No encontrado con este patrón, intentar siguiente
      }
    }

    if (found) {
      usedKeys.push(key);
    } else {
      unusedKeys.push({ key, value });
    }
  } catch (err) {
    // Si grep falla, asumimos que no se usa
    unusedKeys.push({ key, value });
  }
}

console.log(`\n\n${colors.green}✅ Análisis completado${colors.reset}\n`);

// 4. Resultados
console.log(`${colors.blue}📈 RESULTADOS:${colors.reset}`);
console.log(`  Usadas: ${colors.green}${usedKeys.length}${colors.reset}`);
console.log(`  No usadas: ${colors.red}${unusedKeys.length}${colors.reset}`);
console.log(`  Porcentaje usado: ${colors.yellow}${((usedKeys.length / totalKeys) * 100).toFixed(1)}%${colors.reset}\n`);

// 5. Mostrar claves no usadas agrupadas por sección
if (unusedKeys.length > 0) {
  console.log(`${colors.red}❌ TRADUCCIONES NO USADAS:${colors.reset}\n`);

  // Agrupar por sección (primer nivel)
  const bySection = {};
  for (const { key, value } of unusedKeys) {
    const section = key.split('.')[0];
    if (!bySection[section]) {
      bySection[section] = [];
    }
    bySection[section].push({ key, value });
  }

  // Mostrar por sección
  for (const [section, items] of Object.entries(bySection).sort()) {
    console.log(`${colors.magenta}[${section}]${colors.reset} (${items.length} claves)`);

    // Mostrar primeras 5 de cada sección
    items.slice(0, 5).forEach(({ key, value }) => {
      const preview = value.length > 50 ? value.substring(0, 50) + '...' : value;
      console.log(`  ${colors.yellow}${key}${colors.reset}: "${preview}"`);
    });

    if (items.length > 5) {
      console.log(`  ${colors.cyan}... y ${items.length - 5} más${colors.reset}`);
    }
    console.log('');
  }

  // 6. Guardar reporte completo en archivo
  const reportPath = path.join(__dirname, 'unused-translations-report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalKeys,
      usedCount: usedKeys.length,
      unusedCount: unusedKeys.length,
      unusedKeys: unusedKeys,
      bySection: bySection,
    }, null, 2),
    'utf-8'
  );

  console.log(`${colors.cyan}📄 Reporte completo guardado en:${colors.reset}`);
  console.log(`   ${reportPath}\n`);
}

console.log(`${colors.green}✨ ¡Listo!${colors.reset}`);
