import { describe, expect, it } from 'vitest';
import {
  buildTravelMealAllowanceLines,
  calculateTravelCostBreakdown,
  computeBoloTransport,
  deriveTravelHeadcount,
  estimateRoundTripHours,
  TRAVEL_COST_LINE_MARKER,
  withTravelHeadcountNote,
} from '@/lib/services/travelLaborCost';
import { BINGO_ASSISTANT_LINE_LABEL, BINGO_ASSISTANT_LINE_NOTE } from '@/lib/constants/orbita-services';

describe('travelLaborCost', () => {
  it('estima hores de ruta a partir dels km anada+tornada', () => {
    expect(estimateRoundTripHours(394.2)).toBe(6.06);
  });

  it('calcula vehicle facturable, conductor i passatger amb 50 km i 1a hora inclosos', () => {
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
    expect(r.vehicleCost).toBe(86.05);
    expect(r.driverCost).toBe(60);    // 4 h × 15
    expect(r.passengerCost).toBe(60); // 4 h × 15
    expect(r.totalCost).toBe(206.05);
    expect(r.lines).toEqual([
      expect.objectContaining({ label: 'Vehicle ruta · Òrbita', costAmount: 86.05, collaboratorId: null }),
      expect.objectContaining({ label: 'Temps ruta conductor · Òrbita', costAmount: 60, collaboratorId: null }),
      expect.objectContaining({ label: 'Temps ruta passatger · Carlos', costAmount: 60, collaboratorId: 'carlos' }),
    ]);
    expect(r.lines.every((line) => line.notes.includes(TRAVEL_COST_LINE_MARKER))).toBe(true);
  });

  it('no liquida vehicle dins els 50 km inclosos i assigna conductor al col·laborador', () => {
    const r = calculateTravelCostBreakdown({
      roundTripKm: 30,
      vehicleCostPerKm: 0.25,
      routeHours: 3, // cobra floor(3-1)=2 h
      vehicleOwner: { label: 'Carlos', collaboratorId: 'carlos' },
      people: [{ role: 'DRIVER', label: 'Carlos', collaboratorId: 'carlos' }],
    });

    expect(r.vehicleCost).toBe(0);
    expect(r.driverCost).toBe(30); // 2 h × 15
    expect(r.totalCost).toBe(30);
    expect(r.lines).toEqual([
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
    expect(r.mealAllowance).toBe(60);              // dieta: 30 × 2 (422 km > 150)
    // clientCharge = (422 - 50 inclosos) × 0,26 + tripulació 165 + dieta 60
    expect(r.clientCharge).toBe(321.72);
    // cost = mateixa base visible: vehicle facturable 96,72 + tripulació 165 + dieta 60
    expect(r.cost).toBe(321.72);
    // El client i qui posa el cotxe comparteixen la base de 50 km inclosos.
  });

  it('aplica un mínim comercial de vehicle si hi ha km facturables però el cost és microscòpic', () => {
    const r = computeBoloTransport({
      roundTripKm: 56,
      vehicleCostPerKm: 0.26,
      headcountOverride: 2,
    });

    expect(r.breakdown.vehicleCost).toBe(1.56);
    expect(r.vehicleClientCharge).toBe(10);
    expect(r.clientCharge).toBe(10);
  });

  it('aplica dieta quan la ruta supera 150 km', () => {
    const r = computeBoloTransport({
      roundTripKm: 160,
      vehicleCostPerKm: 0.26,
      headcountOverride: 2,
    });
    expect(r.mealAllowance).toBe(60);
  });

  it('no aplica dieta en ruta curta (150 km o menys)', () => {
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

  it('compta l’assistent de Bingo +70 com a persona física de ruta', () => {
    expect(deriveTravelHeadcount([
      { collaboratorId: 'masquerade', kind: 'PROVIDER_SERVICE', label: 'Bingo Musical (Masquerade)', quantity: 1 },
      { collaboratorId: 'masquerade', kind: 'SOUND_TECH', label: 'Tècnic de so inclòs · 1,5 h', costAmount: 0, quantity: 1 },
      { kind: 'OTHER', label: BINGO_ASSISTANT_LINE_LABEL, notes: BINGO_ASSISTANT_LINE_NOTE, quantity: 1 },
    ])).toBe(3);
  });

  it('compta productes de proveïdor amb crew de 2 sense doblar el preu per quantity', () => {
    expect(deriveTravelHeadcount([
      { collaboratorId: 'masquerade', kind: 'PROVIDER_SERVICE', label: 'Animació amb personatge', quantity: 1, travelHeadcount: 2 },
    ])).toBe(2);
  });

  it('recupera el crew de ruta persistit a notes', () => {
    const notes = withTravelHeadcountNote('Producte de catàleg: animacio-doble', 2);

    expect(deriveTravelHeadcount([
      { collaboratorId: 'masquerade', kind: 'PROVIDER_SERVICE', label: 'Animació amb personatge', quantity: 1, notes },
    ])).toBe(2);
  });
});
