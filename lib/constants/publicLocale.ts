export const PUBLIC_LOCALES = ['ca', 'es', 'en'] as const;

export type PublicLocale = (typeof PUBLIC_LOCALES)[number];

export const DEFAULT_PUBLIC_LOCALE: PublicLocale = 'ca';
