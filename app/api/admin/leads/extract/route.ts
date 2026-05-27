import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PROMPT = (text: string) => `Analitza aquesta conversa (pot ser un WhatsApp, email o text) i extreu la informació del CLIENT (no de l'empresa Òrbita Events). Retorna ÚNICAMENT un JSON vàlid sense cap text addicional, amb exactament aquests camps (deixa "" si no trobes la informació):

{
  "name": "nom complet del client",
  "email": "email del client",
  "phone": "telèfon del client",
  "eventType": "un de: WEDDING | BIRTHDAY | CORPORATE | COMMUNION | BAPTISM | OTHER",
  "eventDate": "format YYYY-MM-DD o buit",
  "eventTime": "format HH:MM (hora inici) o buit",
  "eventLocation": "lloc de l'event",
  "guestCount": "número aproximat de convidats o buit",
  "message": "resum breu de la petició del client en 1-2 frases",
  "source": "un de: WHATSAPP | EMAIL | PHONE | INSTAGRAM | WEBSITE | OTHER"
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

function extractName(text: string): string {
  const patterns = [
    /sóc (?:en |la |l')?([A-ZÁÉÍÓÚÀÈÌÒÙÜÏÇÑ][a-záéíóúàèìòùüïçñA-ZÁÉÍÓÚÀÈÌÒÙÜÏÇÑ]{2,}(?:\s[A-ZÁÉÍÓÚÀÈÌÒÙÜÏÇÑ][a-záéíóúàèìòùüïçñ]+)?)/,
    /soy (?:el |la )?(?:presidente|presidenta|sr\.|sra\.)?\s*([A-ZÁÉÍÓÚÀÈÌÒÙÜÏÇÑ][a-záéíóúàèìòùüïçñ]{2,}(?:\s[A-ZÁÉÍÓÚÀÈÌÒÙÜÏÇÑ][a-záéíóúàèìòùüïçñ]+)?)/i,
    /em dic ([A-ZÁÉÍÓÚÀÈÌÒÙÜÏÇÑ][a-záéíóúàèìòùüïçñ]{2,}(?:\s[A-ZÁÉÍÓÚÀÈÌÒÙÜÏÇÑ][a-záéíóúàèìòùüïçñ]+)?)/i,
    /me llamo ([A-ZÁÉÍÓÚÀÈÌÒÙÜÏÇÑ][a-záéíóúàèìòùüïçñ]{2,}(?:\s[A-ZÁÉÍÓÚÀÈÌÒÙÜÏÇÑ][a-záéíóúàèìòùüïçñ]+)?)/i,
    /soy ([A-ZÁÉÍÓÚÀÈÌÒÙÜÏÇÑ][a-záéíóúàèìòùüïçñ]{2,}(?:\s[A-ZÁÉÍÓÚÀÈÌÒÙÜÏÇÑ][a-záéíóúàèìòùüïçñ]+)?)/,
    /hola[,.]?\s+(?:sóc|soy)\s+([A-ZÁÉÍÓÚÀÈÌÒÙÜÏÇÑ][a-záéíóúàèìòùüïçñ]{2,})/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m?.[1]) return m[1].trim();
  }
  return '';
}

function regexFallback(text: string): Record<string, string> {
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+34\s?)?(?:6\d{2}|7[1-9]\d{1}|9\d{2})\s?\d{3}\s?\d{3}/);
  const dateMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/) ||
                    text.match(/\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/);

  let eventDate = '';
  if (dateMatch) {
    const full = dateMatch[0];
    const parts = full.split(/[\/\-]/);
    if (parts[0].length === 4) {
      eventDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else {
      const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      eventDate = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  const guestMatch = text.match(/\b(\d{2,4})\s*(?:persones?|convidats?|assistents?|people|guests?)/i);

  const timeMatch = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  const eventTime = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : '';

  const lower = text.toLowerCase();
  let source = 'OTHER';
  if (lower.includes('whatsapp') || lower.includes('wa.me') || lower.includes('8:') || lower.includes('9:') || lower.includes('Bon dia')) source = 'WHATSAPP';
  else if (lower.includes('@') && lower.includes('assumpte')) source = 'EMAIL';
  else if (lower.includes('instagram') || lower.includes('@')) source = 'INSTAGRAM';

  let eventType = 'OTHER';
  if (/boda|bodes|casament/i.test(text)) eventType = 'WEDDING';
  else if (/cumple|aniversari|birthday|anys/i.test(text)) eventType = 'BIRTHDAY';
  else if (/comuni[oó]n|comunió/i.test(text)) eventType = 'COMMUNION';
  else if (/empresa|corporati|team/i.test(text)) eventType = 'CORPORATE';
  else if (/baptis|bateig/i.test(text)) eventType = 'BAPTISM';

  return {
    name: extractName(text),
    email: emailMatch?.[0] || '',
    phone: phoneMatch?.[0]?.replace(/\s/g, '') || '',
    eventType,
    eventDate,
    eventTime,
    eventLocation: '',
    guestCount: guestMatch?.[1] || '',
    message: '',
    source,
  };
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { text } = await req.json() as { text?: string };
  if (!text?.trim()) {
    return NextResponse.json({ error: 'Text buit' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    let raw = '';
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: getGeminiModelName() });
      const result = await model.generateContent(PROMPT(text));
      raw = result.response.text().trim();

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const data = JSON.parse(jsonMatch[0]) as Record<string, string>;
      return NextResponse.json({ data });
    } catch (err) {
      console.error('[extract] Gemini error, fallback a regex:', err);
      const data = regexFallback(text);
      return NextResponse.json({ data, fallback: true, fallbackReason: classifyGeminiError(err) });
    }
  }

  const data = regexFallback(text);
  return NextResponse.json({ data, fallback: true, fallbackReason: 'unavailable' });
}
