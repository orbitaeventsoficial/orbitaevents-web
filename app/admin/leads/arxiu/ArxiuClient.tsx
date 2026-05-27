'use client';

/* ============================================================================
   ÒRBITA ADMIN — Leads · Arxiu històric · Client (Brass & Obsidian)
   ----------------------------------------------------------------------------
   Llista filtrable + 4 panells de stats. Filtres com a query params (GET).
   Canvi #793.
============================================================================ */

import type { ArchiveListResult, ArchiveStats } from '@/lib/services/leadArchiveService';
import { formatDateSimple, formatMonthYearCompact } from '@/lib/constants';
import './arxiu-design.css';

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
    <div className="fx-root is-contrast">
      <div className="ax__pagehead">
        <div className="ax__tt">
          <span className="ax__eyebrow">Arxiu històric</span>
          <h1 className="ax__h1">Leads perduts</h1>
          <span className="ax__sub">Snapshots conservats després de la purga (cron 90 dies) i del delete manual. Stats: {windowFromISO} → {windowToISO}.</span>
        </div>
      </div>

      {/* ── 4 panells stats ──────────────────────────────────────────── */}
      <div className="ax__statgrid">
        <div className="ax__stat">
          <span className="ax__statlabel">Leads perduts</span>
          <b className="ax__statbig">{stats.totalLost}</b>
          <small>en els últims 12 mesos</small>
        </div>
        <div className="ax__stat">
          <span className="ax__statlabel">Valor estimat perdut</span>
          <b className="ax__statbig">{euro(stats.totalLostValue)}</b>
          <small>suma del valor estimat</small>
        </div>
        <div className="ax__stat ax__stat--wide">
          <span className="ax__statlabel">Distribució per motiu</span>
          {stats.byReason.length === 0 ? (
            <p className="ax__empty">Sense dades.</p>
          ) : (
            <ul className="ax__reasonlist">
              {stats.byReason.map((r) => (
                <li key={r.reason}>
                  <span className="ax__reasonname">{reasonLabel(r.reason)}</span>
                  <span className="ax__bar"><i style={{ width: `${reasonMax === 0 ? 0 : (r.count / reasonMax) * 100}%` }} /></span>
                  <span className="ax__reasonval">{r.count} · {r.percentage}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="ax__stat ax__stat--wide">
          <span className="ax__statlabel">Tendència mensual (perdut vs guanyat)</span>
          {stats.monthly.length === 0 ? (
            <p className="ax__empty">Sense dades.</p>
          ) : (
            <ul className="ax__trendlist">
              {stats.monthly.map((m) => {
                const lostPct = monthlyMax === 0 ? 0 : (m.lost / monthlyMax) * 100;
                const wonPct = monthlyMax === 0 ? 0 : (m.won / monthlyMax) * 100;
                return (
                  <li key={m.monthKey}>
                    <span className="ax__trendmonth">{formatMonth(m.monthKey)}</span>
                    <span className="ax__trendbars">
                      <i className="ax__trendlost" style={{ width: `${lostPct}%` }} />
                      <i className="ax__trendwon" style={{ width: `${wonPct}%` }} />
                    </span>
                    <span className="ax__trendnum">{m.lost} perduts · {m.won} guanyats</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="ax__stat ax__stat--wide">
          <span className="ax__statlabel">Per tipus d&apos;event</span>
          {stats.byEventType.length === 0 ? (
            <p className="ax__empty">Sense dades.</p>
          ) : (
            <ul className="ax__simplelist">
              {stats.byEventType.map((b) => (
                <li key={b.key}><span>{eventTypeLabel(b.key)}</span><b>{b.count}</b><small>{euro(b.totalValue)}</small></li>
              ))}
            </ul>
          )}
        </div>
        <div className="ax__stat ax__stat--wide">
          <span className="ax__statlabel">Per canal d&apos;entrada</span>
          {stats.bySource.length === 0 ? (
            <p className="ax__empty">Sense dades.</p>
          ) : (
            <ul className="ax__simplelist">
              {stats.bySource.map((b) => (
                <li key={b.key}><span>{sourceLabel(b.key)}</span><b>{b.count}</b><small>{euro(b.totalValue)}</small></li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Filtres ──────────────────────────────────────────────────── */}
      <form className="ax__filters" method="get" action="/admin/leads/arxiu">
        <div className="ax__field">
          <label htmlFor="ax-q">Cerca</label>
          <input id="ax-q" name="q" type="search" placeholder="Nom o email…" defaultValue={filters.q} />
        </div>
        <div className="ax__field">
          <label htmlFor="ax-motiu">Motiu</label>
          <select id="ax-motiu" name="motiu" defaultValue={filters.motiu}>
            <option value="">Tots</option>
            {catalog.reasons.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div className="ax__field">
          <label htmlFor="ax-tipus">Tipus</label>
          <select id="ax-tipus" name="tipus" defaultValue={filters.tipus}>
            <option value="">Tots</option>
            {catalog.eventTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="ax__field">
          <label htmlFor="ax-canal">Canal</label>
          <select id="ax-canal" name="canal" defaultValue={filters.canal}>
            <option value="">Tots</option>
            {catalog.sources.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="ax__actions">
          <button type="submit" className="ax__btn ax__btn--primary">Filtrar</button>
          <a href="/admin/leads/arxiu" className="ax__btn ax__btn--ghost">Netejar</a>
        </div>
      </form>

      {/* ── Taula ────────────────────────────────────────────────────── */}
      <div className="ax__tablewrap">
        <table className="ax__table">
          <thead>
            <tr>
              <th scope="col">Lead</th>
              <th scope="col">Contacte</th>
              <th scope="col">Esdeveniment</th>
              <th scope="col">Canal</th>
              <th scope="col">Motiu</th>
              <th scope="col">Valor</th>
              <th scope="col">Arxivat</th>
            </tr>
          </thead>
          <tbody>
            {list.records.length === 0 ? (
              <tr><td colSpan={7} className="ax__emptyrow">Cap entrada coincideix amb els filtres.</td></tr>
            ) : (
              list.records.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.name}</b><br /><small>{formatDateUTC(r.eventDate)}</small></td>
                  <td><span>{r.email}</span><br /><small>{r.phone ?? '—'}</small></td>
                  <td>{eventTypeLabel(r.eventType)}{r.eventLocation ? <><br /><small>{r.eventLocation}</small></> : null}</td>
                  <td>{sourceLabel(r.source)}</td>
                  <td>{reasonLabel(r.lostReason)}</td>
                  <td className="ax__num">{r.estimatedValue ? euro(r.estimatedValue) : '—'}</td>
                  <td><small>{formatDateUTC(r.archivedAt)}</small><br /><small className="ax__archivedby">{r.archivedBy === 'admin' ? 'manual' : 'auto'}</small></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginació ────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <nav className="ax__paginate" aria-label="Paginació de l'arxiu">
          <span>{list.total} entrades · pàgina {currentPage} de {totalPages}</span>
          <div className="ax__pages">
            {currentPage > 1 && <a href={pageHref(currentPage - 1)} className="ax__btn ax__btn--ghost">← Anterior</a>}
            {currentPage < totalPages && <a href={pageHref(currentPage + 1)} className="ax__btn ax__btn--ghost">Següent →</a>}
          </div>
        </nav>
      )}
    </div>
  );
}
