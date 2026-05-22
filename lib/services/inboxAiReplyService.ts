import Anthropic from '@anthropic-ai/sdk';
import { log } from '@/lib/logger';

export type InboxAiReplyInput = {
  fromName: string;
  subject: string;
  bodyText: string;
  eventType?: string | null;
};

export type InboxAiReplyResult = {
  suggestions: string[];
  generatedAt: string;
};

const SYSTEM_PROMPT =
  "Ets l'assistent executiu d'un DJ i empresa d'esdeveniments de Barcelona. " +
  'Generes 3 respostes curtes, professionals i en català informal per a emails de clients. ' +
  "Cada resposta ha de ser directa (1-3 frases), càlida i orientada a l'acció. " +
  'Separa les 3 opcions amb el delimitador exacte "---".';

export async function generateInboxReplySuggestions(input: InboxAiReplyInput): Promise<InboxAiReplyResult> {
  const empty: InboxAiReplyResult = { suggestions: [], generatedAt: new Date().toISOString() };
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !input.bodyText.trim()) return empty;

  const context = [
    `De: ${input.fromName}`,
    `Assumpte: ${input.subject}`,
    input.eventType ? `Tipus d'event: ${input.eventType}` : null,
    '',
    'Missatge:',
    input.bodyText.slice(0, 800),
  ]
    .filter((line) => line !== null)
    .join('\n');

  try {
    const client = new Anthropic({ apiKey: key });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `${context}\n\nGenera 3 respostes curtes per a aquest email.` }],
    });

    const block = msg.content[0];
    if (block.type !== 'text') return empty;

    const suggestions = block.text
      .split('---')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 3);

    return { suggestions, generatedAt: new Date().toISOString() };
  } catch (err) {
    log.error('inboxAiReplyService: Anthropic call failed', err);
    return empty;
  }
}
