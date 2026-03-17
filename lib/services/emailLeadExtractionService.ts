import type { EventType } from '@prisma/client';

type ExtractedLeadData = {
  name: string;
  email: string;
  phone?: string;
  eventType: EventType;
  eventDate?: Date;
  eventSchedule?: string;
  guestCount?: number;
  budget?: string;
  eventLocation?: string;
  message?: string;
  commercialSummary?: string;
  importantUnknowns?: string[];
};

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function splitLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractPhone(text: string): string | undefined {
  const labeled = text.match(
    /(?:tel[eè]fono|tel[eè]fon|m[oò]vil|m[oò]bil|whatsapp)\s*[:\-]?\s*(\+?\d[\d().\s-]{7,}\d)/i
  );
  const match = labeled || text.match(/(?:\+?\d[\d().\s-]{7,}\d)/);
  if (!match) return undefined;
  const raw = (match[1] || match[0]).trim();
  const cleaned = raw.replace(/[^\d+]/g, '').replace(/^00/, '+');
  return cleaned.length >= 8 ? cleaned : undefined;
}

function parseDateCandidate(input: string): Date | undefined {
  const normalized = input.trim();
  if (!normalized) return undefined;

  const direct = new Date(normalized);
  if (!Number.isNaN(direct.getTime())) return direct;

  const dmy = normalized.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/);
  if (!dmy) return undefined;

  const day = Number(dmy[1]);
  const month = Number(dmy[2]);
  const yearRaw = Number(dmy[3]);
  const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
  const candidate = new Date(year, month - 1, day);
  return Number.isNaN(candidate.getTime()) ? undefined : candidate;
}

const MONTH_INDEX: Record<string, number> = {
  enero: 0,
  gener: 0,
  febrer: 1,
  febrero: 1,
  marzo: 2,
  marc: 2,
  abril: 3,
  abril_: 3,
  mayo: 4,
  maig: 4,
  junio: 5,
  juny: 5,
  julio: 6,
  juliol: 6,
  agosto: 7,
  agost: 7,
  septiembre: 8,
  setembre: 8,
  octubre: 9,
  noviembre: 10,
  novembre: 10,
  diciembre: 11,
  desembre: 11,
};

function monthToIndex(raw: string): number | undefined {
  const key = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
  if (!key) return undefined;
  if (key === 'abril') return 3;
  return MONTH_INDEX[key];
}

function inferYearForMonthDay(day: number, month: number): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const candidate = new Date(currentYear, month, day);
  // Si la data ja ha passat fa mesos, assumim any següent.
  if (candidate.getTime() < now.getTime() - 1000 * 60 * 60 * 24 * 90) {
    return currentYear + 1;
  }
  return currentYear;
}

function extractNamedDate(text: string): Date | undefined {
  const named = text.match(
    /\b(?:lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo|dilluns|dimarts|dimecres|dijous|divendres|dissabte|diumenge)?\s*(\d{1,2})\s*(?:de\s+)?([a-zA-ZÀ-ÿ]+)\s*(?:de\s+)?(\d{2,4})?\b/i
  );
  if (!named) return undefined;

  const day = Number(named[1]);
  const monthIndex = monthToIndex(named[2]);
  if (!Number.isFinite(day) || !Number.isFinite(monthIndex)) return undefined;

  const year = named[3]
    ? (() => {
        const y = Number(named[3]);
        return y < 100 ? 2000 + y : y;
      })()
    : inferYearForMonthDay(day, monthIndex!);

  const candidate = new Date(year, monthIndex!, day);
  return Number.isNaN(candidate.getTime()) ? undefined : candidate;
}

function extractEventDate(text: string): Date | undefined {
  const labeled = text.match(
    /(?:fecha|data|date)\s*[:\-]?\s*([0-3]?\d[\/.\-][0-1]?\d[\/.\-](?:\d{2}|\d{4})|\d{4}[\/.\-][0-1]?\d[\/.\-][0-3]?\d)/i
  );
  if (labeled) return parseDateCandidate(labeled[1]);

  const namedLabeled = text.match(
    /(?:fecha|data|date)\s*[:\-]?\s*([^\n\r]{0,80})/i
  );
  if (namedLabeled) {
    const parsedNamed = extractNamedDate(namedLabeled[1]);
    if (parsedNamed) return parsedNamed;
  }

  const inline = text.match(/\b([0-3]?\d[\/.\-][0-1]?\d[\/.\-](?:\d{2}|\d{4}))\b/);
  if (inline) {
    const parsedInline = parseDateCandidate(inline[1]);
    if (parsedInline) return parsedInline;
  }

  return extractNamedDate(text);
}

function extractGuestCount(text: string): number | undefined {
  const match = text.match(/\b(\d{1,4})\s*(?:invitad|invitat|persona|personas|persones|guest|guests|people)\b/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function extractBudget(text: string): string | undefined {
  const labeled = text.match(/(?:presupuesto|pressupost|budget)\s*[:\-]?\s*([^\n\r]+)/i);
  if (labeled) return normalizeWhitespace(labeled[1]).slice(0, 120);

  const eur = text.match(/\b(\d{2,6}(?:[.,]\d{1,2})?)\s*(?:€|eur|euros?)\b/i);
  if (!eur) return undefined;
  return `${eur[1].replace('.', ',')}€`;
}

function extractEventLocation(text: string): string | undefined {
  const labeled = text.match(/(?:ubicaci[oó]n|lugar|localidad|ciudad|location|lloc)\s*[:\-]?\s*([^\n\r]+)/i);
  if (labeled) return normalizeWhitespace(labeled[1]).slice(0, 160);

  const sentence = text.match(
    /(?:se celebr(?:a|ar[aà])|tindr[aà]\s+lloc|es\s+fa(?:r[aà])?)\s+(?:el\s+d[ií]a\s+[^\n\r]{0,40}\s+)?(?:en|a)\s+([^\n\r.,;]{4,120})/i
  );
  if (sentence) return normalizeWhitespace(sentence[1]).slice(0, 160);
  return undefined;
}

function extractSchedule(text: string): string | undefined {
  const windows = Array.from(text.matchAll(/\b(\d{1,2}(?::|[.])\d{2})\s*(?:h)?\s*(?:-|a|to|hasta)\s*(\d{1,2}(?::|[.])\d{2})\b/gi))
    .map((m) => `${m[1].replace('.', ':')}-${m[2].replace('.', ':')}`)
    .slice(0, 5);

  const startsAt = text.match(/\b(?:a partir de|desde|des de)\s+(?:las?\s*)?(\d{1,2}(?::|[.])\d{2})\b/i);
  if (startsAt) windows.unshift(`desde ${startsAt[1].replace('.', ':')}`);

  if (windows.length === 0) return undefined;
  return Array.from(new Set(windows)).join(', ').slice(0, 180);
}

function extractRequestedItems(text: string): string | undefined {
  const lines = splitLines(text);
  const startIdx = lines.findIndex((line) =>
    /(?:material incluid[oa]|material incl[oò]s|incluye|inclou)/i.test(line)
  );
  if (startIdx === -1) return undefined;

  const chunk: string[] = [];
  const firstInline = lines[startIdx].split(/[:\-]/).slice(1).join(':').trim();
  if (firstInline) chunk.push(firstInline);

  for (let i = startIdx + 1; i < lines.length; i += 1) {
    const current = lines[i];
    if (!current) break;
    if (
      /^(data|fecha|date|horari|horario|preu|precio|pressupost|presupuesto|pagament|pago|gr[aà]cies|moltes|salutaci[oó]n)/i.test(
        current
      )
    ) {
      break;
    }
    chunk.push(current.replace(/^[•\-*]\s*/, ''));
    if (chunk.length >= 10) break;
  }

  if (chunk.length === 0) return undefined;
  return normalizeWhitespace(chunk.join(', ')).slice(0, 320);
}

function inferIntent(text: string): string {
  const input = text.toLowerCase();
  if (/(contratar|contractar|reserva|cerrar|tancar|confirmar)/.test(input)) return 'Contractació';
  if (/(presupuesto|pressupost|quote|precio|preu)/.test(input)) return 'Sol·licitud de pressupost';
  if (/(info|informaci[oó]n|consulta|consultar)/.test(input)) return 'Sol·licitud d\'informació';
  return 'Contacte comercial';
}

function buildCommercialSummary(text: string): string | undefined {
  const intent = inferIntent(text);
  const date = extractEventDate(text);
  const schedule = extractSchedule(text);
  const budget = extractBudget(text);
  const guests = extractGuestCount(text);
  const items = extractRequestedItems(text);

  const lines: string[] = [`Interès detectat: ${intent}`];
  if (date) lines.push(`Data detectada: ${date.toLocaleDateString('ca-ES')}`);
  if (schedule) lines.push(`Horari detectat: ${schedule}`);
  if (guests) lines.push(`Convidats detectats: ${guests}`);
  if (budget) lines.push(`Pressupost detectat: ${budget}`);
  if (items) lines.push(`Material sol·licitat: ${items}`);
  return lines.join('\n');
}

function extractImportantUnknowns(body: string): string[] | undefined {
  const lines = splitLines(body).filter((line) => line.length >= 8);

  const candidates = lines.filter((line) => {
    const lower = line.toLowerCase();
    const hasSignal =
      /\b(\d{1,2}[:.]\d{2}|\d+\s*€|eur|euros?|factura|pagament|pago|transferencia|bizum|iban|nif|cif|montaje|desmontaje|micr[oò]fon|escenari|escenario|condiciones?|requisitos?|confirm|urgent|señal|aval|anticipo|plazo|vence)\b/i.test(
        line
      );
    const alreadyLabeled = /^(data|fecha|date|tel[eè]fon|tel[eè]fono|m[oò]vil|horari|horario|material|ubicaci[oó]n|lugar)\s*[:\-]/i.test(
      lower
    );
    return hasSignal && !alreadyLabeled;
  });

  if (candidates.length === 0) return undefined;
  return Array.from(new Set(candidates)).slice(0, 6);
}

function inferEventType(text: string): EventType {
  const input = text.toLowerCase();
  if (/(boda|casament|wedding|novios)/.test(input)) return 'WEDDING';
  if (/(cumple|aniversari|birthday)/.test(input)) return 'BIRTHDAY';
  if (/(empresa|corporate|corporativo|team building|company)/.test(input)) return 'CORPORATE';
  if (/(comuni[oó]n|comunion)/.test(input)) return 'COMMUNION';
  if (/(bautizo|bateig|baptism)/.test(input)) return 'BAPTISM';
  if (/(graduaci[oó]n|graduation)/.test(input)) return 'GRADUATION';
  if (/(fiesta privada|festa privada|private party)/.test(input)) return 'PRIVATE_PARTY';
  return 'OTHER';
}

function buildDisplayName(fromName: string, fromAddress: string): string {
  const cleanName = normalizeWhitespace(fromName);
  if (cleanName) return cleanName.slice(0, 120);
  const localPart = fromAddress.split('@')[0] || 'Client';
  return localPart.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 120);
}

export function extractLeadDataFromEmail(input: {
  fromName?: string;
  fromAddress: string;
  subject?: string;
  bodyText?: string;
}): ExtractedLeadData {
  const subject = input.subject || '';
  const body = input.bodyText || '';
  const fullText = `${subject}\n${body}`;
  const normalizedText = fullText
    .replace(/\u00a0/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  return {
    name: buildDisplayName(input.fromName || '', input.fromAddress),
    email: input.fromAddress.trim().toLowerCase(),
    phone: extractPhone(normalizedText),
    eventType: inferEventType(normalizedText),
    eventDate: extractEventDate(normalizedText),
    eventSchedule: extractSchedule(normalizedText),
    guestCount: extractGuestCount(normalizedText),
    budget: extractBudget(normalizedText),
    eventLocation: extractEventLocation(normalizedText),
    message: body.trim().slice(0, 4000) || undefined,
    commercialSummary: buildCommercialSummary(normalizedText),
    importantUnknowns: extractImportantUnknowns(body),
  };
}

