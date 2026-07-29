/**
 * Classes canòniques compartides del formulari de nova reserva.
 * ----------------------------------------------------------------------------
 * Tailwind + tokens de /studio (orbita-tokens.css). Monocapa: el label, el
 * camp i les pistes d'aquest flux viuen AQUÍ, no repartits per cada secció.
 * Zero hex, zero classe pròpia (sistema propi `nb-*` eradicat — canonització 2026-06-30).
 */

/** Columna d'un camp de formulari (label + control + pista). */
export const NB_FIELD = 'flex min-w-0 flex-col gap-1.5';

/** Etiqueta de camp: mono, majúscules, to apagat. */
export const NB_LABEL =
  'flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[var(--t3)]';

/** Sufix per a un camp obligatori (afegeix un asterisc daurat). */
export const NB_REQ = "after:ml-0.5 after:text-[var(--gold)] after:content-['*']";

/** Pista sota un camp. */
export const NB_HINT = 'text-xs leading-snug text-[var(--t3)]';

/** To verd d'una pista correcta. */
export const NB_HINT_OK = 'text-[var(--o-stage-won-strong)]';

/** To daurat d'una pista d'avís suau. */
export const NB_HINT_WARN = 'text-[var(--gold)]';

/** To informatiu d'una pista neutra. */
export const NB_HINT_INFO = 'text-[var(--t2)]';

/** Capçalera de grup del qüestionari (Qui i quan · Què contractem · Preu). */
export const NB_GROUP =
  'mt-1 border-b border-[var(--line)] pb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]';

/** Intro mono d'una secció (subtítol curt al costat del títol). */
export const NB_INTRO = 'font-mono text-xs uppercase tracking-[0.08em] text-[var(--t3)]';

/**
 * Camp numèric estret (PVP / quantitat) sense els spinners natius, que en
 * amplades petites tapaven el valor.
 */
export const NB_NUM_BARE =
  '[appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none';
