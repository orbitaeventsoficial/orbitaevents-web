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

  it('calcula vehicle, conductor i passatger com a capes separades', () => {
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

    expect(r.vehicleCost).toBe(98.55);
    expect(r.driverCost).toBe(90);
    expect(r.passengerCost).toBe(75);
    expect(r.totalCost).toBe(263.55);
    expect(r.lines).toEqual([
      expect.objectContaining({ label: 'Vehicle ruta · Òrbita', costAmount: 98.55, collaboratorId: null }),
      expect.objectContaining({ label: 'Temps ruta conductor · Òrbita', costAmount: 90, collaboratorId: null }),
      expect.objectContaining({ label: 'Temps ruta passatger · Carlos', costAmount: 75, collaboratorId: 'carlos' }),
    ]);
    expect(r.lines.every((line) => line.notes.includes(TRAVEL_COST_LINE_MARKER))).toBe(true);
  });

  it('assigna vehicle i conductor al col·laborador quan el cotxe el posa el proveïdor', () => {
    const r = calculateTravelCostBreakdown({
      roundTripKm: 30,
      vehicleCostPerKm: 0.25,
      routeHours: 0.75,
      vehicleOwner: { label: 'Carlos', collaboratorId: 'carlos' },
      people: [{ role: 'DRIVER', label: 'Carlos', collaboratorId: 'carlos' }],
    });

    expect(r.vehicleCost).toBe(7.5);
    expect(r.driverCost).toBe(13.5);
    expect(r.totalCost).toBe(21);
    expect(r.lines).toEqual([
      expect.objectContaining({ collaboratorId: 'carlos', costAmount: 7.5 }),
      expect.objectContaining({ collaboratorId: 'carlos', costAmount: 13.5 }),
    ]);
  });
});

