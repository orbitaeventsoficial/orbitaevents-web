import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

const { mockNormalizePhone } = vi.hoisted(() => ({
  mockNormalizePhone: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));
vi.mock('@/lib/utils/normalize', () => ({ normalizePhone: mockNormalizePhone }));

import { sendWhatsAppText } from '@/lib/services/whatsappService';

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.clearAllMocks();
  mockNormalizePhone.mockReturnValue('+34612345678');
  delete process.env.WHATSAPP_API_URL;
  delete process.env.WHATSAPP_API_TOKEN;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe('sendWhatsAppText', () => {
  it('retorna error si env vars no configurades', async () => {
    const result = await sendWhatsAppText({ to: '+34612345678', text: 'Hola' });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('no configurats');
  });

  it('retorna error si telèfon no vàlid', async () => {
    process.env.WHATSAPP_API_URL = 'https://api.whatsapp.com';
    process.env.WHATSAPP_API_TOKEN = 'token123';
    mockNormalizePhone.mockReturnValue(null);

    const result = await sendWhatsAppText({ to: 'invalid', text: 'Hola' });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('no vàlid');
  });

  it('envia missatge correctament', async () => {
    process.env.WHATSAPP_API_URL = 'https://api.whatsapp.com';
    process.env.WHATSAPP_API_TOKEN = 'token123';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id: 'msg-123' }] }),
    });

    const result = await sendWhatsAppText({ to: '+34612345678', text: 'Hola' });

    expect(result.ok).toBe(true);
    expect(result.providerMessageId).toBe('msg-123');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.whatsapp.com/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token123',
        }),
      })
    );
  });

  it('retorna error si API falla', async () => {
    process.env.WHATSAPP_API_URL = 'https://api.whatsapp.com';
    process.env.WHATSAPP_API_TOKEN = 'token123';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Rate limited' } }),
    });

    const result = await sendWhatsAppText({ to: '+34612345678', text: 'Hola' });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Rate limited');
  });

  it('gestiona excepcions de xarxa', async () => {
    process.env.WHATSAPP_API_URL = 'https://api.whatsapp.com';
    process.env.WHATSAPP_API_TOKEN = 'token123';

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await sendWhatsAppText({ to: '+34612345678', text: 'Hola' });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Excepción');
  });
});
