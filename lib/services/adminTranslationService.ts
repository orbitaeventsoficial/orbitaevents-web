import { log } from '@/lib/logger';

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

type TranslateSuccessSingle = {
  ok: true;
  original: string;
  translations: Record<string, string>;
  translationsByText: Record<string, Record<string, string>>;
};

type TranslateSuccessBatch = {
  ok: true;
  originals: string[];
  translationsByText: Record<string, Record<string, string>>;
};

type TranslateFailure = {
  ok: false;
  error: string;
  status: number;
};

type DetectFailure = TranslateFailure;

type DetectSuccess = {
  ok: true;
  text: string;
  detectedLanguage: 'es' | 'ca' | 'en';
};

function normalizeTexts(body: TranslateBody): string[] {
  if (Array.isArray(body.texts)) return body.texts.filter((t) => typeof t === 'string');
  if (typeof body.text === 'string') return [body.text];
  return [];
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
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

    if (!response.ok) return null;
    const data = await response.json();
    const translated = data?.translations?.[0]?.text;
    return typeof translated === 'string' ? translated : null;
  } catch (error) {
    log.error('[Translate] Error traduint amb DeepL', error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function translateWithGoogle(text: string, targetLang: string): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await response.json();

    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }

    return text;
  } catch (error) {
    log.error('[Translate] Error traduint amb Google fallback', error);
    return text;
  }
}

export async function translateAdminContent(body: TranslateBody): Promise<TranslateSuccessSingle | TranslateSuccessBatch | TranslateFailure> {
  const targetLanguages = Array.isArray(body.targetLanguages) ? body.targetLanguages : ['es', 'ca', 'en'];
  const texts = normalizeTexts(body).map((t) => t.trim()).filter(Boolean);

  if (texts.length === 0) return { ok: false, error: 'Text obligatori', status: 400 };
  if (texts.length > MAX_BATCH_TEXTS) return { ok: false, error: `Massa textos (màx ${MAX_BATCH_TEXTS})`, status: 400 };

  const totalChars = texts.reduce((sum, current) => sum + current.length, 0);
  if (totalChars > MAX_BATCH_TOTAL_CHARS) {
    return { ok: false, error: `Payload massa gran (màx ${MAX_BATCH_TOTAL_CHARS} caràcters)`, status: 400 };
  }

  if (texts.some((text) => text.length > MAX_TEXT_LENGTH)) {
    return { ok: false, error: `Text massa llarg (màx ${MAX_TEXT_LENGTH})`, status: 400 };
  }

  const filteredTargets = targetLanguages.filter((lang) => ALLOWED_LANGUAGES.includes(lang as (typeof ALLOWED_LANGUAGES)[number]));
  if (filteredTargets.length === 0) return { ok: false, error: 'Idiomes no vàlids', status: 400 };

  const translationsByText: Record<string, Record<string, string>> = {};
  for (const original of texts) translationsByText[original] = {};

  for (const lang of filteredTargets) {
    const langCode = lang === 'ca' ? 'ca' : lang === 'en' ? 'en' : 'es';
    const translated = await mapLimit(texts, 4, async (original) => {
      const deeplTranslation = await translateWithDeepL(original, langCode);
      return deeplTranslation ?? (await translateWithGoogle(original, langCode));
    });

    for (let i = 0; i < texts.length; i++) {
      translationsByText[texts[i]][lang] = translated[i] ?? texts[i];
    }
  }

  if (texts.length === 1) {
    return {
      ok: true,
      original: texts[0],
      translations: translationsByText[texts[0]],
      translationsByText,
    };
  }

  return { ok: true, originals: texts, translationsByText };
}

function detectLanguage(text: string): 'es' | 'ca' | 'en' {
  const lowerText = text.toLowerCase();
  const catalanWords = ['què', 'és', 'són', 'està', 'amb', 'però', 'també', 'molt', 'més', 'aquest', 'aquesta'];
  const englishWords = ['the', 'is', 'are', 'was', 'were', 'have', 'has', 'with', 'this', 'that'];
  const spanishWords = ['que', 'es', 'son', 'está', 'con', 'pero', 'también', 'muy', 'más', 'este', 'esta'];

  const catalanCount = catalanWords.filter((word) => lowerText.includes(word)).length;
  const englishCount = englishWords.filter((word) => lowerText.includes(` ${word} `)).length;
  const spanishCount = spanishWords.filter((word) => lowerText.includes(word)).length;

  if (catalanCount > spanishCount && catalanCount > englishCount) return 'ca';
  if (englishCount > spanishCount && englishCount > catalanCount) return 'en';
  return 'es';
}

export function detectAdminContentLanguage(text: string): DetectSuccess | DetectFailure {
  if (!text) return { ok: false, error: 'Text obligatori', status: 400 };
  if (text.length > MAX_TEXT_LENGTH) return { ok: false, error: `Text massa llarg (màx ${MAX_TEXT_LENGTH})`, status: 400 };

  return {
    ok: true,
    text,
    detectedLanguage: detectLanguage(text),
  };
}