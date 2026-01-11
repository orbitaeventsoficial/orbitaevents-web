#!/usr/bin/env node
/**
 * Eliminar secciones CONFIRMADAS como no usadas
 */

const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');

// Secciones confirmadas como NO usadas
const sectionsToDelete = [
  'elViatge',
  'casosExit',
  'startCreating',
  'discountPopup',
  'heroNew', // Si existe heroNew, hero es el viejo (ya limpiado)
];

function cleanFile(filePath, locale) {
  console.log(`\n🧹 Limpiando ${locale}.json...`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  let deletedCount = 0;

  for (const section of sectionsToDelete) {
    if (section in data) {
      delete data[section];
      deletedCount++;
      console.log(`  ❌ Eliminada sección: ${section}`);
    }
  }

  if (deletedCount > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`  ✅ ${deletedCount} secciones eliminadas`);
  } else {
    console.log(`  ℹ️  No se encontraron secciones para eliminar`);
  }

  return deletedCount;
}

console.log('🔥 LIMPIEZA DE SECCIONES NO USADAS\n');
console.log(`Secciones a eliminar: ${sectionsToDelete.join(', ')}\n`);

let totalDeleted = 0;

totalDeleted += cleanFile(path.join(messagesDir, 'es.json'), 'es');
totalDeleted += cleanFile(path.join(messagesDir, 'ca.json'), 'ca');
totalDeleted += cleanFile(path.join(messagesDir, 'en.json'), 'en');

console.log(`\n✨ TOTAL: ${totalDeleted} secciones eliminadas\n`);
