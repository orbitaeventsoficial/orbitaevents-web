import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('BookingMarginCard transport source', () => {
  const source = readFileSync(
    join(process.cwd(), 'app/admin/bookings/[id]/BookingMarginCard.tsx'),
    'utf8',
  );

  it('usa travelCost persistent i el cervell computeBoloTransport', () => {
    expect(source).toContain('storedTravelCost');
    expect(source).toContain('computeBoloTransport');
    expect(source).toContain('tollsEur');
    expect(source).toContain('travelCost: transport.cost');
    expect(source).not.toContain('calculateClientTravelCharge');
  });
});
