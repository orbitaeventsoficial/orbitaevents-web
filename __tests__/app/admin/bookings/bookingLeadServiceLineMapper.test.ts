import { describe, expect, it } from 'vitest';
import { mapLeadServiceLinesToBookingFormLines } from '@/app/admin/bookings/bookingLeadServiceLineMapper';

describe('mapLeadServiceLinesToBookingFormLines', () => {
  it('converteix les línies visibles del lead al format del formulari de reserva', () => {
    expect(mapLeadServiceLinesToBookingFormLines([
      {
        collaboratorId: ' carlos-lucas-fernandez ',
        kind: 'PROVIDER_SERVICE',
        label: ' Bingo Musical ',
        revenueAmount: 240,
        costAmount: 160,
        quantity: 1,
        hours: 1.5,
        partyType: ' infantil ',
        notes: ' inclou tècnic ',
      },
      {
        kind: 'BOGUS',
        label: 'Caps mòbils',
        revenueAmount: null,
        costAmount: undefined,
        quantity: 2.8,
      },
      {
        kind: 'DJ',
        label: '   ',
        revenueAmount: 150,
      },
    ])).toEqual([
      {
        collaboratorId: 'carlos-lucas-fernandez',
        kind: 'PROVIDER_SERVICE',
        label: 'Bingo Musical',
        revenueAmount: 240,
        costAmount: 160,
        quantity: 1,
        hours: 1.5,
        partyType: 'infantil',
        notes: 'inclou tècnic',
      },
      {
        kind: 'OTHER',
        label: 'Caps mòbils',
        quantity: 2,
      },
    ]);
  });
});
