import { prisma } from '@/lib/prisma';
import { sendTrackedStandaloneEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';
import { escapeHtml } from '@/lib/utils/sanitize';
import { formatDateTimeFull } from '@/lib/constants';
import { getRecipientsAsString } from '@/lib/services/notificationRecipientsService';
import {
  recordLeadTechnicalSnapshotSaved,
  recordLeadTechnicalSnapshotSent,
} from '@/lib/services/leadActivityService';

interface LeadSnapshotInput {
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
          }
        : null,
    },
  };
}

export function serializeLeadTechnicalSnapshot(input: LeadSnapshotInput): string {
  return JSON.stringify(buildLeadTechnicalSnapshot(input), null, 2);
}

export function renderLeadTechnicalSnapshotEmail(input: {
  leadName: string;
  leadEmail: string;
  snapshotJson: string;
  escapeHtml: (value: string) => string;
}) {
  return `
        <div style="font-family:Segoe UI,Arial,sans-serif;">
          <h2 style="margin:0 0 10px 0;">Snapshot técnico de lead</h2>
          <p style="margin:0 0 16px 0;">Lead: <strong>${input.escapeHtml(input.leadName)}</strong> (${input.escapeHtml(input.leadEmail)})</p>
          <pre style="white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:12px;border-radius:8px;overflow:auto;">${input.escapeHtml(input.snapshotJson)}</pre>
        </div>
      `;
}

export async function processLeadTechnicalSnapshot(input: {
  leadId: string;
  action: 'save_document' | 'send_email';
  recipient?: string;
}) {
  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    include: {
      _count: { select: { notes: true, universalTasks: true, documents: true, activities: true } },
      booking: {
        select: {
          postEventEmailSent: true,
          postEventEmailSentAt: true,
          reviewToken: true,
          reviewSubmittedAt: true,
          postEventReport: { select: { id: true } },
          clientSurvey: { select: { id: true } },
        },
      },
    },
  });

  if (!lead) {
    return { status: 404, body: { ok: false, error: 'Lead no trobat' } };
  }

  const snapshotJson = serializeLeadTechnicalSnapshot({
    lead: {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      eventType: lead.eventType,
      eventDate: lead.eventDate,
      eventLocation: lead.eventLocation,
      guestCount: lead.guestCount,
      budget: lead.budget,
      status: lead.status,
      priority: lead.priority,
      source: lead.source,
      assignedTo: lead.assignedTo,
      preferredLocale: lead.preferredLocale,
      customerId: lead.customerId,
      interestedPackId: lead.interestedPackId,
      interestedExtras: lead.interestedExtras,
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      landingPage: lead.landingPage,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      contactedAt: lead.contactedAt,
      convertedAt: lead.convertedAt,
    },
    stats: {
      notes: lead._count.notes,
      tasks: lead._count.universalTasks,
      documents: lead._count.documents,
      activities: lead._count.activities,
    },
    booking: lead.booking,
  });

  if (input.action === 'save_document') {
    const title = `Snapshot tècnic ${formatDateTimeFull(new Date())}`;
    const fileUrl = `data:application/json;charset=utf-8,${encodeURIComponent(snapshotJson)}`;
    const doc = await prisma.leadDocument.create({
      data: {
        leadId: lead.id,
        type: 'OTHER',
        source: 'AUTO',
        title,
        fileUrl,
        mimeType: 'application/json',
        size: Buffer.byteLength(snapshotJson, 'utf8'),
        createdBy: 'Sistema',
      },
    });

    await recordLeadTechnicalSnapshotSaved({
      leadId: lead.id,
      title,
      documentId: doc.id,
    });

    return { status: 200, body: { ok: true, documentId: doc.id } };
  }

  const recipient = input.recipient || (await getRecipientsAsString('leads')) || SITE_CONFIG.business.email;
  const subject = `Instantània tècnica lead ${lead.name} (${lead.id})`;

  await sendTrackedStandaloneEmail({
    templateKey: 'lead-technical-snapshot',
    to: recipient,
    subject,
    html: renderLeadTechnicalSnapshotEmail({
      leadName: lead.name,
      leadEmail: lead.email,
      snapshotJson,
      escapeHtml,
    }),
    leadId: lead.id,
    customerId: lead.customerId ?? null,
    orbita: { kind: 'lead', id: lead.id, origin: 'lead-technical-snapshot' },
  });

  await recordLeadTechnicalSnapshotSent({
    leadId: lead.id,
    recipient,
  });

  await prisma.leadNote.create({
    data: {
      leadId: lead.id,
      content: `📩 Instantània tècnica enviada a ${recipient}`,
    },
  });

  return { status: 200, body: { ok: true, recipient } };
}
