import { describe, expect, it } from 'vitest';
import { PUBLIC_MOBILE_FOOTER_LEGAL_LINKS } from '@/lib/constants';

describe('PUBLIC_MOBILE_FOOTER_LEGAL_LINKS', () => {
  it('exposes the three canonical mobile-footer legal entries', () => {
    expect(PUBLIC_MOBILE_FOOTER_LEGAL_LINKS).toHaveLength(3);
    expect(PUBLIC_MOBILE_FOOTER_LEGAL_LINKS.map((l) => l.href)).toEqual([
      '/legal/privacidad',
      '/legal/cookies',
      '/legal/aviso-legal',
    ]);
  });

  it('uses the mobileHome.footer namespace keys (legal.privacy / legal.cookies / legal.legal)', () => {
    expect(PUBLIC_MOBILE_FOOTER_LEGAL_LINKS.map((l) => l.tKey)).toEqual([
      'legal.privacy',
      'legal.cookies',
      'legal.legal',
    ]);
  });

  it('hrefs do not include the locale prefix (locale is prepended at render time)', () => {
    for (const link of PUBLIC_MOBILE_FOOTER_LEGAL_LINKS) {
      expect(link.href.startsWith('/legal/')).toBe(true);
      expect(link.href).not.toMatch(/^\/(ca|es|en)\//);
    }
  });
});
