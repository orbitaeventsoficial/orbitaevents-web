/**
 * Les llengües en què surt un document del negoci.
 *
 * Autoritat única. Vivia repetida tres vegades —el servei de dossiers i els dos
 * selectors d'idioma de lead i de reserva—, i tres còpies de la mateixa llista
 * volen dir que un dia una en tindrà una de més i les altres no.
 *
 * `es` és el valor per defecte perquè és el que té la columna
 * `preferredLocale` a la base de dades.
 */
export const DOSSIER_LOCALES = ['ca', 'es', 'en'] as const;

export type DossierLocale = (typeof DOSSIER_LOCALES)[number];

/** Com es diu cada llengua a les pantalles internes. */
export const DOSSIER_LOCALE_OPTIONS: readonly { value: DossierLocale; label: string }[] = [
  { value: 'ca', label: 'Català' },
  { value: 'es', label: 'Castellà' },
  { value: 'en', label: 'Anglès' },
];

export function dossierLocaleLabel(value: string): string {
  return DOSSIER_LOCALE_OPTIONS.find((option) => option.value === value)?.label
    ?? value.toUpperCase();
}
