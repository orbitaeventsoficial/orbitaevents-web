import { buildPipelineForecast } from '@/lib/services/pipelineForecast';
import { buildCashFlowForecast } from '@/lib/services/cashFlowForecast';

/**
 * ECONOMIC COCKPIT — font de veritat de comandament econòmic (el «zenit»).
 *
 * Unifica en UN sol contracte les peces de previsió que abans cada pàgina muntava
 * a mà (pipeline ponderat de leads oberts + cash-flow de reserves compromeses).
 * Respon, per mes i en agregat: «quant tinc compromès, quant és probable (ponderat),
 * quina és la previsió combinada i on hi ha el risc». Reusa els serveis canònics
 * (`buildPipelineForecast`, `buildCashFlowForecast`); no reimplementa cap fórmula.
 */

export interface CockpitMonth {
  month: string;                // "YYYY-MM"
  committedRevenue: number;     // reserves ja confirmades (compromès)
  weightedPipeline: number;     // leads oberts × probabilitat (probable)
  weightedLow: number;          // banda inferior (1σ)
  weightedHigh: number;         // banda superior (1σ)
  combinedForecast: number;     // previsió central (pipeline + històric)
  previousYearActual: number;   // YoY: ingressos reals del mateix mes l'any anterior
  netCashFlow: number;          // ingrés − cost previst del mes
  confirmedBookings: number;    // nombre de reserves confirmades del mes
}

export interface CockpitSummary {
  committedTotal: number;       // suma de committedRevenue
  weightedTotal: number;        // suma de weightedPipeline
  combinedTotal: number;        // suma de combinedForecast
  previousYearTotal: number;    // suma YoY
  /** Marge net previst del període (suma de netCashFlow) — el «quant guanyo», no
   *  només «quant entra». Aquesta és la diferència competitiva: marge real. */
  netForecastTotal: number;
  /** Marge net sobre la previsió combinada d'ingressos (%). null si no hi ha ingrés. */
  netMarginPct: number | null;
  /** Variació de la previsió combinada respecte el mateix període de l'any anterior (%). */
  yoyDeltaPct: number | null;
  monthsAhead: number;
}

export interface EconomicCockpit {
  months: CockpitMonth[];
  summary: CockpitSummary;
}

type PipelineMonth = Awaited<ReturnType<typeof buildPipelineForecast>>[number];
type CashFlowEntry = Awaited<ReturnType<typeof buildCashFlowForecast>>[number];

/**
 * Composició pura (sense I/O) — testejable directament. Fusiona el forecast de
 * pipeline i el cash-flow per clau de mes i en deriva l'agregat de comandament.
 */
export function composeEconomicCockpit(
  pipeline: PipelineMonth[],
  cashFlow: CashFlowEntry[],
): EconomicCockpit {
  const cashByMonth = new Map(cashFlow.map((c) => [c.month, c]));

  const months: CockpitMonth[] = pipeline.map((p) => ({
    month: p.month,
    committedRevenue: p.confirmedRevenue,
    weightedPipeline: p.pipeline,
    weightedLow: p.pipelineLow,
    weightedHigh: p.pipelineHigh,
    combinedForecast: p.combined,
    previousYearActual: p.previousYearActual,
    netCashFlow: cashByMonth.get(p.month)?.netFlow ?? 0,
    confirmedBookings: p.confirmedBookings,
  }));

  const sum = (sel: (m: CockpitMonth) => number) => months.reduce((a, m) => a + sel(m), 0);
  const committedTotal = sum((m) => m.committedRevenue);
  const weightedTotal = sum((m) => m.weightedPipeline);
  const combinedTotal = sum((m) => m.combinedForecast);
  const previousYearTotal = sum((m) => m.previousYearActual);
  const netForecastTotal = sum((m) => m.netCashFlow);
  const yoyDeltaPct = previousYearTotal > 0
    ? Math.round(((combinedTotal - previousYearTotal) / previousYearTotal) * 1000) / 10
    : null;
  const netMarginPct = combinedTotal > 0
    ? Math.round((netForecastTotal / combinedTotal) * 1000) / 10
    : null;

  return {
    months,
    summary: {
      committedTotal,
      weightedTotal,
      combinedTotal,
      previousYearTotal,
      netForecastTotal,
      netMarginPct,
      yoyDeltaPct,
      monthsAhead: months.length,
    },
  };
}

/** Wrapper amb I/O: carrega les peces canòniques en paral·lel i les composa. */
export async function buildEconomicCockpit(monthsAhead = 6): Promise<EconomicCockpit> {
  const [pipeline, cashFlow] = await Promise.all([
    buildPipelineForecast(monthsAhead),
    buildCashFlowForecast(monthsAhead),
  ]);
  return composeEconomicCockpit(pipeline, cashFlow);
}
