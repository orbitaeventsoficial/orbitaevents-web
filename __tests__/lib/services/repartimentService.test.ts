import { describe, expect, it } from 'vitest';
import { computeBoloRepartiment, REPARTIMENT_OWNER_KEY } from '@/lib/services/repartimentService';

describe('computeBoloRepartiment', () => {
  it('reparteix un bolo de proveïdor: Bingo → Masquerade + marge Òrbita', () => {
    const r = computeBoloRepartiment([
      { label: 'Bingo Musical (Masquerade)', kind: 'PROVIDER_SERVICE', revenueAmount: 240, costAmount: 160, quantity: 1, collaboratorId: 'masquerade' },
    ]);
    expect(r.totals.clientTotal).toBe(240);
    expect(r.totals.aCollaboradors).toBe(160);
    expect(r.totals.partOrbita).toBe(80);
    const masq = r.perPersona.find((p) => p.personId === 'masquerade');
    expect(masq?.rep).toBe(160);
    const orbita = r.perPersona.find((p) => p.esOrbita);
    expect(orbita?.rep).toBe(80);
    expect(r.elements[0].margeOrbita).toBe(80);
  });

  it('tècnic de so: qui el fa cobra els 40 € (Masquerade vs Òrbita)', () => {
    // Tècnic el fa el PROVEÏDOR → Masquerade cobra 160 + 40 = 200; Òrbita 40.
    const techProvider = computeBoloRepartiment([
      { label: 'Bingo', kind: 'PROVIDER_SERVICE', revenueAmount: 240, costAmount: 160, quantity: 1, collaboratorId: 'masquerade' },
      { label: 'Tècnic de so inclòs', kind: 'SOUND_TECH', revenueAmount: 0, costAmount: 40, quantity: 1, collaboratorId: 'masquerade' },
    ]);
    expect(techProvider.perPersona.find((p) => p.personId === 'masquerade')?.rep).toBe(200);
    expect(techProvider.totals.partOrbita).toBe(40); // 240 − 200

    // Tècnic el fa ÒRBITA (sense collaboratorId) → Masquerade 160; Òrbita es queda 80.
    const techOrbita = computeBoloRepartiment([
      { label: 'Bingo', kind: 'PROVIDER_SERVICE', revenueAmount: 240, costAmount: 160, quantity: 1, collaboratorId: 'masquerade' },
      { label: 'Tècnic de so inclòs', kind: 'SOUND_TECH', revenueAmount: 0, costAmount: 40, quantity: 1, collaboratorId: null },
    ]);
    expect(techOrbita.perPersona.find((p) => p.personId === 'masquerade')?.rep).toBe(160);
    expect(techOrbita.totals.partOrbita).toBe(80); // 240 − 160
  });

  it('transport atribuïble: vehicle i conductor van a qui els posa', () => {
    // Bingo Masquerade + transport: cotxe i conductor de CARLOS → Carlos cobra tot el transport.
    const r = computeBoloRepartiment([
      { label: 'Bingo', kind: 'PROVIDER_SERVICE', revenueAmount: 240, costAmount: 160, quantity: 1, collaboratorId: 'masquerade' },
      { label: 'Vehicle ruta · Carlos', kind: 'OTHER', revenueAmount: 0, costAmount: 84, quantity: 1, collaboratorId: 'carlos' },
      { label: 'Temps ruta conductor · Carlos', kind: 'OTHER', revenueAmount: 0, costAmount: 99, quantity: 1, collaboratorId: 'carlos' },
    ]);
    expect(r.perPersona.find((p) => p.personId === 'carlos')?.rep).toBe(183); // 84 + 99
    expect(r.perPersona.find((p) => p.personId === 'masquerade')?.rep).toBe(160);
    expect(r.totals.aCollaboradors).toBe(343); // 160 + 183
    expect(r.totals.partOrbita).toBe(-103);    // 240 − 343 (pèrdua: transport no repercutit)
  });

  it('bolo 100% propi (DJ Òrbita): tot va a Òrbita', () => {
    const r = computeBoloRepartiment([
      { label: 'DJ 1a hora', kind: 'DJ', revenueAmount: 150, costAmount: 0, quantity: 1, collaboratorId: null },
    ]);
    expect(r.totals.partOrbita).toBe(150);
    expect(r.perPersona).toHaveLength(1);
    expect(r.perPersona[0].personId).toBe(REPARTIMENT_OWNER_KEY);
  });

  it('bolo buit → tot a zero', () => {
    const r = computeBoloRepartiment([]);
    expect(r.totals).toEqual({ clientTotal: 0, aCollaboradors: 0, partOrbita: 0 });
    expect(r.perPersona).toHaveLength(1); // només Òrbita, a 0
  });
});
