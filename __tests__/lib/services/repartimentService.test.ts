import { describe, expect, it } from 'vitest';
import { computeBoloRepartiment, REPARTIMENT_OWNER_KEY } from '@/lib/services/repartimentService';

describe('computeBoloRepartiment', () => {
  it('reparteix un bolo de proveïdor: cost extern + benefici net Òrbita', () => {
    const r = computeBoloRepartiment([
      { label: 'Bingo Musical (Masquerade)', kind: 'PROVIDER_SERVICE', revenueAmount: 240, costAmount: 160, quantity: 1, collaboratorId: 'masquerade' },
    ]);

    expect(r.totals.clientTotal).toBe(240);
    expect(r.totals.pagamentsCollaboradors).toBe(160);
    expect(r.totals.liquidacionsCapAOrbita).toBe(0);
    expect(r.totals.aCollaboradors).toBe(160);
    expect(r.totals.brutOrbita).toBe(80);
    expect(r.totals.costInternOrbita).toBe(0);
    expect(r.totals.partOrbita).toBe(80);
    expect(r.perPersona.find((p) => p.personId === 'masquerade')?.rep).toBe(160);
    expect(r.perPersona.find((p) => p.esOrbita)?.rep).toBe(80);
    expect(r.elements[0].margeOrbita).toBe(80);
  });

  it('tècnic inclòs fet per Òrbita: el cost negatiu de proveïdor és liquidació cap a Òrbita', () => {
    const r = computeBoloRepartiment([
      { label: 'Bingo', kind: 'PROVIDER_SERVICE', revenueAmount: 240, costAmount: 200, quantity: 1, collaboratorId: 'masquerade' },
      { label: 'Tècnic de so inclòs', kind: 'SOUND_TECH', revenueAmount: 0, costAmount: -40, quantity: 1, collaboratorId: 'masquerade' },
    ]);

    expect(r.totals.clientTotal).toBe(240);
    expect(r.totals.pagamentsCollaboradors).toBe(200);
    expect(r.totals.liquidacionsCapAOrbita).toBe(40);
    expect(r.totals.aCollaboradors).toBe(160);
    expect(r.totals.brutOrbita).toBe(80);
    expect(r.totals.partOrbita).toBe(80);
    expect(r.perPersona.find((p) => p.personId === 'masquerade')?.rep).toBe(160);

    const tech = r.elements.find((e) => e.label === 'Tècnic de so inclòs');
    expect(tech?.esOrbita).toBe(true);
    expect(tech?.beneficiariId).toBe(REPARTIMENT_OWNER_KEY);
    expect(tech?.cobra).toBe(40);
    expect(tech?.liquidacioOrbita).toBe(40);
    expect(tech?.margeOrbita).toBe(40);
  });

  it('costos propis de ruta: vehicle, hores i dietes resten del benefici net', () => {
    const r = computeBoloRepartiment([
      { label: 'Transport client', kind: 'OTHER', revenueAmount: 315, costAmount: 0, quantity: 1, collaboratorId: null },
      { label: 'Vehicle ruta · Òrbita', kind: 'OTHER', revenueAmount: 0, costAmount: 90, quantity: 1, collaboratorId: null },
      { label: 'Temps ruta conductor · Òrbita', kind: 'OTHER', revenueAmount: 0, costAmount: 83, quantity: 1, collaboratorId: null },
      { label: 'Dieta desplaçament · Òrbita', kind: 'OTHER', revenueAmount: 0, costAmount: 30, quantity: 1, collaboratorId: null },
    ]);

    expect(r.totals.clientTotal).toBe(315);
    expect(r.totals.brutOrbita).toBe(315);
    expect(r.totals.costInternOrbita).toBe(203);
    expect(r.totals.partOrbita).toBe(112);
    expect(r.perPersona.find((p) => p.esOrbita)?.brut).toBe(315);
    expect(r.perPersona.find((p) => p.esOrbita)?.costIntern).toBe(203);
    expect(r.elements.find((e) => e.label.startsWith('Temps ruta conductor'))?.margeOrbita).toBe(-83);
  });

  it('bolo mixt Bingo + DJ + transport: separa pagaments, liquidacions, cost intern i net', () => {
    const r = computeBoloRepartiment([
      { label: 'Bingo Musical (Masquerade)', kind: 'PROVIDER_SERVICE', revenueAmount: 240, costAmount: 200, quantity: 1, collaboratorId: 'masquerade' },
      { label: 'Tècnic de so inclòs', kind: 'SOUND_TECH', revenueAmount: 0, costAmount: -40, quantity: 1, collaboratorId: 'masquerade' },
      { label: 'DJ · 1a hora', kind: 'DJ', revenueAmount: 150, costAmount: 0, quantity: 1, collaboratorId: null },
      { label: 'DJ · hora addicional', kind: 'DJ', revenueAmount: 100, costAmount: 0, quantity: 1, collaboratorId: null },
      { label: 'Transport client', kind: 'OTHER', revenueAmount: 315, costAmount: 0, quantity: 1, collaboratorId: null },
      { label: 'Vehicle ruta · Òrbita', kind: 'OTHER', revenueAmount: 0, costAmount: 90, quantity: 1, collaboratorId: null },
      { label: 'Temps ruta conductor · Òrbita', kind: 'OTHER', revenueAmount: 0, costAmount: 83, quantity: 1, collaboratorId: null },
      { label: 'Temps ruta passatger · Masquerade', kind: 'OTHER', revenueAmount: 0, costAmount: 83, quantity: 1, collaboratorId: 'masquerade' },
      { label: 'Dieta desplaçament · Òrbita', kind: 'OTHER', revenueAmount: 0, costAmount: 30, quantity: 1, collaboratorId: null },
      { label: 'Dieta desplaçament · Masquerade', kind: 'OTHER', revenueAmount: 0, costAmount: 30, quantity: 1, collaboratorId: 'masquerade' },
    ]);

    expect(r.totals.clientTotal).toBe(805);
    expect(r.totals.pagamentsCollaboradors).toBe(313);
    expect(r.totals.liquidacionsCapAOrbita).toBe(40);
    expect(r.totals.aCollaboradors).toBe(273);
    expect(r.totals.brutOrbita).toBe(532);
    expect(r.totals.costInternOrbita).toBe(203);
    expect(r.totals.partOrbita).toBe(329);
    expect(r.perPersona.find((p) => p.personId === 'masquerade')?.rep).toBe(273);
    expect(r.perPersona.find((p) => p.esOrbita)?.rep).toBe(329);
  });

  it('bolo 100% propi (DJ Òrbita): tot va a Òrbita si no hi ha cost intern explícit', () => {
    const r = computeBoloRepartiment([
      { label: 'DJ 1a hora', kind: 'DJ', revenueAmount: 150, costAmount: 0, quantity: 1, collaboratorId: null },
    ]);
    expect(r.totals.partOrbita).toBe(150);
    expect(r.perPersona).toHaveLength(1);
    expect(r.perPersona[0].personId).toBe(REPARTIMENT_OWNER_KEY);
  });

  it('bolo buit → tot a zero', () => {
    const r = computeBoloRepartiment([]);
    expect(r.totals).toEqual({
      clientTotal: 0,
      aCollaboradors: 0,
      pagamentsCollaboradors: 0,
      liquidacionsCapAOrbita: 0,
      costInternOrbita: 0,
      brutOrbita: 0,
      partOrbita: 0,
    });
    expect(r.perPersona).toHaveLength(1);
  });
});
