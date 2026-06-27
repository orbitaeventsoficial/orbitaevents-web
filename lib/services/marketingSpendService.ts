/**
 * marketingSpendService.ts — Despesa de màrqueting real per canal i mes.
 *
 * Base del CAC real: l'usuari carrega la despesa invertida a cada canal cada mes
 * i el cacAnalysis la divideix pels clients guanyats del mateix període.
 */

import { prisma } from '@/lib/prisma';
import type { LeadSource } from '@prisma/client';

export interface MarketingSpendEntry {
  id: string;
  channel: LeadSource;
  year: number;
  month: number; // 1-12
  amount: number;
  notes: string | null;
}

export interface ChannelSpendSummary {
  /** Suma de tota la despesa carregada per al canal. */
  totalSpend: number;
  /** Mes més antic amb despesa (inclusiu). */
  fromYear: number;
  fromMonth: number;
  /** Mes més recent amb despesa (inclusiu). */
  toYear: number;
  toMonth: number;
}

/** Llista totes les entrades de despesa, més recents primer. */
export async function listMarketingSpend(): Promise<MarketingSpendEntry[]> {
  const rows = await prisma.marketingSpend.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { channel: 'asc' }],
  });
  return rows.map((r) => ({
    id: r.id,
    channel: r.channel,
    year: r.year,
    month: r.month,
    amount: r.amount,
    notes: r.notes,
  }));
}

/**
 * Crea o actualitza la despesa d'un canal per a un mes concret (upsert per la
 * clau única canal+any+mes). Import 0 o negatiu no és vàlid.
 */
export async function upsertMarketingSpend(input: {
  channel: LeadSource;
  year: number;
  month: number;
  amount: number;
  notes?: string | null;
}): Promise<MarketingSpendEntry> {
  const row = await prisma.marketingSpend.upsert({
    where: { channel_year_month: { channel: input.channel, year: input.year, month: input.month } },
    create: {
      channel: input.channel,
      year: input.year,
      month: input.month,
      amount: input.amount,
      notes: input.notes ?? null,
    },
    update: { amount: input.amount, notes: input.notes ?? null },
  });
  return { id: row.id, channel: row.channel, year: row.year, month: row.month, amount: row.amount, notes: row.notes };
}

/** Elimina una entrada de despesa per id. */
export async function deleteMarketingSpend(id: string): Promise<void> {
  await prisma.marketingSpend.delete({ where: { id } });
}

/**
 * Resum de despesa per canal: total invertit i rang de mesos cobert. Serveix per
 * casar la despesa amb els clients guanyats del mateix període (CAC real).
 */
export async function getChannelSpendSummary(): Promise<Map<LeadSource, ChannelSpendSummary>> {
  const rows = await prisma.marketingSpend.findMany({
    select: { channel: true, year: true, month: true, amount: true },
  });

  const map = new Map<LeadSource, ChannelSpendSummary>();
  for (const r of rows) {
    const ym = r.year * 12 + (r.month - 1);
    const cur = map.get(r.channel);
    if (!cur) {
      map.set(r.channel, {
        totalSpend: r.amount,
        fromYear: r.year,
        fromMonth: r.month,
        toYear: r.year,
        toMonth: r.month,
      });
      continue;
    }
    cur.totalSpend += r.amount;
    const fromYm = cur.fromYear * 12 + (cur.fromMonth - 1);
    const toYm = cur.toYear * 12 + (cur.toMonth - 1);
    if (ym < fromYm) { cur.fromYear = r.year; cur.fromMonth = r.month; }
    if (ym > toYm) { cur.toYear = r.year; cur.toMonth = r.month; }
  }
  return map;
}
