import 'server-only';
import { verifyCsrf } from '@/lib/csrf';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractLeadDataFromText } from '@/lib/services/leadTextExtractionService';
import { EVENT_TYPE_VALUES, LEAD_SOURCE_VALUES } from '@/lib/constants';

const PROMPT = (text: string) => `Analitza aquesta conversa (pot ser un WhatsApp, email o text) i extreu la informació del CLIENT (no de l'empresa Òrbita Events). Retorna ÚNICAMENT un JSON vàlid sense cap text addicional, amb exactament aquests camps (deixa "" si no trobes la informació):

{
  "name": "nom complet del client",
  "email": "email del client",
  "phone": "telèfon del client",
  "eventType": "un de: WEDDING | BIRTHDAY | CORPORATE | COMMUNION | BAPTISM | OTHER",
  "eventDate": "format YYYY-MM-DD o buit",
  "eventTime": "format HH:MM (hora inici) o buit",
  "eventEndTime": "format HH:MM (hora final) o buit",
  "eventLocation": "lloc de l'event",
  "guestCount": "número aproximat de convidats o buit",
  "message": "resum breu de la petició del client en 1-2 frases",
  "source": "un de: WHATSAPP | PHONE | INSTAGRAM | WEBSITE | WALLAPOP | REFERRAL | GOOGLE | OTHER"
}

Conversa:
${text.slice(0, 4000)}`;

function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
}

function classifyGeminiError(err: unknown): 'quota' | 'unavailable' {
  const message = err instanceof Error ? err.message : String(err);
  if (/\b(429|quota|rate limit|resource_exhausted|too many requests)\b/i.test(message)) {
    return 'quota';
  }
  return 'unavailable';
}

const GEMINI_QUOTA_COOLDOWN_MS = 10 * 60 * 1000;
const MIN_GEMINI_TEXT_LENGTH = 80;

let geminiQuotaBlockedUntil = 0;

function regexFallback(text: string): Record<string, string> {
  return extractLeadDataFromText(text);
}

function coerceString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeExtractedEventType(value: unknown) {
  const normalized = coerceString(value).toUpperCase();
  return EVENT_TYPE_VALUES.includes(normalized as typeof EVENT_TYPE_VALUES[number]) ? normalized : 'OTHER';
}

function normalizeExtractedSource(value: unknown) {
  const normalized = coerceString(value).toUpperCase();
  const source = normalized === 'EMAIL' ? 'OTHER' : normalized;
  return LEAD_SOURCE_VALUES.includes(source as typeof LEAD_SOURCE_VALUES[number]) ? source : 'OTHER';
}

function sanitizeExtractedLeadData(raw: Record<string, unknown>, originalText: string) {
  return {
    name: coerceString(raw.name),
    email: coerceString(raw.email),
    phone: coerceString(raw.phone),
    dni: coerceString(raw.dni),
    address: coerceString(raw.address),
    eventType: normalizeExtractedEventType(raw.eventType),
    eventDate: coerceString(raw.eventDate),
    eventTime: coerceString(raw.eventTime),
    eventEndTime: coerceString(raw.eventEndTime),
    eventLocation: coerceString(raw.eventLocation),
    guestCount: coerceString(raw.guestCount),
    budget: coerceString(raw.budget),
    message: coerceString(raw.message),
    source: normalizeExtractedSource(raw.source),
  };
}

function hasUsefulLocalExtraction(data: ReturnType<typeof sanitizeExtractedLeadData>) {
  const hasContact = Boolean(data.email || data.phone);
  const hasEventSignal = Boolean(data.eventDate || data.eventTime || data.eventLocation || data.guestCount || data.budget);
  return Boolean(data.name && hasContact) || hasEventSignal;
}

function isGeminiQuotaBlocked(now = Date.now()) {
  return geminiQuotaBlockedUntil > now;
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const { text } = await req.json() as { text?: string };
  if (!text?.trim()) {
    return NextResponse.json({ error: 'Text buit' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const localData = sanitizeExtractedLeadData(regexFallback(text), text);

  if (hasUsefulLocalExtraction(localData)) {
    return NextResponse.json({ data: localData });
  }

  if (text.trim().length < MIN_GEMINI_TEXT_LENGTH) {
    return NextResponse.json({ data: localData, fallback: true, fallbackReason: 'too-short' });
  }

  if (apiKey && !isGeminiQuotaBlocked()) {
    let raw = '';
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: getGeminiModelName() });
      const result = await model.generateContent(PROMPT(text));
      raw = result.response.text().trim();

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const data = sanitizeExtractedLeadData(JSON.parse(jsonMatch[0]) as Record<string, unknown>, text);
      return NextResponse.json({ data });
    } catch (err) {
      console.error('[extract] Gemini error, fallback a regex:', err);
      const fallbackReason = classifyGeminiError(err);
      if (fallbackReason === 'quota') {
        geminiQuotaBlockedUntil = Date.now() + GEMINI_QUOTA_COOLDOWN_MS;
      }
      return NextResponse.json({ data: localData, fallback: true, fallbackReason });
    }
  }

  return NextResponse.json({
    data: localData,
    fallback: true,
    fallbackReason: isGeminiQuotaBlocked() ? 'quota' : 'unavailable',
  });
}
