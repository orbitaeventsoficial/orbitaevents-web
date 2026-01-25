#!/usr/bin/env node
/**
 * Script de verificació de tracking per Òrbita Events
 * Verifica que Google Analytics estigui configurat
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('\n🔍 VERIFICANT CONFIGURACIÓ DE TRACKING...\n');

// Llegir .env.local
let envContent = '';
try {
  envContent = readFileSync(join(rootDir, '.env.local'), 'utf-8');
} catch (err) {
  console.log('❌ No s\'ha trobat .env.local');
  process.exit(1);
}

// Verificar Google Analytics
const gaMatch = envContent.match(/NEXT_PUBLIC_GA_MEASUREMENT_ID=(.+)/);
const gaId = gaMatch ? gaMatch[1].trim() : '';
const gtmMatch = envContent.match(/NEXT_PUBLIC_GTM_ID=(.+)/);
const gtmId = gtmMatch ? gtmMatch[1].trim() : '';

if (gaId && gaId.startsWith('G-')) {
  console.log('✅ Google Analytics configurat:', gaId);
} else {
  console.log('❌ Google Analytics NO configurat');
  console.log('   Afegeix: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX');
}

if (gtmId && gtmId.startsWith('GTM-')) {
  console.log('✅ Google Tag Manager configurat:', gtmId);
} else {
  console.log('⚠️  Google Tag Manager no trobat');
  console.log('   Afegeix: NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX');
}

// Verificar events de tracking al codi
console.log('\n📊 EVENTS DE TRACKING IMPLEMENTATS:\n');

const analyticsFile = readFileSync(join(rootDir, 'app/lib/analytics.ts'), 'utf-8');

const events = [
  'generate_lead',
  'contact_whatsapp',
  'contact_phone',
  'select_pack',
  'calculate_price',
  'view_video_testimonial',
  'scroll',
  'click_cta',
  'page_view'
];

events.forEach(event => {
  if (analyticsFile.includes(event)) {
    console.log(`✅ ${event}`);
  } else {
    console.log(`❌ ${event}`);
  }
});

// Resum
console.log('\n═══════════════════════════════════════════════════════\n');

if (gaId && gaId.startsWith('G-')) {
  console.log('🎉 TRACKING ACTIVAT! Google Ads pot començar a funcionar.\n');
  console.log('SEGÜENTS PASSOS:');
  console.log('1. Afegir les mateixes variables a Railway');
  console.log('2. Fer redeploy');
  console.log('3. Configurar conversions a Google Ads');
} else {
  console.log('⚠️  TRACKING NO ACTIU - Google Ads NO funcionarà\n');
  console.log('SEGÜENTS PASSOS:');
  console.log('1. Obtenir Google Analytics ID: https://analytics.google.com');
  console.log('2. Afegir a .env.local: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX');
  console.log('3. Tornar a executar aquest script');
}

console.log('\n═══════════════════════════════════════════════════════\n');
