import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('/admin/bookings/new date conflict gate', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/bookings/NewBookingForm.tsx'), 'utf8');
  const conflictHookSource = readFileSync(join(process.cwd(), 'app/admin/bookings/useBookingDateConflicts.ts'), 'utf8');

  it('bloqueja la creacio fins que es revisen els conflictes del mateix dia', () => {
    expect(source).toContain('const [dateConflictAcknowledged, setDateConflictAcknowledged] = useState(false);');
    expect(source).toContain('const submitBlockedByDateConflictCheck = hasDateConflictError;');
    expect(source).toContain('const submitBlockedByDateConflict = hasDateConflicts && !dateConflictAcknowledged;');
    expect(source).toContain('const submitDisabled = submitting || submitBlockedByMissingBasics || submitBlockedByDateConflictCheck || submitBlockedByDateConflict;');
    expect(source).toContain('checked={dateConflictAcknowledged}');
    expect(source).toContain('setDateConflictAcknowledged(e.target.checked)');
    expect(source).toContain('dateConflictError={dateConflictError}');
    expect(source).toContain("submitBlockedByDateConflict");
    expect(source).toContain("'Verifica disponibilitat'");
    expect(source).toContain("'Confirma conflicte de dia'");
    expect(source).toContain('No es pot crear sense verificar disponibilitat.');
    expect(source).toContain('He revisat les reserves d&apos;aquest dia');
    expect(source).not.toContain('window.confirm(');
  });

  it('no amaga errors quan no pot verificar conflictes del dia', () => {
    expect(conflictHookSource).toContain("const [dateConflictError, setDateConflictError] = useState('');");
    expect(conflictHookSource).toContain("throw new Error(data.error || data.message || 'No s\\'ha pogut verificar la disponibilitat del dia.');");
    expect(conflictHookSource).toContain("if (error instanceof DOMException && error.name === 'AbortError') return;");
    expect(conflictHookSource).toContain("console.error('[useBookingDateConflicts] Error carregant conflictes de data'");
    expect(conflictHookSource).toContain('return { dateConflicts, dateConflictError };');
    expect(conflictHookSource).not.toContain('catch {');
  });
});
