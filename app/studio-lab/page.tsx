'use client';

/* ============================================================================
   ÒRBITA — laboratori del nou admin (/studio-lab) · reconstrucció de zero
   ----------------------------------------------------------------------------
   Tesi: un negoci d'esdeveniments no es gestiona amb menús i llistes, es
   gestiona amb el TEMPS i amb UNA sola decisió a la vegada.

   La pantalla respon dues coses i prou:
     1) Què he de fer ara  → una única zona de FOCUS (decisió o fitxa del bolo).
     2) Com s'omple la temporada → el CALENDARI de 3 mesos (reserves + forats).

   Tot el soroll fora: ni KPIs, ni kanban de 5 columnes, ni barra de lents, ni
   log. Mínima informació, només l'important. Premium i gairebé monocrom + or.

   Prototip intern (noindex). Dades de mostra. Iterable lliurement.
============================================================================ */

import { useMemo, useState } from 'react';
import './studio-lab.css';

type Stage = 'nou' | 'contactat' | 'pressupost' | 'guanyat' | 'perdut';
type Risk = 'alt' | 'mitjà' | 'baix';
type ResourceId = 'dj' | 'so' | 'llums' | 'furgo' | 'foto';
type Health = 'urgent' | 'watch' | 'ok' | 'idle';
type DotState = 'attention' | 'progress' | 'settled' | 'conflict' | 'idle';

const REF_TODAY = '2026-05-23';
const SEASON_YEAR = 2026;
const SEASON_WINDOW = 3; // mesos visibles alhora

const STAGE_ORDER: Stage[] = ['nou', 'contactat', 'pressupost', 'guanyat', 'perdut'];
const STAGE_LABEL: Record<Stage, string> = {
  nou: 'Nova',
  contactat: 'Contactada',
  pressupost: 'Negociant',
  guanyat: 'Reservat',
  perdut: 'Perduda',
};

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

type Bolo = {
  id: string;
  client: string;
  type: string;
  date: string; // ISO YYYY-MM-DD
  value: number;
  stage: Stage;
  risk: Risk;
  resources: ResourceId[];
  deposit: boolean;
  remaining: boolean;
  checklist: number; // 0..100
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
  const a = Date.parse(`${iso}T00:00:00Z`);
  const b = Date.parse(`${REF_TODAY}T00:00:00Z`);
  return Math.round((a - b) / 86_400_000);
}
function dayLabel(iso: string): string {
  const { m, d } = parseISO(iso);
  return `${d} ${MONTHS_CA[m - 1]}`;
}
function weekdayIndex(iso: string): number {
  const { y, m, d } = parseISO(iso);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
function weekdayName(iso: string): string {
  return WEEKDAYS_CA[weekdayIndex(iso)];
}
function weekdayShort(iso: string): string {
  return WEEKDAYS_SHORT_CA[weekdayIndex(iso)];
}
function shiftIso(iso: string, days: number): string {
  const { y, m, d } = parseISO(iso);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return isoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}
function monthIndex(iso: string): number {
  return parseISO(iso).m;
}
function saturdaysInMonth(y: number, m: number): string[] {
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out: string[] = [];
  for (let d = 1; d <= last; d++) {
    if (new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 6) out.push(isoDate(y, m, d));
  }
  return out;
}

function healthOf(b: Bolo, conflictIds: Set<string>): Health {
  if (b.stage === 'perdut') return 'idle';
  if (conflictIds.has(b.id)) return 'urgent';
  if (b.stage === 'nou' && b.lastTouchDays >= 3) return 'urgent';
  if (b.stage === 'guanyat' && !b.deposit) return 'urgent';
  if (b.stage === 'guanyat' && b.deposit && b.remaining && b.checklist >= 100) return 'ok';
  return 'watch';
}

function stateOf(b: Bolo, conflictIds: Set<string>): DotState {
  if (conflictIds.has(b.id)) return 'conflict';
  switch (healthOf(b, conflictIds)) {
    case 'urgent': return 'attention';
    case 'ok': return 'settled';
    case 'idle': return 'idle';
    default: return 'progress';
  }
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

function primaryActionFor(b: Bolo): string {
  switch (b.stage) {
    case 'nou': return 'Respon ara';
    case 'contactat': return 'Envia el pressupost';
    case 'pressupost': return 'Tanca la senyal';
    case 'guanyat':
      if (!b.deposit) return 'Cobra la senyal';
      if (b.checklist < 100) return 'Obre la producció';
      return 'Confirma la logística';
    case 'perdut':
    default: return 'Reactiva el contacte';
  }
}

function nextStepFor(b: Bolo, conflictResources: Set<ResourceId>): string {
  if (conflictResources.size > 0) {
    const r = Array.from(conflictResources)[0];
    return `Tens el ${RESOURCES[r]} duplicat el mateix dia. Resol-ho abans de res.`;
  }
  switch (b.stage) {
    case 'nou':
      return b.lastTouchDays >= 3
        ? `Fa ${b.lastTouchDays} dies que espera resposta. La velocitat marca la conversió.`
        : 'Fes el primer contacte avui, mentre l\'interès és viu.';
    case 'contactat':
      return 'Envia el pressupost mentre l\'interès és calent.';
    case 'pressupost':
      return 'Truca per tancar la senyal i bloquejar la data.';
    case 'guanyat':
      if (!b.deposit) return 'Encara no està bloquejat: cobra la senyal.';
      if (b.checklist < 100) return `Producció al ${b.checklist}%: equip, logística i documents.`;
      return 'Tot a punt. Confirma la logística amb l\'equip.';
    case 'perdut':
    default:
      return 'Programa una reactivació d\'aquí uns mesos.';
  }
}

/* Cua de decisions: ordenada per pes i urgència. El cor del FOCUS. */
type Decision = { id: string; boloId: string; kicker: string; title: string; why: string };

export default function StudioLabPage() {
  const [bolos, setBolos] = useState<Bolo[]>(INITIAL_BOLOS);
  const [selectedId, setSelectedId] = useState<string | null>(null); // null = mode prioritats
  const [focusIndex, setFocusIndex] = useState(0);
  const [monthAnchor, setMonthAnchor] = useState(6); // Juny
  const [note, setNote] = useState<string | null>(null);

  const conflicts = useMemo(() => findConflicts(bolos), [bolos]);
  const conflictIds = useMemo(() => {
    const s = new Set<string>();
    for (const c of conflicts) for (const b of c.bolos) s.add(b.id);
    return s;
  }, [conflicts]);

  const decisions = useMemo<Decision[]>(() => {
    type D = Decision & { weight: number; days: number };
    const items: D[] = [];
    conflicts.forEach((c, i) => {
      items.push({
        id: `cf-${i}`, boloId: c.bolos[0].id, weight: 100, days: daysUntil(c.date),
        kicker: 'Conflicte de capacitat',
        title: `${RESOURCES[c.resource]} duplicat el ${dayLabel(c.date)}`,
        why: `${c.bolos.map((b) => b.client).join(' i ')} es trepitgen el mateix recurs i dia.`,
      });
    });
    for (const b of bolos) {
      const days = daysUntil(b.date);
      if (b.stage === 'nou' && b.lastTouchDays >= 3)
        items.push({ id: `sp-${b.id}`, boloId: b.id, weight: 92, days, kicker: 'Resposta pendent', title: `Respon ${b.client}`, why: `Fa ${b.lastTouchDays} dies que espera. Cada dia perd conversió.` });
      if (b.stage === 'guanyat' && !b.deposit)
        items.push({ id: `sg-${b.id}`, boloId: b.id, weight: 88, days, kicker: 'Caixa en risc', title: `Cobra la senyal de ${b.client}`, why: `${euro(b.value)} reservats sense senyal: la data no està bloquejada.` });
      if (b.stage === 'guanyat' && b.deposit && !b.remaining && days <= 21 && days >= 0)
        items.push({ id: `sr-${b.id}`, boloId: b.id, weight: 80, days, kicker: 'Resta a cobrar', title: `Resta de ${b.client}`, why: `Falten ${days} dies per a l'esdeveniment i la resta segueix pendent.` });
      if (b.stage === 'pressupost')
        items.push({ id: `cl-${b.id}`, boloId: b.id, weight: 76, days, kicker: 'A tancar', title: `Tanca ${b.client}`, why: `${euro(b.value)} en joc, encara negociant.` });
      if (b.stage === 'guanyat' && b.checklist < 50 && days <= 60 && days >= 0)
        items.push({ id: `pr-${b.id}`, boloId: b.id, weight: 70, days, kicker: 'Producció', title: `Prepara ${b.client}`, why: `Producció al ${b.checklist}% i l'esdeveniment s'acosta.` });
    }
    return items.sort((a, b) => b.weight - a.weight || a.days - b.days).slice(0, 6);
  }, [bolos, conflicts]);

  const selected = useMemo(() => bolos.find((b) => b.id === selectedId) ?? null, [bolos, selectedId]);
  const safeFocusIndex = decisions.length ? Math.min(focusIndex, decisions.length - 1) : 0;
  const focusDecision = decisions[safeFocusIndex] ?? null;

  const selectedConflictResources = useMemo(() => {
    const set = new Set<ResourceId>();
    if (!selected) return set;
    for (const c of conflicts) if (c.bolos.some((b) => b.id === selected.id)) set.add(c.resource);
    return set;
  }, [conflicts, selected]);

  const viewMonths = useMemo(
    () => Array.from({ length: SEASON_WINDOW }, (_, i) => monthAnchor + i).filter((m) => m >= 1 && m <= 12),
    [monthAnchor],
  );

  const months = useMemo(() => {
    return viewMonths.map((m) => {
      const events = bolos
        .filter((b) => monthIndex(b.date) === m && b.stage !== 'perdut')
        .sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
      const freeSaturdays = saturdaysInMonth(SEASON_YEAR, m)
        .filter((sat) => {
          const span = new Set([shiftIso(sat, -1), sat, shiftIso(sat, 1)]);
          return !bolos.some((b) => b.stage !== 'perdut' && span.has(b.date));
        })
        .map((sat) => parseISO(sat).d);
      return { m, label: MONTHS_FULL_CA[m - 1], events, freeSaturdays };
    });
  }, [viewMonths, bolos]);

  const rangeLabel = viewMonths.length
    ? `${MONTHS_FULL_CA[viewMonths[0] - 1]} – ${MONTHS_FULL_CA[viewMonths[viewMonths.length - 1] - 1]} ${SEASON_YEAR}`
    : '';

  function openBolo(id: string) {
    setSelectedId(id);
    setNote(null);
  }
  function backToPriorities() {
    setSelectedId(null);
    setNote(null);
  }
  function cycleFocus(dir: -1 | 1) {
    if (!decisions.length) return;
    setFocusIndex((i) => (Math.min(i, decisions.length - 1) + dir + decisions.length) % decisions.length);
  }
  function advance(b: Bolo, dir: -1 | 1) {
    const idx = STAGE_ORDER.indexOf(b.stage);
    const next = STAGE_ORDER[idx + dir];
    if (!next) return;
    setBolos((prev) => prev.map((x) => (x.id === b.id ? { ...x, stage: next } : x)));
    setNote(`${b.client} → ${STAGE_LABEL[next]}.`);
  }
  function runPrimary(b: Bolo) {
    const transitions: Partial<Record<Stage, Stage>> = { nou: 'contactat', contactat: 'pressupost', pressupost: 'guanyat' };
    const next = transitions[b.stage];
    if (next) {
      setBolos((prev) => prev.map((x) => (x.id === b.id ? { ...x, stage: next } : x)));
      setNote(`${primaryActionFor(b)} · ${b.client} → ${STAGE_LABEL[next]}.`);
      return;
    }
    setNote(`${primaryActionFor(b)} · acció preparada per ${b.client}.`);
  }

  return (
    <main className="sl-root">
      <div className="sl-app">
        {/* Barra superior — mínima: marca + temporada */}
        <header className="sl-top">
          <div className="sl-brand">
            <span className="sl-brand__mark">Ò</span>
            <span className="sl-brand__name">Òrbita</span>
          </div>
          <div className="sl-today">{weekdayName(REF_TODAY)} · {dayLabel(REF_TODAY)}</div>
        </header>

        {/* FOCUS — una sola cosa: la decisió més important o el bolo obert */}
        <section className="sl-focus" aria-label="Focus">
          {selected ? (
            <article className="sl-focus__card" data-state={stateOf(selected, conflictIds)}>
              <button type="button" className="sl-back" onClick={backToPriorities}>‹ Prioritats</button>
              <p className="sl-focus__kicker">{STAGE_LABEL[selected.stage]} · {selected.type}</p>
              <h1 className="sl-focus__title">{selected.client}</h1>
              <p className="sl-focus__line">
                <span>{weekdayName(selected.date)} {dayLabel(selected.date)}</span>
                <span className="sl-sep" />
                <span>{euro(selected.value)}</span>
              </p>

              <p className="sl-focus__step">{nextStepFor(selected, selectedConflictResources)}</p>

              <div className="sl-meta">
                <div className="sl-meta__item">
                  <span>Cobrament</span>
                  <div className="sl-pay" aria-hidden="true">
                    <i className={selected.deposit ? 'on' : ''} />
                    <i className={selected.remaining ? 'on' : ''} />
                  </div>
                  <b>{selected.deposit && selected.remaining ? 'Cobrat' : selected.deposit ? 'Senyal' : 'Sense senyal'}</b>
                </div>
                <div className="sl-meta__item">
                  <span>Equip</span>
                  <div className="sl-crew">
                    {selected.resources.map((r) => (
                      <span key={r} className={`sl-crew__chip${selectedConflictResources.has(r) ? ' is-conflict' : ''}`}>{RESOURCES[r]}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sl-actions">
                <button type="button" className="sl-btn sl-btn--primary" onClick={() => runPrimary(selected)}>{primaryActionFor(selected)}</button>
                <div className="sl-stage-move" role="group" aria-label="Mou de fase">
                  <button type="button" onClick={() => advance(selected, -1)} disabled={STAGE_ORDER.indexOf(selected.stage) === 0} aria-label="Fase anterior">‹</button>
                  <button type="button" onClick={() => advance(selected, 1)} disabled={STAGE_ORDER.indexOf(selected.stage) === STAGE_ORDER.length - 1} aria-label="Fase següent">›</button>
                </div>
              </div>
              {note && <p className="sl-note" aria-live="polite">{note}</p>}
            </article>
          ) : focusDecision ? (
            <article className="sl-focus__card" data-state={conflictIds.has(focusDecision.boloId) ? 'conflict' : 'attention'}>
              <p className="sl-focus__kicker">El següent pas · {focusDecision.kicker}</p>
              <h1 className="sl-focus__title">{focusDecision.title}</h1>
              <p className="sl-focus__step">{focusDecision.why}</p>
              <div className="sl-actions">
                <button type="button" className="sl-btn sl-btn--primary" onClick={() => openBolo(focusDecision.boloId)}>Obre i resol</button>
                <div className="sl-queue" role="group" aria-label="Altres decisions">
                  <button type="button" onClick={() => cycleFocus(-1)} aria-label="Decisió anterior">‹</button>
                  <span>{safeFocusIndex + 1} / {decisions.length}</span>
                  <button type="button" onClick={() => cycleFocus(1)} aria-label="Decisió següent">›</button>
                </div>
              </div>
            </article>
          ) : (
            <article className="sl-focus__card sl-focus__card--calm">
              <p className="sl-focus__kicker">El següent pas</p>
              <h1 className="sl-focus__title">Tot sota control.</h1>
              <p className="sl-focus__step">Cap decisió oberta. Mira la temporada i omple els caps de setmana lliures.</p>
            </article>
          )}
        </section>

        {/* TEMPORADA — el calendari: reserves + forats, 3 mesos */}
        <section className="sl-season" aria-label="Temporada">
          <header className="sl-season__head">
            <h2>Temporada</h2>
            <div className="sl-range">
              <button type="button" onClick={() => setMonthAnchor((a) => Math.max(1, a - 1))} disabled={monthAnchor <= 1} aria-label="Mesos anteriors">‹</button>
              <span>{rangeLabel}</span>
              <button type="button" onClick={() => setMonthAnchor((a) => Math.min(12 - SEASON_WINDOW + 1, a + 1))} disabled={monthAnchor >= 12 - SEASON_WINDOW + 1} aria-label="Mesos següents">›</button>
            </div>
          </header>

          <div className="sl-months">
            {months.map((month) => (
              <article key={month.m} className="sl-month">
                <header className="sl-month__head">
                  <h3>{month.label}</h3>
                  <span>{month.events.length} {month.events.length === 1 ? 'reserva' : 'reserves'}</span>
                </header>

                <ul className="sl-events">
                  {month.events.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        className={`sl-event${b.id === selectedId ? ' is-selected' : ''}`}
                        onClick={() => openBolo(b.id)}
                      >
                        <i className="sl-dot" data-state={stateOf(b, conflictIds)} aria-hidden="true" />
                        <span className="sl-event__date">{weekdayShort(b.date)} {parseISO(b.date).d}</span>
                        <span className="sl-event__client">{b.client}</span>
                        {conflictIds.has(b.id) && <span className="sl-event__flag" aria-hidden="true">⚠</span>}
                      </button>
                    </li>
                  ))}
                  {month.events.length === 0 && <li className="sl-events__empty">Mes lliure</li>}
                </ul>

                {month.freeSaturdays.length > 0 && (
                  <div className="sl-free" aria-label={`Dissabtes lliures de ${month.label}`}>
                    <span className="sl-free__label">Lliure</span>
                    {month.freeSaturdays.map((d) => (
                      <span key={d} className="sl-free__day">{d}</span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
