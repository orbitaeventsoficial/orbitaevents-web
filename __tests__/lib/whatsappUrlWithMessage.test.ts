import { describe, expect, it } from 'vitest';
import { WHATSAPP_NUMBER, WHATSAPP_URL, WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';

describe('WHATSAPP_URL_WITH_MESSAGE', () => {
  it('builds the canonical wa.me URL with the encoded message', () => {
    const url = WHATSAPP_URL_WITH_MESSAGE('Hola Òrbita!');
    expect(url).toBe(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola Òrbita!')}`);
    expect(url.startsWith(WHATSAPP_URL)).toBe(true);
  });

  it('encodes characters that would otherwise break the query string', () => {
    const url = WHATSAPP_URL_WITH_MESSAGE('a&b=c d?e#f');
    expect(url).toBe(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('a&b=c d?e#f')}`);
    expect(url).not.toContain('a&b=c');
    expect(url).toContain('a%26b%3Dc');
  });

  it('handles empty message returning a still-valid URL with empty text', () => {
    const url = WHATSAPP_URL_WITH_MESSAGE('');
    expect(url).toBe(`https://wa.me/${WHATSAPP_NUMBER}?text=`);
  });

  it('uses the canonical phone number from WHATSAPP_NUMBER (no hardcoded literal)', () => {
    expect(WHATSAPP_NUMBER).toBe('34699121023');
    expect(WHATSAPP_URL_WITH_MESSAGE('x')).toContain(`/${WHATSAPP_NUMBER}?`);
  });
});
