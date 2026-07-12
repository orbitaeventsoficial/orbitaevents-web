import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('post-event booking anchors', () => {
  it('seguiment usa el botó compartit i obre la reserva al bloc post-event', () => {
    const page = source('app/admin/post-event/seguiment/page.tsx');

    expect(page).toContain("import PostEventEmailButton from '../../components/PostEventEmailButton'");
    expect(page).not.toContain("from '../../bookings/[id]/PostEventEmailButton'");
    expect(page).toContain("buildBookingHref(booking.id, 'sec-post-event')");
  });

  it('seguiment no recupera feedback com a títol visible', () => {
    const page = source('app/admin/post-event/seguiment/page.tsx');

    expect(page).toContain('Agraïment al Client');
    expect(page).toContain('Què incloure al seguiment?');
    expect(page).not.toContain('Feedback al Client');
    expect(page).not.toContain('Què incloure al feedback?');
  });

  it('la ruta legacy feedback només reexporta la ruta canònica de seguiment', () => {
    const legacyPage = source('app/admin/post-event/feedback/page.tsx');

    expect(legacyPage).toContain("from '../seguiment/page'");
    expect(legacyPage).not.toContain('buildPendingPostEventFollowUpBookingWhere');
  });

  it('reports obre detalls al bloc post-event de la reserva', () => {
    const page = source('app/admin/post-event/reports/page.tsx');

    expect(page).toContain("buildBookingHref(report.bookingId, 'sec-post-event')");
  });

  it('surveys obre detalls al bloc post-event de la reserva', () => {
    const page = source('app/admin/post-event/surveys/page.tsx');

    expect(page).toContain("buildBookingHref(survey.bookingId, 'sec-post-event')");
  });

  it('playbook manté el client connectat al bloc post-event de la reserva', () => {
    const page = source('app/admin/post-event/playbook/page.tsx');

    expect(page).toContain("buildBookingHref(item.bookingId, 'sec-post-event')");
  });
});
