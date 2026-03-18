import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

import {
  detectContentLanguage,
  translateContent,
} from '@/lib/services/translationService';

// ─────────────────────────────────────────────────────────────────────────
// detectContentLanguage
// ─────────────────────────────────────────────────────────────────────────
describe('detectContentLanguage', () => {
  it('detecta català', () => {
    const result = detectContentLanguage('Això és molt interessant, però també és difícil amb aquest context');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.detectedLanguage).toBe('ca');
    }
  });

  it('detecta castellà', () => {
    const result = detectContentLanguage('Esto es muy interesante pero también muy difícil');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.detectedLanguage).toBe('es');
    }
  });

  it('detecta anglès', () => {
    const result = detectContentLanguage('This is very interesting and the results are great with this approach');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.detectedLanguage).toBe('en');
    }
  });

  it('retorna error si text buit', () => {
    const result = detectContentLanguage('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('obligatori');
    }
  });

  it('retorna error si text massa llarg', () => {
    const result = detectContentLanguage('a'.repeat(2001));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('llarg');
    }
  });

  it('text ambigú per defecte castellà', () => {
    const result = detectContentLanguage('hola');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.detectedLanguage).toBe('es');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// translateContent — validació
// ─────────────────────────────────────────────────────────────────────────
describe('translateContent validació', () => {
  it('retorna error si no hi ha text', async () => {
    const result = await translateContent({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toContain('obligatori');
    }
  });

  it('retorna error si text buit', async () => {
    const result = await translateContent({ text: '   ' });
    expect(result.ok).toBe(false);
  });

  it('retorna error si massa textos', async () => {
    const result = await translateContent({
      texts: Array.from({ length: 201 }, (_, i) => `Text ${i}`),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Massa');
    }
  });

  it('retorna error si text individual massa llarg', async () => {
    const result = await translateContent({
      text: 'a'.repeat(2001),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('llarg');
    }
  });

  it('retorna error si payload total massa gran', async () => {
    const result = await translateContent({
      texts: Array.from({ length: 50 }, () => 'a'.repeat(1500)),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('gran');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// translateContent — funcionalitat
// ─────────────────────────────────────────────────────────────────────────
describe('translateContent funcionalitat', () => {
  // Mock fetch per simular Google Translate
  beforeEach(() => {
    vi.stubEnv('DEEPL_API_KEY', '');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const urlStr = String(url);
      // Google Translate mock — retorna el text original com a "traducció"
      if (urlStr.includes('translate.googleapis.com')) {
        const match = urlStr.match(/q=([^&]+)/);
        const text = match ? decodeURIComponent(match[1]) : '';
        return new Response(JSON.stringify([[[`[translated] ${text}`]]]), { status: 200 });
      }
      return new Response('Not found', { status: 404 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('tradueix un text sol a múltiples idiomes', async () => {
    const result = await translateContent({
      text: 'Hola món',
      targetLanguages: ['es', 'en'],
    });

    expect(result.ok).toBe(true);
    if (result.ok && 'original' in result) {
      expect(result.original).toBe('Hola món');
      expect(result.translations).toBeDefined();
      expect(result.translationsByText['Hola món']).toBeDefined();
    }
  });

  it('tradueix múltiples textos', async () => {
    const result = await translateContent({
      texts: ['Hola', 'Adéu'],
      targetLanguages: ['es'],
    });

    expect(result.ok).toBe(true);
    if (result.ok && 'originals' in result) {
      expect(result.originals).toEqual(['Hola', 'Adéu']);
      expect(result.translationsByText['Hola']).toBeDefined();
      expect(result.translationsByText['Adéu']).toBeDefined();
    }
  });

  it('usa targetLanguages per defecte [es, ca, en]', async () => {
    const result = await translateContent({ text: 'Test' });

    expect(result.ok).toBe(true);
    if (result.ok && 'translations' in result) {
      expect(Object.keys(result.translations)).toEqual(expect.arrayContaining(['es', 'ca', 'en']));
    }
  });

  it('filtra textos no-string', async () => {
    const result = await translateContent({
      texts: ['Valid', null as unknown as string, undefined as unknown as string, 'Also valid'],
      targetLanguages: ['es'],
    });

    expect(result.ok).toBe(true);
    if (result.ok && 'originals' in result) {
      expect(result.originals).toEqual(['Valid', 'Also valid']);
    }
  });
});
