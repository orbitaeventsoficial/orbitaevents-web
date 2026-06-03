import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import '../leads-design.css';
import LeadDetailClient from './LeadDetailClient';
import LeadActionsEnhanced from './LeadActionsEnhanced';
import LeadProfileEditor from './LeadProfileEditor';
import LeadWorkspace from './LeadWorkspace';
import LeadNotesPanel from './LeadNotesPanel';
import LeadGuidedFlow from './LeadGuidedFlow';
import { scoreLead } from '@/lib/services/commercialScoring';
import { computeLeadInsights } from '@/lib/services/leadInsightsService';
import ScoreSnapshotButton from './ScoreSnapshotButton';
import LeadInsightsBanner from './LeadInsightsBanner';
import LeadScoreBreakdown from './LeadScoreBreakdown';
import LeadTechnicalSnapshotPanel from './LeadTechnicalSnapshotPanel';
import LeadCustomerLinkPanel from './LeadCustomerLinkPanel';
import LeadMobileQuickActions from './LeadMobileQuickActions';
import { LeadDossiersPanel } from './LeadDossiersPanel';
import { buildLeadTechnicalSnapshot } from '@/lib/services/leadSnapshotService';
import { previewLeadCustomerLink } from '@/lib/services/leads/leadCustomerLinkService';
import { SITE_CONFIG } from '@/app/config/site-config';
import InfoTooltip from '@/app/admin/components/InfoTooltip';
import { ADMIN_HELP } from '@/app/admin/components/adminHelpGlossary';
import { ADMIN_LEAD_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { getWeatherForEvent } from '@/lib/services/weatherService';
import type { WxData } from '@/app/admin/components/WxBadge';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: { name: true },
  });

  return {
    title: lead ? `${lead.name} | Entrades` : 'Entrada no trobada',
  };
}

import { LEAD_SCORE_BAND_LABELS, formatDate, formatDateFull, formatDateSimple, formatDateTimeFull, formatDateTime, formatNumber, getEventLabel, getLeadPriorityDisplay, getLeadStatusDisplay } from '@/lib/constants';
import { getAppBaseUrl } from '@/lib/site';


const STAGE_KEY_MAP: Record<string, string> = {
  NEW: 'nou', CONTACTED: 'contactat', QUOTE_SENT: 'contactat',
  NEGOTIATING: 'contactat', WON: 'guanyat', LOST: 'perdut',
};

function getPriorityBadge(priority: string) {
  const tone = getLeadPriorityDisplay(priority);
  return { label: tone.label, color: tone.bg + ' ' + tone.text };
}

function parseBudgetValue(input?: string | null): number | null {
  if (!input) return null;
  const normalized = input.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export default async function LeadDetailPage({ params }: Props) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      customerId: true,
      name: true,
      email: true,
      phone: true,
      eventType: true,
      eventDate: true,
      eventLocation: true,
      guestCount: true,
      budget: true,
      message: true,
      interestedPackId: true,
      interestedExtras: true,
      source: true,
      landingPage: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      status: true,
      priority: true,
      nurturingStep: true,
      lastNurturingAt: true,
      assignedTo: true,
      preferredLocale: true,
      createdAt: true,
      updatedAt: true,
      contactedAt: true,
      convertedAt: true,
      eventPhone: true,
      eventAddress: true,
      eventStartTime: true,
      eventEndTime: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          preferredLocale: true,
          source: true,
          totalEvents: true,
          totalSpent: true,
          lastEventDate: true,
        },
      },
      proposals: {
        select: { id: true, reference: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      dossiers: {
        select: { id: true, nom: true, sentAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        where: { deletedAt: null },
      },
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      universalTasks: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      activities: { orderBy: { createdAt: 'desc' } },
      booking: {
        select: {
          id: true, reference: true, total: true, status: true,
          depositPaid: true, depositAmount: true,
          remainingPaid: true, remainingAmount: true,
          paymentMethod: true, invoiceRequired: true, cashAmount: true,
          reviewToken: true, reviewSubmittedAt: true,
          postEventEmailSent: true, postEventEmailSentAt: true,
          postEventReport: { select: { id: true } },
          clientSurvey: { select: { id: true, npsScore: true, overallRating: true } },
          clientFeedback: { select: { id: true, sentAt: true, discountCode: true } },
          extraHours: true,
          travelCost: true,
          subtotal: true,
          pack: { select: { djHours: true, extraHourPrice: true, price: true } },
          collaboratorBookings: {
            select: {
              commissionAmount: true,
              collaboratorPrice: true,
              collaborator: { select: { id: true, name: true } },
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  const statusConf = getLeadStatusDisplay(lead.status);
  const eventType = getEventLabel(lead.eventType);
  const priorityConf = getPriorityBadge(lead.priority);
  const baseUrl = getAppBaseUrl();
  const reviewUrl = lead.booking?.reviewToken
    ? `${baseUrl}/${lead.preferredLocale || 'es'}/valoracio?token=${lead.booking.reviewToken}&ref=${lead.booking.reference}`
    : null;
  const reviewFlowStatus = !lead.booking
    ? 'SENSE_RESERVA'
    : (lead.booking.reviewSubmittedAt || lead.booking.clientSurvey)
      ? 'RESPONDIDO'
      : lead.booking.postEventEmailSent
        ? 'ENVIADO'
        : 'FALTA_ENVIAR';
  const internalPostEventStatus = !lead.booking
    ? 'SENSE_RESERVA'
    : lead.booking.postEventReport && lead.booking.clientFeedback?.sentAt
      ? 'COMPLETO'
      : lead.booking.postEventReport || lead.booking.clientFeedback?.sentAt
        ? 'EN_PROGRESO'
        : 'PENDIENTE';
  const leadAgeDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );
  const budgetValue = parseBudgetValue(lead.budget);
  const estimatedRevenue = lead.booking?.total ?? budgetValue ?? null;
  const leadScore = scoreLead({
    status: lead.status,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    eventDate: lead.eventDate,
    budget: lead.budget,
    phone: lead.phone,
    eventLocation: lead.eventLocation,
    guestCount: lead.guestCount,
    interestedPackId: lead.interestedPackId,
    source: lead.source,
  });
  const customerLinkPreview = await previewLeadCustomerLink(lead.id);
  const relatedLeads = await prisma.lead.findMany({
    where: {
      id: { not: lead.id },
      OR: [
        ...(lead.customerId ? [{ customerId: lead.customerId }] : []),
        { email: lead.email },
      ],
    },
    select: {
      id: true,
      eventType: true,
      status: true,
      eventDate: true,
      createdAt: true,
      booking: {
        select: {
          id: true,
          reference: true,
          eventDate: true,
          status: true,
          total: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const technicalSnapshot = buildLeadTechnicalSnapshot({
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
      notes: lead.notes.length,
      tasks: lead.universalTasks.length,
      documents: lead.documents.length,
      activities: lead.activities.length,
    },
    booking: lead.booking,
  });
  const technicalSnapshotJson = JSON.stringify(technicalSnapshot, null, 2);
  const internalSnapshotEmail = process.env.CONTACT_TO || SITE_CONFIG.business.email;
  const stageKey = STAGE_KEY_MAP[lead.status] || 'nou';

  const serializedTasks = lead.universalTasks.map((task) => ({
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
  }));

  const serializedDocuments = lead.documents.map((doc) => ({
    ...doc,
    createdAt: doc.createdAt.toISOString(),
  }));

  const serializedActivities = lead.activities.map((activity) => ({
    ...activity,
    createdAt: activity.createdAt.toISOString(),
  }));
  const openTasksCount = lead.universalTasks.filter((task) => task.status !== 'DONE' && task.status !== 'CANCELLED').length;

  const leadInsights = computeLeadInsights({
    lead: {
      id: lead.id,
      status: lead.status,
      priority: lead.priority,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      contactedAt: lead.contactedAt,
      convertedAt: lead.convertedAt,
      eventDate: lead.eventDate,
      eventType: lead.eventType,
      budget: lead.budget,
      phone: lead.phone,
      eventLocation: lead.eventLocation,
      guestCount: lead.guestCount,
      interestedPackId: lead.interestedPackId,
      source: lead.source,
    },
    tasks: lead.universalTasks.map((t) => ({ status: t.status, dueDate: t.dueDate, title: t.title })),
    activities: lead.activities.map((a) => ({ createdAt: a.createdAt, type: a.type })),
    booking: lead.booking ? {
      status: lead.booking.status,
      total: lead.booking.total,
      depositPaid: lead.booking.depositPaid,
      remainingPaid: lead.booking.remainingPaid,
      depositAmount: lead.booking.depositAmount,
    } : null,
    relatedLeads: relatedLeads.map((r) => ({
      status: r.status,
      booking: r.booking ? { total: r.booking.total } : null,
    })),
  });

  // Meteo: només si l'event és dins del rang de 5 dies
  let leadWx: WxData | null = null;
  if (lead.eventDate && lead.eventLocation) {
    const diffMs = lead.eventDate.getTime() - Date.now();
    if (diffMs >= -86400000 && diffMs <= 5 * 86400000) {
      const weather = await getWeatherForEvent(lead.eventLocation, lead.eventDate).catch(() => null);
      if (weather) leadWx = { kind: weather.kind, tmax: weather.tempMax, tmin: weather.tempMin, forecast: true };
    }
  }

  return (
      <LeadDetailClient
        notes={lead.notes.map((n) => ({ id: n.id, content: n.content, createdBy: n.createdBy, createdAt: n.createdAt.toISOString() }))}
        proposals={lead.proposals.map((p) => ({ id: p.id, reference: p.reference, status: p.status, createdAt: p.createdAt.toISOString() }))}
        dossiers={lead.dossiers.map((d) => ({ id: d.id, nom: d.nom, estat: d.sentAt ? 'enviat' : 'esborrany', createdAt: d.createdAt.toISOString() }))}
        lead={{
        id: lead.id,
        name: lead.name,
        stage: stageKey as 'nou' | 'contactat' | 'guanyat' | 'perdut',
        type: eventType,
        dateISO: lead.eventDate ? lead.eventDate.toISOString() : null,
        time: lead.eventStartTime ?? null,
        endTime: lead.eventEndTime ?? null,
        location: lead.eventLocation,
        value: estimatedRevenue,
        pax: lead.guestCount,
        priority: lead.priority,
        phone: lead.phone,
        email: lead.email,
        channel: lead.source,
        owner: lead.assignedTo,
        last: null,
        product: null,
        lostReason: null,
        wx: leadWx,
        eventPhone: lead.eventPhone ?? null,
        eventAddress: lead.eventAddress ?? null,
        booking: lead.booking ? {
          id: lead.booking.id,
          reference: lead.booking.reference,
          depositPaid: lead.booking.depositPaid,
          remainingPaid: lead.booking.remainingPaid,
          depositAmount: Number(lead.booking.depositAmount),
          remainingAmount: Number(lead.booking.remainingAmount),
          total: Number(lead.booking.total),
          paymentMethod: lead.booking.paymentMethod,
          invoiceRequired: lead.booking.invoiceRequired,
          cashAmount: lead.booking.cashAmount ? Number(lead.booking.cashAmount) : null,
          totalHours: (() => {
            // Si té hora inici i fi, calcula hores reals
            const start = lead.eventStartTime;
            const end = lead.eventEndTime;
            if (start && end) {
              const [sh, sm] = start.split(':').map(Number);
              const [eh, em] = end.split(':').map(Number);
              let mins = (eh * 60 + em) - (sh * 60 + sm);
              if (mins < 0) mins += 24 * 60; // passa mitjanit
              return Math.round(mins / 60 * 10) / 10;
            }
            return (lead.booking.pack?.djHours ?? 0) + (lead.booking.extraHours ?? 0);
          })(),
          collaboratorCost: lead.booking.collaboratorBookings?.[0]
            ? {
                amount: Number(lead.booking.collaboratorBookings[0].commissionAmount),
                name: lead.booking.collaboratorBookings[0].collaborator.name,
              }
            : null,
          costFloor: (() => {
            // Pack base + transport + col·laborador = cost mínim estimat
            const packCost = lead.booking.pack?.price ? Number(lead.booking.pack.price) : 0;
            const travelCost = lead.booking.travelCost ? Number(lead.booking.travelCost) : 0;
            const collabCost = lead.booking.collaboratorBookings?.[0]
              ? Number(lead.booking.collaboratorBookings[0].commissionAmount)
              : 0;
            const floor = packCost + travelCost + collabCost;
            return floor > 0 ? floor : null;
          })(),
        } : null,
      }} />
  );
}





