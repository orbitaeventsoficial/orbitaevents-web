// app/api/admin/texts/route.ts
// API per gestionar textos de la web (llegeix/escriu directament a es.json)
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Ruta a l'arxiu es.json
const ES_JSON_PATH = path.join(process.cwd(), 'messages', 'es.json');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓ: Quins camps són EDITABLES
// Tot el que NO estigui aquí serà NOMÉS LECTURA (bloquejat)
// ═══════════════════════════════════════════════════════════════════════════
const EDITABLE_PATHS = [
  // Botons principals
  'common.buttons.contact',
  'common.buttons.configure',
  'common.buttons.requestQuote',
  'common.buttons.reserveToday',

  // Hero
  'hero.title.line1',
  'hero.title.line2',
  'hero.title.line3',
  'hero.subtitle',
  'hero.subtitleBold',
  'hero.subtitleEnd',
  'hero.features',
  'hero.forEvents',

  // Serveis - Noms i taglines
  'services.weddings.name',
  'services.weddings.tagline',
  'services.parties.name',
  'services.parties.tagline',
  'services.mobile.name',
  'services.mobile.tagline',
  'services.corporate.name',
  'services.corporate.tagline',
  'services.production.name',
  'services.production.tagline',
  'services.rental.name',
  'services.rental.tagline',

  // Garanties
  'guarantee.title',
  'guarantee.titleHighlight',
  'guarantee.subtitle',
  'guarantee.ourCommitment',
  'guarantee.successMessage',

  // CTA final
  'finalCta.title',
  'finalCta.titleHighlight',
  'finalCta.subtitle',
  'finalCta.subtitleHighlight',
  'finalCta.responseTime',

  // Contacte
  'contact.title',
  'contact.subtitle',
  'contact.responseTime',

  // Footer
  'footer.tagline',
  'footer.copyright',

  // Testimonials - Es poden editar les cites
  'testimonials.items.wedding.quote',
  'testimonials.items.birthday.quote',
  'testimonials.items.corporate.quote',

  // FAQ - Preguntes i respostes
  'faq.items.1.question',
  'faq.items.1.answer',
  'faq.items.2.question',
  'faq.items.2.answer',
  'faq.items.3.question',
  'faq.items.3.answer',
  'faq.items.4.question',
  'faq.items.4.answer',
  'faq.items.5.question',
  'faq.items.5.answer',
  'faq.items.6.question',
  'faq.items.6.answer',
  'faq.items.7.question',
  'faq.items.7.answer',

  // Packs
  'packs.title',
  'packs.titleHighlight',
  'packs.subtitle',

  // Offer Modal
  'offerModal.title',
  'offerModal.discount',
  'offerModal.description',
  'offerModal.cta',

  // Urgency
  'urgency.urgentTitle',
  'urgency.urgentSubtitle',
];

// Funció per obtenir valor d'un objecte per path (ex: "hero.title.line1")
function _getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// Funció per establir valor en un objecte per path
function setValueByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current: unknown, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj) as Record<string, unknown> | undefined;

  if (target && typeof target === 'object') {
    target[lastKey] = value;
  }
}

// GET - Obtenir tots els textos amb info d'editabilitat
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const content = await fs.readFile(ES_JSON_PATH, 'utf-8');
    const data = JSON.parse(content);

    // Crear llista de textos amb el seu estat
    const texts: Array<{
      path: string;
      value: string;
      editable: boolean;
      category: string;
    }> = [];

    // Funció recursiva per extreure tots els textos
    function extractTexts(obj: Record<string, unknown>, currentPath: string = '') {
      for (const [key, value] of Object.entries(obj)) {
        // Ignorar claus que comencen amb _
        if (key.startsWith('_')) continue;

        const newPath = currentPath ? `${currentPath}.${key}` : key;

        if (typeof value === 'string') {
          texts.push({
            path: newPath,
            value: value,
            editable: EDITABLE_PATHS.includes(newPath),
            category: newPath.split('.')[0], // Primera part del path
          });
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          extractTexts(value as Record<string, unknown>, newPath);
        }
      }
    }

    extractTexts(data);

    // Agrupar per categoria
    const grouped = texts.reduce((acc, text) => {
      if (!acc[text.category]) acc[text.category] = [];
      acc[text.category].push(text);
      return acc;
    }, {} as Record<string, typeof texts>);

    return NextResponse.json({
      ok: true,
      texts: grouped,
      editablePaths: EDITABLE_PATHS,
      totalTexts: texts.length,
      editableCount: texts.filter(t => t.editable).length,
    });
  } catch (error) {
    log.error('Error llegint textos:', error);
    return NextResponse.json(
      { error: 'Error llegint textos' },
      { status: 500 }
    );
  }
}

// PUT - Actualitzar textos (només els editables)
export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const body = await req.json();
    const { updates } = body as {
      updates: Array<{ path: string; value: string }>;
    };

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Format invàlid' },
        { status: 400 }
      );
    }

    // Verificar que tots els paths són editables
    const invalidPaths = updates.filter(u => !EDITABLE_PATHS.includes(u.path));
    if (invalidPaths.length > 0) {
      return NextResponse.json(
        {
          error: 'Alguns camps no són editables',
          invalidPaths: invalidPaths.map(p => p.path)
        },
        { status: 403 }
      );
    }

    // Llegir arxiu actual
    const content = await fs.readFile(ES_JSON_PATH, 'utf-8');
    const data = JSON.parse(content);

    // Aplicar canvis
    for (const { path, value } of updates) {
      setValueByPath(data, path, value);
    }

    // Guardar arxiu
    await fs.writeFile(ES_JSON_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');

    return NextResponse.json({
      ok: true,
      updated: updates.length,
      message: 'Textos actualitzats. Recorda fer push per traduir automàticament.',
    });
  } catch (error) {
    log.error('Error actualitzant textos:', error);
    return NextResponse.json(
      { error: 'Error actualitzant textos' },
      { status: 500 }
    );
  }
}