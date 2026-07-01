import { describe, expect, it } from 'vitest';
import {
  calculateTravelCostBreakdown,
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
    expect(r.driverCost).toBe(72);    // 4 h × 18
    expect(r.passengerCost).toBe(60); // 4 h × 15
    expect(r.totalCost).toBe(230.55);
    expect(r.lines).toEqual([
      expect.objectContaining({ label: 'Vehicle ruta · Òrbita', costAmount: 98.55, collaboratorId: null }),
      expect.objectContaining({ label: 'Temps ruta conductor · Òrbita', costAmount: 72, collaboratorId: null }),
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
    expect(r.driverCost).toBe(36); // 2 h × 18
    expect(r.totalCost).toBe(43.5);
    expect(r.lines).toEqual([
      expect.objectContaining({ collaboratorId: 'carlos', costAmount: 7.5 }),
      expect.objectContaining({ collaboratorId: 'carlos', costAmount: 36 }),
    ]);
  });

  it('regla del propietari: 1a hora inclosa, hores senceres completades (1,5 h→0; 2 h→1 h)', () => {
    const under = calculateTravelCostBreakdown({
      roundTripKm: 100, routeHours: 1.5, vehicleCostPerKm: 0.25,
      vehicleOwner: { label: 'Òrbita' }, people: [{ role: 'DRIVER', label: 'Òrbita' }],
    });
    expect(under.chargeableHours).toBe(0); // floor(1.5-1)=0
    expect(under.laborCostApplies).toBe(false);
    expect(under.driverCost).toBe(0);

    const oneE50 = calculateTravelCostBreakdown({
      roundTripKm: 120, routeHours: 1.83, vehicleCostPerKm: 0.25,
      vehicleOwner: { label: 'Òrbita' }, people: [{ role: 'DRIVER', label: 'Òrbita' }],
    });
    expect(oneE50.chargeableHours).toBe(0); // 1 h 50 min → encara 0

    const two = calculateTravelCostBreakdown({
      roundTripKm: 130, routeHours: 2, vehicleCostPerKm: 0.25,
      vehicleOwner: { label: 'Òrbita' }, people: [{ role: 'DRIVER', label: 'Òrbita' }],
    });
    expect(two.chargeableHours).toBe(1); // floor(2-1)=1
    expect(two.driverCost).toBe(18);     // 1 h × 18
  });
});
