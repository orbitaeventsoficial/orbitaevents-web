import type { Prisma } from '@prisma/client';
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';
import { getPostEventWorkflowDates } from '@/lib/constants/postEventWorkflow';

function buildPostEventStartDueEventDateRange(now: Date) {
  const { catchupFrom, startDueBefore } = getPostEventWorkflowDates(now);
  return {
    gte: catchupFrom,
    lte: startDueBefore,
  };
}

export function buildPendingPostEventEmailBookingWhere(now: Date = new Date()): Prisma.BookingWhereInput {
  const { catchupFrom, emailDueBefore } = getPostEventWorkflowDates(now);
  return {
    status: 'COMPLETED',
    eventDate: {
      gte: catchupFrom,
      lte: emailDueBefore,
    },
    postEventEmailSent: false,
    clientEmail: {
      not: { contains: PLACEHOLDER_EMAIL_DOMAIN },
    },
  };
}

export function buildPendingPostEventFollowUpBookingWhere(now: Date = new Date()): Prisma.BookingWhereInput {
  return buildPendingPostEventEmailBookingWhere(now);
}

export function buildPendingPostEventReportBookingWhere(now: Date = new Date()): Prisma.BookingWhereInput {
  return {
    status: 'COMPLETED',
    eventDate: buildPostEventStartDueEventDateRange(now),
    postEventReport: null,
  };
}

export function buildPendingPostEventSurveyBookingWhere(now: Date = new Date()): Prisma.BookingWhereInput {
  return {
    status: 'COMPLETED',
    eventDate: buildPostEventStartDueEventDateRange(now),
    clientSurvey: null,
  };
}

export function buildNotStartedPostEventBookingWhere(now: Date = new Date()): Prisma.BookingWhereInput {
  const { catchupFrom, startDueBefore } = getPostEventWorkflowDates(now);
  return {
    status: 'COMPLETED',
    eventDate: {
      gte: catchupFrom,
      lte: startDueBefore,
    },
    postEventEmailSent: false,
    postEventReport: null,
    clientSurvey: null,
  };
}
