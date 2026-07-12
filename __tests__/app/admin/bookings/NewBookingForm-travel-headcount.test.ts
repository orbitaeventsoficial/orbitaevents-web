import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('/admin/bookings/new transport headcount', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/bookings/NewBookingForm.tsx'), 'utf8');

  it('usa el cervell canonic de persones de ruta i no una reimplementacio local', () => {
    expect(source).toContain('deriveTravelHeadcount');
    expect(source).toContain('return deriveTravelHeadcount(serviceLines, Boolean(selectedPackForTravel));');
    expect(source).not.toContain('travelHeadcountFromLine');
    expect(source).not.toContain("if (line.kind === 'SOUND_TECH') return sum");
  });
});
