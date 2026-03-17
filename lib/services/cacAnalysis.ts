/**
 * cacAnalysis.ts — Cost d'Adquisició de Client real
 *
 * Calcula el CAC real per canal basant-se en dades reals de conversió.
 * Compara amb el CAC estimat de profitabilityConfig.
 */

import { prisma } from '@/lib/prisma';
import { getProfitabilityConfig } from './profitabilityService';

interface CacChannelRow {
  channel: string;
  totalLeads: number;
  wonLeads: number;
  conversionRate: number;
  estimatedCac: number;
  realCac: number | null;
}

export async function buildCacAnalysis(): Promise<CacChannelRow[]> {
  const config = await getProfitabilityConfig();

  // Agrupar leads per source
  const leadsBySource = await prisma.lead.groupBy({
    by: ['source'],
    _count: { id: true },
  });

  const wonBySource = await prisma.lead.groupBy({
    by: ['source'],
    where: { status: 'WON' },
    _count: { id: true },
  });

  const wonMap = new Map<string, number>();
  for (const row of wonBySource) {
    wonMap.set(row.source, row._count.id);
  }

  const results: CacChannelRow[] = [];

  for (const row of leadsBySource) {
    const channel = row.source;
    const totalLeads = row._count.id;
    const wonLeads = wonMap.get(channel) || 0;
    const conversionRate = totalLeads > 0 ? wonLeads / totalLeads : 0;
    const estimatedCac = config.channelCac[channel] ?? config.channelCac.UNKNOWN ?? 20;

    // CAC real: si tenim conversió > 0, ajustem el CAC estimat
    // amb la taxa de conversió real (com a pes invers de la eficiència)
    // CAC real ponderat = estimatedCac / conversionRate (si > baseline 10%)
    // Això reflecteix que canals amb baixa conversió tenen CAC efectiu més alt
    let realCac: number | null = null;
    if (wonLeads > 0 && conversionRate > 0) {
      // Baseline de conversió assumida per als CAC estimats: 15%
      const baselineConversion = 0.15;
      realCac = Math.round(estimatedCac * (baselineConversion / conversionRate));
    }

    results.push({
      channel,
      totalLeads,
      wonLeads,
      conversionRate,
      estimatedCac,
      realCac,
    });
  }

  // Ordenar per totalLeads desc
  results.sort((a, b) => b.totalLeads - a.totalLeads);

  return results;
}
