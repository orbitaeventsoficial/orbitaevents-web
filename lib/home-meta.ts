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

