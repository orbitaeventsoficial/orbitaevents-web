#!/usr/bin/env node

/**
 * 🌍 SCRIPT DE TRADUCCIÓ AUTOMÀTICA - ÒRBITA EVENTS
 * 
 * Utilitza Google Translate API (GRATIS - sense clau API)
 * 
 * ÚS:
 *   node scripts/translate.mjs           → Tradueix tot
 *   node scripts/translate.mjs --force   → Força re-traducció completa
 *   node scripts/translate.mjs --check   → Només comprova què falta
 * 
 * IDIOMES:
 *   es (espanyol) → MESTRE (font)
 *   ca (català)   → esclau
 *   en (anglès)   → esclau
 *   ar (àrab)     → esclau
 *   fr (francès)  → esclau
 *   zh (xinès)    → esclau
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuració
const MASTER_LOCALE = 'es';
// Temporalment només xinès - canviar per ['ca', 'en', 'ar', 'fr', 'zh'] per tots
const TARGET_LOCALES = process.argv.includes('--lang')
  ? [process.argv[process.argv.indexOf('--lang') + 1]]
  : ['ca', 'en', 'ar', 'fr', 'zh'];
const MESSAGES_DIR = path.join(__dirname, '..', 'messages');

// Google Translate API (gratis, sense clau)
const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';

// Mapping d'idiomes per Google Translate
const LOCALE_MAP = {
  'es': 'es',
  'ca': 'ca',
  'en': 'en',
  'ar': 'ar',
  'fr': 'fr',
  'zh': 'zh-CN'  // Xinès simplificat
};

// Colors per la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Tradueix un text amb Google Translate (GRATIS)
 */
async function translateText(text, fromLang, toLang) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return text;
  }

  // No traduir si és només variables {name}, números, etc.
  if (/^[\{\}\d\s\.\,\-\_\@\#\%\&\*\(\)]+$/.test(text)) {
    return text;
  }

  const url = new URL(GOOGLE_TRANSLATE_URL);
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', LOCALE_MAP[fromLang] || fromLang);
  url.searchParams.set('tl', LOCALE_MAP[toLang] || toLang);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    
    // La resposta és un array anidat, el text traduït està a data[0][0][0]
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      let translated = data[0].map(item => item[0]).join('');
      
      // Preservar variables {name}, {count}, etc.
      const originalVars = text.match(/\{[^}]+\}/g) || [];
      const translatedVars = translated.match(/\{[^}]+\}/g) || [];
      
      // Restaurar variables originals si s'han modificat
      originalVars.forEach((v, i) => {
        if (translatedVars[i] && translatedVars[i] !== v) {
          translated = translated.replace(translatedVars[i], v);
        }
      });
      
      return translated;
    }
    return text;
  } catch (error) {
    log('red', `   ⚠️ Error traduint "${text.substring(0, 30)}...": ${error.message}`);
    return text;
  }
}

/**
 * Tradueix un objecte recursivament
 */
async function translateObject(obj, fromLang, toLang, path = '') {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'string') {
      // Mostrar progrés
      process.stdout.write(`\r   📝 Traduint: ${currentPath.substring(0, 50).padEnd(50)}...`);
      
      result[key] = await translateText(value, fromLang, toLang);
      
      // Petit delay per no saturar l'API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } else if (Array.isArray(value)) {
      result[key] = await Promise.all(
        value.map(async (item) => {
          if (typeof item === 'string') {
            return await translateText(item, fromLang, toLang);
          } else if (typeof item === 'object') {
            return await translateObject(item, fromLang, toLang, currentPath);
          }
          return item;
        })
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = await translateObject(value, fromLang, toLang, currentPath);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Troba claus que falten o han canviat
 */
function findMissingKeys(master, target, path = '') {
  const missing = [];
  
  for (const [key, value] of Object.entries(master)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'string') {
      if (!target || target[key] === undefined) {
        missing.push(currentPath);
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      missing.push(...findMissingKeys(value, target?.[key], currentPath));
    }
  }
  
  return missing;
}

/**
 * Fusiona traduccions existents amb noves
 */
function mergeTranslations(existing, newTranslations) {
  const result = { ...existing };
  
  for (const [key, value] of Object.entries(newTranslations)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = mergeTranslations(existing?.[key] || {}, value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Funció principal
 */
async function main() {
  const args = process.argv.slice(2);
  const forceAll = args.includes('--force');
  const checkOnly = args.includes('--check');
  
  log('cyan', '\n🌍 ÒRBITA EVENTS - Sistema de Traducció Automàtica\n');
  log('blue', `   Idioma mestre: ${MASTER_LOCALE}`);
  log('blue', `   Idiomes destí: ${TARGET_LOCALES.join(', ')}\n`);
  
  // Llegir arxiu mestre
  const masterPath = path.join(MESSAGES_DIR, `${MASTER_LOCALE}.json`);
  if (!fs.existsSync(masterPath)) {
    log('red', `❌ No es troba l'arxiu mestre: ${masterPath}`);
    process.exit(1);
  }
  
  const masterContent = JSON.parse(fs.readFileSync(masterPath, 'utf-8'));
  const masterKeys = Object.keys(masterContent);
  log('green', `✅ Arxiu mestre carregat: ${masterKeys.length} seccions principals\n`);
  
  // Processar cada idioma destí
  for (const locale of TARGET_LOCALES) {
    log('yellow', `\n📌 Processant: ${locale.toUpperCase()}`);
    
    const targetPath = path.join(MESSAGES_DIR, `${locale}.json`);
    let existingContent = {};
    
    // Llegir arxiu existent si existeix
    if (fs.existsSync(targetPath)) {
      existingContent = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      log('blue', `   📂 Arxiu existent carregat`);
    }
    
    // Trobar claus que falten
    const missingKeys = findMissingKeys(masterContent, existingContent);
    
    if (checkOnly) {
      if (missingKeys.length > 0) {
        log('yellow', `   ⚠️ ${missingKeys.length} claus falten:`);
        missingKeys.slice(0, 10).forEach(k => log('yellow', `      - ${k}`));
        if (missingKeys.length > 10) {
          log('yellow', `      ... i ${missingKeys.length - 10} més`);
        }
      } else {
        log('green', `   ✅ Totes les claus presents`);
      }
      continue;
    }
    
    if (forceAll || missingKeys.length > 0) {
      const toTranslate = forceAll ? masterContent : masterContent; // TODO: només traduir el que falta
      
      log('blue', `   🔄 Traduint ${forceAll ? 'tot' : missingKeys.length + ' claus noves'}...`);
      
      const translated = await translateObject(toTranslate, MASTER_LOCALE, locale);
      
      // Fusionar amb existent (si no és force)
      const finalContent = forceAll ? translated : mergeTranslations(existingContent, translated);
      
      // Guardar
      fs.writeFileSync(targetPath, JSON.stringify(finalContent, null, 2), 'utf-8');
      log('green', `\n   ✅ Guardat: ${targetPath}`);
      
    } else {
      log('green', `   ✅ Ja està actualitzat`);
    }
  }
  
  log('cyan', '\n\n🎉 Traducció completada!\n');
}

// Executar
main().catch(error => {
  log('red', `\n❌ Error: ${error.message}`);
  process.exit(1);
});
