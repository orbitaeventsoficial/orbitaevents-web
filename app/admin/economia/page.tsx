import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { buildProfitabilityReport, normalizeProfitabilityConfig } from '@/lib/services/profitabilityService';
import { deriveFlowStatusFromTimeline } from '@/lib/services/communicationStatusService';
import { calculateCostPerHour } from '@/lib/inventory-utils';
import { computePackPricingHealth, getPackPricingModelConfigEditable } from '@/lib/services/packPricingHealth';
import { buildCashFlowForecast } from '@/lib/services/cashFlowForecast';
import { buildPipelineForecast } from '@/lib/services/pipelineForecast';
import { getEffectiveVehicleCostPerKm } from '@/lib/services/fuelReferenceService';
import { buildCacAnalysis } from '@/lib/services/cacAnalysis';
import { fetchCanonicalCommunicationEventsForBookings } from '@/lib/services/timelineQueryService';
import { readPackPricingModelHistory, readProfitabilityConfigHistory } from '@/lib/services/adminConfigHistoryService';
import EconomiaClient from './EconomiaClient';
import { buildEconomiaPaymentRow, summarizeEconomiaPaymentRows } from './economia-payments';

export const dynamic = 'force-dynamic';

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default async function EconomiaPage() {
  const now = new Date();
  const monthStart = startOfMonth(now);

  // ---------------------------------------------------------------------------
  // 1. FINANCES DATA
  // ---------------------------------------------------------------------------

  let bookings: Array<{
    id: string;
    reference: string;
    status: string;
    clientName: string;
    clientPhone: string;
    eventDate: Date;
    total: number;
    depositAmount: number;
    depositPaid: boolean;
    depositPaidAt: Date | null;
    remainingAmount: number;
    remainingPaid: boolean;
    remainingPaidAt: Date | null;
    cashAmount: number | null;
  }> = [];

  let canonicalCommEventsByBooking: Record<string, Awaited<ReturnType<typeof fetchCanonicalCommunicationEventsForBookings>>[string]> = {};

  try {
    bookings = await prisma.booking.findMany({
      where: { status: { not: 'CANCELLED' } },
      orderBy: { eventDate: 'asc' },
      select: {
        id: true,
        reference: true,
        status: true,
        clientName: true,
        clientPhone: true,
        eventDate: true,
        total: true,
        depositAmount: true,
        depositPaid: true,
        depositPaidAt: true,
        remainingAmount: true,
        remainingPaid: true,
        remainingPaidAt: true,
        cashAmount: true,
      },
      take: 500,
    });

    if (bookings.length > 0) {
      canonicalCommEventsByBooking = await fetchCanonicalCommunicationEventsForBookings(
        bookings.map((b) => b.id),
        2000
      );
    }
  } catch (error) {
    log.error('Error carregant dades financeres', error);
    bookings = [];
    canonicalCommEventsByBooking = {};
  }

  const rows = bookings.map((booking) => {
    const paymentFlow = deriveFlowStatusFromTimeline(canonicalCommEventsByBooking[booking.id] || [], 'PAYMENT');

    return buildEconomiaPaymentRow(booking, {
      now,
      paymentFlowState: paymentFlow.state,
    });
  });

  const {
    outstandingTotal,
    overdueTotal,
    dueSoonTotal,
    monthCollected,
    atRiskRows,
    upcomingDueRows,
  } = summarizeEconomiaPaymentRows(rows, monthStart);

  // ---------------------------------------------------------------------------
  // 2. PROFITABILITY DATA
  // ---------------------------------------------------------------------------

  let report: Awaited<ReturnType<typeof buildProfitabilityReport>> | null = null;
  let reportError = false;

  try {
    report = await buildProfitabilityReport();
  } catch (error) {
    reportError = true;
    log.error('Error generant informe de rendibilitat', error);
  }

  // Valor d'inventari (actius de l'empresa)
  let inventoryValue = 0;
  let inventoryCount = 0;
  try {
    const invAgg = await prisma.inventoryItem.aggregate({
      where: { status: { not: 'RETIRED' } },
      _sum: { value: true },
      _count: true,
    });
    inventoryValue = invAgg._sum.value || 0;
    inventoryCount = invAgg._count || 0;
  } catch (error) {
    log.error('[Economia] Error carregant dades', error);
  }

  // Serialize profitability rows for client
  const serializeRow = (row: { id: string; reference: string; clientName: string; eventDate: Date; source: string; netMargin: number; marginPct: number; travelCost: number }) => ({
    id: row.id,
    reference: row.reference,
    clientName: row.clientName,
    eventDate: row.eventDate.toISOString(),
    source: row.source,
    netMargin: row.netMargin,
    marginPct: row.marginPct,
    travelCost: row.travelCost,
  });

  const defaultConfig = normalizeProfitabilityConfig(null);
  const packPricingConfig = await getPackPricingModelConfigEditable();
  const packsForPricing = await prisma.pack.findMany({
    where: { isActive: true },
    orderBy: [{ service: 'asc' }, { price: 'asc' }],
    select: {
      id: true,
      slug: true,
      service: true,
      price: true,
      extraHourPrice: true,
      djHours: true,
      maxGuests: true,
      soundWatts: true,
      translations: {
        select: {
          locale: true,
          name: true,
        },
      },
      inventory: {
        select: {
          quantity: true,
          item: {
            select: {
              name: true,
              purchasePrice: true,
              expectedLifeHours: true,
            },
          },
        },
        orderBy: {
          item: { name: 'asc' },
        },
      },
    },
  }).catch(() => []);

  const packPricingRows = packsForPricing
    .map((pack) => {
      const health = computePackPricingHealth(pack, {
        ...packPricingConfig,
        specialistServices: new Set(packPricingConfig.specialistServices),
      });
      const inventoryCostPerHour = pack.inventory.reduce((sum, row) => {
        const itemPerHour = calculateCostPerHour(row.item.purchasePrice, row.item.expectedLifeHours);
        return sum + (itemPerHour * Math.max(1, row.quantity));
      }, 0);
      const directCost = (inventoryCostPerHour * Math.max(1, pack.djHours))
        + (health.laborCostPerHourUsed * Math.max(1, pack.djHours))
        + packPricingConfig.fixedPackCost;
      const profit = health.publicPrice - directCost;
      const marginPct = health.publicPrice > 0 ? (profit / health.publicPrice) : 0;
      const extraHourCostEstimated = inventoryCostPerHour + health.laborCostPerHourUsed;
      const extraHourProfit = health.publicExtraHourPrice - extraHourCostEstimated;
      const extraHourMarginPct = health.publicExtraHourPrice > 0 ? (extraHourProfit / health.publicExtraHourPrice) : 0;
      const preferredTranslation = pack.translations.find((row) => row.locale === 'ca')
        || pack.translations.find((row) => row.locale === 'es')
        || pack.translations[0];
      return {
        id: pack.id,
        name: preferredTranslation?.name || pack.slug,
        slug: pack.slug,
        service: pack.service || 'general',
        price: health.publicPrice,
        recommendedPrice: health.recommendedPrice,
        directCost,
        profit,
        marginPct,
        extraHourPrice: health.publicExtraHourPrice,
        recommendedExtraHourPrice: health.recommendedExtraHourPrice,
        extraHourCostEstimated,
        extraHourProfit,
        extraHourMarginPct,
        divergencePct: health.divergencePct,
        extraHourDivergencePct: health.extraHourDivergencePct,
        hasAlert: health.hasAlert,
      };
    })
    .sort((a, b) => a.marginPct - b.marginPct);

  const packPricingSummary = packPricingRows.reduce(
    (acc, row) => {
      if (row.marginPct >= packPricingConfig.marginTargetPct) acc.healthy += 1;
      else if (row.marginPct >= packPricingConfig.marginTargetPct - 0.08) acc.warning += 1;
      else acc.critical += 1;
      return acc;
    },
    { healthy: 0, warning: 0, critical: 0 }
  );
  const [historyEntries, packPricingHistoryEntries] = await Promise.all([
    readProfitabilityConfigHistory(),
    readPackPricingModelHistory(packPricingConfig),
  ]);

  // Dades addicionals: tresoreria, previsions, vehicle, CAC
  const [cashFlow, forecastPipeline, vehicleConfig, cacByChannel] = await Promise.all([
    buildCashFlowForecast(6).catch((err) => { log.error('cashFlow failed', err); return []; }),
    buildPipelineForecast(6).catch((err) => { log.error('forecast failed', err); return []; }),
    getEffectiveVehicleCostPerKm().catch((err) => {
      log.error('vehicleConfig failed', err);
      return { costPerKm: 0.19, fuelPricePerLiter: 0, consumptionL100: 8.5, maintenanceCostPerKm: 0.12, updatedAt: null };
    }),
    buildCacAnalysis().catch((err) => { log.error('cacAnalysis failed', err); return []; }),
  ]);

  return (
    <EconomiaClient
      outstandingTotal={outstandingTotal}
      overdueTotal={overdueTotal}
      dueSoonTotal={dueSoonTotal}
      monthCollected={monthCollected}
      atRiskRows={atRiskRows}
      upcomingDueRows={upcomingDueRows}
      allPaymentRows={rows}
      hasReport={!!report}
      reportError={reportError}
      realized={report?.realized ?? { revenue: 0, netMargin: 0, avgMarginPct: 0, bookings: 0 }}
      forecast={report?.forecast ?? { revenue: 0, netMargin: 0, avgMarginPct: 0, bookings: 0 }}
      topProfitability={report?.topProfitability.map(serializeRow) ?? []}
      riskProfitability={report?.riskProfitability.map(serializeRow) ?? []}
      bySource={report?.bySource ?? []}
      config={report?.config ?? defaultConfig}
      packPricingConfig={packPricingConfig}
      packPricingRows={packPricingRows}
      packPricingSummary={packPricingSummary}
      packPricingHistoryEntries={packPricingHistoryEntries}
      historyEntries={historyEntries}
      inventoryValue={inventoryValue}
      inventoryCount={inventoryCount}
      cashFlow={cashFlow}
      forecast_pipeline={forecastPipeline}
      vehicleConfig={{
        fuelPricePerLiter: vehicleConfig.fuelPricePerLiter,
        consumptionL100: vehicleConfig.consumptionL100,
        maintenanceCostPerKm: vehicleConfig.maintenanceCostPerKm,
        effectiveCostPerKm: vehicleConfig.costPerKm,
        updatedAt: vehicleConfig.updatedAt,
      }}
      cacByChannel={cacByChannel}
    />
  );
}
