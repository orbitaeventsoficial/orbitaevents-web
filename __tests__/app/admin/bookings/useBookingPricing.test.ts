import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useBookingPricing } from '@/app/admin/bookings/useBookingPricing';
import type { BookingFormData, BookingPack } from '@/app/admin/bookings/booking-form.types';
import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';

const BASE_FORM: Pick<BookingFormData, 'packId' | 'extraHours' | 'eventStartTime' | 'eventEndTime' | 'distanceKm' | 'tollsEur' | 'fuelCostPerKm' | 'discount'> = {
  packId: 'pack-basic',
  extraHours: '0',
  eventStartTime: '22:00',
  eventEndTime: '00:00',
  distanceKm: '0',
  tollsEur: '0',
  fuelCostPerKm: '0.19',
  discount: '0',
};

const PACKS: BookingPack[] = [
  {
    id: 'pack-basic',
    slug: 'basic',
    service: 'discomovil',
    price: 500,
    originalPrice: null,
    extraHourPrice: 50,
    djHours: 2,
    soundWatts: 2000,
    includesFog: false,
    includesMic: false,
    translations: [{ name: 'Basic', description: 'Pack basic' }],
  },
];

describe('useBookingPricing', () => {
  it('clampa la base despres de descompte a zero', () => {
    const { result } = renderHook(() =>
      useBookingPricing({
        form: { ...BASE_FORM, discount: '900' },
        packs: PACKS,
        extras: [],
        selectedExtras: {},
        invoiceRequired: true,
      }),
    );

    expect(result.current.pricing).toMatchObject({
      subtotal: 500,
      discount: 900,
      vatAmount: 0,
      total: 0,
      deposit: 0,
    });
  });

  it('usa el cost intern de ruta complet quan el formulari el calcula fora de serviceLines', () => {
    const { result } = renderHook(() =>
      useBookingPricing({
        form: { ...BASE_FORM, distanceKm: '422', fuelCostPerKm: '0.25' },
        packs: PACKS,
        extras: [],
        selectedExtras: {},
        internalTravelCostOverride: 303.5,
      }),
    );

    expect(result.current.internalTravelCost).toBe(303.5);
    expect(result.current.marginEstimate?.directCost).toBeCloseTo(
      303.5 + 500 * PROFITABILITY_MODEL_DEFAULTS.packCostRatio + PROFITABILITY_MODEL_DEFAULTS.fixedOperationalCost,
      2,
    );
  });

  it('suma els peatges al càrrec visible de transport', () => {
    const { result } = renderHook(() =>
      useBookingPricing({
        form: { ...BASE_FORM, distanceKm: '60', tollsEur: '12.5' },
        packs: PACKS,
        extras: [],
        selectedExtras: {},
      }),
    );

    expect(result.current.travelCharge).toBe(14.4);
  });
});
