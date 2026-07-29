import { describe, expect, it } from 'vitest';
import {
  buildCustomExtrasFromLeadServiceLines,
  deriveEventScheduleDurationHours,
  deriveLeadDurationHours,
  deriveStudioDurationHours,
  inferStudioServiceFromLead,
  leadServiceLinesForTransport,
} from '@/app/admin/presupuestos/studio-utils';
import { TRAVEL_COST_LINE_MARKER } from '@/lib/services/travelLaborCost';

describe('presupuestos studio-utils', () => {
  it('converteix línies de lead en extres de pressupost i amaga costos interns de ruta', () => {
    const lines = [
      {
        id: 'line-bingo',
        kind: 'PROVIDER_SERVICE',
        label: 'Bingo Musical',
        revenueAmount: 240,
        costAmount: 200,
        quantity: 1,
        hours: 1,
        collaboratorId: 'carlos-lucas-fernandez',
      },
      {
        id: 'line-assistant',
        kind: 'SOUND_TECH',
        label: 'Asistent Bingo',
        revenueAmount: 50,
        costAmount: 40,
        quantity: 2,
        hours: 1,
        collaboratorId: 'carlos-lucas-fernandez',
      },
      {
        id: 'line-route',
        kind: 'OTHER',
        label: 'Temps ruta conductor',
        revenueAmount: 0,
        costAmount: 45,
        quantity: 1,
        notes: `${TRAVEL_COST_LINE_MARKER} DRIVER`,
      },
    ];

    expect(buildCustomExtrasFromLeadServiceLines(lines)).toEqual([
      { id: 'lead-line-line-bingo', name: 'Bingo Musical', price: 240 },
      { id: 'lead-line-line-assistant', name: 'Asistent Bingo x2', price: 100 },
    ]);
    expect(leadServiceLinesForTransport(lines)).toHaveLength(2);
    expect(deriveLeadDurationHours(lines)).toBe(2);
  });

  it('deriva la durada del pressupost des de l’horari del bolo abans que de metadades de producte', () => {
    const lines = [
      { kind: 'PROVIDER_SERVICE', label: 'Asistent Bingo', revenueAmount: 50, hours: 90 },
      { kind: 'PROVIDER_SERVICE', label: 'El secret dels pirates', revenueAmount: 385, hours: 70 },
      { kind: 'DJ', label: 'DJ Orbita · primera hora', revenueAmount: 150, hours: 1 },
    ];

    expect(deriveEventScheduleDurationHours('20:30-23:30')).toBe(3);
    expect(deriveStudioDurationHours({ eventSchedule: '20:30-23:30', lines, fallback: 4 })).toBe(3);
    expect(deriveStudioDurationHours({ eventSchedule: '', lines, fallback: 4 })).toBe(1);
  });

  it('infereix animació quan el lead porta Bingo Musical encara que eventType sigui OTHER', () => {
    expect(inferStudioServiceFromLead({
      eventType: 'OTHER',
      serviceLines: [
        { kind: 'DJ', label: 'DJ · hora addicional', revenueAmount: 100 },
        { kind: 'PROVIDER_SERVICE', label: 'Bingo Musical (Masquerade Events)', revenueAmount: 240 },
      ],
    })).toBe('animacion');
  });

  it('mapeja eventTypes canònics a serveis del Studio', () => {
    expect(inferStudioServiceFromLead({ eventType: 'WEDDING' })).toBe('bodas');
    expect(inferStudioServiceFromLead({ eventType: 'CORPORATE' })).toBe('empresas');
    expect(inferStudioServiceFromLead({ eventType: 'BIRTHDAY' })).toBe('fiestas');
  });
});
