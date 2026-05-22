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

import { generateInboxReplySuggestions } from '@/lib/services/inboxAiReplyService';

const baseInput = {
  fromName: 'Anna Garcia',
  subject: 'Consulta per casament',
  bodyText: 'Hola, estem buscant un DJ per al nostre casament el proper juny. Podeu enviar-nos informació i preus?',
  eventType: 'wedding',
};

describe('generateInboxReplySuggestions', () => {
  const origKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'Hola Anna, gràcies per contactar-nos!\n---\nHola, encantats de rebre la vostra consulta.\n---\nBona tarda, t\'enviem la informació sol·licitada.',
        },
      ],
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

  it('retorna 3 suggeriments quan API key present', async () => {
    const result = await generateInboxReplySuggestions(baseInput);
    expect(result.suggestions).toHaveLength(3);
    expect(result.suggestions[0]).toContain('Anna');
    expect(result.generatedAt).toBeTruthy();
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('retorna buit si no hi ha API key', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await generateInboxReplySuggestions(baseInput);
    expect(result.suggestions).toHaveLength(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('retorna buit si bodyText és buit', async () => {
    const result = await generateInboxReplySuggestions({ ...baseInput, bodyText: '   ' });
    expect(result.suggestions).toHaveLength(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('retorna buit si Anthropic falla', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));
    const result = await generateInboxReplySuggestions(baseInput);
    expect(result.suggestions).toHaveLength(0);
  });

  it('retorna màxim 3 suggeriments encara que el model en generi més', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Opció 1\n---\nOpció 2\n---\nOpció 3\n---\nOpció 4\n---\nOpció 5' }],
    });
    const result = await generateInboxReplySuggestions(baseInput);
    expect(result.suggestions).toHaveLength(3);
  });

  it('inclou context del tipus d\'event al prompt', async () => {
    await generateInboxReplySuggestions(baseInput);
    const call = mockCreate.mock.calls[0][0] as { messages: Array<{ content: string }> };
    expect(call.messages[0].content).toContain('wedding');
  });

  it('usa model haiku', async () => {
    await generateInboxReplySuggestions(baseInput);
    const call = mockCreate.mock.calls[0][0] as { model: string };
    expect(call.model).toContain('haiku');
  });

  it('gestiona bloc non-text sense error', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'tool_use', id: 'x', name: 'y', input: {} }] });
    const result = await generateInboxReplySuggestions(baseInput);
    expect(result.suggestions).toHaveLength(0);
  });
});
