#!/usr/bin/env node
/**
 * Eliminar componentes y archivos no usados
 * Basado en unused-components-report.json
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Archivos que NO se deben borrar (son convenciones de Next.js)
const KEEP_FILES = [
  'app\\robots.ts',
  'app\\sitemap.ts',
  'app\\viewport.ts',
];

console.log(`${colors.cyan}🗑️  LIMPIEZA DE COMPONENTES NO USADOS${colors.reset}\n`);

// Leer el reporte
const reportPath = path.join(__dirname, 'unused-components-report.json');
if (!fs.existsSync(reportPath)) {
  console.error(`${colors.red}❌ No se encontró el reporte: ${reportPath}${colors.reset}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
console.log(`📊 Total archivos en reporte: ${colors.yellow}${report.unusedCount}${colors.reset}`);

// Filtrar archivos a eliminar (excluir los que debemos mantener)
const filesToDelete = report.unusedFiles.filter(file => {
  const shouldKeep = KEEP_FILES.includes(file.path);
  if (shouldKeep) {
    console.log(`${colors.green}✓ Manteniendo:${colors.reset} ${file.path} ${colors.cyan}(Next.js convention)${colors.reset}`);
  }
  return !shouldKeep;
});

console.log(`\n🗑️  Archivos a eliminar: ${colors.red}${filesToDelete.length}${colors.reset}\n`);

// Confirmar antes de eliminar
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question(`${colors.yellow}¿Confirmar eliminación de ${filesToDelete.length} archivos? (s/n): ${colors.reset}`, (answer) => {
  readline.close();

  if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'si') {
    console.log(`\n${colors.yellow}❌ Operación cancelada${colors.reset}`);
    process.exit(0);
  }

  console.log(`\n${colors.cyan}🔥 Eliminando archivos...${colors.reset}\n`);

  let deletedCount = 0;
  let errorCount = 0;

  for (const file of filesToDelete) {
    const fullPath = path.join(__dirname, '..', file.path);

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        deletedCount++;
        console.log(`  ${colors.red}❌${colors.reset} ${file.fileName}`);
      } else {
        console.log(`  ${colors.yellow}⚠️  Ya no existe:${colors.reset} ${file.fileName}`);
      }
    } catch (err) {
      errorCount++;
      console.error(`  ${colors.red}✗ Error eliminando ${file.fileName}: ${err.message}${colors.reset}`);
    }
  }

  // Eliminar directorios vacíos
  console.log(`\n${colors.cyan}🧹 Limpiando directorios vacíos...${colors.reset}\n`);

  const dirsToCheck = [
    path.join(__dirname, '..', 'app', 'admin', 'components'),
    path.join(__dirname, '..', 'app', 'admin', 'components', 'desktop'),
    path.join(__dirname, '..', 'app', 'admin', 'components', 'mobile'),
    path.join(__dirname, '..', 'app', 'admin', 'text-manager'),
    path.join(__dirname, '..', 'app', 'components', 'mobile'),
    path.join(__dirname, '..', 'app', 'components', 'mobile-ultimate'),
    path.join(__dirname, '..', 'app', 'components', 'seo'),
    path.join(__dirname, '..', 'app', 'components', 'utils'),
    path.join(__dirname, '..', 'app', 'components', 'forms'),
    path.join(__dirname, '..', 'app', 'components', 'home'),
    path.join(__dirname, '..', 'app', 'config'),
    path.join(__dirname, '..', 'app', 'constants'),
    path.join(__dirname, '..', 'app', 'hooks'),
    path.join(__dirname, '..', 'app', 'types'),
    path.join(__dirname, '..', 'app', '(seo)'),
  ];

  let removedDirs = 0;
  for (const dir of dirsToCheck) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        if (files.length === 0) {
          fs.rmdirSync(dir);
          removedDirs++;
          console.log(`  ${colors.magenta}📁 Eliminado directorio vacío:${colors.reset} ${path.relative(path.join(__dirname, '..'), dir)}`);
        }
      }
    } catch (err) {
      // Ignorar errores al eliminar directorios
    }
  }

  // Resumen
  console.log(`\n${colors.green}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✨ LIMPIEZA COMPLETADA${colors.reset}`);
  console.log(`${colors.green}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✓ Archivos eliminados:${colors.reset} ${deletedCount}`);
  console.log(`${colors.green}✓ Directorios eliminados:${colors.reset} ${removedDirs}`);
  console.log(`${colors.green}✓ Archivos conservados (Next.js):${colors.reset} ${KEEP_FILES.length}`);
  if (errorCount > 0) {
    console.log(`${colors.red}✗ Errores:${colors.reset} ${errorCount}`);
  }
  console.log();
});
