// lib/constants/inventory.ts
// Decisions estables de domini sobre inventari i reposició.

/**
 * Botigues PREFERENTS per a reposició d'equip.
 * Quan apareixen als resultats de cerca, es mostren primer perquè ofereixen
 * finançament (tipus Klarna/SeQura) — decisió de producte del propietari.
 * Comparació en minúscules i per inclusió (substring) sobre el nom de la botiga.
 */
export const PREFERRED_REPLACEMENT_SOURCES = ['dj mania', 'djmania'] as const;

/**
 * So DJ inclos dins el preu del DJ (decisio propietari 2026-07-08).
 * Dels serveis DJ, 50 eur son liquidacio real a Isma pels altaveus, pero NO es
 * ven com a producte/proveidor seleccionable: el client compra DJ a preu tancat.
 */
export const SOUND_RENTAL = {
  enabled: true,
  collaboratorId: 'isma-lloguer-altaveus',
  collaboratorName: 'Isma',
  costPerEvent: 50,
  label: 'So DJ inclos - Isma',
  notesMarker: '[included-sound-rental]',
} as const;
