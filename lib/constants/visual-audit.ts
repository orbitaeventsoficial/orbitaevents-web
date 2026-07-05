export const VISUAL_AUDIT_DEFAULT_RUN_ID = 'visual-audit-1416-final';

export const VISUAL_AUDIT_VIEWPORT_ORDER = ['desktop', 'tablet', 'mobile'] as const;

export const VISUAL_AUDIT_ORGAN_ORDER = [
  'Comandament',
  'Comercial/Documents',
  'Comunicacions',
  'Operativa',
  'Clients',
  'Partners',
  'Cataleg',
  'Post-event',
  'Web/Marketing',
  'Sistema',
] as const;

export const VISUAL_AUDIT_REVIEW_DIMENSIONS = [
  { id: 'vis', label: 'Vis', title: 'Visual' },
  { id: 'coh', label: 'Coh', title: 'Coherencia de serie' },
  { id: 'can', label: 'Can', title: 'Canon i tokens' },
  { id: 'mon', label: 'Mon', title: 'Monocapa' },
  { id: 'resp', label: 'Resp', title: 'Responsiu' },
  { id: 'typ', label: 'Typ', title: 'Tipografia' },
  { id: 'fn', label: 'Fn', title: 'Funcions i botons' },
  { id: 'api', label: 'Api', title: 'APIs i cablejat' },
  { id: 'lnk', label: 'Lnk', title: 'Enllacos' },
] as const;

export const VISUAL_AUDIT_ZENIT_PRINCIPLES = [
  'Mateixa ma visual: totes les pantalles semblen del mateix sistema.',
  'Densitat amb calma: molta informacio, jerarquia clara i zero soroll tecnic.',
  'Accio clara: que passa, que importa i que toca fer.',
  'Un sol cervell: numeros, estats, labels i regles venen de fonts canoniques.',
  'Responsiu real: desktop, tablet i mobil son formes d operar.',
] as const;
