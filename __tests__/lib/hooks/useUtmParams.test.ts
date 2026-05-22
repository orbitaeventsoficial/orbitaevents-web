import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useUtmParams } from '@/lib/hooks/useUtmParams';

beforeEach(() => {
  window.history.pushState({}, '', '/');
});

afterEach(() => {
  window.history.pushState({}, '', '/');
});

describe('useUtmParams', () => {
  it('extreu utm_source, utm_medium i utm_campaign del search', () => {
    window.history.pushState({}, '', '/ca/serveis?utm_source=google&utm_medium=cpc&utm_campaign=summer');
    const { result } = renderHook(() => useUtmParams());
    expect(result.current).toEqual({
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'summer',
      landingPage: '/ca/serveis',
    });
  });

  it('retorna landingPage sense UTMs si no hi ha paràmetres', () => {
    window.history.pushState({}, '', '/ca');
    const { result } = renderHook(() => useUtmParams());
    expect(result.current).toEqual({ landingPage: '/ca' });
  });

  it('retalla utm_source llarg a 200 caràcters', () => {
    const long = 'x'.repeat(250);
    window.history.pushState({}, '', `/?utm_source=${long}`);
    const { result } = renderHook(() => useUtmParams());
    expect(result.current.utmSource).toHaveLength(200);
  });

  it('retalla landingPage llarg a 500 caràcters', () => {
    const longPath = '/' + 'p'.repeat(600);
    window.history.pushState({}, '', longPath);
    const { result } = renderHook(() => useUtmParams());
    expect(result.current.landingPage).toHaveLength(500);
  });
});
