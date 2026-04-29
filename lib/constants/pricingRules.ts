// Regles canòniques de pricing per data
//
// Aquestes regles s'apliquen automàticament al pressupost segons la data d'esdeveniment.
// Cada regla té un multiplicador (1.10 = +10%) i una etiqueta visible al pressupost.
// Si una regla aplica, el preu base es multiplica i la diferència apareix com a línia
// "Recàrrec temporada" al PDF.
//
// Prioritat: en cas de solapament (cap de setmana de Nadal, p.ex.), la regla amb
// multiplicador més alt guanya. Si dues regles tenen el mateix multiplicador, la
// més específica (festiu concret > rang temporada > recurrent setmanal) guanya.

export type DatePricingRuleKind = 'recurring-weekday' | 'date-range' | 'fixed-date';

export type DatePricingRule = {
  id: string;
  kind: DatePricingRuleKind;
  /** Multiplicador aplicat al preu base (1.0 = sense canvi, 1.15 = +15%) */
  multiplier: number;
  /** Etiqueta visible al PDF (3 idiomes) */
  label: { ca: string; es: string; en: string };
  /** Prioritat de tie-break quan dues regles tenen el mateix multiplicador */
  priority: number;
} & (
  | { kind: 'recurring-weekday'; weekdays: number[] /* 0=diumenge ... 6=dissabte */ }
  | { kind: 'date-range'; startMonth: number; startDay: number; endMonth: number; endDay: number }
  | { kind: 'fixed-date'; month: number; day: number }
);

export const DATE_PRICING_RULES: DatePricingRule[] = [
  // Recurrent setmanal — caps de setmana (divendres+dissabte)
  {
    id: 'weekend',
    kind: 'recurring-weekday',
    weekdays: [5, 6], // divendres + dissabte
    multiplier: 1.10,
    label: { ca: 'Recàrrec cap de setmana', es: 'Recargo fin de semana', en: 'Weekend surcharge' },
    priority: 1,
  },

  // Rang — alta temporada (juny → setembre)
  {
    id: 'high-season',
    kind: 'date-range',
    startMonth: 6,
    startDay: 1,
    endMonth: 9,
    endDay: 30,
    multiplier: 1.15,
    label: { ca: 'Recàrrec alta temporada', es: 'Recargo temporada alta', en: 'High season surcharge' },
    priority: 2,
  },

  // Rang — Nadal i Cap d'Any (15 desembre → 6 gener)
  {
    id: 'christmas',
    kind: 'date-range',
    startMonth: 12,
    startDay: 15,
    endMonth: 1,
    endDay: 6,
    multiplier: 1.25,
    label: { ca: 'Recàrrec Nadal i Cap d\'Any', es: 'Recargo Navidad y Año Nuevo', en: 'Holiday season surcharge' },
    priority: 3,
  },

  // Festius concrets nacionals (rellevants per a events)
  {
    id: 'new-year-eve',
    kind: 'fixed-date',
    month: 12,
    day: 31,
    multiplier: 1.50,
    label: { ca: 'Recàrrec Cap d\'Any', es: 'Recargo Nochevieja', en: 'New Year\'s Eve surcharge' },
    priority: 4,
  },
];

export const DATE_PRICING_RULE_PRIORITY_MAX = Math.max(
  ...DATE_PRICING_RULES.map((rule) => rule.priority),
);
