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

import { generateCopySuggestions } from '@/lib/services/copyAiSuggestionsService';

const THREE_OPTIONS = 'Opció A\n---\nOpció B\n---\nOpció C';

describe('generateCopySuggestions', () => {
  const origKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: THREE_OPTIONS }] });
  });

  afterEach(() => {
    if (origKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = origKey;
    }
    vi.clearAllMocks();
  });

  it('retorna 3 suggeriments per quote-why-us', async () => {
    const result = await generateCopySuggestions({ type: 'quote-why-us', context: "Casament, client: Anna" });
    expect(result.suggestions).toHaveLength(3);
    expect(result.generatedAt).toBeTruthy();
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('retorna 3 suggeriments per social-caption', async () => {
    const result = await generateCopySuggestions({ type: 'social-caption', context: "Festa aniversari" });
    expect(result.suggestions).toHaveLength(3);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('retorna buit si no hi ha API key', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await generateCopySuggestions({ type: 'quote-why-us', context: 'test' });
    expect(result.suggestions).toHaveLength(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('retorna buit si context és buit', async () => {
    const result = await generateCopySuggestions({ type: 'social-caption', context: '   ' });
    expect(result.suggestions).toHaveLength(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('retorna buit si Anthropic falla', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));
    const result = await generateCopySuggestions({ type: 'quote-why-us', context: 'test' });
    expect(result.suggestions).toHaveLength(0);
  });

  it('retorna màxim 3 suggeriments', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'A\n---\nB\n---\nC\n---\nD\n---\nE' }],
    });
    const result = await generateCopySuggestions({ type: 'social-caption', context: 'test' });
    expect(result.suggestions).toHaveLength(3);
  });

  it('usa model haiku', async () => {
    await generateCopySuggestions({ type: 'quote-why-us', context: 'test' });
    const call = mockCreate.mock.calls[0][0] as { model: string };
    expect(call.model).toContain('haiku');
  });

  it('gestiona bloc non-text sense error', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'tool_use', id: 'x', name: 'y', input: {} }] });
    const result = await generateCopySuggestions({ type: 'social-caption', context: 'test' });
    expect(result.suggestions).toHaveLength(0);
  });
});
