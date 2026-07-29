import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('booking detail post-event email state', () => {
  it('passes the persisted post-event sent flag to the email button', () => {
    const source = readFileSync(join(process.cwd(), 'app/admin/bookings/[id]/page.tsx'), 'utf8');

    expect(source).toContain(
      '<PostEventEmailButton bookingId={booking.id} initiallySent={booking.postEventEmailSent} />'
    );
  });

  it('keeps the post-event email action inside the post-event section', () => {
    const source = readFileSync(join(process.cwd(), 'app/admin/bookings/[id]/page.tsx'), 'utf8');
    const postEventSectionIndex = source.indexOf('<SecDivider id="sec-post-event">Post-event</SecDivider>');
    const emailButtonIndex = source.indexOf(
      '<PostEventEmailButton bookingId={booking.id} initiallySent={booking.postEventEmailSent} />'
    );

    expect(postEventSectionIndex).toBeGreaterThan(-1);
    expect(emailButtonIndex).toBeGreaterThan(postEventSectionIndex);
    expect(source.slice(0, postEventSectionIndex)).not.toContain(
      '<PostEventEmailButton bookingId={booking.id} initiallySent={booking.postEventEmailSent} />'
    );
  });

  it('explains that pending surveys depend on the canonical post-event email', () => {
    const source = readFileSync(join(process.cwd(), 'app/admin/bookings/[id]/page.tsx'), 'utf8');

    expect(source).toContain('const postEventSurveyStatus = booking.clientSurvey');
    expect(source).toContain("Email enviat; pendent de resposta");
    expect(source).toContain("S'enviarà amb l'email post-event");
    expect(source).toContain('{postEventSurveyStatus}');
  });

  it('uses the booking post-event email flag as the email status source', () => {
    const source = readFileSync(join(process.cwd(), 'app/admin/bookings/[id]/page.tsx'), 'utf8');

    expect(source).toContain('const postEventEmailStatus = booking.postEventEmailSent');
    expect(source).toContain('booking.postEventEmailSentAt');
    expect(source).toContain('Email post-event');
    expect(source).toContain('{postEventEmailStatus}');
    expect(source).not.toContain('Feedback Enviat');
  });

  it('renders the internal post-event status from the operational snapshot', () => {
    const source = readFileSync(join(process.cwd(), 'app/admin/bookings/[id]/page.tsx'), 'utf8');

    expect(source).toContain('const internalPostEventStatusLabel = internalPostEventStatus');
    expect(source).toContain('Tancament intern');
    expect(source).toContain('{internalPostEventStatusLabel}');
  });

  it('does not load ClientFeedback for booking detail post-event state', () => {
    const source = readFileSync(join(process.cwd(), 'app/admin/bookings/[id]/page.tsx'), 'utf8');

    expect(source).not.toContain('clientFeedback: true');
  });
});
