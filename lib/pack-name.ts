type LocalizedName = { locale: string; name: string };

export function getTranslatedPackName(
  translations: LocalizedName[],
  fallback: string,
  locale?: string | null,
) {
  const preferred = String(locale || 'ca').toLowerCase();
  return (
    translations.find((t) => t.locale === preferred)?.name ||
    translations.find((t) => t.locale === 'ca')?.name ||
    translations[0]?.name ||
    fallback
  );
}
