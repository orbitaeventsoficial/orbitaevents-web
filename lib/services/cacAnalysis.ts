/**
 * cacAnalysis.ts — Cost d'Adquisició de Client real
 *
 * CAC real = despesa real del canal / clients guanyats del mateix període.
 * La despesa surt de MarketingSpend (entrada manual per canal i mes). Si un canal
 * no té despesa carregada, realCac queda null i es mostra el CAC estimat de
 * profitabilityConfig com a referència.
 */

import { prisma } from '@/lib/prisma';
import { getProfitabilityConfig } from './profitabilityService';
import { getChannelSpendSummary } from './marketingSpendService';
import type { LeadSource } from '@prisma/client';

interface CacChannelRow {
  channel: string;
  totalLeads: number;
  wonLeads: number;
  conversionRate: number;
  estimatedCac: number;
  /** Despesa real carregada per al canal (null si no n'hi ha). */
  realSpend: number | null;
  /** CAC real = despesa / guanyats del període cobert per la despesa (null si no n'hi ha). */
  realCac: number | null;
}

export async function buildCacAnalysis(): Promise<CacChannelRow[]> {
  const [config, spendByChannel] = await Promise.all([
    getProfitabilityConfig(),
    getChannelSpendSummary(),
  ]);

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

    // CAC real: despesa carregada / clients guanyats DINS el període cobert per la despesa.
    const spend = spendByChannel.get(channel as LeadSource);
    let realSpend: number | null = null;
    let realCac: number | null = null;
    if (spend && spend.totalSpend > 0) {
      realSpend = spend.totalSpend;
      // Rang [inici del mes més antic, inici del mes següent al més recent).
      const from = new Date(spend.fromYear, spend.fromMonth - 1, 1);
      const to = new Date(spend.toYear, spend.toMonth, 1);
      const wonInPeriod = await prisma.lead.count({
        where: {
          source: channel as LeadSource,
          status: 'WON',
          convertedAt: { gte: from, lt: to },
        },
      });
      realCac = wonInPeriod > 0 ? Math.round(realSpend / wonInPeriod) : null;
    }

    results.push({
      channel,
      totalLeads,
      wonLeads,
      conversionRate,
      estimatedCac,
      realSpend,
      realCac,
    });
  }

  // Ordenar per totalLeads desc
  results.sort((a, b) => b.totalLeads - a.totalLeads);

  return results;
}
