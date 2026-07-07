import { SUPPORTED_LOCALES } from '@/lib/constants';
import { ECONOMIC_RISK_BOOKING_STATUSES } from '@/lib/constants/adminCalendar';
import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
import { computeDashboardNextEventEconomics } from '@/lib/admin/bookingEconomics';
import { prisma } from '@/lib/prisma';
import { loadPendingFollowUps } from '@/lib/services/responseTrackingService';

const DAY_MS = 1000 * 60 * 60 * 24;

type CalendarDay = {
  leads: {
    id: string;
    customerId: string | null;
    name: string;
    eventDate: string;
    eventType: string | null;
    status: string | null;
    eventStartTime: string | null;
    eventEndTime: string | null;
    eventLocation: string | null;
  }[];
  reservas: {
    id: string;
    leadId: string | null;
    customerId: string | null;
    fechaEvento: string;
    clientName: string | null;
    ubicacion: string | null;
    estado: string | null;
    eventType: string | null;
    total: number | null;
    eventStartTime: string | null;
    eventEndTime: string | null;
    packName: string | null;
    economicRisk: {
      level: 'critical' | 'warning';
      label: string;
      reasons: string[];
      marginPct: number;
      outstandingAmount: number;
      netMargin: number;
      daysUntil: number;
    } | null;
  }[];
  bloqueos: {
    id: string;
    fecha: string;
    motivo: string | null;
    notas: string | null;
  }[];
  tasks: {
    id: string;
    title: string;
    dueDate: string;
    status: string;
    priority: string;
    leadId: string | null;
    customerId: string | null;
    bookingId: string | null;
  }[];
  socialPosts: {
    id: string;
    title: string;
    scheduledAt: string;
    status: string;
    platforms: string[];
    contentType: string;
  }[];
  followUps: {
    leadId: string;
    customerId: string | null;
    name: string;
    urgency: 'URGENT' | 'NORMAL' | 'LOW';
    suggestedAction: string;
    dueDate: string;
  }[];
};

type CalendarBookingEconomicInput = {
  eventDate: Date;
  status: string | null;
  total: number | null;
  depositAmount?: number | null;
  remainingAmount?: number | null;
  depositPaid?: boolean | null;
  remainingPaid?: boolean | null;
  cashAmount?: number | null;
  extraHours?: number | null;
  travelCost?: number | null;
  distanceKm?: number | null;
  pack?: { price?: number | null; extraHourPrice?: number | null } | null;
  extras?: Array<{ price?: number | null; quantity?: number | null }> | null;
  serviceLines?: Array<{
    revenueAmount?: number | null;
    costAmount?: number | null;
    quantity?: number | null;
    collaboratorId?: string | null;
    kind?: string | null;
    label?: string | null;
  }> | null;
};

function formatEconomicAmount(value: number): string {
  return `${Math.round(value)} EUR`;
}

function buildCalendarBookingEconomicRisk(booking: CalendarBookingEconomicInput, now: Date) {
  if (!ECONOMIC_RISK_BOOKING_STATUSES.has(String(booking.status ?? ''))) return null;

  const economics = computeDashboardNextEventEconomics({
    total: Number(booking.total ?? 0),
    depositAmount: booking.depositAmount ?? 0,
    remainingAmount: booking.remainingAmount ?? null,
    depositPaid: Boolean(booking.depositPaid),
    remainingPaid: Boolean(booking.remainingPaid),
    cashAmount: booking.cashAmount ?? 0,
    extraHours: booking.extraHours ?? 0,
    travelCost: booking.travelCost ?? 0,
    distanceKm: booking.distanceKm ?? 0,
    pack: booking.pack
      ? {
          price: Number(booking.pack.price ?? 0),
          extraHourPrice: booking.pack.extraHourPrice ?? null,
        }
      : null,
    extras: (booking.extras ?? []).map((extra) => ({
      price: Number(extra.price ?? 0),
      quantity: Number(extra.quantity ?? 0),
    })),
    serviceLines: booking.serviceLines ?? [],
  }, PROFITABILITY_MODEL_DEFAULTS);

  const daysUntil = Math.max(0, Math.ceil((booking.eventDate.getTime() - now.getTime()) / DAY_MS));
  const marginCritical = economics.marginPct < 25;
  const cashImminent = economics.outstandingAmount > 0 && daysUntil <= 7;
  if (!marginCritical && !cashImminent) return null;

  const reasons = [
    marginCritical ? `Marge ${economics.marginPct}%` : null,
    cashImminent ? `Pendent ${formatEconomicAmount(economics.outstandingAmount)}` : null,
  ].filter((reason): reason is string => Boolean(reason));

  return {
    level: marginCritical || (cashImminent && daysUntil <= 1) ? 'critical' as const : 'warning' as const,
    label: reasons.join(' · '),
    reasons,
    marginPct: economics.marginPct,
    outstandingAmount: economics.outstandingAmount,
    netMargin: economics.netMargin,
    daysUntil,
  };
}

export async function getAdminCalendarMonth(from?: string | null, to?: string | null) {
  if (!from || !to) {
    return { status: 400, body: { error: 'Paràmetres from i to requerits' } };
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const now = new Date();

  const [leads, bookings, availabilities, tasks, socialPosts, followUps] = await Promise.all([
    prisma.lead.findMany({
      where: {
        eventDate: {
          gte: fromDate,
          lte: toDate,
        },
        booking: null,
      },
      select: {
        id: true,
        customerId: true,
        name: true,
        eventDate: true,
        eventType: true,
        status: true,
        eventStartTime: true,
        eventEndTime: true,
        eventLocation: true,
      },
      orderBy: {
        eventDate: 'asc',
      },
    }),
    prisma.booking.findMany({
      where: {
        eventDate: {
          gte: fromDate,
          lte: toDate,
        },
        status: {
          notIn: ['CANCELLED'],
        },
      },
      select: {
        id: true,
        leadId: true,
        customerId: true,
        eventDate: true,
        clientName: true,
        eventLocation: true,
        eventVenue: true,
        status: true,
        eventType: true,
        total: true,
        depositAmount: true,
        remainingAmount: true,
        depositPaid: true,
        remainingPaid: true,
        cashAmount: true,
        extraHours: true,
        travelCost: true,
        distanceKm: true,
        eventStartTime: true,
        eventEndTime: true,
        extras: { select: { price: true, quantity: true } },
        serviceLines: { select: { revenueAmount: true, costAmount: true, quantity: true, collaboratorId: true, kind: true, label: true } },
        pack: {
          select: {
            slug: true,
            price: true,
            extraHourPrice: true,
            translations: {
              where: { locale: { in: [...SUPPORTED_LOCALES] } },
              select: { locale: true, name: true },
            },
          },
        },
      },
      orderBy: {
        eventDate: 'asc',
      },
    }),
    prisma.availability.findMany({
      where: {
        date: {
          gte: fromDate,
          lte: toDate,
        },
        status: 'BLOCKED',
      },
      select: {
        id: true,
        date: true,
        note: true,
      },
    }),
    prisma.task.findMany({
      where: {
        dueDate: {
          gte: fromDate,
          lte: toDate,
        },
        status: {
          in: ['OPEN', 'IN_PROGRESS'],
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        priority: true,
        leadId: true,
        customerId: true,
        bookingId: true,
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    }),
    prisma.socialPost.findMany({
      where: {
        scheduledAt: {
          gte: fromDate,
          lte: toDate,
        },
        status: {
          in: ['DRAFT', 'SCHEDULED'],
        },
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        status: true,
        platforms: true,
        contentType: true,
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
    }),
    loadPendingFollowUps(new Date(), 200),
  ]);

  const days: Record<string, CalendarDay> = {};
  const currentDate = new Date(fromDate);
  while (currentDate <= toDate) {
    const key = currentDate.toISOString().slice(0, 10);
    days[key] = { leads: [], reservas: [], bloqueos: [], tasks: [], socialPosts: [], followUps: [] };
    currentDate.setDate(currentDate.getDate() + 1);
  }

  for (const lead of leads) {
    if (!lead.eventDate) continue;
    const key = lead.eventDate.toISOString().slice(0, 10);
    if (!days[key]) continue;

    days[key].leads.push({
      id: lead.id,
      customerId: lead.customerId ?? null,
      name: lead.name,
      eventDate: lead.eventDate.toISOString(),
      eventType: lead.eventType,
      status: lead.status,
      eventStartTime: lead.eventStartTime,
      eventEndTime: lead.eventEndTime,
      eventLocation: lead.eventLocation,
    });
  }

  for (const booking of bookings) {
    const key = booking.eventDate.toISOString().slice(0, 10);
    if (!days[key]) continue;

    days[key].reservas.push({
      id: booking.id,
      leadId: booking.leadId ?? null,
      customerId: booking.customerId ?? null,
      fechaEvento: booking.eventDate.toISOString(),
      clientName: booking.clientName,
      ubicacion: booking.eventVenue || booking.eventLocation,
      estado: booking.status,
      eventType: booking.eventType,
      total: booking.total,
      eventStartTime: booking.eventStartTime,
      eventEndTime: booking.eventEndTime,
      packName:
        booking.pack?.translations.find((translation) => translation.locale === 'ca')?.name ||
        booking.pack?.translations.find((translation) => translation.locale === 'es')?.name ||
        booking.pack?.translations.find((translation) => translation.locale === 'en')?.name ||
        booking.pack?.slug ||
        null,
      economicRisk: buildCalendarBookingEconomicRisk(booking, now),
    });
  }

  for (const availability of availabilities) {
    const key = availability.date.toISOString().slice(0, 10);
    if (!days[key]) continue;

    days[key].bloqueos.push({
      id: availability.id,
      fecha: availability.date.toISOString(),
      motivo: 'Dia bloquejat',
      notas: availability.note,
    });
  }


  for (const task of tasks) {
    if (!task.dueDate) continue;
    const key = task.dueDate.toISOString().slice(0, 10);
    if (!days[key]) continue;

    days[key].tasks.push({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate.toISOString(),
      status: task.status,
      priority: task.priority,
      leadId: task.leadId ?? null,
      customerId: task.customerId ?? null,
      bookingId: task.bookingId ?? null,
    });
  }

  for (const post of socialPosts) {
    if (!post.scheduledAt) continue;
    const key = post.scheduledAt.toISOString().slice(0, 10);
    if (!days[key]) continue;

    days[key].socialPosts.push({
      id: post.id,
      title: post.title,
      scheduledAt: post.scheduledAt.toISOString(),
      status: post.status,
      platforms: post.platforms,
      contentType: post.contentType,
    });
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  if (days[todayKey]) {
    for (const item of followUps.items) {
      days[todayKey].followUps.push({
        leadId: item.leadId,
        customerId: item.customerId,
        name: item.name,
        urgency: item.urgency,
        suggestedAction: item.suggestedAction,
        dueDate: todayKey,
      });
    }
  }
  return { status: 200, body: { days } };
}
