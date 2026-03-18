import { describe, it, expect } from 'vitest';

import { getWeddingCoverageZones } from '@/lib/services/weddingCoverage';

const mockT = (key: string) => key; // returns key as-is (simulates missing translation)

describe('getWeddingCoverageZones', () => {
  it('retorna 4 zones', () => {
    const zones = getWeddingCoverageZones(undefined, mockT);
    expect(zones).toHaveLength(4);
  });

  it('cada zona té href, icon, name, desc', () => {
    const zones = getWeddingCoverageZones(undefined, mockT);
    for (const zone of zones) {
      expect(zone.href).toBeTruthy();
      expect(zone.icon).toBeTruthy();
      expect(zone.name).toBeTruthy();
      expect(zone.desc).toBeTruthy();
    }
  });

  it('usa fallback si t() retorna la clau', () => {
    const zones = getWeddingCoverageZones(undefined, mockT);
    expect(zones[0].name).toBe('Maresme');
    expect(zones[0].desc).toBe('Bodas frente al mar y fincas costeras');
  });

  it('usa traducció si t() retorna valor', () => {
    const t = (key: string) => {
      if (key === 'coverage.zones.maresme.name') return 'Maresme Costa';
      return key;
    };

    const zones = getWeddingCoverageZones(undefined, t);
    expect(zones[0].name).toBe('Maresme Costa');
  });

  it('busca en messages si t() falla', () => {
    const t = () => { throw new Error('missing'); };
    const messages = {
      coverage: {
        zones: {
          maresme: { name: 'Maresme msg', desc: 'Desc msg' },
          girona: { name: 'Girona msg', desc: 'Desc msg' },
          costaBrava: { name: 'Costa Brava msg', desc: 'Desc msg' },
          valles: { name: 'Vallès msg', desc: 'Desc msg' },
        },
      },
    } as unknown as Parameters<typeof getWeddingCoverageZones>[0];

    const zones = getWeddingCoverageZones(messages, t);
    expect(zones[0].name).toBe('Maresme msg');
  });

  it('conté zones esperades', () => {
    const zones = getWeddingCoverageZones(undefined, mockT);
    const names = zones.map((z) => z.name);
    expect(names).toContain('Maresme');
    expect(names).toContain('Girona');
    expect(names).toContain('Costa Brava');
    expect(names).toContain('Vallès');
  });

  it('hrefs contenen /servicios/', () => {
    const zones = getWeddingCoverageZones(undefined, mockT);
    for (const zone of zones) {
      expect(zone.href).toMatch(/^\/servicios\//);
    }
  });
});
