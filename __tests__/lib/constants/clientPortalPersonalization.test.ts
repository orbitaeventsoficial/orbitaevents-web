import { describe, expect, it } from 'vitest';
import {
  CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS,
  CLIENT_PORTAL_DEFAULT_ACCENT_COLOR,
  CLIENT_PORTAL_PERSONALIZATION_LIMITS,
} from '@/lib/constants/clientPortalPersonalization';

describe('client portal personalization constants', () => {
  it('manté els límits compartits de personalització i caducitat', () => {
    expect(CLIENT_PORTAL_PERSONALIZATION_LIMITS).toEqual({
      headline: 120,
      introMessage: 1200,
      accentColor: 20,
    });
    expect(CLIENT_PORTAL_DEFAULT_ACCENT_COLOR).toBe('#06b6d4');
    expect(CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS).toEqual({
      defaultDays: 30,
      minDays: 1,
      maxDays: 365,
    });
  });
});
