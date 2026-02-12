import type { EventType } from '@prisma/client';

export type ExtractedLeadData = {
  name: string;
  email: string;
  phone?: string;
  eventType: EventType;
  eventDate?: Date;
  guestCount?: number;
  budget?: string;
  eventLocation?: string;
  message?: string;
};

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function extractPhone(text: string): string | undefined {
  const match = text.match(/(?:\+?\d[\d().\s-]{7,}\d)/);
  if (!match) return undefined;
  const raw = match[0].trim();
  const cleaned = raw.replace(/[^\d+]/g, '');
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

function extractEventDate(text: string): Date | undefined {
  const labeled = text.match(
    /(?:fecha|data|date)\s*[:\-]?\s*([0-3]?\d[\/.\-][0-1]?\d[\/.\-](?:\d{2}|\d{4})|\d{4}[\/.\-][0-1]?\d[\/.\-][0-3]?\d)/i
  );
  if (labeled) return parseDateCandidate(labeled[1]);

  const inline = text.match(/\b([0-3]?\d[\/.\-][0-1]?\d[\/.\-](?:\d{2}|\d{4}))\b/);
  if (!inline) return undefined;
  return parseDateCandidate(inline[1]);
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

  const eur = text.match(/\b(\d{2,5})\s*(?:€|eur|euros?)\b/i);
  if (!eur) return undefined;
  return `${eur[1]}€`;
}

function extractEventLocation(text: string): string | undefined {
  const labeled = text.match(/(?:ubicaci[oó]n|lugar|localidad|ciudad|location|lloc)\s*[:\-]?\s*([^\n\r]+)/i);
  if (!labeled) return undefined;
  return normalizeWhitespace(labeled[1]).slice(0, 160);
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

  return {
    name: buildDisplayName(input.fromName || '', input.fromAddress),
    email: input.fromAddress.trim().toLowerCase(),
    phone: extractPhone(fullText),
    eventType: inferEventType(fullText),
    eventDate: extractEventDate(fullText),
    guestCount: extractGuestCount(fullText),
    budget: extractBudget(fullText),
    eventLocation: extractEventLocation(fullText),
    message: body.trim().slice(0, 4000) || undefined,
  };
}
