import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import '../leads-design.css';
import LeadDetailClient from './LeadDetailClient';
import { getWeatherForEvent } from '@/lib/services/weatherService';
import { getEffectiveVehicleCostPerKm } from '@/lib/services/fuelReferenceService';
import { DEFAULT_VEHICLE_COST_PER_KM } from '@/lib/services/travelCost';
import { TRAVEL_COST_LINE_MARKER } from '@/lib/services/travelLaborCost';
import { computeBookingFinancialSummary } from '@/lib/services/costEngine';
import { getProfitabilityConfig } from '@/lib/services/profitabilityService';
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

import { getEventLabel, parseBudgetAmount } from '@/lib/constants';


const STAGE_KEY_MAP: Record<string, string> = {
  NEW: 'nou', CONTACTED: 'contactat', QUOTE_SENT: 'contactat',
  NEGOTIATING: 'contactat', WON: 'guanyat', LOST: 'perdut',
};

function isTravelCostLine(line: { notes?: string | null }): boolean {
  return Boolean(line.notes?.includes(TRAVEL_COST_LINE_MARKER));
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
      source: true,
      status: true,
      priority: true,
      assignedTo: true,
      eventPhone: true,
      eventAddress: true,
      distanceKm: true,
      eventStartTime: true,
      eventEndTime: true,
      sourceCollaboratorId: true,
      proposals: {
        select: {
          id: true,
          reference: true,
          status: true,
          total: true,
          sentAt: true,
          acceptedAt: true,
          createdAt: true,
          pdfUrl: true,
          contractReference: true,
          contractStatus: true,
          contractPdfUrl: true,
          contractSignedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      dossiers: {
        select: { id: true, nom: true, mode: true, sentAt: true, sentTo: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        where: { deletedAt: null },
      },
      documents: { orderBy: { createdAt: 'desc' } },
      booking: {
        select: {
          id: true, reference: true, total: true,
          depositPaid: true, depositAmount: true,
          remainingPaid: true, remainingAmount: true,
          paymentMethod: true, invoiceRequired: true, cashAmount: true,
          extraHours: true,
          travelCost: true,
          pack: {
            select: {
              code: true,
              service: true,
              price: true,
              djHours: true,
              extraHourPrice: true,
              translations: { select: { locale: true, name: true } },
            },
          },
          extras: {
            select: {
              quantity: true,
              price: true,
              extra: {
                select: {
                  slug: true,
                  translations: { select: { locale: true, name: true } },
                },
              },
            },
          },
          serviceLines: {
            orderBy: { sortOrder: 'asc' },
            select: {
              kind: true,
              label: true,
              revenueAmount: true,
              costAmount: true,
              quantity: true,
              notes: true,
              collaboratorId: true,
              collaborator: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  const eventType = getEventLabel(lead.eventType);
  const budgetValue = parseBudgetAmount(lead.budget);
  const estimatedRevenue = lead.booking?.total ?? budgetValue ?? null;
  const stageKey = STAGE_KEY_MAP[lead.status] || 'nou';

  const serializedDocuments = lead.documents.map((doc) => ({
    ...doc,
    createdAt: doc.createdAt.toISOString(),
  }));

  // Meteo: només si l'event és dins del rang de 5 dies
  let leadWx: WxData | null = null;
  if (lead.eventDate && lead.eventLocation) {
    const diffMs = lead.eventDate.getTime() - Date.now();
    if (diffMs >= -86400000 && diffMs <= 5 * 86400000) {
      const weather = await getWeatherForEvent(lead.eventLocation, lead.eventDate).catch(() => null);
      if (weather) leadWx = { kind: weather.kind, tmax: weather.tempMax, tmin: weather.tempMin, forecast: true };
    }
  }

  // Cost/km real del vehicle (benzina MITECO + consum + manteniment) per al
  // càlcul de «Km assumibles» del bolo. Fallback al valor pla si el servei falla.
  const vehicleCostPerKm = await getEffectiveVehicleCostPerKm()
    .then((v) => (v.costPerKm > 0 ? v.costPerKm : DEFAULT_VEHICLE_COST_PER_KM))
    .catch(() => DEFAULT_VEHICLE_COST_PER_KM);

  // Economia REAL del lead quan ja té reserva: la veritat econòmica viu a la
  // reserva (`Booking`), no al bolo provisional. Es calcula amb la MATEIXA font
  // canònica que la fitxa de reserva (`computeBookingFinancialSummary`), per no
  // mostrar un marge inflat (la base contractada té cost real, no només ingrés).
  let bookingEconomia: {
    net: number; marginPct: number; total: number; directCost: number;
    acquisitionCost: number; serviceLinesCost: number; fixedOperationalCost: number;
    tone: 'emerald' | 'amber' | 'orange' | 'rose'; label: string;
  } | null = null;
  if (lead.booking) {
    const b = lead.booking;
    const profitabilityConfig = await getProfitabilityConfig().catch(() => null);
    if (profitabilityConfig) {
      const extrasTotal = (b.extras ?? []).reduce(
        (s, e) => s + Number(e.price || 0) * (e.quantity || 1), 0);
      const visibleServiceLines = (b.serviceLines ?? []).filter((line) => !isTravelCostLine(line));
      const slRevenue = visibleServiceLines.reduce(
        (s, l) => s + Number(l.revenueAmount || 0) * (l.quantity || 1), 0);
      const slCost = visibleServiceLines.reduce(
        (s, l) => s + Number(l.costAmount || 0) * (l.quantity || 1), 0);
      const summary = computeBookingFinancialSummary({
        total: Number(b.total),
        packPrice: b.pack?.price ? Number(b.pack.price) : 0,
        extrasTotal,
        extraHours: b.extraHours ?? 0,
        extraHourPrice: b.pack?.extraHourPrice ? Number(b.pack.extraHourPrice) : 0,
        distanceKm: 0,
        travelCost: b.travelCost ? Number(b.travelCost) : 0,
        serviceLinesRevenue: slRevenue,
        serviceLinesCost: slCost,
        source: lead.source,
      }, profitabilityConfig);
      bookingEconomia = {
        net: summary.netMargin,
        marginPct: summary.marginPct,
        total: summary.total,
        directCost: summary.directCost,
        acquisitionCost: summary.acquisitionCost,
        serviceLinesCost: summary.serviceLinesCost,
        fixedOperationalCost: summary.fixedOperationalCost,
        tone: summary.marginTone.tone,
        label: summary.marginTone.label,
      };
    }
  }

  return (
      <LeadDetailClient
        vehicleCostPerKm={vehicleCostPerKm}
        initialDistanceKm={lead.distanceKm ?? null}
        bookingEconomia={bookingEconomia}
        proposals={lead.proposals.map((p) => ({
          id: p.id,
          reference: p.reference,
          status: p.status,
          total: Number(p.total),
          sentAt: p.sentAt ? p.sentAt.toISOString() : null,
          acceptedAt: p.acceptedAt ? p.acceptedAt.toISOString() : null,
          createdAt: p.createdAt.toISOString(),
          pdfUrl: p.pdfUrl,
          contractReference: p.contractReference,
          contractStatus: p.contractStatus,
          contractPdfUrl: p.contractPdfUrl,
          contractSignedAt: p.contractSignedAt ? p.contractSignedAt.toISOString() : null,
        }))}
        dossiers={lead.dossiers.map((d) => ({
          id: d.id,
          nom: d.nom,
          estat: d.sentAt ? 'enviat' : 'esborrany',
          mode: d.mode,
          sentAt: d.sentAt ? d.sentAt.toISOString() : null,
          sentTo: d.sentTo,
          createdAt: d.createdAt.toISOString(),
        }))}
        documents={serializedDocuments.map((doc) => ({
          id: doc.id,
          type: doc.type,
          title: doc.title,
          fileUrl: doc.fileUrl,
          createdAt: doc.createdAt,
        }))}
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
        sourceCollaboratorId: lead.sourceCollaboratorId ?? null,
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
          contractedProducts: (() => {
            const pickName = (translations?: Array<{ locale: string; name: string }>) =>
              translations?.find((t) => t.locale === 'ca')?.name ||
              translations?.find((t) => t.locale === 'es')?.name ||
              translations?.find((t) => t.locale === 'en')?.name ||
              null;
            const products: Array<{ id: string; kind: string; label: string; quantity: number; amount: number | null; meta?: string | null }> = [];
            if (lead.booking.pack) {
              products.push({
                id: 'pack',
                kind: 'PACK',
                label: pickName(lead.booking.pack.translations) || lead.booking.pack.code || 'Pack contractat',
                quantity: 1,
                amount: Number(lead.booking.pack.price),
                meta: lead.booking.pack.service,
              });
            }
            for (const extraRow of lead.booking.extras || []) {
              products.push({
                id: `extra-${extraRow.extra.slug}`,
                kind: 'EXTRA',
                label: pickName(extraRow.extra.translations) || extraRow.extra.slug,
                quantity: extraRow.quantity || 1,
                amount: Number(extraRow.price || 0),
                meta: 'extra',
              });
            }
            for (const line of (lead.booking.serviceLines || []).filter((item) => !isTravelCostLine(item))) {
              products.push({
                id: `line-${products.length}`,
                kind: line.kind,
                label: line.label,
                quantity: line.quantity || 1,
                amount: line.revenueAmount !== null && line.revenueAmount !== undefined ? Number(line.revenueAmount) : null,
                meta: line.collaborator?.name || line.kind,
              });
            }
            if (lead.booking.extraHours && lead.booking.extraHours > 0 && lead.booking.pack?.extraHourPrice) {
              products.push({
                id: 'extra-hours',
                kind: 'EXTRA_HOURS',
                label: 'Hores extra',
                quantity: lead.booking.extraHours,
                amount: Number(lead.booking.pack.extraHourPrice),
                meta: 'temps ampliat',
              });
            }
            return products;
          })(),
          collaboratorCost: (() => {
            // Cost de col·laborador = línies de servei subcontractades (amb collaboratorId).
            const collabLines = (lead.booking.serviceLines || []).filter((l) => l.collaboratorId && !isTravelCostLine(l));
            if (collabLines.length === 0) return null;
            const amount = collabLines.reduce((sum, l) => sum + Number(l.costAmount || 0) * (l.quantity || 1), 0);
            return amount > 0 ? { amount, name: collabLines[0].collaborator?.name || 'Col·laborador' } : null;
          })(),
          costFloor: (() => {
            // Pack base + transport + cost de col·laborador (línies) = cost mínim estimat
            const packCost = lead.booking.pack?.price ? Number(lead.booking.pack.price) : 0;
            const travelCost = lead.booking.travelCost ? Number(lead.booking.travelCost) : 0;
            const collabCost = (lead.booking.serviceLines || [])
              .filter((l) => l.collaboratorId && !isTravelCostLine(l))
              .reduce((sum, l) => sum + Number(l.costAmount || 0) * (l.quantity || 1), 0);
            const floor = packCost + travelCost + collabCost;
            return floor > 0 ? floor : null;
          })(),
        } : null,
      }} />
  );
}
