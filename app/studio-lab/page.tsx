'use client';

/* ============================================================================
   ÒRBITA — Sala de comandament (/studio-lab)
   ----------------------------------------------------------------------------
   Es manté el que funcionava: navegació superior per àrees, calendari de caps
   de setmana (Dv/Ds/Dg) i pipeline de leads arrossegable (Nou → Perdut).

   Principi: fora el SOROLL textual. Cap frase advisory ("queden 3 dissabtes",
   "perill", "mes fort"). La informació es llegeix VISUALMENT:
     · color = estat (atenció · en marxa · tancat · conflicte)
     · ple/buit = capacitat (dissabtes ocupats vs lliures)
     · barra = cobrament (senyal · resta)   · ⚠ = conflicte de recurs
   Es conserva només la DADA (client, data, import, equip).

   Estètica: espresso fosc + un sol metall (llautó), serif (Cormorant) per als
   titulars i imports. Prototip intern noindex, dades de mostra.
============================================================================ */

import { useMemo, useState } from 'react';
import './studio-lab.css';

type Stage = 'nou' | 'contactat' | 'pressupost' | 'guanyat' | 'perdut';
type Risk = 'alt' | 'mitjà' | 'baix';
type ResourceId = 'dj' | 'so' | 'llums' | 'furgo' | 'foto';
type DotState = 'attention' | 'progress' | 'settled' | 'conflict' | 'idle';

const REF_TODAY = '2026-05-23';
const SEASON_YEAR = 2026;
const SEASON_WINDOW = 3;

const STAGE_ORDER: Stage[] = ['nou', 'contactat', 'pressupost', 'guanyat', 'perdut'];
const STAGES: { id: Stage; label: string }[] = [
  { id: 'nou', label: 'Nou' },
  { id: 'contactat', label: 'Contactat' },
  { id: 'pressupost', label: 'Negociant' },
  { id: 'guanyat', label: 'Reservat' },
  { id: 'perdut', label: 'Perdut' },
];

const RESOURCES: Record<ResourceId, string> = {
  dj: 'DJ',
  so: 'So',
  llums: 'Llums',
  furgo: 'Furgoneta',
  foto: 'Fotògraf',
};

const MONTHS_CA = ['gen', 'feb', 'març', 'abr', 'maig', 'juny', 'jul', 'ago', 'set', 'oct', 'nov', 'des'];
const MONTHS_FULL_CA = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
const WEEKDAYS_CA = ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte'];
const WEEKDAYS_SHORT_CA = ['dg', 'dl', 'dt', 'dc', 'dj', 'dv', 'ds'];

/* Àrees de treball del nou admin (navegació superior amb desplegables). */
const NAV_GROUPS: { id: string; label: string; items: string[] }[] = [
  { id: 'comercial', label: 'Comercial', items: ['Entrades', 'Clients', 'Pressupostos', 'Pipeline'] },
  { id: 'operacio', label: 'Operació', items: ['Reserves', 'Calendari', 'Tasques', 'Equip i inventari'] },
  { id: 'diners', label: 'Diners', items: ['Facturació', 'Cobraments', 'Marges', 'Preus i packs'] },
  { id: 'marqueting', label: 'Màrqueting', items: ['Catàleg', 'Ressenyes', 'Blog', 'Integracions'] },
  { id: 'sistema', label: 'Sistema', items: ['Safata', 'Correus', 'Informes', 'Configuració'] },
];

type Bolo = {
  id: string;
  client: string;
  type: string;
  date: string;
  value: number;
  stage: Stage;
  risk: Risk;
  resources: ResourceId[];
  deposit: boolean;
  remaining: boolean;
  checklist: number;
  lastTouchDays: number;
};

const INITIAL_BOLOS: Bolo[] = [
  { id: 'b0', client: 'Aniversari Pol', type: 'Festa', date: '2026-05-30', value: 600, stage: 'guanyat', risk: 'baix', resources: ['dj', 'so'], deposit: true, remaining: true, checklist: 100, lastTouchDays: 1 },
  { id: 'b1', client: 'Laia i Nil', type: 'Boda', date: '2026-06-14', value: 2490, stage: 'pressupost', risk: 'alt', resources: ['dj', 'so', 'llums'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 4 },
  { id: 'b2', client: 'Atlas Group', type: 'Empresa', date: '2026-06-21', value: 3200, stage: 'contactat', risk: 'mitjà', resources: ['dj', 'so'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 2 },
  { id: 'b3', client: 'Festa privada BCN', type: 'Discomòbil', date: '2026-06-28', value: 700, stage: 'pressupost', risk: 'alt', resources: ['dj'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 6 },
  { id: 'b4', client: 'Masia Soler', type: 'Boda', date: '2026-07-04', value: 1890, stage: 'guanyat', risk: 'baix', resources: ['dj', 'so', 'llums', 'foto'], deposit: true, remaining: false, checklist: 35, lastTouchDays: 9 },
  { id: 'b5', client: 'Tech Nova SL', type: 'Empresa', date: '2026-07-04', value: 4100, stage: 'guanyat', risk: 'alt', resources: ['dj', 'furgo'], deposit: true, remaining: false, checklist: 10, lastTouchDays: 12 },
  { id: 'b6', client: 'Júlia & Pau', type: 'Boda', date: '2026-07-12', value: 2750, stage: 'nou', risk: 'mitjà', resources: ['dj', 'so', 'llums'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 1 },
  { id: 'b7', client: 'Ajuntament Vic', type: 'Festa major', date: '2026-08-01', value: 5600, stage: 'contactat', risk: 'mitjà', resources: ['dj', 'so', 'llums', 'furgo'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 8 },
  { id: 'b8', client: 'Bodes del Mar', type: 'Boda', date: '2026-08-08', value: 3300, stage: 'guanyat', risk: 'baix', resources: ['dj', 'so', 'foto'], deposit: true, remaining: true, checklist: 100, lastTouchDays: 3 },
  { id: 'b9', client: 'Lluís festes', type: 'Discomòbil', date: '2026-08-15', value: 850, stage: 'perdut', risk: 'alt', resources: ['dj'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 20 },
  { id: 'b10', client: 'Gala Vermut SL', type: 'Empresa', date: '2026-06-06', value: 1500, stage: 'nou', risk: 'baix', resources: ['so'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 5 },
];

/* ── Helpers purs ──────────────────────────────────────────────────────── */
function euro(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
}
function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}
function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function daysUntil(iso: string): number {
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${REF_TODAY}T00:00:00Z`)) / 86_400_000);
}
function dayLabel(iso: string): string {
  const { m, d } = parseISO(iso);
  return `${d} ${MONTHS_CA[m - 1]}`;
}
function weekdayIndex(iso: string): number {
  const { y, m, d } = parseISO(iso);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
function weekdayName(iso: string): string { return WEEKDAYS_CA[weekdayIndex(iso)]; }
function weekdayShort(iso: string): string { return WEEKDAYS_SHORT_CA[weekdayIndex(iso)]; }
function shiftIso(iso: string, days: number): string {
  const { y, m, d } = parseISO(iso);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return isoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}
function monthIndex(iso: string): number { return parseISO(iso).m; }
function saturdaysInMonth(y: number, m: number): string[] {
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out: string[] = [];
  for (let d = 1; d <= last; d++) if (new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 6) out.push(isoDate(y, m, d));
  return out;
}

type Conflict = { date: string; resource: ResourceId; bolos: Bolo[] };
function findConflicts(bolos: Bolo[]): Conflict[] {
  const active = bolos.filter((b) => b.stage !== 'perdut');
  const byDate = new Map<string, Bolo[]>();
  for (const b of active) byDate.set(b.date, [...(byDate.get(b.date) ?? []), b]);
  const conflicts: Conflict[] = [];
  for (const [date, items] of byDate) {
    if (items.length < 2) continue;
    const resources = new Set<ResourceId>(items.flatMap((b) => b.resources));
    for (const resource of resources) {
      const sharing = items.filter((b) => b.resources.includes(resource));
      if (sharing.length >= 2) conflicts.push({ date, resource, bolos: sharing });
    }
  }
  return conflicts.sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
}

/* Estat → color. Un sol significat, llegit sense paraules. */
function stateOf(b: Bolo, conflictIds: Set<string>): DotState {
  if (b.stage === 'perdut') return 'idle';
  if (conflictIds.has(b.id)) return 'conflict';
  if (b.stage === 'nou' && b.lastTouchDays >= 3) return 'attention';
  if (b.stage === 'guanyat' && !b.deposit) return 'attention';
  if (b.stage === 'guanyat' && b.deposit && b.remaining && b.checklist >= 100) return 'settled';
  return 'progress';
}
function urgencyRank(s: DotState): number {
  return s === 'conflict' ? 3 : s === 'attention' ? 2 : s === 'progress' ? 1 : 0;
}
function primaryActionFor(b: Bolo): string {
  switch (b.stage) {
    case 'nou': return 'Respon ara';
    case 'contactat': return 'Envia pressupost';
    case 'pressupost': return 'Tanca la senyal';
    case 'guanyat':
      if (!b.deposit) return 'Cobra la senyal';
      if (b.checklist < 100) return 'Obre producció';
      return 'Confirma logística';
    case 'perdut':
    default: return 'Reactiva';
  }
}

export default function StudioLabPage() {
  const [bolos, setBolos] = useState<Bolo[]>(INITIAL_BOLOS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [monthAnchor, setMonthAnchor] = useState(6);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);

  const conflicts = useMemo(() => findConflicts(bolos), [bolos]);
  const conflictIds = useMemo(() => {
    const s = new Set<string>();
    for (const c of conflicts) for (const b of c.bolos) s.add(b.id);
    return s;
  }, [conflicts]);

  const attentionCount = useMemo(
    () => bolos.filter((b) => { const s = stateOf(b, conflictIds); return s === 'attention' || s === 'conflict'; }).length,
    [bolos, conflictIds],
  );

  /* El bolo que demana el detall: el seleccionat o, per defecte, el més urgent. */
  const ranked = useMemo(
    () => [...bolos].sort((a, b) =>
      urgencyRank(stateOf(b, conflictIds)) - urgencyRank(stateOf(a, conflictIds))
      || daysUntil(a.date) - daysUntil(b.date)),
    [bolos, conflictIds],
  );
  const detail = useMemo(
    () => bolos.find((b) => b.id === selectedId) ?? ranked[0] ?? null,
    [bolos, selectedId, ranked],
  );
  const detailConflictResources = useMemo(() => {
    const set = new Set<ResourceId>();
    if (!detail) return set;
    for (const c of conflicts) if (c.bolos.some((b) => b.id === detail.id)) set.add(c.resource);
    return set;
  }, [conflicts, detail]);

  const viewMonths = useMemo(
    () => Array.from({ length: SEASON_WINDOW }, (_, i) => monthAnchor + i).filter((m) => m >= 1 && m <= 12),
    [monthAnchor],
  );

  const months = useMemo(() => {
    const byDate = new Map<string, Bolo>();
    for (const b of bolos) if (b.stage !== 'perdut' && !byDate.has(b.date)) byDate.set(b.date, b);
    return viewMonths.map((m) => {
      const sats = saturdaysInMonth(SEASON_YEAR, m);
      const weekends = sats.map((sat) => {
        const days = [shiftIso(sat, -1), sat, shiftIso(sat, 1)].map((iso) => ({
          iso, day: parseISO(iso).d, inMonth: monthIndex(iso) === m, bolo: byDate.get(iso) ?? null,
        }));
        const taken = days.find((d) => d.bolo)?.bolo ?? null;
        return { sat, days, taken };
      });
      return { m, label: MONTHS_FULL_CA[m - 1], weekends };
    });
  }, [viewMonths, bolos]);

  const rangeLabel = viewMonths.length
    ? `${MONTHS_CA[viewMonths[0] - 1]} – ${MONTHS_CA[viewMonths[viewMonths.length - 1] - 1]} ${String(SEASON_YEAR).slice(2)}`
    : '';

  function moveBolo(id: string, stage: Stage) {
    setBolos((prev) => prev.map((b) => (b.id === id ? { ...b, stage } : b)));
    setSelectedId(id);
  }
  function onDrop(stage: Stage) {
    if (draggingId) moveBolo(draggingId, stage);
    setDraggingId(null);
    setDragOver(null);
  }
  function advance(b: Bolo, dir: -1 | 1) {
    const next = STAGE_ORDER[STAGE_ORDER.indexOf(b.stage) + dir];
    if (next) moveBolo(b.id, next);
  }
  function runPrimary(b: Bolo) {
    const t: Partial<Record<Stage, Stage>> = { nou: 'contactat', contactat: 'pressupost', pressupost: 'guanyat' };
    const next = t[b.stage];
    if (next) moveBolo(b.id, next);
    else setSelectedId(b.id);
  }

  return (
    <main className="sl-root">
      <div className="sl-bg" aria-hidden="true" />
      <div className="sl-wrap">
        {/* Masthead — marca + àrees + senyal d'atenció */}
        <header className="sl-mast">
          <div className="sl-brand">
            <span className="sl-brand__mark">Ò</span>
            <span className="sl-brand__word">Òrbita</span>
          </div>
          <nav className="sl-nav" aria-label="Àrees de treball">
            {NAV_GROUPS.map((g) => (
              <div className="sl-nav__group" key={g.id}>
                <button
                  type="button"
                  className={`sl-nav__title${openMenu === g.id ? ' is-open' : ''}`}
                  aria-haspopup="true"
                  aria-expanded={openMenu === g.id}
                  onClick={() => setOpenMenu(openMenu === g.id ? null : g.id)}
                >
                  {g.label}
                </button>
                {openMenu === g.id && (
                  <div className="sl-nav__menu" role="menu">
                    {g.items.map((it) => (
                      <button key={it} type="button" role="menuitem" onClick={() => setOpenMenu(null)}>{it}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="sl-mast__meta">
            <span className="sl-date">{weekdayName(REF_TODAY)} {parseISO(REF_TODAY).d}</span>
            <span className={`sl-bell${attentionCount ? ' is-on' : ''}`} title={`${attentionCount} requereixen atenció`}>
              <i aria-hidden="true" />{attentionCount}
            </span>
          </div>
        </header>
        {openMenu && <button type="button" className="sl-scrim" aria-label="Tanca el menú" onClick={() => setOpenMenu(null)} />}

        {/* TEMPORADA — calendari de caps de setmana, capacitat llegida en ple/buit */}
        <section className="sl-block" aria-label="Temporada">
          <header className="sl-block__head">
            <h2>Temporada</h2>
            <div className="sl-step" role="group" aria-label="Navega pels mesos">
              <button type="button" onClick={() => setMonthAnchor((a) => Math.max(1, a - 1))} disabled={monthAnchor <= 1} aria-label="Mesos anteriors">‹</button>
              <span>{rangeLabel}</span>
              <button type="button" onClick={() => setMonthAnchor((a) => Math.min(12 - SEASON_WINDOW + 1, a + 1))} disabled={monthAnchor >= 12 - SEASON_WINDOW + 1} aria-label="Mesos següents">›</button>
            </div>
          </header>

          <div className="sl-cal">
            {months.map((month) => (
              <article className="sl-mon" key={month.m}>
                <header className="sl-mon__head">
                  <h3>{month.label}</h3>
                  <div className="sl-meter" aria-hidden="true">
                    {month.weekends.map((w) => (
                      <i
                        key={w.sat}
                        className={`sl-meter__pip${w.taken ? ' is-taken' : ''}`}
                        data-state={w.taken ? stateOf(w.taken, conflictIds) : undefined}
                      />
                    ))}
                  </div>
                </header>
                <div className="sl-grid">
                  <span className="sl-grid__h">dv</span>
                  <span className="sl-grid__h">ds</span>
                  <span className="sl-grid__h">dg</span>
                  {month.weekends.map((w) =>
                    w.days.map((d) => {
                      const b = d.bolo;
                      if (!b) {
                        return <span key={d.iso} className={`sl-cell is-free${d.inMonth ? '' : ' is-out'}`}><span className="sl-cell__day">{d.day}</span></span>;
                      }
                      return (
                        <button
                          key={d.iso}
                          type="button"
                          className={`sl-cell is-booked${b.id === selectedId ? ' is-selected' : ''}${conflictIds.has(b.id) ? ' is-conflict' : ''}${d.inMonth ? '' : ' is-out'}`}
                          data-state={stateOf(b, conflictIds)}
                          onClick={() => setSelectedId(b.id)}
                        >
                          <span className="sl-cell__day">{d.day}</span>
                          <span className="sl-cell__name">{b.client}</span>
                          {conflictIds.has(b.id) && <span className="sl-cell__warn" aria-hidden="true">⚠</span>}
                        </button>
                      );
                    }),
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* PIPELINE + DETALL — moure el lead i actuar, sense paraules sobreres */}
        <section className="sl-block" aria-label="Pipeline">
          <header className="sl-block__head">
            <h2>Pipeline</h2>
          </header>

          <div className="sl-ops">
            <div className="sl-board">
              {STAGES.map((stage) => {
                const items = bolos.filter((b) => b.stage === stage.id).sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
                return (
                  <div
                    key={stage.id}
                    className={`sl-col${dragOver === stage.id ? ' is-over' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(stage.id); }}
                    onDragLeave={() => setDragOver((s) => (s === stage.id ? null : s))}
                    onDrop={() => onDrop(stage.id)}
                  >
                    <header className="sl-col__head">
                      <span>{stage.label}</span>
                      <b>{items.length}</b>
                    </header>
                    <div className="sl-col__body">
                      {items.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className={`sl-lead${b.id === selectedId ? ' is-selected' : ''}${b.id === draggingId ? ' is-dragging' : ''}${conflictIds.has(b.id) ? ' is-conflict' : ''}`}
                          data-state={stateOf(b, conflictIds)}
                          draggable
                          onDragStart={() => setDraggingId(b.id)}
                          onDragEnd={() => { setDraggingId(null); setDragOver(null); }}
                          onClick={() => setSelectedId(b.id)}
                        >
                          <span className="sl-lead__date">{weekdayShort(b.date)} {dayLabel(b.date)}</span>
                          <span className="sl-lead__name">{b.client}</span>
                          <span className="sl-lead__val">{euro(b.value)}</span>
                          {conflictIds.has(b.id) && <span className="sl-lead__warn" aria-hidden="true">⚠</span>}
                        </button>
                      ))}
                      {items.length === 0 && <span className="sl-col__empty" aria-hidden="true" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {detail && (
              <aside className="sl-detail" data-state={stateOf(detail, conflictIds)} aria-label="Detall del bolo">
                <span className="sl-detail__type">{detail.type}</span>
                <h3 className="sl-detail__name">{detail.client}</h3>
                <p className="sl-detail__when">{weekdayName(detail.date)} {dayLabel(detail.date)}</p>
                <p className="sl-detail__val">{euro(detail.value)}</p>

                <div className="sl-detail__pay" aria-label="Cobrament">
                  <i className={detail.deposit ? 'on' : ''} />
                  <i className={detail.remaining ? 'on' : ''} />
                </div>

                <div className="sl-detail__crew">
                  {detail.resources.map((r) => (
                    <span key={r} className={`sl-tag${detailConflictResources.has(r) ? ' is-conflict' : ''}`}>{RESOURCES[r]}</span>
                  ))}
                </div>

                <div className="sl-detail__foot">
                  <div className="sl-dots" aria-label="Fase">
                    {STAGE_ORDER.map((s, i) => (
                      <i key={s} className={`sl-dots__d${detail.stage === s ? ' is-now' : ''}${i < STAGE_ORDER.indexOf(detail.stage) ? ' is-done' : ''}`} />
                    ))}
                  </div>
                  <div className="sl-detail__move" role="group" aria-label="Mou de fase">
                    <button type="button" onClick={() => advance(detail, -1)} disabled={STAGE_ORDER.indexOf(detail.stage) === 0} aria-label="Fase anterior">‹</button>
                    <button type="button" onClick={() => advance(detail, 1)} disabled={STAGE_ORDER.indexOf(detail.stage) === STAGE_ORDER.length - 1} aria-label="Fase següent">›</button>
                  </div>
                </div>

                <button type="button" className="sl-act" onClick={() => runPrimary(detail)}>{primaryActionFor(detail)}</button>
              </aside>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
