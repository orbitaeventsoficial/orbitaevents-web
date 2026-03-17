type HelpEntryId =
  | 'lead'
  | 'client'
  | 'leadSource'
  | 'leadStatus'
  | 'leadPriority'
  | 'leadScore'
  | 'leadLandingPage'
  | 'leadUtmSource'
  | 'leadUtmMedium'
  | 'leadUtmCampaign'
  | 'leadAttribution'
  | 'pipeline'
  | 'cac'
  | 'conversion'
  | 'postEvent'
  | 'inboxImport'
  | 'task'
  | 'document'
  | 'quote'
  | 'booking'
  | 'billing'
  | 'leadEditorSource'
  | 'leadEditorLanding'
  | 'leadEditorUtmSource'
  | 'leadEditorUtmMedium'
  | 'leadEditorUtmCampaign';

type HelpEntry = {
  id: HelpEntryId;
  term: string;
  description: string;
  keywords: string[];
};

const HELP_ENTRY_DEFS: Record<HelpEntryId, HelpEntry> = {
  lead: {
    id: 'lead',
    term: 'Entrada',
    description: 'Persona que ha preguntat, pero encara no es client tancat.',
    keywords: ['entrada', 'entrades', 'lead', 'leads'],
  },
  client: {
    id: 'client',
    term: 'Client',
    description: 'Persona que ja tens guardada com a client i pot tenir diversos esdeveniments.',
    keywords: ['client', 'cliente', 'clients'],
  },
  leadSource: {
    id: 'leadSource',
    term: 'Origen',
    description: "Canal d'entrada del lead: web, whatsapp, instagram, wallapop, recomanacio, etc.",
    keywords: ['origen', 'source', 'canal'],
  },
  leadStatus: {
    id: 'leadStatus',
    term: 'Estat entrada',
    description: 'Fase comercial actual del lead: nou, contactat, pressupost enviat, negociacio, guanyat o perdut.',
    keywords: ['estat', 'estado', 'status', 'estat entrada', 'estat lead'],
  },
  leadPriority: {
    id: 'leadPriority',
    term: 'Prioritat',
    description: "Nivell d'urgencia comercial per prioritzar seguiment i tasques.",
    keywords: ['prioritat', 'prioridad', 'priority'],
  },
  leadScore: {
    id: 'leadScore',
    term: 'Puntuacio entrada',
    description: 'Puntuacio automatica de qualitat comercial segons les dades del lead i la fase actual del proces.',
    keywords: ['puntuacio entrada', 'lead score', 'score'],
  },
  leadLandingPage: {
    id: 'leadLandingPage',
    term: 'Landing',
    description: "URL de la pagina on era l'usuari abans d'enviar el formulari.",
    keywords: ['landing', 'landing page'],
  },
  leadUtmSource: {
    id: 'leadUtmSource',
    term: 'UTM source',
    description: 'Font de transit o campanya: google, instagram, newsletter, referral...',
    keywords: ['utm source'],
  },
  leadUtmMedium: {
    id: 'leadUtmMedium',
    term: 'UTM medium',
    description: 'Tipus de canal de captacio: cpc, social, email, organic...',
    keywords: ['utm medium'],
  },
  leadUtmCampaign: {
    id: 'leadUtmCampaign',
    term: 'UTM campaign',
    description: 'Nom de la campanya de captacio o promocio.',
    keywords: ['utm campaign'],
  },
  leadAttribution: {
    id: 'leadAttribution',
    term: 'Atribucio',
    description: "Dades de marketing per saber d'on arriba el lead i quina campanya funciona millor.",
    keywords: ['atribucio', 'atribucion', 'attribution'],
  },
  pipeline: {
    id: 'pipeline',
    term: 'Pipeline',
    description: 'Cami de la venda, de primer contacte fins tancament.',
    keywords: ['pipeline', 'embudo'],
  },
  cac: {
    id: 'cac',
    term: 'CAC',
    description: 'Quant et costa aconseguir un client en un canal.',
    keywords: ['cac', 'coste adquisicion', 'cost d’adquisicio'],
  },
  conversion: {
    id: 'conversion',
    term: 'Conversio',
    description: 'De 100 entrades, quantes acaben reservant.',
    keywords: ['conversio', 'conversion', 'conversión'],
  },
  postEvent: {
    id: 'postEvent',
    term: 'Post-esdeveniment',
    description: 'Tot el que fas despres de l\'esdeveniment: informe, valoracio i seguiment.',
    keywords: ['post-event', 'post evento', 'postevento', 'post-esdeveniment'],
  },
  inboxImport: {
    id: 'inboxImport',
    term: 'Importacio de bustia',
    description: 'Passar un correu a la fitxa d\'entrada automaticament.',
    keywords: ['inbox', 'imap', 'importat', 'importado'],
  },
  task: {
    id: 'task',
    term: 'Tasca',
    description: 'Cosa pendent de fer: trucar, enviar pressupost, etc.',
    keywords: ['tasca', 'task', 'tarea'],
  },
  document: {
    id: 'document',
    term: 'Document',
    description: 'Arxiu guardat del lead o client: pressupost, contracte, factura...',
    keywords: ['document', 'documento', 'archivo'],
  },
  quote: {
    id: 'quote',
    term: 'Pressupost',
    description: 'Proposta economica que envies al client abans de tancar.',
    keywords: ['pressupost', 'presupuesto', 'quote'],
  },
  booking: {
    id: 'booking',
    term: 'Reserva',
    description: 'Event ja confirmat i vinculat a un client.',
    keywords: ['reserva', 'booking'],
  },
  billing: {
    id: 'billing',
    term: 'Facturacio',
    description: 'Imports cobrats i pendents de cobrar.',
    keywords: ['facturacio', 'facturacion', 'revenue', 'ingresos'],
  },
  leadEditorSource: {
    id: 'leadEditorSource',
    term: 'Origen',
    description: 'Canal pel qual ha arribat el lead: web, whatsapp, instagram, wallapop, etc.',
    keywords: ['origen editor', 'canal lead'],
  },
  leadEditorLanding: {
    id: 'leadEditorLanding',
    term: 'Landing page',
    description: "Pagina exacta on l'usuari estava quan va enviar el formulari.",
    keywords: ['landing editor'],
  },
  leadEditorUtmSource: {
    id: 'leadEditorUtmSource',
    term: 'UTM source',
    description: 'Font de la campanya, per exemple google, instagram o newsletter.',
    keywords: ['utm source editor'],
  },
  leadEditorUtmMedium: {
    id: 'leadEditorUtmMedium',
    term: 'UTM medium',
    description: 'Tipus de canal de captacio, per exemple cpc, social, email o organic.',
    keywords: ['utm medium editor'],
  },
  leadEditorUtmCampaign: {
    id: 'leadEditorUtmCampaign',
    term: 'UTM campaign',
    description: 'Nom de la campanya de marketing o promocio.',
    keywords: ['utm campaign editor'],
  },
};

export const HELP_ENTRIES = Object.values(HELP_ENTRY_DEFS);

export const ADMIN_HELP = Object.freeze(
  Object.fromEntries(HELP_ENTRIES.map((entry) => [entry.id, entry.description])) as Record<HelpEntryId, string>
);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function scoreKeyword(input: string, keyword: string): number {
  const normalizedKeyword = normalize(keyword);
  const compactKeyword = normalizedKeyword.trim();
  if (!compactKeyword) return 0;

  const boundaryRegex = new RegExp(`(^|\\b)${escapeRegExp(compactKeyword)}(\\b|$)`, 'i');
  if (boundaryRegex.test(input)) {
    return 100 + compactKeyword.length;
  }

  if (input.includes(compactKeyword)) {
    return 20 + compactKeyword.length;
  }

  return 0;
}

export function matchHelpEntry(text: string): HelpEntry | null {
  const input = normalize(text);
  let best: { entry: HelpEntry; score: number } | null = null;

  for (const entry of HELP_ENTRIES) {
    let entryScore = 0;
    for (const keyword of entry.keywords) {
      entryScore = Math.max(entryScore, scoreKeyword(input, keyword));
    }
    if (entryScore > 0 && (!best || entryScore > best.score)) {
      best = { entry, score: entryScore };
    }
  }

  return best?.entry || null;
}


