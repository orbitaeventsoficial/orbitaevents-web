import Anthropic from '@anthropic-ai/sdk';
import { log } from '@/lib/logger';

export type CopyContextType = 'quote-why-us' | 'social-caption';

export type CopyAiSuggestionsInput = {
  type: CopyContextType;
  context: string;
};

export type CopyAiSuggestionsResult = {
  suggestions: string[];
  generatedAt: string;
};

const SYSTEM_PROMPTS: Record<CopyContextType, string> = {
  'quote-why-us':
    "Ets el copywriter d'un DJ i empresa d'esdeveniments de Barcelona. " +
    'Generes 3 textos curts, professionals i en català informal per al camp "Per què triar-nos" d\'un pressupost. ' +
    'Cada text ha de tenir entre 2 i 4 frases, ser persuasiu però no exagerat, i destacar confiança, experiència o personalització. ' +
    'Separa les 3 opcions amb el delimitador exacte "---".',
  'social-caption':
    "Ets el community manager d'un DJ i empresa d'esdeveniments de Barcelona. " +
    'Generes 3 captions de xarxes socials en català informal, positius i captivadors. ' +
    'Cada caption ha de tenir entre 1 i 3 frases, incloure un emoji rellevant i acabar amb una crida a l\'acció subtil. ' +
    'Separa les 3 opcions amb el delimitador exacte "---".',
};

export async function generateCopySuggestions(input: CopyAiSuggestionsInput): Promise<CopyAiSuggestionsResult> {
  const empty: CopyAiSuggestionsResult = { suggestions: [], generatedAt: new Date().toISOString() };
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !input.context.trim()) return empty;

  try {
    const client = new Anthropic({ apiKey: key });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPTS[input.type],
      messages: [{ role: 'user', content: `Context: ${input.context}\n\nGenera 3 opcions de text.` }],
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
    log.error('copyAiSuggestionsService: Anthropic call failed', err);
    return empty;
  }
}
