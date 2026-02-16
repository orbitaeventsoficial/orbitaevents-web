// app/api/admin/translate/route.ts
// API de traducció automàtica per al gestor de textos
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const MAX_TEXT_LENGTH = 2000;
const MAX_BATCH_TEXTS = 200;
const MAX_BATCH_TOTAL_CHARS = 50000;
const TRANSLATE_TIMEOUT_MS = 6000;
const ALLOWED_LANGUAGES = ['es', 'ca', 'en'] as const;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_BASE_URL =
  process.env.DEEPL_BASE_URL ||
  (DEEPL_API_KEY?.includes(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com');

type TranslateBody = {
  text?: string;
  texts?: string[];
  targetLanguages?: string[];
};

function normalizeTexts(body: TranslateBody): string[] {
  if (Array.isArray(body.texts)) return body.texts.filter((t) => typeof t === 'string');
  if (typeof body.text === 'string') return [body.text];
  return [];
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function mapDeepLTarget(lang: string): string {
  if (lang === 'es') return 'ES';
  if (lang === 'ca') return 'CA';
  return 'EN-GB';
}

async function translateWithDeepL(text: string, targetLang: string): Promise<string | null> {
  if (!DEEPL_API_KEY) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);

  try {
    const params = new URLSearchParams();
    params.append('auth_key', DEEPL_API_KEY);
    params.append('text', text);
    params.append('target_lang', mapDeepLTarget(targetLang));

    const response = await fetch(`${DEEPL_BASE_URL}/v2/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const translated = data?.translations?.[0]?.text;
    return typeof translated === 'string' ? translated : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Funció simple de traducció amb Google Translate (sense API key)
async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    // Fer servir Google Translate via fetch simple
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await response.json();

    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }

    return text; // Si falla, retornem el text original
  } catch (error) {
    log.error('Error traduint:', error);
    return text; // Si falla, retornem el text original
  }
}

// POST - Traduir text a múltiples idiomes
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
    const body = (await req.json()) as TranslateBody;
    const targetLanguages = Array.isArray(body.targetLanguages) ? body.targetLanguages : ['es', 'ca', 'en'];
    const texts = normalizeTexts(body).map((t) => t.trim()).filter(Boolean);

    if (texts.length === 0) {
      return NextResponse.json({ ok: false, error: 'Text obligatori' }, { status: 400 });
    }

    if (texts.length > MAX_BATCH_TEXTS) {
      return NextResponse.json(
        { ok: false, error: `Massa textos (màx ${MAX_BATCH_TEXTS})` },
        { status: 400 }
      );
    }

    const totalChars = texts.reduce((sum, current) => sum + current.length, 0);
    if (totalChars > MAX_BATCH_TOTAL_CHARS) {
      return NextResponse.json(
        { ok: false, error: `Payload massa gran (màx ${MAX_BATCH_TOTAL_CHARS} caràcters)` },
        { status: 400 }
      );
    }

    if (texts.some((text) => text.length > MAX_TEXT_LENGTH)) {
      return NextResponse.json(
        { ok: false, error: `Text massa llarg (màx ${MAX_TEXT_LENGTH})` },
        { status: 400 }
      );
    }

    const filteredTargets = targetLanguages.filter((lang) =>
      ALLOWED_LANGUAGES.includes(lang as typeof ALLOWED_LANGUAGES[number])
    );

    if (filteredTargets.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Idiomes no vàlids' },
        { status: 400 }
      );
    }

    const translationsByText: Record<string, Record<string, string>> = {};
    for (const original of texts) translationsByText[original] = {};

    for (const lang of filteredTargets) {
      const langCode = lang === 'ca' ? 'ca' : lang === 'en' ? 'en' : 'es';
      const translated = await mapLimit(texts, 4, async (original) => {
        const deeplTranslation = await translateWithDeepL(original, langCode);
        return deeplTranslation ?? (await translateText(original, langCode));
      });

      for (let i = 0; i < texts.length; i++) {
        translationsByText[texts[i]][lang] = translated[i] ?? texts[i];
      }
    }

    if (texts.length === 1) {
      return NextResponse.json({
        ok: true,
        original: texts[0],
        translations: translationsByText[texts[0]],
        translationsByText,
      });
    }

    return NextResponse.json({
      ok: true,
      originals: texts,
      translationsByText,
    });

  } catch (error) {
    log.error('Error en traducció:', error);
    return NextResponse.json(
      { ok: false, error: 'Error en traducció' },
      { status: 500 }
    );
  }
}

// Detectar idioma del text
function detectLanguage(text: string): 'es' | 'ca' | 'en' {
  const lowerText = text.toLowerCase();

  // Paraules clau en català
  const catalanWords = ['què', 'és', 'són', 'està', 'amb', 'però', 'també', 'molt', 'més', 'aquest', 'aquesta'];
  const catalanCount = catalanWords.filter(word => lowerText.includes(word)).length;

  // Paraules clau en anglès
  const englishWords = ['the', 'is', 'are', 'was', 'were', 'have', 'has', 'with', 'this', 'that'];
  const englishCount = englishWords.filter(word => lowerText.includes(` ${word} `)).length;

  // Paraules clau en castellà
  const spanishWords = ['que', 'es', 'son', 'está', 'con', 'pero', 'también', 'muy', 'más', 'este', 'esta'];
  const spanishCount = spanishWords.filter(word => lowerText.includes(word)).length;

  if (catalanCount > spanishCount && catalanCount > englishCount) return 'ca';
  if (englishCount > spanishCount && englishCount > catalanCount) return 'en';
  return 'es';
}

// GET - Detectar idioma d'un text
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
        { ok: false, error: 'Text obligatori' },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { ok: false, error: `Text massa llarg (màx ${MAX_TEXT_LENGTH})` },
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
    log.error('Error detectant idioma:', error);
    return NextResponse.json(
      { ok: false, error: 'Error detectant idioma' },
      { status: 500 }
    );
  }
}
