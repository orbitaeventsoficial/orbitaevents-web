#!/usr/bin/env node
/**
 * LIMPIEZA PROFUNDA - Eliminar carpetas y APIs viejas/no usadas
 * Basado en análisis manual de la estructura del proyecto
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
  blue: '\x1b[34m',
};

console.log(`${colors.cyan}🧹 LIMPIEZA PROFUNDA DE CARPETAS Y APIs${colors.reset}\n`);

const rootDir = path.join(__dirname, '..');

// Lista completa de carpetas/archivos a eliminar
const itemsToDelete = [
  // 1. Carpeta con brackets raros (vacía)
  {
    path: 'app/[[]locale[]]/gracias',
    type: 'dir',
    reason: 'Carpeta vacía con brackets incorrectos',
    category: 'ERROR'
  },
  {
    path: 'app/[[]locale[]]',
    type: 'dir',
    reason: 'Carpeta padre con brackets incorrectos',
    category: 'ERROR'
  },

  // 2. Páginas admin NO en navegación (no usadas)
  {
    path: 'app/admin/contactes',
    type: 'dir',
    reason: 'Página admin no está en navegación',
    category: 'ADMIN'
  },
  {
    path: 'app/admin/coverage',
    type: 'dir',
    reason: 'Página admin no está en navegación',
    category: 'ADMIN'
  },
  {
    path: 'app/admin/dashboard',
    type: 'dir',
    reason: 'Página admin no está en navegación (duplicado)',
    category: 'ADMIN'
  },
  {
    path: 'app/admin/duplicates',
    type: 'dir',
    reason: 'Página admin no está en navegación',
    category: 'ADMIN'
  },
  {
    path: 'app/admin/equipment',
    type: 'dir',
    reason: 'Página admin no está en navegación',
    category: 'ADMIN'
  },
  {
    path: 'app/admin/events',
    type: 'dir',
    reason: 'Página admin no está en navegación',
    category: 'ADMIN'
  },
  {
    path: 'app/admin/features',
    type: 'dir',
    reason: 'Página admin no está en navegación',
    category: 'ADMIN'
  },
  {
    path: 'app/admin/privacy',
    type: 'dir',
    reason: 'Página admin no está en navegación',
    category: 'ADMIN'
  },
  {
    path: 'app/admin/stats',
    type: 'dir',
    reason: 'Página admin no está en navegación',
    category: 'ADMIN'
  },
  {
    path: 'app/admin/theme',
    type: 'dir',
    reason: 'Página admin no está en navegación',
    category: 'ADMIN'
  },

  // 3. Componentes admin no usados
  {
    path: 'app/admin/components/BottomSheet.tsx',
    type: 'file',
    reason: 'Componente admin no importado en ningún lado',
    category: 'COMPONENT'
  },
  {
    path: 'app/admin/components/ui.tsx',
    type: 'file',
    reason: 'Componente admin no importado en ningún lado',
    category: 'COMPONENT'
  },
  {
    path: 'app/admin/components/mobile/BottomNavPro.tsx',
    type: 'file',
    reason: 'Componente mobile no importado',
    category: 'COMPONENT'
  },

  // 4. APIs viejas/duplicadas de textos
  {
    path: 'app/api/admin/texts',
    type: 'dir',
    reason: 'API vieja de textos (no usada)',
    category: 'API'
  },
  {
    path: 'app/api/admin/texts-json',
    type: 'dir',
    reason: 'API vieja de textos con JSON (no usada)',
    category: 'API'
  },
  {
    path: 'app/api/admin/translations',
    type: 'dir',
    reason: 'API vieja de traducciones con Prisma (no usada)',
    category: 'API'
  },
];

// Agrupar por categoría
const byCategory = itemsToDelete.reduce((acc, item) => {
  if (!acc[item.category]) acc[item.category] = [];
  acc[item.category].push(item);
  return acc;
}, {});

console.log(`📊 Resumen:\n`);
Object.keys(byCategory).forEach(cat => {
  const categoryColors = {
    'ERROR': colors.red,
    'ADMIN': colors.yellow,
    'COMPONENT': colors.blue,
    'API': colors.magenta,
  };
  const color = categoryColors[cat] || colors.cyan;
  console.log(`${color}${cat}:${colors.reset} ${byCategory[cat].length} items`);
});

console.log(`\n${colors.cyan}Total:${colors.reset} ${itemsToDelete.length} items\n`);

// Confirmar
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question(`${colors.yellow}¿Eliminar estos ${itemsToDelete.length} items? (s/n): ${colors.reset}`, (answer) => {
  readline.close();

  if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'si') {
    console.log(`\n${colors.yellow}❌ Operación cancelada${colors.reset}`);
    process.exit(0);
  }

  console.log(`\n${colors.cyan}🔥 Eliminando...${colors.reset}\n`);

  let deletedDirs = 0;
  let deletedFiles = 0;
  let errors = 0;

  // Eliminar en orden: primero archivos, luego directorios (de más profundo a más superficial)
  const sortedItems = [...itemsToDelete].sort((a, b) => {
    // Files first, then dirs by depth (deepest first)
    if (a.type === 'file' && b.type === 'dir') return -1;
    if (a.type === 'dir' && b.type === 'file') return 1;
    const aDepth = a.path.split('/').length;
    const bDepth = b.path.split('/').length;
    return bDepth - aDepth;
  });

  for (const item of sortedItems) {
    const fullPath = path.join(rootDir, item.path);

    try {
      if (!fs.existsSync(fullPath)) {
        console.log(`  ${colors.yellow}⚠️  Ya no existe:${colors.reset} ${item.path}`);
        continue;
      }

      if (item.type === 'file') {
        fs.unlinkSync(fullPath);
        deletedFiles++;
        console.log(`  ${colors.red}❌${colors.reset} ${item.path}`);
      } else {
        // Eliminar directorio recursivamente
        fs.rmSync(fullPath, { recursive: true, force: true });
        deletedDirs++;
        console.log(`  ${colors.red}📁${colors.reset} ${item.path}`);
      }
    } catch (err) {
      errors++;
      console.error(`  ${colors.red}✗ Error: ${item.path} - ${err.message}${colors.reset}`);
    }
  }

  // Eliminar directorios vacíos que puedan quedar
  console.log(`\n${colors.cyan}🧹 Limpiando directorios vacíos...${colors.reset}\n`);

  const dirsToCheck = [
    path.join(rootDir, 'app', 'admin', 'components', 'mobile'),
    path.join(rootDir, 'app', 'admin', 'components'),
  ];

  let removedEmptyDirs = 0;
  for (const dir of dirsToCheck) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        if (files.length === 0) {
          fs.rmdirSync(dir);
          removedEmptyDirs++;
          console.log(`  ${colors.magenta}📁 Eliminado directorio vacío:${colors.reset} ${path.relative(rootDir, dir)}`);
        }
      }
    } catch (err) {
      // Ignorar errores
    }
  }

  // Resumen final
  console.log(`\n${colors.green}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✨ LIMPIEZA PROFUNDA COMPLETADA${colors.reset}`);
  console.log(`${colors.green}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✓ Archivos eliminados:${colors.reset} ${deletedFiles}`);
  console.log(`${colors.green}✓ Directorios eliminados:${colors.reset} ${deletedDirs}`);
  console.log(`${colors.green}✓ Directorios vacíos limpiados:${colors.reset} ${removedEmptyDirs}`);
  if (errors > 0) {
    console.log(`${colors.red}✗ Errores:${colors.reset} ${errors}`);
  }
  console.log();
});
