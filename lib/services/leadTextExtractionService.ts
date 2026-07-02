import type { EventType, LeadSource } from '@prisma/client';

export type ExtractedLeadTextData = {
  name: string;
  email: string;
  phone: string;
  dni: string;
  address: string;
  eventType: EventType;
  eventDate: string;
  eventTime: string;
  eventEndTime: string;
  eventLocation: string;
  guestCount: string;
  budget: string;
  message: string;
  source: LeadSource;
};

const MONTHS: Record<string, number> = {
  enero: 1,
  gener: 1,
  febrer: 2,
  febrero: 2,
  marc: 3,
  marzo: 3,
  abril: 4,
  maig: 5,
  mayo: 5,
  juny: 6,
  junio: 6,
  juliol: 7,
  julio: 7,
  agost: 8,
  agosto: 8,
  setembre: 9,
  septiembre: 9,
  octubre: 10,
  novembre: 11,
  noviembre: 11,
  desembre: 12,
  diciembre: 12,
};

function normalizeWhitespace(input: string): string {
  return input.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
}

function normalizeLeadText(input: string): string {
  return input
    .replace(/\u00a0/g, ' ')
    .split(/\r?\n/)
    .map((line) => line
      .replace(/^\s*\[\d{1,2}:\d{2},\s*\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\]\s*[^:\n]{1,80}:\s*/u, '')
      .replace(/[ \t]+/g, ' ')
      .trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function normalizeLetters(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function capitalizeWords(input: string): string {
  return normalizeWhitespace(input)
    .replace(/[.,;:!?()[\]{}”””]+$/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function cleanTail(input: string, max = 160): string {
  return normalizeWhitespace(input)
    .replace(/[.,;]+$/g, '')
    .slice(0, max);
}

function extractName(text: string): string {
  const emailLine = text.match(/(?:^|\n)\s*([\p{L}' -]{2,80})\s*[-–]\s*[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/iu);
  if (emailLine?.[1]) {
    const name = capitalizeWords(emailLine[1]);
    if (name.length >= 2) return name;
  }

  const patterns = [
    /\b(?:em dic|me llamo|mi nombre es|el meu nom és|el meu nom es)\s+([\p{L}' -]{2,80})/iu,
    /\b(?:s[oó]c|soy)\s+(?:en|el|la|l'|una?|sr\.?|sra\.?)?\s*([\p{L}' -]{2,80})/iu,
    /\b(?:es diu|se llama)\s+([\p{L}' -]{2,80})/iu,
    /\bhola[,.]?\s+(?:s[oó]c|soy)\s+(?:en|el|la|l')?\s*([\p{L}' -]{2,80})/iu,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const stop = match[1].split(/\b(?:i|y|de|del|que|per|para|amb|con|desde)\b/i)[0];
    const name = capitalizeWords(stop);
    if (name.length >= 2) return name;
  }

  return '';
}

function extractEmail(text: string): string {
  return text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/)?.[0]?.toLowerCase() || '';
}

function extractPhone(text: string): string {
  const labeled = text.match(
    /(?:tel[eè]fon|tel[eè]fono|m[oò]bil|movil|whatsapp|tlf)\s*[:\-]?\s*(\+?\d[\d().\s-]{7,}\d)/i
  );
  const match = labeled || text.match(/(?:\+?\d[\d().\s-]{7,}\d)/);
  if (!match) return '';
  const raw = (match[1] || match[0]).trim();
  const cleaned = raw.replace(/[^\d+]/g, '').replace(/^00/, '+');
  return cleaned.length >= 8 ? cleaned : '';
}

function extractDni(text: string): string {
  const labeled = text.match(/\b(?:dni|nif|cif)\s*[:\-]?\s*([A-Z0-9 -]{7,14})\b/i);
  if (labeled?.[1]) return labeled[1].replace(/\s|-/g, '').toUpperCase();
  return text.match(/\b(?:[A-Z]\d{7,8}|\d{7,8}[A-Z])\b/i)?.[0]?.toUpperCase() || '';
}

function toIsoDate(year: number, month: number, day: number): string {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return '';
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return '';
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function extractEventDate(text: string): string {
  const ymd = text.match(/\b(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})\b/);
  if (ymd) return toIsoDate(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));

  const dmy = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/);
  if (dmy) {
    const yearRaw = Number(dmy[3]);
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    return toIsoDate(year, Number(dmy[2]), Number(dmy[1]));
  }

  const namedMatches = text.matchAll(
    /\b(\d{1,2})\s*(?:de\s+)?([a-zA-ZÀ-ÿ]+)\s*(?:de\s+)?(\d{2,4})?\b/gi
  );
  for (const named of namedMatches) {
    const day = Number(named[1]);
    const month = MONTHS[normalizeLetters(named[2])];
    if (!month) continue;
    const currentYear = new Date().getFullYear();
    const yearRaw = named[3] ? Number(named[3]) : currentYear;
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    const iso = toIsoDate(year, month, day);
    if (iso) return iso;
  }

  return '';
}

function extractEventTime(text: string): string {
  const labeled = text.match(
    /\b(?:horari|horario|hora|comen[cç]ar(?:[ií]em)?|comienza|empieza|inici|inicio|a partir de|des de|desde|a les|a las?)\s*(?:[:\-]?\s*)?([01]?\d|2[0-3])[:.]([0-5]\d)\b/i
  );
  if (labeled) return `${labeled[1].padStart(2, '0')}:${labeled[2]}`;

  const range = text.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\s*(?:h)?\s*(?:-|a|to|hasta)\s*(?:[01]?\d|2[0-3])[:.][0-5]\d\b/i);
  if (range) return `${range[1].padStart(2, '0')}:${range[2]}`;

  const hourRange = text.match(
    /\b(?:horari|horario|de|des de|desde)\s*(?:[:\-]?\s*)?([01]?\d|2[0-3])\s*(?:h)?\s*(?:-|a|to|hasta)\s*([01]?\d|2[0-3])\s*(?:h)?(?:[^\n\r]{0,40}\b(?:vespre|noche|nit)\b)?/i
  );
  if (!hourRange?.[1]) return '';
  let hour = Number(hourRange[1]);
  const context = normalizeLetters(hourRange[0]);
  if (hour >= 1 && hour <= 11 && /(vespre|noche|nit)/.test(context)) hour += 12;
  return `${String(hour).padStart(2, '0')}:00`;
}

function extractEventEndTime(text: string): string {
  const range = text.match(/\b(?:[01]?\d|2[0-3])[:.][0-5]\d\s*(?:h)?\s*(?:-|a|to|hasta)\s*([01]?\d|2[0-3])[:.]([0-5]\d)\b/i);
  if (range) return `${range[1].padStart(2, '0')}:${range[2]}`;

  const hourRange = text.match(
    /\b(?:horari|horario|de|des de|desde)\s*(?:[:\-]?\s*)?([01]?\d|2[0-3])\s*(?:h)?\s*(?:-|a|to|hasta)\s*([01]?\d|2[0-3])\s*(?:h)?(?:[^\n\r]{0,40}\b(?:vespre|noche|nit)\b)?/i
  );
  if (!hourRange?.[2]) return '';
  let hour = Number(hourRange[2]);
  const context = normalizeLetters(hourRange[0]);
  if (hour >= 1 && hour <= 11 && /(vespre|noche|nit)/.test(context)) hour += 12;
  return `${String(hour).padStart(2, '0')}:00`;
}

function extractGuestCount(text: string): string {
  const match = text.match(
    /\b(?:unes?|aprox(?:imadament|imadamente)?\s*)?(\d{1,4})\s*(?:persones?|personas?|convidats?|invitad[oa]s?|assistents?|asistentes?|guests?|people)\b/i
  );
  if (!match?.[1]) return '';
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? String(value) : '';
}

function extractBudget(text: string): string {
  const labeled = text.match(/(?:pressupost|presupuesto|budget)\s*[:\-]?\s*([^\n\r;]{2,80})/i);
  const amountPattern = /\b(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d{2,6}(?:[.,]\d{1,2})?)\s*(?:€|eur|euros?)\b/i;
  if (labeled?.[1]) {
    const labeledText = cleanTail(labeled[1], 120).replace(/^(?:és|es|de|entre)\s+/i, '');
    const range = labeledText.match(/\b(\d{2,6})\s*(?:-|–|a|y|i)\s*(\d{2,6})\s*(?:€|eur|euros?)?/i);
    if (range) return `${range[1]}-${range[2]}€`;
    const labeledAmount = labeledText.match(amountPattern);
    return labeledAmount?.[1] ? `${labeledAmount[1]}€` : labeledText;
  }

  const amount = text.match(amountPattern);
  return amount?.[1] ? `${amount[1]}€` : '';
}

function extractLocation(text: string): string {
  const dayLocation = text.match(
    /(?:^|\n)\s*(?:la\s+)?ubicaci[oó]\s+del\s+dia\s+\d{1,2}\s+(?:és|es|ser[aà]|será)\s+([^\n\r.]{3,160})/im
  );
  if (dayLocation?.[1]) return cleanTail(dayLocation[1]);

  const labeled = text.match(
    /(?:^|\n|[.;])\s*(?:ubicaci[oó]n?|lloc|lugar|localitat|localidad|ciutat|ciudad|poblaci[oó]n?|municipi)\s*[:\-]?\s*([^\n\r.]{3,160})/im
  );
  if (labeled?.[1]) return cleanTail(labeled[1]);

  const sentence = text.match(
    /(?:ser[aà]|será|es far[aà]|es farà|se celebra|se har[aá]|tindr[aà] lloc|tendrá lugar)\s+(?:al|a la|a l'|en el|en la|a|en)\s+([^\n\r.,;]{3,120})/i
  );
  if (sentence?.[1]) return cleanTail(sentence[1]);

  const city = text.match(/\b(?:a|en)\s+([\p{L}][\p{L}' -]{2,60})(?=$|[.,;])/iu);
  return city?.[1] ? cleanTail(city[1], 80) : '';
}

function extractAddress(text: string): string {
  const labeled = text.match(/(?:adre[cç]a|direcci[oó]n|address)\s*[:\-]?\s*([^\n\r]{3,180})/i);
  return labeled?.[1] ? cleanTail(labeled[1], 180) : '';
}

function inferEventType(text: string): EventType {
  const input = normalizeLetters(text);
  if (/(bingo musical|bingo)/.test(input)) return 'OTHER';
  if (/(boda|casament|wedding|novios)/.test(input)) return 'WEDDING';
  if (/(cumple|aniversari|birthday|aniversario)/.test(input)) return 'BIRTHDAY';
  if (/(empresa|corporati|corporativo|team building|company)/.test(input)) return 'CORPORATE';
  if (/(comunion|comunio)/.test(input)) return 'COMMUNION';
  if (/(bautizo|bateig|baptism)/.test(input)) return 'BAPTISM';
  if (/(graduacion|graduacio|graduation)/.test(input)) return 'GRADUATION';
  if (/(fiesta privada|festa privada|private party)/.test(input)) return 'PRIVATE_PARTY';
  return 'OTHER';
}

function inferSource(text: string): LeadSource {
  const input = normalizeLetters(text);
  if (/(whatsapp|wa\.me|\bwp\b)/.test(input)) return 'WHATSAPP';
  if (/(instagram|\big\b)/.test(input)) return 'INSTAGRAM';
  if (/(wallapop)/.test(input)) return 'WALLAPOP';
  if (/(gmail|hotmail|outlook|assumpte|asunto|email|correo)/.test(input) || extractEmail(text)) return 'OTHER';
  if (/(trucada|llamada|telefono|telefon)/.test(input)) return 'PHONE';
  return 'OTHER';
}

export function extractLeadDataFromText(text: string): ExtractedLeadTextData {
  const cleaned = normalizeLeadText(text).slice(0, 4000);
  const original = normalizeWhitespace(text).slice(0, 4000);

  return {
    name: extractName(cleaned),
    email: extractEmail(cleaned),
    phone: extractPhone(cleaned) || extractPhone(original),
    dni: extractDni(cleaned),
    address: extractAddress(cleaned),
    eventType: inferEventType(cleaned),
    eventDate: extractEventDate(cleaned),
    eventTime: extractEventTime(cleaned),
    eventEndTime: extractEventEndTime(cleaned),
    eventLocation: extractLocation(cleaned),
    guestCount: extractGuestCount(cleaned),
    budget: extractBudget(cleaned),
    message: cleaned,
    source: inferSource(cleaned),
  };
}
