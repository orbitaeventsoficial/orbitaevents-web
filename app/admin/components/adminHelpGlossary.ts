export type HelpEntry = {
  term: string;
  description: string;
  keywords: string[];
};

export const HELP_ENTRIES: HelpEntry[] = [
  { term: 'Lead', description: 'Persona que ha preguntat, però encara NO és client tancat.', keywords: ['lead', 'leads'] },
  { term: 'Client', description: 'Persona que ja tens guardada com a client (pot tenir varis events).', keywords: ['client', 'cliente', 'clients'] },
  { term: 'Origen', description: 'D’on ha vingut el contacte. Exemple: Web, WhatsApp, Wallapop.', keywords: ['origen', 'source', 'canal'] },
  { term: 'Estat lead', description: 'En quin punt està la venda: nou, contactat, pressupost, negociació, guanyat o perdut.', keywords: ['estat', 'estado', 'status'] },
  { term: 'Prioritat', description: 'Quina urgència té. Alta = mirar-ho abans.', keywords: ['prioritat', 'prioridad', 'priority'] },
  { term: 'Lead score', description: 'Nota automàtica (0-100) per saber si és un lead bo o fluix.', keywords: ['lead score', 'score'] },
  { term: 'Landing', description: 'Pàgina exacta on estava abans d’enviar el formulari.', keywords: ['landing', 'landing page'] },
  { term: 'UTM source', description: 'Nom curt de la font. Exemple: google, instagram.', keywords: ['utm source'] },
  { term: 'UTM medium', description: 'Tipus de canal. Exemple: anuncio, social, email.', keywords: ['utm medium'] },
  { term: 'UTM campaign', description: 'Nom de campanya. Exemple: estiu-2026.', keywords: ['utm campaign'] },
  { term: 'Atribució', description: 'A quin canal li donem el mèrit de portar el lead.', keywords: ['atribucio', 'atribución', 'attribution'] },
  { term: 'Pipeline', description: 'Camí de la venda, de primer contacte fins tancament.', keywords: ['pipeline', 'embudo'] },
  { term: 'CAC', description: 'Quant et costa aconseguir un client en un canal.', keywords: ['cac', 'coste adquisicion', 'cost d’adquisicio'] },
  { term: 'Conversió', description: 'De 100 leads, quants acaben reservant.', keywords: ['conversio', 'conversión', 'conversion'] },
  { term: 'Post-event', description: 'Tot el que fas després de l’event: informe, valoració i seguiment.', keywords: ['post-event', 'post evento', 'postevento'] },
  { term: 'Inbox import', description: 'Passar un email a fitxa lead automàticament.', keywords: ['inbox', 'imap', 'importat', 'importado'] },
  { term: 'Tasca', description: 'Cosa pendent de fer (trucar, enviar pressupost, etc.).', keywords: ['tasca', 'task', 'tarea'] },
  { term: 'Document', description: 'Arxiu guardat del lead (pressupost, contracte, factura...).', keywords: ['document', 'documento', 'archivo'] },
  { term: 'Pressupost', description: 'Proposta econòmica que envies al client abans de tancar.', keywords: ['pressupost', 'presupuesto', 'quote'] },
  { term: 'Reserva', description: 'Event ja confirmat i vinculat a un client.', keywords: ['reserva', 'booking'] },
  { term: 'Facturació', description: 'Imports cobrats i pendents de cobrar.', keywords: ['facturacio', 'facturación', 'revenue', 'ingresos'] },
];

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
