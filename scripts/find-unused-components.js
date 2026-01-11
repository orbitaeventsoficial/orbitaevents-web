#!/usr/bin/env node
/**
 * Encuentra componentes .tsx/.ts que NO se importan en ningún lado
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

console.log(`${colors.cyan}🔍 Buscando componentes no usados...${colors.reset}\n`);

const appDir = path.join(__dirname, '..', 'app');

// Obtener todos los archivos .tsx y .ts (excepto .d.ts)
let allFiles = [];
try {
  const output = execSync(
    `dir /S /B "${appDir}\\*.tsx" "${appDir}\\*.ts"`,
    { encoding: 'utf-8' }
  ).trim();
  allFiles = output.split('\n').map(f => f.trim()).filter(f => f && !f.endsWith('.d.ts'));
} catch (err) {
  console.error('Error obteniendo archivos:', err.message);
  process.exit(1);
}

console.log(`📊 Total de archivos: ${colors.yellow}${allFiles.length}${colors.reset}\n`);

// Archivos que son puntos de entrada (no necesitan ser importados)
const entryPoints = [
  'page.tsx',
  'layout.tsx',
  'route.ts',
  'middleware.ts',
  'error.tsx',
  'not-found.tsx',
  'loading.tsx',
  'template.tsx',
  'default.tsx',
  'global-error.tsx',
];

const unusedFiles = [];
let checkedCount = 0;

for (const filePath of allFiles) {
  checkedCount++;

  if (checkedCount % 50 === 0) {
    process.stdout.write(`\r⏳ Verificados: ${checkedCount}/${allFiles.length}`);
  }

  const fileName = path.basename(filePath);

  // Saltar entry points de Next.js
  if (entryPoints.includes(fileName)) {
    continue;
  }

  // Saltar archivos .OLD, backup, etc.
  if (fileName.includes('.OLD') || fileName.includes('.backup') || fileName.includes('-old')) {
    unusedFiles.push({ filePath, reason: 'Archivo OLD/backup', fileName });
    continue;
  }

  // Obtener el nombre del componente/archivo sin extensión
  const componentName = fileName.replace(/\.(tsx|ts)$/, '');

  // Buscar si se importa en algún lado
  // Buscar patrones: import ... from './Component'  o  import ... from '@/path/Component'
  try {
    execSync(
      `findstr /S /C:"from './${componentName}'" /C:"from '../${componentName}'" /C:"from '@/.*${componentName}'" /C:"/${componentName}'" "${appDir}\\*.tsx" "${appDir}\\*.ts" >nul 2>&1`,
      { stdio: 'pipe' }
    );
    // Si no lanza error, se encontró
  } catch (err) {
    // No se encontró ninguna importación
    unusedFiles.push({ filePath, reason: 'No importado', fileName });
  }
}

console.log(`\n\n${colors.green}✅ Análisis completado${colors.reset}\n`);

// Resultados
console.log(`${colors.red}❌ COMPONENTES NO USADOS (${unusedFiles.length}):${colors.reset}\n`);

if (unusedFiles.length > 0) {
  unusedFiles.forEach(({ filePath, reason, fileName }) => {
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    console.log(`  ${colors.yellow}${fileName}${colors.reset}`);
    console.log(`    ${colors.cyan}${relativePath}${colors.reset}`);
    console.log(`    ${colors.magenta}Razón: ${reason}${colors.reset}\n`);
  });

  // Guardar reporte
  const reportPath = path.join(__dirname, 'unused-components-report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalFiles: allFiles.length,
      unusedCount: unusedFiles.length,
      unusedFiles: unusedFiles.map(f => ({
        path: path.relative(path.join(__dirname, '..'), f.filePath),
        fileName: f.fileName,
        reason: f.reason,
      })),
    }, null, 2),
    'utf-8'
  );

  console.log(`${colors.cyan}📄 Reporte guardado en:${colors.reset}`);
  console.log(`   ${reportPath}\n`);
} else {
  console.log(`  ${colors.green}¡No se encontraron componentes sin usar!${colors.reset}\n`);
}

console.log(`${colors.green}✨ ¡Listo!${colors.reset}`);
