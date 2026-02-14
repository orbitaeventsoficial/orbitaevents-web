export interface LeadSnapshotInput {
  lead: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    eventType: string;
    eventDate?: Date | string | null;
    eventSchedule?: string | null;
    eventLocation?: string | null;
    guestCount?: number | null;
    budget?: string | null;
    status: string;
    priority: string;
    source: string;
    assignedTo?: string | null;
    preferredLocale: string;
    customerId?: string | null;
    interestedPackId?: string | null;
    interestedExtras?: string[] | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    landingPage?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    contactedAt?: Date | string | null;
    convertedAt?: Date | string | null;
  };
  stats: {
    notes: number;
    tasks: number;
    documents: number;
    activities: number;
  };
  booking?: {
    postEventEmailSent?: boolean;
    postEventEmailSentAt?: Date | string | null;
    reviewToken?: string | null;
    reviewSubmittedAt?: Date | string | null;
    postEventReport?: unknown;
    clientSurvey?: unknown;
    clientFeedback?: unknown;
  } | null;
}

export function buildLeadTechnicalSnapshot(input: LeadSnapshotInput) {
  const booking = input.booking ?? null;
  return {
    lead: {
      id: input.lead.id,
      name: input.lead.name,
      email: input.lead.email,
      phone: input.lead.phone ?? null,
      eventType: input.lead.eventType,
      eventDate: input.lead.eventDate ?? null,
      eventSchedule: input.lead.eventSchedule ?? null,
      eventLocation: input.lead.eventLocation ?? null,
      guestCount: input.lead.guestCount ?? null,
      budget: input.lead.budget ?? null,
      status: input.lead.status,
      priority: input.lead.priority,
      source: input.lead.source,
      assignedTo: input.lead.assignedTo ?? null,
      preferredLocale: input.lead.preferredLocale,
      customerId: input.lead.customerId ?? null,
      interestedPackId: input.lead.interestedPackId ?? null,
      interestedExtras: input.lead.interestedExtras ?? [],
      utmSource: input.lead.utmSource ?? null,
      utmMedium: input.lead.utmMedium ?? null,
      utmCampaign: input.lead.utmCampaign ?? null,
      landingPage: input.lead.landingPage ?? null,
      createdAt: input.lead.createdAt,
      updatedAt: input.lead.updatedAt,
      contactedAt: input.lead.contactedAt ?? null,
      convertedAt: input.lead.convertedAt ?? null,
    },
    stats: {
      notes: input.stats.notes,
      tasks: input.stats.tasks,
      documents: input.stats.documents,
      activities: input.stats.activities,
      hasBooking: !!booking,
      postEvent: booking
        ? {
            postEventEmailSent: !!booking.postEventEmailSent,
            postEventEmailSentAt: booking.postEventEmailSentAt ?? null,
            reviewToken: booking.reviewToken ?? null,
            reviewSubmittedAt: booking.reviewSubmittedAt ?? null,
            hasPostEventReport: !!booking.postEventReport,
            hasClientSurvey: !!booking.clientSurvey,
            hasClientFeedback: !!booking.clientFeedback,
          }
        : null,
    },
  };
}
