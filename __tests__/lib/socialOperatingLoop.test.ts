import { describe, expect, it } from 'vitest';

import { buildSocialOperatingLoop } from '@/lib/socialOperatingLoop';

describe('buildSocialOperatingLoop', () => {
  it('prioritza convertir idees quan no hi ha calendari programat', () => {
    expect(
      buildSocialOperatingLoop({
        ideasCount: 3,
        scheduledCount: 0,
        publishedCount: 1,
        instagramLeadCount: 0,
        instagramWonCount: 0,
        isActive: true,
        consistencyScore: 60,
      })
    ).toMatchObject({
      title: 'Idees sense calendari',
      focus: 'Convertir una idea en peça programada abans de generar-ne més',
      evidence: '3 idees disponibles · 0 programades',
      captureLabel: 'Instagram encara sense pipeline atribuït',
    });
  });

  it('marca el contingut connectat quan Instagram ja porta pipeline', () => {
    expect(
      buildSocialOperatingLoop({
        ideasCount: 0,
        scheduledCount: 2,
        publishedCount: 4,
        instagramLeadCount: 9,
        instagramWonCount: 2,
        isActive: true,
        consistencyScore: 67,
      })
    ).toEqual({
      title: 'Contingut connectat a captació',
      focus: 'Repetir el format que porta leads i revisar conversió guanyada',
      evidence: '4 publicades · 2 programades',
      captureLabel: '9 leads Instagram · 2 guanyats',
    });
  });

  it('detecta calendari actiu sense captació visible', () => {
    expect(
      buildSocialOperatingLoop({
        ideasCount: 0,
        scheduledCount: 1,
        publishedCount: 3,
        instagramLeadCount: 0,
        instagramWonCount: 0,
        isActive: true,
        consistencyScore: 80,
      }).title
    ).toBe('Calendari actiu sense captació visible');
  });
});
