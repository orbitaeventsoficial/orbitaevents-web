// app/api/admin/translate/route.ts
// API de traducción automática para Text Manager
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const MAX_TEXT_LENGTH = 2000;
const TRANSLATE_TIMEOUT_MS = 6000;
const ALLOWED_LANGUAGES = ['es', 'ca', 'en'] as const;

// Función simple de traducción usando Google Translate (sin API key)
async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    // Usar Google Translate vía fetch simple
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await response.json();

    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }

    return text; // Si falla, devolver el texto original
  } catch (error) {
    log.error('Error traduciendo:', error);
    return text; // Si falla, devolver el texto original
  }
}

// POST - Traducir texto a múltiples idiomas
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const rateLimit = await checkRateLimit(req, {
    limit: 30,
    windowSeconds: 300,
    prefix: 'admin-translate',
  });
  if (rateLimit) return rateLimit;

  try {
    const body = await req.json();
    const { text, targetLanguages = ['es', 'ca', 'en'] } = body as {
      text: string;
      targetLanguages?: string[];
    };

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Texto requerido' },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { ok: false, error: `Texto demasiado largo (max ${MAX_TEXT_LENGTH})` },
        { status: 400 }
      );
    }

    const filteredTargets = targetLanguages.filter((lang) =>
      ALLOWED_LANGUAGES.includes(lang as typeof ALLOWED_LANGUAGES[number])
    );

    if (filteredTargets.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Idiomas no válidos' },
        { status: 400 }
      );
    }

    // Traducir a cada idioma objetivo
    const translations: Record<string, string> = {};

    for (const lang of filteredTargets) {
      const langCode = lang === 'ca' ? 'ca' : lang === 'en' ? 'en' : 'es';
      translations[lang] = await translateText(text, langCode);
    }

    return NextResponse.json({
      ok: true,
      original: text,
      translations,
    });

  } catch (error) {
    log.error('Error en traducción:', error);
    return NextResponse.json(
      { ok: false, error: 'Error en traducción' },
      { status: 500 }
    );
  }
}

// Detectar idioma del texto
function detectLanguage(text: string): 'es' | 'ca' | 'en' {
  const lowerText = text.toLowerCase();

  // Palabras clave en catalán
  const catalanWords = ['què', 'és', 'són', 'està', 'amb', 'però', 'també', 'molt', 'més', 'aquest', 'aquesta'];
  const catalanCount = catalanWords.filter(word => lowerText.includes(word)).length;

  // Palabras clave en inglés
  const englishWords = ['the', 'is', 'are', 'was', 'were', 'have', 'has', 'with', 'this', 'that'];
  const englishCount = englishWords.filter(word => lowerText.includes(` ${word} `)).length;

  // Palabras clave en español
  const spanishWords = ['que', 'es', 'son', 'está', 'con', 'pero', 'también', 'muy', 'más', 'este', 'esta'];
  const spanishCount = spanishWords.filter(word => lowerText.includes(word)).length;

  if (catalanCount > spanishCount && catalanCount > englishCount) return 'ca';
  if (englishCount > spanishCount && englishCount > catalanCount) return 'en';
  return 'es';
}

// GET - Detectar idioma de un texto
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const rateLimit = await checkRateLimit(req, {
    limit: 60,
    windowSeconds: 300,
    prefix: 'admin-translate-detect',
  });
  if (rateLimit) return rateLimit;

  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');

    if (!text) {
      return NextResponse.json(
        { ok: false, error: 'Texto requerido' },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { ok: false, error: `Texto demasiado largo (max ${MAX_TEXT_LENGTH})` },
        { status: 400 }
      );
    }

    const language = detectLanguage(text);

    return NextResponse.json({
      ok: true,
      text,
      detectedLanguage: language,
    });

  } catch (error) {
    log.error('Error detectando idioma:', error);
    return NextResponse.json(
      { ok: false, error: 'Error detectando idioma' },
      { status: 500 }
    );
  }
}
