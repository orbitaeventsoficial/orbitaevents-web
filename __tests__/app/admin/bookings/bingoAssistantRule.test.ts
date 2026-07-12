import { describe, expect, it } from 'vitest';
import { BINGO_ASSISTANT_LINE_LABEL } from '@/lib/constants/orbita-services';
import { syncBingoAssistantForGuests } from '@/app/admin/bookings/bingoAssistantRule';
import type { BookingServiceLineFormInput } from '@/app/admin/bookings/booking-form.types';

const bingoLine: BookingServiceLineFormInput = {
  collaboratorId: 'masquerade',
  kind: 'PROVIDER_SERVICE',
  label: 'Bingo Musical (Masquerade)',
  revenueAmount: 240,
  costAmount: 200,
  quantity: 1,
  travelHeadcount: 1,
};

describe('syncBingoAssistantForGuests', () => {
  it('afegeix assistent operatiu al Bingo Musical adult amb 70 pax o més', () => {
    const next = syncBingoAssistantForGuests([bingoLine], '70');

    expect(next).toHaveLength(2);
    expect(next[1]).toEqual(expect.objectContaining({
      kind: 'OTHER',
      label: BINGO_ASSISTANT_LINE_LABEL,
      revenueAmount: 0,
      quantity: 1,
      travelHeadcount: 1,
    }));
  });

  it('no duplica l’assistent si ja existeix', () => {
    const once = syncBingoAssistantForGuests([bingoLine], 90);
    const twice = syncBingoAssistantForGuests(once, 90);

    expect(twice.filter((line) => line.label === BINGO_ASSISTANT_LINE_LABEL)).toHaveLength(1);
  });

  it('no aplica la regla a Bingo Musical KIDS ni sota el llindar', () => {
    const kidsLine = { ...bingoLine, label: 'Bingo Musical KIDS (Masquerade)' };

    expect(syncBingoAssistantForGuests([bingoLine], 69)).toEqual([bingoLine]);
    expect(syncBingoAssistantForGuests([kidsLine], 90)).toEqual([kidsLine]);
  });
});
