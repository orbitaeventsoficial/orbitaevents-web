import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractLeadDataFromText } from '@/lib/services/leadTextExtractionService';

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

function regexFallback(text: string): Record<string, string> {
  return extractLeadDataFromText(text);
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
