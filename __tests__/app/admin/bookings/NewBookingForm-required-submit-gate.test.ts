import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('/admin/bookings/new required submit gate', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/bookings/NewBookingForm.tsx'), 'utf8');

  it('bloqueja el CTA fins tenir client, contacte, data, ubicacio i bolo', () => {
    expect(source).toContain('const hasClientBasics = Boolean(form.clientName.trim() && form.clientEmail.trim() && form.clientPhone.trim());');
    expect(source).toContain('const hasEventBasics = Boolean(form.eventDate && form.eventLocation.trim());');
    expect(source).toContain('const submitBlockedByMissingBasics = !hasClientBasics || !hasEventBasics || !boloNotEmpty;');
    // La porta real inclou també el bloqueig mentre la comprovació de conflicte
    // de data està pendent (82f3d242); el test blinda la línia completa.
    expect(source).toContain('const submitDisabled = submitting || submitBlockedByMissingBasics || submitBlockedByDateConflictCheck || submitBlockedByDateConflict;');
    expect(source).toContain("'Completa client i contacte'");
    expect(source).toContain("'Completa data i lloc'");
    expect(source).toContain("'Afegeix servei o pack'");
  });
});
