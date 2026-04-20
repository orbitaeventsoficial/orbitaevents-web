import caMessages from '@/messages/ca.json';
import esMessages from '@/messages/es.json';
import enMessages from '@/messages/en.json';

export type PublicErrorLocale = 'ca' | 'es' | 'en';

export type ErrorPageCopy = {
  title: string;
  defaultMessage: string;
  tryAgain: string;
  backToHome: string;
  errorCode: string;
};

export type NotFoundCopy = {
  title: string;
  description: string;
  backToHome: string;
};

type PublicErrorMessages = {
  errorPage?: Partial<ErrorPageCopy>;
  notFound?: Partial<NotFoundCopy>;
};

const MESSAGES_BY_LOCALE: Record<PublicErrorLocale, PublicErrorMessages> = {
  ca: caMessages as PublicErrorMessages,
  es: esMessages as PublicErrorMessages,
  en: enMessages as PublicErrorMessages,
};

function normalizeLocale(locale?: string): PublicErrorLocale {
  return locale === 'es' || locale === 'en' ? locale : 'ca';
}

export function getErrorPageCopy(locale?: string): ErrorPageCopy {
  const copy = MESSAGES_BY_LOCALE[normalizeLocale(locale)].errorPage || {};
  const fallback = MESSAGES_BY_LOCALE.ca.errorPage || {};

  return {
    title: copy.title || fallback.title || 'Hi ha hagut un error',
    defaultMessage: copy.defaultMessage || fallback.defaultMessage || "S'ha produït un error inesperat.",
    tryAgain: copy.tryAgain || fallback.tryAgain || "Torna-ho a provar",
    backToHome: copy.backToHome || fallback.backToHome || "Torna a l'inici",
    errorCode: copy.errorCode || fallback.errorCode || 'Codi error:',
  };
}

export function getNotFoundCopy(locale?: string): NotFoundCopy {
  const copy = MESSAGES_BY_LOCALE[normalizeLocale(locale)].notFound || {};
  const fallback = MESSAGES_BY_LOCALE.ca.notFound || {};

  return {
    title: copy.title || fallback.title || 'Pàgina no trobada',
    description: copy.description || fallback.description || 'La pàgina que busques no existeix o s’ha mogut.',
    backToHome: copy.backToHome || fallback.backToHome || "Torna a l'inici",
  };
}
