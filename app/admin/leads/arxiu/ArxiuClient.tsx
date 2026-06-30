'use client';

/* ============================================================================
   ÒRBITA ADMIN — Leads · Arxiu històric · Client
   ----------------------------------------------------------------------------
   Llista filtrable + panells de stats. Filtres com a query params (GET).
   100% canònic: AdminPage / AdminSection / AdminKpi + tokens (.ap-* / .adm-input).
   Canvi #793 · canonitzat.
============================================================================ */

import type { ArchiveListResult, ArchiveStats } from '@/lib/services/leadArchiveService';
import { formatDateSimple, formatMonthYearCompact } from '@/lib/constants';
import { AdminPage, AdminSection, AdminKpiRow, AdminKpi, AdminEmptyState } from '../../components/AdminPage';

type CatalogOption = { value: string; label: string };

interface ArxiuClientProps {
  list: ArchiveListResult;
  stats: ArchiveStats;
  pageSize: number;
  currentPage: number;
  filters: { motiu: string; tipus: string; canal: string; q: string };
  catalog: { reasons: CatalogOption[]; eventTypes: CatalogOption[]; sources: CatalogOption[] };
  windowFromISO: string;
  windowToISO: string;
}

function euro(n: number): string {
  const rounded = Math.round(n);
  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;
}

function formatDateUTC(d: Date | null): string {
  if (!d) return '—';
  return formatDateSimple(d);
}

function formatMonth(monthKey: string): string {
  // formatMonthYearCompact espera 'YYYY-MM' o ISO; el monthKey ja és 'YYYY-MM'.
  return formatMonthYearCompact(monthKey);
}

const FIELD_LABEL = 'font-mono text-xs font-bold uppercase tracking-[0.04em] text-[var(--t3)]';
const PANEL_EMPTY = 'm-0 text-xs italic text-[var(--t3)]';

export default function ArxiuClient({ list, stats, pageSize, currentPage, filters, catalog, windowFromISO, windowToISO }: ArxiuClientProps) {
  const reasonLabel = (raw: string | null) => {
    if (raw === null) return 'Sense motiu';
    if (raw === 'UNCLASSIFIED') return 'Sense motiu';
    return catalog.reasons.find((r) => r.value === raw)?.label ?? raw;
  };
  const eventTypeLabel = (raw: string) => catalog.eventTypes.find((t) => t.value === raw)?.label ?? raw;
  const sourceLabel = (raw: string) => catalog.sources.find((s) => s.value === raw)?.label ?? raw;

  const totalPages = Math.max(1, Math.ceil(list.total / pageSize));
  const monthlyMax = stats.monthly.reduce((max, m) => Math.max(max, m.lost + m.won), 0);
  const reasonMax = stats.byReason.reduce((max, r) => Math.max(max, r.count), 0);

  function pageHref(target: number) {
    const params = new URLSearchParams();
    if (filters.motiu) params.set('motiu', filters.motiu);
    if (filters.tipus) params.set('tipus', filters.tipus);
    if (filters.canal) params.set('canal', filters.canal);
    if (filters.q) params.set('q', filters.q);
    if (target > 1) params.set('page', String(target));
    const qs = params.toString();
    return qs ? `?${qs}` : '/admin/leads/arxiu';
  }

  return (
    <AdminPage
      eyebrow="Arxiu històric"
      title="Leads perduts"
      subtitle={`Snapshots conservats després de la purga (cron 90 dies) i del delete manual. Stats: ${windowFromISO} → ${windowToISO}.`}
      kpis={
        <AdminKpiRow>
          <AdminKpi label="Leads perduts" value={stats.totalLost} trend="en els últims 12 mesos" />
          <AdminKpi label="Valor estimat perdut" value={euro(stats.totalLostValue)} trend="suma del valor estimat" />
        </AdminKpiRow>
      }
    >
      {/* ── Panells analítics ────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminSection title="Distribució per motiu">
          {stats.byReason.length === 0 ? (
            <p className={PANEL_EMPTY}>Sense dades.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {stats.byReason.map((r) => (
                <li key={r.reason} className="grid grid-cols-[1.2fr_2fr_auto] items-center gap-3 text-sm">
                  <span className="font-semibold text-[var(--t)]">{reasonLabel(r.reason)}</span>
                  <span className="relative block h-2 overflow-hidden rounded-[var(--o-r-pill)] bg-[var(--line2)]">
                    <i
                      className="block h-full rounded-[var(--o-r-pill)] bg-[var(--gold)]"
                      style={{ width: `${reasonMax === 0 ? 0 : (r.count / reasonMax) * 100}%` }}
                    />
                  </span>
                  <span className="whitespace-nowrap text-right font-mono text-[var(--o-text-2xs)] text-[var(--t2)]">
                    {r.count} · {r.percentage}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminSection>

        <AdminSection title="Tendència mensual (perdut vs guanyat)">
          {stats.monthly.length === 0 ? (
            <p className={PANEL_EMPTY}>Sense dades.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {stats.monthly.map((m) => {
                const lostPct = monthlyMax === 0 ? 0 : (m.lost / monthlyMax) * 100;
                const wonPct = monthlyMax === 0 ? 0 : (m.won / monthlyMax) * 100;
                return (
                  <li key={m.monthKey} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-[var(--o-text-2xs)]">
                    <span className="font-mono text-[var(--t2)]">{formatMonth(m.monthKey)}</span>
                    <span className="relative block h-2 overflow-hidden rounded-[var(--o-r-pill)] bg-[var(--line2)]">
                      <i
                        className="absolute left-0 top-0 h-full rounded-[var(--o-r-pill)] bg-[var(--o-stage-lost)]"
                        style={{ width: `${lostPct}%` }}
                      />
                      <i
                        className="absolute left-0 top-0 h-full rounded-[var(--o-r-pill)] bg-[var(--o-stage-won)] mix-blend-screen"
                        style={{ width: `${wonPct}%` }}
                      />
                    </span>
                    <span className="whitespace-nowrap text-right font-mono text-xs text-[var(--t2)]">
                      {m.lost} perduts · {m.won} guanyats
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminSection>

        <AdminSection title="Per tipus d'event">
          {stats.byEventType.length === 0 ? (
            <p className={PANEL_EMPTY}>Sense dades.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {stats.byEventType.map((b) => (
                <li
                  key={b.key}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-[var(--o-r-sm)] bg-[var(--raised)] px-2.5 py-1.5 text-sm text-[var(--t)]"
                >
                  <span>{eventTypeLabel(b.key)}</span>
                  <b className="font-mono font-bold text-[var(--gold)]">{b.count}</b>
                  <small className="font-mono text-xs text-[var(--t3)]">{euro(b.totalValue)}</small>
                </li>
              ))}
            </ul>
          )}
        </AdminSection>

        <AdminSection title="Per canal d'entrada">
          {stats.bySource.length === 0 ? (
            <p className={PANEL_EMPTY}>Sense dades.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {stats.bySource.map((b) => (
                <li
                  key={b.key}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-[var(--o-r-sm)] bg-[var(--raised)] px-2.5 py-1.5 text-sm text-[var(--t)]"
                >
                  <span>{sourceLabel(b.key)}</span>
                  <b className="font-mono font-bold text-[var(--gold)]">{b.count}</b>
                  <small className="font-mono text-xs text-[var(--t3)]">{euro(b.totalValue)}</small>
                </li>
              ))}
            </ul>
          )}
        </AdminSection>
      </div>

      {/* ── Filtres ──────────────────────────────────────────────────── */}
      <form method="get" action="/admin/leads/arxiu" className="ap-card">
        <div className="ap-card-body grid gap-2.5 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="arxiu-q" className={FIELD_LABEL}>Cerca</label>
            <input id="arxiu-q" name="q" type="search" placeholder="Nom o email…" defaultValue={filters.q} className="adm-input" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="arxiu-motiu" className={FIELD_LABEL}>Motiu</label>
            <select id="arxiu-motiu" name="motiu" defaultValue={filters.motiu} className="adm-input">
              <option value="">Tots</option>
              {catalog.reasons.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="arxiu-tipus" className={FIELD_LABEL}>Tipus</label>
            <select id="arxiu-tipus" name="tipus" defaultValue={filters.tipus} className="adm-input">
              <option value="">Tots</option>
              {catalog.eventTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="arxiu-canal" className={FIELD_LABEL}>Canal</label>
            <select id="arxiu-canal" name="canal" defaultValue={filters.canal} className="adm-input">
              <option value="">Tots</option>
              {catalog.sources.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="ap-btn ap-btn--primary">Filtrar</button>
            <a href="/admin/leads/arxiu" className="ap-btn">Netejar</a>
          </div>
        </div>
      </form>

      {/* ── Taula ────────────────────────────────────────────────────── */}
      <div className="ap-table-wrap">
        <table className="ap-table">
          <thead className="ap-table-head">
            <tr>
              <th scope="col" className="ap-table-th">Lead</th>
              <th scope="col" className="ap-table-th">Contacte</th>
              <th scope="col" className="ap-table-th">Esdeveniment</th>
              <th scope="col" className="ap-table-th">Canal</th>
              <th scope="col" className="ap-table-th">Motiu</th>
              <th scope="col" className="ap-table-th">Valor</th>
              <th scope="col" className="ap-table-th">Arxivat</th>
            </tr>
          </thead>
          <tbody className="ap-table-body">
            {list.records.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <AdminEmptyState icon="🗂️" title="Cap entrada coincideix amb els filtres." />
                </td>
              </tr>
            ) : (
              list.records.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.name}</b><br /><small className="text-[var(--t3)]">{formatDateUTC(r.eventDate)}</small></td>
                  <td><span>{r.email}</span><br /><small className="text-[var(--t3)]">{r.phone ?? '—'}</small></td>
                  <td>{eventTypeLabel(r.eventType)}{r.eventLocation ? <><br /><small className="text-[var(--t3)]">{r.eventLocation}</small></> : null}</td>
                  <td>{sourceLabel(r.source)}</td>
                  <td>{reasonLabel(r.lostReason)}</td>
                  <td className="whitespace-nowrap font-mono">{r.estimatedValue ? euro(r.estimatedValue) : '—'}</td>
                  <td><small className="text-[var(--t3)]">{formatDateUTC(r.archivedAt)}</small><br /><small className="italic text-[var(--t3)]">{r.archivedBy === 'admin' ? 'manual' : 'auto'}</small></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginació ────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-2.5 text-sm text-[var(--t2)]" aria-label="Paginació de l'arxiu">
          <span>{list.total} entrades · pàgina {currentPage} de {totalPages}</span>
          <div className="flex gap-2">
            {currentPage > 1 && <a href={pageHref(currentPage - 1)} className="ap-btn ap-btn--xs">← Anterior</a>}
            {currentPage < totalPages && <a href={pageHref(currentPage + 1)} className="ap-btn ap-btn--xs">Següent →</a>}
          </div>
        </nav>
      )}
    </AdminPage>
  );
}
