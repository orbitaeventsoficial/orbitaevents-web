#!/usr/bin/env node
/**
 * Script para eliminar textos deprecated de los archivos de traducción
 */

const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');

// Claves a eliminar (deprecated/no usadas)
const keysToDelete = [
  'hero.headline1',
  'hero.headline2',
  'hero.headline3',
  'hero.headlines',
  'hero.headlineOld1',
  'hero.headlineOld2',
  'hero.headline',
  'hero.countdownPrefix',
  'hero.days',
  'hero.hours',
  'hero.mins',
  'hero.secs',
  'hero.urgencyExpired',
  'hero.scroll',
  'hero.punchline',
  'hero.services',
  'hero.response',
  'hero.scarcity',
  'hero.mobileCta',
  'hero.serviceLabels',
  'hero.socialProof',
  'hero.urgency',
  'hero.scrollMore',
  'hero.titleLine1',
  'hero.titleLine2',
  'hero.subtitle',
  'hero.subtitleHighlight',
  'hero.ctaPrimary',
  'hero.ctaSecondary',
  'hero.title',
  'hero.subtitleOld',
  'hero.subtitleBold',
  'hero.subtitleEnd',
  'hero.availableSlots',
  'hero.features',
  'hero.forEvents',
  'hero.events',
  'hero.simpleCta',
  'hero.happyClients',
  'hero.trust',
  'hero.cta',
];

function deleteByPath(obj, path) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) return false;
    current = current[keys[i]];
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey in current) {
    delete current[lastKey];
    return true;
  }
  return false;
}

function cleanFile(filePath, locale) {
  console.log(`\n🧹 Limpiando ${locale}.json...`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  let deletedCount = 0;

  for (const key of keysToDelete) {
    if (deleteByPath(data, key)) {
      deletedCount++;
      console.log(`  ❌ Eliminado: ${key}`);
    }
  }

  // Guardar archivo limpio
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');

  console.log(`  ✅ ${deletedCount} claves eliminadas de ${locale}.json`);
  return deletedCount;
}

console.log('🔥 LIMPIEZA DE TEXTOS DEPRECATED\n');
console.log(`Claves a eliminar: ${keysToDelete.length}`);

let totalDeleted = 0;

// Limpiar ES
totalDeleted += cleanFile(path.join(messagesDir, 'es.json'), 'es');

// Limpiar CA
totalDeleted += cleanFile(path.join(messagesDir, 'ca.json'), 'ca');

// Limpiar EN
totalDeleted += cleanFile(path.join(messagesDir, 'en.json'), 'en');

console.log(`\n✨ TOTAL: ${totalDeleted} claves eliminadas de los 3 archivos`);
console.log('✅ Limpieza completada\n');
