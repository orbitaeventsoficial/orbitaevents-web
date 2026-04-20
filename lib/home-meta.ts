import caMessages from '@/messages/ca.json';
import esMessages from '@/messages/es.json';
import enMessages from '@/messages/en.json';

export type PublicLocale = 'ca' | 'es' | 'en';

export type HomeMeta = {
  title?: string;
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImageAlt?: string;
};

type MessagesShape = {
  homePage?: {
    meta?: HomeMeta;
  };
};

const HOME_META_BY_LOCALE: Record<PublicLocale, HomeMeta> = {
  ca: ((caMessages as MessagesShape).homePage?.meta) || {},
  es: ((esMessages as MessagesShape).homePage?.meta) || {},
  en: ((enMessages as MessagesShape).homePage?.meta) || {},
};

export function getHomeMeta(locale: PublicLocale = 'ca'): HomeMeta {
  return HOME_META_BY_LOCALE[locale] || HOME_META_BY_LOCALE.ca;
}

export function getHomeKeywords(locale: PublicLocale = 'ca'): string[] {
  const keywords = HOME_META_BY_LOCALE[locale]?.keywords;
  return Array.isArray(keywords) ? keywords : [];
}

export function getDefaultHomeMeta(locale: PublicLocale = 'es'): Required<Pick<HomeMeta, 'title' | 'description' | 'ogTitle' | 'ogDescription' | 'ogImageAlt'>> & { keywords: string[] } {
  const meta = getHomeMeta(locale);
  const fallback = getHomeMeta('ca');
  const localKeywords = getHomeKeywords(locale);
  const fallbackKeywords = getHomeKeywords('ca');

  return {
    title: meta.title || fallback.title || 'Orbita Events',
    description: meta.description || fallback.description || '',
    keywords: localKeywords.length > 0 ? localKeywords : fallbackKeywords,
    ogTitle: meta.ogTitle || meta.title || fallback.ogTitle || fallback.title || 'Orbita Events',
    ogDescription: meta.ogDescription || meta.description || fallback.ogDescription || fallback.description || '',
    ogImageAlt: meta.ogImageAlt || fallback.ogImageAlt || 'Orbita Events',
  };
}

