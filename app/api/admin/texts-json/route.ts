// app/api/admin/texts-json/route.ts
// API BRUTAL per gestionar textos - Llegeix/escriu directament als JSON
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Rutes als fitxers JSON
const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const CA_JSON_PATH = path.join(MESSAGES_DIR, 'ca.json');
const ES_JSON_PATH = path.join(MESSAGES_DIR, 'es.json');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓ DE SECCIONS - Per agrupar els textos de forma lògica
// ═══════════════════════════════════════════════════════════════════════════

interface SectionConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  paths: string[];  // Paths dins del JSON (ex: 'hero', 'services.bodas')
}

const SECTIONS_CONFIG: SectionConfig[] = [
  {
    id: 'hero',
    name: 'Hero Principal',
    emoji: '🏠',
    description: 'El primer que veuen els visitants - titulars, subtítols, CTA',
    paths: ['hero.headlines', 'hero.headline1', 'hero.headline2', 'hero.subtitle', 'hero.cta', 'hero.trust', 'hero.badge']
  },
  {
    id: 'services',
    name: 'Serveis',
    emoji: '🛠️',
    description: 'Casaments, festes, empreses - noms, descripcions, preus',
    paths: ['services']
  },
  {
    id: 'tematitzacio',
    name: 'Tematització',
    emoji: '✨',
    description: 'Món Màgic, Halloween, experiències temàtiques',
    paths: ['tematitzacio']
  },
  {
    id: 'testimonials',
    name: 'Testimonis',
    emoji: '💬',
    description: 'Opinions dels clients, cites, valoracions',
    paths: ['testimonials', 'reviews']
  },
  {
    id: 'stats',
    name: 'Estadístiques',
    emoji: '📊',
    description: 'Números, anys experiència, events realitzats',
    paths: ['stats']
  },
  {
    id: 'cta',
    name: 'Crides a l\'Acció',
    emoji: '🔥',
    description: 'Botons, CTAs, urgència, ofertes',
    paths: ['finalCta', 'urgency', 'offerModal']
  },
  {
    id: 'contact',
    name: 'Contacte',
    emoji: '📧',
    description: 'Formulari, missatges, confirmacions',
    paths: ['contact', 'contactForm']
  },
  {
    id: 'footer',
    name: 'Peu de Pàgina',
    emoji: '🦶',
    description: 'Footer, legal, copyright',
    paths: ['footer', 'footerLinks']
  },
  {
    id: 'common',
    name: 'Elements Comuns',
    emoji: '🔘',
    description: 'Botons, navegació, missatges generals',
    paths: ['common', 'navigation']
  },
  {
    id: 'faq',
    name: 'FAQ',
    emoji: '❓',
    description: 'Preguntes freqüents i respostes',
    paths: ['faq']
  },
  {
    id: 'guarantee',
    name: 'Garanties',
    emoji: '✅',
    description: 'Compromisos, garanties, promeses',
    paths: ['guarantee']
  },
  {
    id: 'packs',
    name: 'Packs i Preus',
    emoji: '📦',
    description: 'Paquets, preus, característiques',
    paths: ['packs', 'pricing']
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// UTILITATS
// ═══════════════════════════════════════════════════════════════════════════

// Obtenir valor d'un objecte per path
function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// Establir valor en un objecte per path
function setValueByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current: Record<string, unknown> = obj;
  
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  
  current[lastKey] = value;
}

// Extreure tots els textos d'un objecte recursivament
interface TextEntry {
  path: string;
  caValue: string;
  esValue: string;
  section: string;
}

function extractTexts(
  caObj: Record<string, unknown>, 
  esObj: Record<string, unknown>,
  section: string,
  currentPath: string = ''
): TextEntry[] {
  const texts: TextEntry[] = [];
  
  for (const [key, caValue] of Object.entries(caObj)) {
    // Ignorar claus que comencen amb _
    if (key.startsWith('_')) continue;
    
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    const esValue = getValueByPath(esObj, key);
    
    if (typeof caValue === 'string') {
      texts.push({
        path: newPath,
        caValue: caValue,
        esValue: typeof esValue === 'string' ? esValue : caValue,
        section
      });
    } else if (typeof caValue === 'object' && caValue !== null && !Array.isArray(caValue)) {
      texts.push(...extractTexts(
        caValue as Record<string, unknown>,
        (esValue || {}) as Record<string, unknown>,
        section,
        newPath
      ));
    }
  }
  
  return texts;
}

// ═══════════════════════════════════════════════════════════════════════════
// GET - Obtenir tots els textos organitzats per seccions
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sectionFilter = searchParams.get('section');
    const searchTerm = searchParams.get('search')?.toLowerCase();
    
    // Llegir els dos fitxers JSON
    const [caContent, esContent] = await Promise.all([
      fs.readFile(CA_JSON_PATH, 'utf-8'),
      fs.readFile(ES_JSON_PATH, 'utf-8'),
    ]);
    
    const caData = JSON.parse(caContent);
    const esData = JSON.parse(esContent);
    
    // Organitzar textos per seccions
    const result: Record<string, { config: SectionConfig; texts: TextEntry[] }> = {};
    
    for (const section of SECTIONS_CONFIG) {
      // Filtrar per secció si s'especifica
      if (sectionFilter && section.id !== sectionFilter) continue;
      
      const sectionTexts: TextEntry[] = [];
      
      for (const basePath of section.paths) {
        const caSection = getValueByPath(caData, basePath);
        const esSection = getValueByPath(esData, basePath);
        
        if (caSection && typeof caSection === 'object') {
          const texts = extractTexts(
            caSection as Record<string, unknown>,
            (esSection || {}) as Record<string, unknown>,
            section.id,
            basePath
          );
          sectionTexts.push(...texts);
        }
      }
      
      // Filtrar per terme de cerca si s'especifica
      let filteredTexts = sectionTexts;
      if (searchTerm) {
        filteredTexts = sectionTexts.filter(t => 
          t.path.toLowerCase().includes(searchTerm) ||
          t.caValue.toLowerCase().includes(searchTerm) ||
          t.esValue.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filteredTexts.length > 0) {
        result[section.id] = {
          config: section,
          texts: filteredTexts
        };
      }
    }
    
    return NextResponse.json({
      ok: true,
      sections: result,
      sectionsConfig: SECTIONS_CONFIG,
      totalTexts: Object.values(result).reduce((sum, s) => sum + s.texts.length, 0)
    });
    
  } catch (error) {
    log.error('Error llegint textos:', error);
    return NextResponse.json(
      { error: 'Error llegint textos', details: String(error) },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUT - Actualitzar textos (guarda en ambdós idiomes)
// ═══════════════════════════════════════════════════════════════════════════

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { updates } = body as {
      updates: Array<{ path: string; caValue: string; esValue: string }>
    };
    
    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Format invàlid: es requereix un array de updates' },
        { status: 400 }
      );
    }
    
    // Llegir fitxers actuals
    const [caContent, esContent] = await Promise.all([
      fs.readFile(CA_JSON_PATH, 'utf-8'),
      fs.readFile(ES_JSON_PATH, 'utf-8'),
    ]);
    
    const caData = JSON.parse(caContent);
    const esData = JSON.parse(esContent);
    
    // Aplicar canvis
    for (const { path, caValue, esValue } of updates) {
      setValueByPath(caData, path, caValue);
      setValueByPath(esData, path, esValue);
    }
    
    // Guardar fitxers
    await Promise.all([
      fs.writeFile(CA_JSON_PATH, JSON.stringify(caData, null, 2) + '\n', 'utf-8'),
      fs.writeFile(ES_JSON_PATH, JSON.stringify(esData, null, 2) + '\n', 'utf-8'),
    ]);
    
    return NextResponse.json({
      ok: true,
      updated: updates.length,
      message: `✅ ${updates.length} textos actualitzats en CA i ES`
    });
    
  } catch (error) {
    log.error('Error actualitzant textos:', error);
    return NextResponse.json(
      { error: 'Error actualitzant textos', details: String(error) },
      { status: 500 }
    );
  }
}
