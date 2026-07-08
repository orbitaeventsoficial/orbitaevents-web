import { describe, expect, it } from 'vitest';
import {
  buildTravelMealAllowanceLines,
  calculateTravelCostBreakdown,
  computeBoloTransport,
  estimateRoundTripHours,
  TRAVEL_COST_LINE_MARKER,
} from '@/lib/services/travelLaborCost';

describe('travelLaborCost', () => {
  it('estima hores de ruta a partir dels km anada+tornada', () => {
    expect(estimateRoundTripHours(394.2)).toBe(6.06);
  });

  it('calcula vehicle, conductor i passatger amb la 1a hora inclosa (routeHours 5 → cobra 4 h)', () => {
    const r = calculateTravelCostBreakdown({
      roundTripKm: 394.2,
      vehicleCostPerKm: 0.25,
      routeHours: 5,
      vehicleOwner: { label: 'Òrbita' },
      people: [
        { role: 'DRIVER', label: 'Òrbita' },
        { role: 'PASSENGER', label: 'Carlos', collaboratorId: 'carlos' },
      ],
    });

    expect(r.includedHours).toBe(1);
    expect(r.chargeableHours).toBe(4); // floor(5 - 1)
    expect(r.vehicleCost).toBe(98.55);
    expect(r.driverCost).toBe(60);    // 4 h × 15
    expect(r.passengerCost).toBe(60); // 4 h × 15
    expect(r.totalCost).toBe(218.55);
    expect(r.lines).toEqual([
      expect.objectContaining({ label: 'Vehicle ruta · Òrbita', costAmount: 98.55, collaboratorId: null }),
      expect.objectContaining({ label: 'Temps ruta conductor · Òrbita', costAmount: 60, collaboratorId: null }),
      expect.objectContaining({ label: 'Temps ruta passatger · Carlos', costAmount: 60, collaboratorId: 'carlos' }),
    ]);
    expect(r.lines.every((line) => line.notes.includes(TRAVEL_COST_LINE_MARKER))).toBe(true);
  });

  it('assigna vehicle i conductor al col·laborador quan el cotxe el posa el proveïdor', () => {
    const r = calculateTravelCostBreakdown({
      roundTripKm: 30,
      vehicleCostPerKm: 0.25,
      routeHours: 3, // cobra floor(3-1)=2 h
      vehicleOwner: { label: 'Carlos', collaboratorId: 'carlos' },
      people: [{ role: 'DRIVER', label: 'Carlos', collaboratorId: 'carlos' }],
    });

    expect(r.vehicleCost).toBe(7.5);
    expect(r.driverCost).toBe(30); // 2 h × 15
    expect(r.totalCost).toBe(37.5);
    expect(r.lines).toEqual([
      expect.objectContaining({ collaboratorId: 'carlos', costAmount: 7.5 }),
      expect.objectContaining({ collaboratorId: 'carlos', costAmount: 30 }),
    ]);
  });

  it('1a hora inclosa, excés en blocs de 30 min amunt (1,5 h→0,5; 1h50→1; 2 h→1)', () => {
    const oneAndHalf = calculateTravelCostBreakdown({
      roundTripKm: 100, routeHours: 1.5, vehicleCostPerKm: 0.25,
      vehicleOwner: { label: 'Òrbita' }, people: [{ role: 'DRIVER', label: 'Òrbita' }],
    });
    expect(oneAndHalf.chargeableHours).toBe(0.5); // ceil((1.5-1)/0.5)*0.5
    expect(oneAndHalf.driverCost).toBe(7.5);      // 0.5 h × 15

    const oneE50 = calculateTravelCostBreakdown({
      roundTripKm: 120, routeHours: 1.83, vehicleCostPerKm: 0.25,
      vehicleOwner: { label: 'Òrbita' }, people: [{ role: 'DRIVER', label: 'Òrbita' }],
    });
    expect(oneE50.chargeableHours).toBe(1); // ceil(0.83/0.5)*0.5 = 1

    const under1h = calculateTravelCostBreakdown({
      roundTripKm: 50, routeHours: 0.8, vehicleCostPerKm: 0.25,
      vehicleOwner: { label: 'Òrbita' }, people: [{ role: 'DRIVER', label: 'Òrbita' }],
    });
    expect(under1h.chargeableHours).toBe(0); // dins la 1a hora inclosa
    expect(under1h.laborCostApplies).toBe(false);

    const two = calculateTravelCostBreakdown({
      roundTripKm: 130, routeHours: 2, vehicleCostPerKm: 0.25,
      vehicleOwner: { label: 'Òrbita' }, people: [{ role: 'DRIVER', label: 'Òrbita' }],
    });
    expect(two.chargeableHours).toBe(1); // ceil((2-1)/0.5)*0.5 = 1
    expect(two.driverCost).toBe(15);     // 1 h × 15
  });

  it('transport a break-even amb dieta en ruta llarga (15 €/h + 30 €/persona)', () => {
    const r = computeBoloTransport({
      roundTripKm: 422,
      vehicleCostPerKm: 0.26,
      headcountOverride: 2,
    });

    expect(r.breakdown.chargeableHours).toBe(5.5);
    expect(r.breakdown.peopleCost).toBe(165);      // tripulació: 5,5 h × 15 × 2
    expect(r.mealAllowance).toBe(60);              // dieta: 30 × 2 (routeHours 6,49 > 3)
    // clientCharge = cotxe amb franquícia (372 × 0,26 = 96,72) + tripulació 165 + dieta 60
    expect(r.clientCharge).toBe(321.72);
    // cost = cotxe sencer 109,72 + tripulació 165 + dieta 60
    expect(r.cost).toBe(334.72);
    // Break-even: l'únic negatiu (−13) és la franquícia del cotxe (gest comercial), no la dieta.
  });

  it('no aplica dieta en ruta curta (per sota del llindar de 3 h)', () => {
    const r = computeBoloTransport({
      roundTripKm: 120, // ~1,85 h a/t < 3 h
      vehicleCostPerKm: 0.26,
      headcountOverride: 2,
    });
    expect(r.mealAllowance).toBe(0);
  });

  it('reparteix la dieta entre les persones que viatgen', () => {
    const lines = buildTravelMealAllowanceLines([
      { role: 'DRIVER', label: 'Òrbita' },
      { role: 'PASSENGER', label: 'Masquerade', collaboratorId: 'masquerade', count: 2 },
    ], 90);

    expect(lines).toEqual([
      expect.objectContaining({ label: 'Dieta desplaçament · Òrbita', costAmount: 30, collaboratorId: null }),
      expect.objectContaining({ label: 'Dieta desplaçament · Masquerade x2', costAmount: 60, collaboratorId: 'masquerade' }),
    ]);
    expect(lines.every((line) => line.notes.includes(TRAVEL_COST_LINE_MARKER))).toBe(true);
  });
});
