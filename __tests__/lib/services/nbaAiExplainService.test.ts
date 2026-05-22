import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(function AnthropicMock() {
    return {
    messages: { create: mockCreate },
    };
  }),
}));

import { generateNBAExplanation } from '@/lib/services/nbaAiExplainService';
import type { NextBestAction } from '@/lib/services/nextBestActionService';

const mockAction: NextBestAction = {
  rank: 1,
  id: 'lead:CONTACT_NOW:l1',
  domain: 'lead',
  actionType: 'CONTACT_NOW',
  urgency: 'CRITICAL',
  icon: '🔥',
  title: 'Contactar Anna Garcia',
  subtitle: 'Lead nou fa 5h',
  href: '/admin/leads/l1',
  score: 150,
  entity: { type: 'lead', id: 'l1', name: 'Anna Garcia' },
  reasoning: 'Lead sense contactar des de fa 5h — SLA en risc',
  estimatedImpact: 'HIGH',
  timeWindow: 'Ara',
};

describe('generateNBAExplanation', () => {
  const origKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Explicació de prova generada per IA.' }],
    });
  });

  afterEach(() => {
    if (origKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = origKey;
    }
    vi.clearAllMocks();
  });

  it('retorna explicació quan API key present', async () => {
    const result = await generateNBAExplanation([mockAction]);
    expect(result.explanation).toBe('Explicació de prova generada per IA.');
    expect(result.generatedAt).toBeTruthy();
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('retorna buit si no hi ha API key', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await generateNBAExplanation([mockAction]);
    expect(result.explanation).toBe('');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('retorna buit si actions és buit', async () => {
    const result = await generateNBAExplanation([]);
    expect(result.explanation).toBe('');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('retorna buit si Anthropic falla', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));
    const result = await generateNBAExplanation([mockAction]);
    expect(result.explanation).toBe('');
  });

  it('passa màxim 3 accions al model', async () => {
    const actions: NextBestAction[] = Array.from({ length: 5 }, (_, i) => ({
      ...mockAction,
      id: `lead:CONTACT_NOW:l${i}`,
      rank: i + 1,
    }));
    await generateNBAExplanation(actions);
    const call = mockCreate.mock.calls[0][0] as { messages: Array<{ content: string }> };
    const userMsg = call.messages[0].content;
    expect(userMsg).toContain('1.');
    expect(userMsg).toContain('2.');
    expect(userMsg).toContain('3.');
    expect(userMsg).not.toContain('4.');
  });

  it('inclou system prompt', async () => {
    await generateNBAExplanation([mockAction]);
    const call = mockCreate.mock.calls[0][0] as { system: string };
    expect(call.system).toContain('assistent executiu');
  });

  it('usa model haiku', async () => {
    await generateNBAExplanation([mockAction]);
    const call = mockCreate.mock.calls[0][0] as { model: string };
    expect(call.model).toContain('haiku');
  });
});
