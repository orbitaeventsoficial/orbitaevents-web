import { log } from '@/lib/logger';

const TRANSLATE_TIMEOUT_MS = 7000;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_BASE_URL =
  process.env.DEEPL_BASE_URL ||
  (DEEPL_API_KEY?.includes(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com');

function normalizeTargetLocale(locale?: string | null): string {
  const raw = String(locale || 'ca').trim().toLowerCase();
  if (!raw) return 'ca';
  if (raw.startsWith('ca')) return 'ca';
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('ru')) return 'ru';
  if (raw.startsWith('fr')) return 'fr';
  if (raw.startsWith('it')) return 'it';
  if (raw.startsWith('de')) return 'de';
  if (raw.startsWith('pt')) return 'pt';
  return raw.slice(0, 2);
}

function mapDeepLTarget(lang: string): string {
  if (lang === 'ca') return 'CA';
  if (lang === 'es') return 'ES';
  if (lang === 'en') return 'EN-GB';
  if (lang === 'ru') return 'RU';
  if (lang === 'fr') return 'FR';
  if (lang === 'it') return 'IT';
  if (lang === 'de') return 'DE';
  if (lang === 'pt') return 'PT-PT';
  return 'EN-GB';
}

async function translateWithDeepL(text: string, targetLang: string, html = false): Promise<string | null> {
  if (!DEEPL_API_KEY) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);

  try {
    const params = new URLSearchParams();
    params.append('auth_key', DEEPL_API_KEY);
    params.append('text', text);
    params.append('target_lang', mapDeepLTarget(targetLang));
    if (html) params.append('tag_handling', 'html');

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
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function translateWithGoogle(text: string, targetLang: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = await response.json();
    const translated = data?.[0]?.[0]?.[0];
    return typeof translated === 'string' && translated.trim() ? translated : null;
  } catch {
    return null;
  }
}

export async function translateTextForLocale(text: string, locale?: string | null): Promise<string> {
  const target = normalizeTargetLocale(locale);
  if (target === 'ca') return text;
  const trimmed = String(text || '').trim();
  if (!trimmed) return text;

  const byDeepL = await translateWithDeepL(trimmed, target, false);
  if (byDeepL) return byDeepL;
  const byGoogle = await translateWithGoogle(trimmed, target);
  if (byGoogle) return byGoogle;
  return text;
}

export async function translateHtmlForLocale(html: string, locale?: string | null): Promise<string> {
  const target = normalizeTargetLocale(locale);
  if (target === 'ca') return html;
  const trimmed = String(html || '').trim();
  if (!trimmed) return html;

  // Only DeepL is safe for HTML tags.
  const byDeepL = await translateWithDeepL(trimmed, target, true);
  if (byDeepL) return byDeepL;

  log.warn('No s’ha pogut traduir HTML amb DeepL; s’envia en idioma original', { target });
  return html;
}

