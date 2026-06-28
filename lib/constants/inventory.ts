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
 * Lloguer de so per bolo (propietari 2026-06-28): mentre no es comprin altaveus
 * propis (EV ETX-12P, desig futur), el so es lloga al col·laborador "Isma" per un
 * cost fix per esdeveniment. S'afegeix automàticament com a línia de servei a la
 * creació de reserves amb pack, i el cost es resta al marge (com qualsevol col·laborador).
 * Quan es comprin els altaveus propis: posar `enabled: false` o cost 0.
 */
export const SOUND_RENTAL = {
  enabled: true,
  collaboratorName: 'Isma',
  costPerEvent: 50,
  label: 'Lloguer so (PA) — Isma',
} as const;
