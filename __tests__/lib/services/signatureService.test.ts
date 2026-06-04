import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getEmailSignatureHtml, getEmailSignatureText } from '@/lib/services/signatureService';
import { EMAIL_CONTACT } from '@/lib/constants/email';

vi.mock('@/lib/services/imageManagerService', () => ({
  getManagedImageOverride: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    setting: {
      findUnique: vi.fn(() => Promise.resolve(null)),
    },
  },
}));

describe('signatureService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getEmailSignatureHtml', () => {
    it('retorna una firma HTML vàlida amb contactes canonical', async () => {
      const html = await getEmailSignatureHtml();
      expect(html).toContain('Òrbita Events');
      expect(html).toContain(EMAIL_CONTACT.phone);
      expect(html).toContain(EMAIL_CONTACT.email);
      expect(html).toContain(EMAIL_CONTACT.web);
    });

    it('inclou estructura HTML correcta (table + logo)', async () => {
      const html = await getEmailSignatureHtml();
      expect(html).toContain('role="presentation"');
      expect(html).toContain('cellspacing="0"');
      expect(html).toContain('alt="Òrbita Events"');
    });

    it('inclou styles inline sans hardcoded hex colors', async () => {
      const html = await getEmailSignatureHtml();
      expect(html).not.toMatch(/#[0-9a-fA-F]{6}/); // No hex colors inline
    });
  });

  describe('getEmailSignatureText', () => {
    it('retorna una firma text vàlida amb contactes canonical', async () => {
      const text = await getEmailSignatureText();
      expect(text).toContain('Òrbita Events');
      expect(text).toContain(EMAIL_CONTACT.phone);
      expect(text).toContain(EMAIL_CONTACT.email);
      expect(text).toContain(EMAIL_CONTACT.web);
    });

    it('comença amb separador --- ', async () => {
      const text = await getEmailSignatureText();
      expect(text.startsWith('\n---\n')).toBe(true);
    });
  });

  describe('EMAIL_CONTACT constant', () => {
    it('exposa phone, email, web de forma canonical', () => {
      expect(EMAIL_CONTACT).toHaveProperty('phone');
      expect(EMAIL_CONTACT).toHaveProperty('email');
      expect(EMAIL_CONTACT).toHaveProperty('web');
      expect(typeof EMAIL_CONTACT.phone).toBe('string');
      expect(typeof EMAIL_CONTACT.email).toBe('string');
      expect(typeof EMAIL_CONTACT.web).toBe('string');
    });
  });
});
