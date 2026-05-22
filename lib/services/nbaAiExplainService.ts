import Anthropic from '@anthropic-ai/sdk';
import type { NextBestAction } from './nextBestActionService';
import { log } from '@/lib/logger';

export type NBAExplainResult = {
  explanation: string;
  generatedAt: string;
};

const SYSTEM_PROMPT =
  "Ets l'assistent executiu d'un DJ i empresa d'esdeveniments de Barcelona. Parles sempre en català informal però professional. Ets directe i concís. La teva funció és ajudar el propietari a entendre PER QUÈ les accions prioritàries d'avui impacten el seu negoci i quina és la primera cosa que ha de fer.";

export async function generateNBAExplanation(actions: NextBestAction[]): Promise<NBAExplainResult> {
  const empty: NBAExplainResult = { explanation: '', generatedAt: new Date().toISOString() };

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || actions.length === 0) return empty;

  const top = actions.slice(0, 3);
  const context = top
    .map(
      (a, i) =>
        `${i + 1}. ${a.icon} ${a.title}\n   Motiu: ${a.reasoning}\n   Urgència: ${a.urgency} · Impacte: ${a.estimatedImpact} · Finestra: ${a.timeWindow}`,
    )
    .join('\n\n');

  const userPrompt = `Explica en 2-3 frases directes per què la prioritat #1 d'avui és urgent i quin és el risc real si no s'actua. Esmenta breument les accions #2 i #3 si aporten context. No facis llistes, no usis títols, no repeteixis l'acció verbatim.

Prioritats actuals:
${context}`;

  try {
    const client = new Anthropic({ apiKey: key });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const block = msg.content[0];
    const explanation = block.type === 'text' ? block.text.trim() : '';
    return { explanation, generatedAt: new Date().toISOString() };
  } catch (err) {
    log.error('nbaAiExplainService: Anthropic call failed', err);
    return empty;
  }
}
