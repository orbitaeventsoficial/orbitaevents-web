import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';
import {
  buildPendingPostEventFeedbackBookingWhere,
  buildNotStartedPostEventBookingWhere,
  buildPendingPostEventEmailBookingWhere,
  buildPendingPostEventReportBookingWhere,
  buildPendingPostEventSurveyBookingWhere,
} from '@/lib/services/postEventPendingService';

describe('postEventPendingService', () => {
  const now = new Date('2026-07-11T10:00:00.000Z');

  it('construeix la finestra canònica de catch-up per email post-event pendent', () => {
    expect(buildPendingPostEventEmailBookingWhere(now)).toEqual({
      status: 'COMPLETED',
      eventDate: {
        gte: new Date('2026-04-12T10:00:00.000Z'),
        lte: new Date('2026-07-09T10:00:00.000Z'),
      },
      postEventEmailSent: false,
      clientEmail: {
        not: { contains: PLACEHOLDER_EMAIL_DOMAIN },
      },
    });
  });

  it('construeix la finestra canònica de booking completat sense post-event arrencat', () => {
    expect(buildNotStartedPostEventBookingWhere(now)).toEqual({
      status: 'COMPLETED',
      eventDate: {
        gte: new Date('2026-04-12T10:00:00.000Z'),
        lte: new Date('2026-07-08T10:00:00.000Z'),
      },
      postEventEmailSent: false,
      postEventReport: null,
      clientSurvey: null,
    });
  });

  it('construeix la cua canònica de feedback pendent amb la mateixa regla que email post-event', () => {
    expect(buildPendingPostEventFeedbackBookingWhere(now)).toEqual(buildPendingPostEventEmailBookingWhere(now));
  });

  it('construeix la cua canònica d informes interns pendents', () => {
    expect(buildPendingPostEventReportBookingWhere(now)).toEqual({
      status: 'COMPLETED',
      eventDate: {
        gte: new Date('2026-04-12T10:00:00.000Z'),
        lte: new Date('2026-07-08T10:00:00.000Z'),
      },
      postEventReport: null,
    });
  });

  it('construeix la cua canònica d enquestes pendents', () => {
    expect(buildPendingPostEventSurveyBookingWhere(now)).toEqual({
      status: 'COMPLETED',
      eventDate: {
        gte: new Date('2026-04-12T10:00:00.000Z'),
        lte: new Date('2026-07-08T10:00:00.000Z'),
      },
      clientSurvey: null,
    });
  });
});
