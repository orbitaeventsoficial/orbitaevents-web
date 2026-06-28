// lib/constants/inventory.ts
// Decisions estables de domini sobre inventari i reposició.

/**
 * Botigues PREFERENTS per a reposició d'equip.
 * Quan apareixen als resultats de cerca, es mostren primer perquè ofereixen
 * finançament (tipus Klarna/SeQura) — decisió de producte del propietari.
 * Comparació en minúscules i per inclusió (substring) sobre el nom de la botiga.
 */
export const PREFERRED_REPLACEMENT_SOURCES = ['dj mania', 'djmania'] as const;
