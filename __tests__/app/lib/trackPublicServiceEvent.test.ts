import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trackPublicServiceEvent } from '@/app/lib/analytics';

describe('trackPublicServiceEvent', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { gtag: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('forwards action and params to window.gtag with the canonical "event" command', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag });

    trackPublicServiceEvent('bodas_pack_cta', { pack_id: 'pack-aa-25', price: 700 });

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith('event', 'bodas_pack_cta', { pack_id: 'pack-aa-25', price: 700 });
  });

  it('is a no-op when window.gtag is not defined', () => {
    vi.stubGlobal('window', {});

    expect(() => {
      trackPublicServiceEvent('discomovil_hero_cta', { position: 'hero' });
    }).not.toThrow();
  });

  it('is a no-op on the server (window === undefined)', () => {
    vi.stubGlobal('window', undefined);

    expect(() => {
      trackPublicServiceEvent('fiestas_mid_cta', { position: 'mid' });
    }).not.toThrow();
  });

  it('passes through arbitrary param shapes (string/number/boolean/undefined)', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag });

    trackPublicServiceEvent('mixed_event', {
      flag: true,
      label: 'demo',
      count: 3,
      missing: undefined,
    });

    expect(gtag).toHaveBeenCalledWith('event', 'mixed_event', {
      flag: true,
      label: 'demo',
      count: 3,
      missing: undefined,
    });
  });
});
