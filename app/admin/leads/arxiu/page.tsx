/* ============================================================================
   ÒRBITA ADMIN — Leads · Arxiu històric (server component)
   ----------------------------------------------------------------------------
   Llistat històric de leads LOST snapshotats abans de ser purgats per la cron
   de cleanup (>90 dies) o pel delete manual. Inclou 4 panells de stats.
   Canvi #793.
============================================================================ */

import { loadArchiveList, loadArchiveStats } from '@/lib/services/leadArchiveService';
import { EVENT_TYPE_PLAIN, SOURCE_LABELS } from '@/lib/constants';
import { LEAD_LOST_REASON_LABELS } from '@/lib/constants/leadLoss';
import ArxiuClient from './ArxiuClient';

const PAGE_SIZE = 20;

function parseSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value && value.trim().length > 0 ? value.trim() : null;
}

function parseIntParam(value: string | string[] | undefined, fallback: number, min = 0): number {
  const raw = parseSearchParam(value);
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min) return fallback;
  return Math.floor(n);
}

export default async function ArxiuPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const lostReason = parseSearchParam(searchParams.motiu);
  const eventType = parseSearchParam(searchParams.tipus);
  const source = parseSearchParam(searchParams.canal);
  const search = parseSearchParam(searchParams.q);
  const page = parseIntParam(searchParams.page, 1, 1);
  const offset = (page - 1) * PAGE_SIZE;

  // Rang de stats: últims 12 mesos (UTC)
  const now = new Date();
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const from = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1));

  const [list, stats] = await Promise.all([
    loadArchiveList(
      { lostReason, eventType, source, search },
      { limit: PAGE_SIZE, offset },
    ),
    loadArchiveStats({ from, to }),
  ]);

  return (
    <ArxiuClient
      list={list}
      stats={stats}
      pageSize={PAGE_SIZE}
      currentPage={page}
      filters={{ motiu: lostReason ?? '', tipus: eventType ?? '', canal: source ?? '', q: search ?? '' }}
      catalog={{
        reasons: Object.entries(LEAD_LOST_REASON_LABELS).map(([value, label]) => ({ value, label })),
        eventTypes: Object.entries(EVENT_TYPE_PLAIN).map(([value, label]) => ({ value, label })),
        sources: Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label })),
      }}
      windowFromISO={from.toISOString().slice(0, 10)}
      windowToISO={to.toISOString().slice(0, 10)}
    />
  );
}

