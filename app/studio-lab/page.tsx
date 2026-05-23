'use client';

/* ============================================================================
   ÒRBITA COMMAND v2 — laboratori del nou admin (/studio-lab)
   ----------------------------------------------------------------------------
   Premissa: el sistema no organitza pantalles, organitza decisions.
   v2 re-centra el concepte en el TEMPS (cada bolo és una data immòbil amb
   recursos limitats) i hi suma l'EXECUCIÓ, no només la venda:

     1. Triage "Avui"  → les decisions reals d'ara, prioritzades.
     2. Capacitat       → calendari de temporada que detecta conflictes de
                          dia/recurs ABANS que passin.
     3. Pipeline        → una lent de venda, no el centre. Re-ordenable per capa.
     4. Cockpit         → fitxa d'execució del bolo: cobrament, equip, checklist.

   Prototip intern (noindex). Dades de mostra. Iterable lliurement.
============================================================================ */

import { useEffect, useMemo, useState } from 'react';
import './studio-lab.css';

type Stage = 'nou' | 'contactat' | 'pressupost' | 'guanyat' | 'perdut';
type LensId = 'time' | 'money' | 'people' | 'ops';
type Risk = 'alt' | 'mitjà' | 'baix';
type ResourceId = 'dj' | 'so' | 'llums' | 'furgo' | 'foto';
type TriageKind = 'conflict' | 'signal' | 'speed' | 'close' | 'prod' | 'rest';
type Tone = Stage | 'conflict';

/* Avui de referència per a la temporada de mostra (estable per captures). */
const REF_TODAY = '2026-05-23';

const STAGE_ORDER: Stage[] = ['nou', 'contactat', 'pressupost', 'guanyat', 'perdut'];

const STAGES: { id: Stage; label: string }[] = [
  { id: 'nou', label: 'Noves' },
  { id: 'contactat', label: 'Contactades' },
  { id: 'pressupost', label: 'Negociant' },
  { id: 'guanyat', label: 'Guanyades' },
  { id: 'perdut', label: 'Perdudes' },
];

const RESOURCES: Record<ResourceId, string> = {
  dj: 'DJ principal',
  so: 'Tècnic de so',
  llums: 'Pack de llums',
  furgo: 'Furgoneta',
  foto: 'Fotògraf',
};

const MONTHS_CA = ['gen', 'feb', 'març', 'abr', 'maig', 'juny', 'jul', 'ago', 'set', 'oct', 'nov', 'des'];
const WEEKDAYS_CA = ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte'];

const LENSES: { id: LensId; label: string; detail: string; effect: string }[] = [
  { id: 'time', label: 'Temps', detail: 'dates · conflictes', effect: 'Pipeline ordenat per data més propera. El que crema primer, a dalt.' },
  { id: 'money', label: 'Diners', detail: 'senyals · marge', effect: 'Pipeline ordenat per import. Primer el que mou més caixa.' },
  { id: 'people', label: 'Persones', detail: 'risc · relació', effect: 'Pipeline ordenat per risc. Els clients tensos, primer.' },
  { id: 'ops', label: 'Operació', detail: 'equip · producció', effect: 'Pipeline ordenat per preparació. El menys llest, primer.' },
];

type Bolo = {
  id: string;
  client: string;
  type: string;
  date: string; // ISO YYYY-MM-DD
  value: number;
  stage: Stage;
  risk: Risk;
  resources: ResourceId[];
  deposit: boolean; // senyal cobrada
  remaining: boolean; // resta cobrada
  checklist: number; // 0..100 producció
  lastTouchDays: number; // dies des de l'últim contacte
};

const INITIAL_BOLOS: Bolo[] = [
  { id: 'b1', client: 'Laia i Nil', type: 'Boda', date: '2026-06-14', value: 2490, stage: 'pressupost', risk: 'alt', resources: ['dj', 'so', 'llums'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 4 },
  { id: 'b2', client: 'Atlas Group', type: 'Empresa', date: '2026-06-21', value: 3200, stage: 'contactat', risk: 'mitjà', resources: ['dj', 'so'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 2 },
  { id: 'b3', client: 'Festa privada BCN', type: 'Discomòbil', date: '2026-06-28', value: 700, stage: 'pressupost', risk: 'alt', resources: ['dj'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 6 },
  { id: 'b4', client: 'Masia Soler', type: 'Boda', date: '2026-07-04', value: 1890, stage: 'guanyat', risk: 'baix', resources: ['dj', 'so', 'llums', 'foto'], deposit: true, remaining: false, checklist: 35, lastTouchDays: 9 },
  { id: 'b5', client: 'Tech Nova SL', type: 'Empresa', date: '2026-07-04', value: 4100, stage: 'guanyat', risk: 'alt', resources: ['dj', 'furgo'], deposit: true, remaining: false, checklist: 10, lastTouchDays: 12 },
  { id: 'b6', client: 'Júlia & Pau', type: 'Boda', date: '2026-07-12', value: 2750, stage: 'nou', risk: 'mitjà', resources: ['dj', 'so', 'llums'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 1 },
  { id: 'b7', client: 'Ajuntament Vic', type: 'Festa major', date: '2026-08-01', value: 5600, stage: 'contactat', risk: 'mitjà', resources: ['dj', 'so', 'llums', 'furgo'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 8 },
  { id: 'b8', client: 'Bodes del Mar', type: 'Boda', date: '2026-08-08', value: 3300, stage: 'guanyat', risk: 'baix', resources: ['dj', 'so', 'foto'], deposit: true, remaining: true, checklist: 80, lastTouchDays: 3 },
  { id: 'b9', client: 'Lluís festes', type: 'Discomòbil', date: '2026-08-15', value: 850, stage: 'perdut', risk: 'alt', resources: ['dj'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 20 },
  { id: 'b10', client: 'Gala Vermut SL', type: 'Empresa', date: '2026-06-06', value: 1500, stage: 'nou', risk: 'baix', resources: ['so'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 5 },
];

/* ── Helpers purs ──────────────────────────────────────────────────────── */

function euro(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '€';
}

function daysUntil(iso: string): number {
  const a = Date.parse(`${iso}T00:00:00Z`);
  const b = Date.parse(`${REF_TODAY}T00:00:00Z`);
  return Math.round((a - b) / 86_400_000);
}

function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

function dayLabel(iso: string): string {
  const { m, d } = parseISO(iso);
  return `${d} ${MONTHS_CA[m - 1]}`;
}

function weekdayName(iso: string): string {
  const { y, m, d } = parseISO(iso);
  return WEEKDAYS_CA[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function monthIndex(iso: string): number {
  return parseISO(iso).m;
}

function riskRank(risk: Risk): number {
  return risk === 'alt' ? 3 : risk === 'mitjà' ? 2 : 1;
}

function paymentTone(b: Bolo): Tone {
  if (b.deposit && b.remaining) return 'guanyat';
  if (b.deposit) return 'pressupost';
  return 'perdut';
}

function paymentLabel(b: Bolo): string {
  if (b.deposit && b.remaining) return 'Cobrat del tot';
  if (b.deposit) return 'Senyal cobrada · resta pendent';
  return 'Sense senyal';
}

function lensComparator(lens: LensId): (a: Bolo, b: Bolo) => number {
  switch (lens) {
    case 'money':
      return (a, b) => b.value - a.value;
    case 'people':
      return (a, b) => riskRank(b.risk) - riskRank(a.risk) || b.value - a.value;
    case 'ops':
      return (a, b) => a.checklist - b.checklist || daysUntil(a.date) - daysUntil(b.date);
    case 'time':
    default:
      return (a, b) => daysUntil(a.date) - daysUntil(b.date);
  }
}

type Conflict = { date: string; resource: ResourceId; bolos: Bolo[] };

function findConflicts(bolos: Bolo[]): Conflict[] {
  const active = bolos.filter((b) => b.stage !== 'perdut');
  const byDate = new Map<string, Bolo[]>();
  for (const b of active) {
    byDate.set(b.date, [...(byDate.get(b.date) ?? []), b]);
  }
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

const ACTIONS_BY_STAGE: Record<Stage, string[]> = {
  nou: ['Respon ara per WhatsApp', 'Assigna responsable', 'Marca com a contactat'],
  contactat: ['Genera pressupost', 'Programa trucada', 'Adjunta catàleg'],
  pressupost: ['Truca per tancar la senyal', 'Envia recordatori', 'Genera contracte'],
  guanyat: ['Cobra la senyal', 'Obre checklist de producció', 'Reserva equip crític'],
  perdut: ['Registra motiu de pèrdua', 'Programa reactivació', 'Arxiva'],
};

export default function StudioLabPage() {
  const [bolos, setBolos] = useState<Bolo[]>(INITIAL_BOLOS);
  const [selectedId, setSelectedId] = useState<string>('b4');
  const [activeLens, setActiveLens] = useState<LensId>('time');
  const [activeStage, setActiveStage] = useState<Stage>('guanyat');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);
  const [lastCommand, setLastCommand] = useState<string>('Esperant decisió operativa.');
  const [clock, setClock] = useState<string>('');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setClock(`${WEEKDAYS_CA[d.getDay()]} · ${hh}:${mm}`);
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  const selected = useMemo(
    () => bolos.find((b) => b.id === selectedId) ?? bolos[0],
    [bolos, selectedId],
  );

  const conflicts = useMemo(() => findConflicts(bolos), [bolos]);

  const conflictBoloIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of conflicts) for (const b of c.bolos) ids.add(b.id);
    return ids;
  }, [conflicts]);

  const selectedConflictResources = useMemo(() => {
    const set = new Set<ResourceId>();
    for (const c of conflicts) {
      if (c.bolos.some((b) => b.id === selectedId)) set.add(c.resource);
    }
    return set;
  }, [conflicts, selectedId]);

  const pipelineValue = useMemo(
    () => bolos.filter((b) => b.stage !== 'perdut').reduce((a, b) => a + b.value, 0),
    [bolos],
  );

  const wonBolos = useMemo(() => bolos.filter((b) => b.stage === 'guanyat'), [bolos]);

  /* Triage "Avui": decisions reals, prioritzades per pes i urgència. */
  const triage = useMemo(() => {
    type Item = { id: string; kind: TriageKind; tone: Tone; kicker: string; title: string; sub: string; boloId: string; weight: number; days: number };
    const items: Item[] = [];

    conflicts.forEach((c, i) => {
      const days = daysUntil(c.date);
      items.push({
        id: `cf-${i}`,
        kind: 'conflict',
        tone: 'conflict',
        kicker: 'Conflicte de capacitat',
        title: `${RESOURCES[c.resource]} duplicat el ${dayLabel(c.date)}`,
        sub: `${c.bolos.map((b) => b.client).join(' i ')} · ${weekdayName(c.date)}`,
        boloId: c.bolos[0].id,
        weight: 100,
        days,
      });
    });

    for (const b of bolos) {
      const days = daysUntil(b.date);
      if (b.stage === 'nou' && b.lastTouchDays >= 3) {
        items.push({ id: `sp-${b.id}`, kind: 'speed', tone: 'nou', kicker: 'Resposta pendent', title: `Respon ${b.client}`, sub: `Fa ${b.lastTouchDays} dies sense contacte · la velocitat marca la conversió`, boloId: b.id, weight: 92, days });
      }
      if (b.stage === 'guanyat' && !b.deposit) {
        items.push({ id: `sg-${b.id}`, kind: 'signal', tone: 'pressupost', title: `Cobra la senyal de ${b.client}`, kicker: 'Caixa en risc', sub: `Guanyat sense senyal · ${euro(b.value)} sense bloquejar`, boloId: b.id, weight: 88, days });
      }
      if (b.stage === 'guanyat' && b.deposit && !b.remaining && days <= 21 && days >= 0) {
        items.push({ id: `sr-${b.id}`, kind: 'rest', tone: 'guanyat', kicker: 'Resta a cobrar', title: `Cobra la resta de ${b.client}`, sub: `Event d'aquí ${days} dies · resta pendent`, boloId: b.id, weight: 80, days });
      }
      if (b.stage === 'pressupost') {
        items.push({ id: `cl-${b.id}`, kind: 'close', tone: 'pressupost', kicker: 'Tancament calent', title: `Tanca el pressupost de ${b.client}`, sub: `${euro(b.value)} · ${dayLabel(b.date)} · risc ${b.risk}`, boloId: b.id, weight: 76, days });
      }
      if (b.stage === 'guanyat' && b.checklist < 50 && days <= 60 && days >= 0) {
        items.push({ id: `pr-${b.id}`, kind: 'prod', tone: 'guanyat', kicker: 'Producció pendent', title: `Prepara ${b.client}`, sub: `Checklist al ${b.checklist}% · event d'aquí ${days} dies`, boloId: b.id, weight: 70, days });
      }
    }

    return items.sort((a, b) => b.weight - a.weight || a.days - b.days).slice(0, 5);
  }, [bolos, conflicts]);

  const lens = LENSES.find((l) => l.id === activeLens) ?? LENSES[0];

  const monthlyPlan = useMemo(() => {
    const months = [6, 7, 8];
    return months.map((m) => {
      const items = bolos
        .filter((b) => monthIndex(b.date) === m)
        .sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
      const total = items.reduce((sum, b) => sum + b.value, 0);
      const highRisk = items.filter((b) => b.risk === 'alt').length;
      const won = items.filter((b) => b.stage === 'guanyat').length;
      const monthConflicts = conflicts.filter((c) => monthIndex(c.date) === m).length;
      return { m, label: MONTHS_CA[m - 1], items, total, highRisk, won, monthConflicts };
    });
  }, [bolos, conflicts]);

  function moveBolo(id: string, stage: Stage, note?: string) {
    setBolos((prev) => prev.map((b) => (b.id === id ? { ...b, stage } : b)));
    setSelectedId(id);
    setActiveStage(stage);
    const target = bolos.find((b) => b.id === id);
    setLastCommand(note ?? `${target?.client ?? 'Bolo'} → ${STAGES.find((s) => s.id === stage)?.label}.`);
  }

  function onDrop(stage: Stage) {
    if (draggingId) moveBolo(draggingId, stage);
    setDraggingId(null);
    setDragOver(null);
  }

  function shiftSelected(dir: -1 | 1) {
    const idx = STAGE_ORDER.indexOf(selected.stage);
    const next = STAGE_ORDER[idx + dir];
    if (!next) return;
    moveBolo(selected.id, next, `${selected.client} → ${STAGES.find((s) => s.id === next)?.label}.`);
  }

  function selectBolo(id: string, note?: string) {
    const b = bolos.find((x) => x.id === id);
    setSelectedId(id);
    if (b) setActiveStage(b.stage);
    if (note) setLastCommand(note);
  }

  function runCommand(command: string) {
    const transitions: Partial<Record<string, Stage>> = {
      'Marca com a contactat': 'contactat',
      'Genera pressupost': 'pressupost',
      'Genera contracte': 'guanyat',
      'Registra motiu de pèrdua': 'perdut',
    };
    const nextStage = transitions[command];
    if (nextStage) {
      moveBolo(selected.id, nextStage, `${command}: ${selected.client} → ${STAGES.find((s) => s.id === nextStage)?.label}.`);
      return;
    }
    setLastCommand(`${command}: acció preparada per ${selected.client}.`);
  }

  function nextBestAction(b: Bolo): string {
    if (selectedConflictResources.size > 0) {
      const r = Array.from(selectedConflictResources)[0];
      return `Resol el conflicte de ${RESOURCES[r]} del ${dayLabel(b.date)} abans de res.`;
    }
    switch (b.stage) {
      case 'nou':
        return b.lastTouchDays >= 3
          ? `Respon ara — fa ${b.lastTouchDays} dies que espera. La velocitat marca la conversió.`
          : 'Fes el primer contacte avui mentre l\'interès és viu.';
      case 'contactat':
        return 'Envia el pressupost mentre l\'interès és calent.';
      case 'pressupost':
        return 'Truca per tancar la senyal i bloquejar la data.';
      case 'guanyat':
        if (!b.deposit) return 'Cobra la senyal abans de res: encara no està bloquejat.';
        if (b.checklist < 100) return `Completa la producció (${b.checklist}%): equip, logística i documents.`;
        return 'Tot a punt — confirma logística amb l\'equip.';
      case 'perdut':
      default:
        return 'Registra el motiu i programa reactivació d\'aquí 3 mesos.';
    }
  }

  const pay = paymentTone(selected);

  return (
    <main className="sl-root">
      <div className="sl-shell">
        {/* Capçalera */}
        <header className="sl-header">
          <div className="sl-brand">
            <span className="sl-glyph">Ò</span>
            <div>
              <strong>Òrbita Command</strong>
              <em>sistema operatiu d&apos;esdeveniments</em>
            </div>
          </div>
          <nav className="sl-layers" aria-label="Lent activa del pipeline">
            {LENSES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === activeLens ? 'is-active' : ''}
                aria-pressed={item.id === activeLens}
                onClick={() => {
                  setActiveLens(item.id);
                  setLastCommand(`Lent ${item.label}: ${item.effect}`);
                }}
              >
                <strong>{item.label}</strong>
                <em>{item.detail}</em>
              </button>
            ))}
          </nav>
          <div className="sl-clock">
            <span>Ara</span>
            <strong>{clock || '—'}</strong>
          </div>
        </header>

        {/* Triage "Avui" — el cor: les decisions reals d'ara */}
        <section className="sl-triage" aria-label="Decisions d'avui">
          <header className="sl-triage__head">
            <div>
              <span>Avui cal decidir</span>
              <strong>{triage.length} decisions reals, per ordre d&apos;urgència</strong>
            </div>
            <em>{lens.effect}</em>
          </header>
          <div className="sl-triage__row">
            {triage.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sl-triage-card${item.boloId === selectedId ? ' is-selected' : ''}`}
                data-tone={item.tone}
                onClick={() => selectBolo(item.boloId, `${item.kicker}: ${item.title}.`)}
              >
                <span className="sl-triage-card__kicker">{item.kicker}</span>
                <strong className="sl-triage-card__title">{item.title}</strong>
                <em className="sl-triage-card__sub">{item.sub}</em>
              </button>
            ))}
            {triage.length === 0 && <p className="sl-triage__empty">Cap decisió oberta. Tot sota control.</p>}
          </div>
        </section>

        {/* KPIs vius */}
        <section className="sl-kpis" aria-label="Indicadors">
          <button type="button" className="sl-kpi sl-kpi--accent" onClick={() => setLastCommand(`Pipeline viu: ${euro(pipelineValue)} en joc.`)}>
            <span>Pipeline viu</span>
            <strong>{euro(pipelineValue)}</strong>
            <em>{bolos.filter((b) => b.stage !== 'perdut' && b.stage !== 'guanyat').length} oportunitats obertes</em>
          </button>
          <button type="button" className="sl-kpi" onClick={() => { if (wonBolos[0]) selectBolo(wonBolos[0].id, 'Bolos guanyats: revisant producció.'); }}>
            <span>Guanyats</span>
            <strong>{wonBolos.length}</strong>
            <em>{euro(wonBolos.reduce((a, b) => a + b.value, 0))} a executar</em>
          </button>
          <button type="button" className="sl-kpi" onClick={() => { if (triage[0]) selectBolo(triage[0].boloId, 'Decisions obertes: anant a la més urgent.'); }}>
            <span>Decisions obertes</span>
            <strong>{triage.length}</strong>
            <em>el triage les ordena per tu</em>
          </button>
          <button
            type="button"
            className={conflicts.length ? 'sl-kpi sl-kpi--danger' : 'sl-kpi'}
            onClick={() => { if (conflicts[0]) selectBolo(conflicts[0].bolos[0].id, `Conflicte: ${RESOURCES[conflicts[0].resource]} el ${dayLabel(conflicts[0].date)}.`); }}
          >
            <span>Conflictes</span>
            <strong>{conflicts.length}</strong>
            <em>{conflicts.length ? 'dia/recurs duplicat' : 'agenda neta'}</em>
          </button>
        </section>

        {/* Capacitat — l'espina: temporada bolo a bolo amb conflictes marcats */}
        <section className="sl-month-plan" aria-label="Capacitat de temporada">
          <header className="sl-section-head">
            <div>
              <span>Capacitat de temporada</span>
              <strong>Juny, juliol i agost bolo a bolo</strong>
            </div>
            <em>Veu la càrrega i els conflictes de dia/recurs abans d&apos;entrar al pipeline.</em>
          </header>
          {conflicts.length > 0 && (
            <div className="sl-conflict-banner" role="status">
              <strong>{conflicts.length} conflicte{conflicts.length > 1 ? 's' : ''} de capacitat</strong>
              <span>{conflicts.map((c) => `${RESOURCES[c.resource]} · ${dayLabel(c.date)}`).join('  ·  ')}</span>
            </div>
          )}
          <div className="sl-month-grid">
            {monthlyPlan.map((month) => (
              <article key={month.m} className="sl-month">
                <header className="sl-month__head">
                  <div>
                    <strong>{month.label}</strong>
                    <span>{month.items.length} bolos · {euro(month.total)}</span>
                  </div>
                  <b>{month.won}/{month.items.length} tancats</b>
                </header>
                <div className="sl-month__body">
                  {month.items.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={`sl-month-event${b.id === selectedId ? ' is-selected' : ''}${conflictBoloIds.has(b.id) ? ' is-conflict' : ''}`}
                      data-stage={b.stage}
                      onClick={() => selectBolo(b.id, `${month.label}: revisant ${b.client}.`)}
                    >
                      <span>{parseISO(b.date).d}</span>
                      <strong>{b.client}</strong>
                      <em>{b.type} · {STAGES.find((s) => s.id === b.stage)?.label}</em>
                      <b>{euro(b.value)}</b>
                    </button>
                  ))}
                  {month.items.length === 0 && <p className="sl-col__empty">Mes lliure</p>}
                </div>
                <footer className="sl-month__foot">
                  <span>{month.highRisk ? `${month.highRisk} risc alt` : 'sense risc alt'}</span>
                  <span>{month.monthConflicts ? `${month.monthConflicts} conflicte` : (month.total >= 7000 ? 'mes fort' : 'marge lliure')}</span>
                </footer>
              </article>
            ))}
          </div>
        </section>

        {/* Selector d'estat (mòbil) */}
        <nav className="sl-stage-strip" aria-label="Estat visible en mòbil">
          {STAGES.map((stage) => {
            const count = bolos.filter((b) => b.stage === stage.id).length;
            return (
              <button
                key={stage.id}
                type="button"
                className={stage.id === activeStage ? 'is-active' : ''}
                data-stage={stage.id}
                onClick={() => {
                  setActiveStage(stage.id);
                  const first = bolos.find((b) => b.stage === stage.id);
                  if (first) setSelectedId(first.id);
                }}
              >
                <strong>{stage.label}</strong>
                <span>{count}</span>
              </button>
            );
          })}
        </nav>

        {/* Pipeline — una lent de venda, re-ordenable per capa */}
        <section className="sl-board" aria-label="Pipeline de bolos">
          {STAGES.map((stage) => {
            const items = bolos
              .filter((b) => b.stage === stage.id)
              .sort(lensComparator(activeLens));
            const total = items.reduce((a, b) => a + b.value, 0);
            return (
              <div
                key={stage.id}
                className={`sl-col${dragOver === stage.id ? ' is-over' : ''}${activeStage !== stage.id ? ' is-mobile-hidden' : ''}`}
                data-stage={stage.id}
                onDragOver={(e) => { e.preventDefault(); setDragOver(stage.id); }}
                onDragLeave={() => setDragOver((s) => (s === stage.id ? null : s))}
                onDrop={() => onDrop(stage.id)}
              >
                <header className="sl-col__head">
                  <strong>{stage.label}</strong>
                  <span className="sl-col__count">{items.length}</span>
                </header>
                <div className="sl-col__sum">{euro(total)}</div>
                <div className="sl-col__body">
                  {items.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={`sl-card sl-risk-${b.risk}${b.id === selectedId ? ' is-selected' : ''}${b.id === draggingId ? ' is-dragging' : ''}${conflictBoloIds.has(b.id) ? ' is-conflict' : ''}`}
                      data-stage={b.stage}
                      draggable
                      onDragStart={() => setDraggingId(b.id)}
                      onDragEnd={() => { setDraggingId(null); setDragOver(null); }}
                      onClick={() => selectBolo(b.id)}
                    >
                      <span className="sl-card__top">
                        <span className="sl-card__date">{dayLabel(b.date)}</span>
                        <span className="sl-card__risk" aria-label={`risc ${b.risk}`} />
                      </span>
                      <strong className="sl-card__client">{b.client}</strong>
                      <span className="sl-card__type">{b.type}</span>
                      <span className="sl-card__foot">
                        <b className="sl-card__value">{euro(b.value)}</b>
                        <span className="sl-card__pay" data-pay={paymentTone(b)} aria-label={paymentLabel(b)} />
                      </span>
                    </button>
                  ))}
                  {items.length === 0 && <p className="sl-col__empty">Deixa-hi anar un bolo</p>}
                </div>
              </div>
            );
          })}
        </section>

        {/* Cockpit del bolo + senyals */}
        <section className="sl-bottom">
          <article className="sl-decision" data-stage={selected.stage}>
            <div className="sl-decision__head">
              <div>
                <span className="sl-kicker">Cockpit · {STAGES.find((s) => s.id === selected.stage)?.label}</span>
                <h2>{selected.client}</h2>
                <p className="sl-decision__meta">
                  {selected.type} · {dayLabel(selected.date)} ({weekdayName(selected.date)}) · {euro(selected.value)} · risc {selected.risk}
                </p>
              </div>
              <div className="sl-move" role="group" aria-label="Mou de fase">
                <button type="button" onClick={() => shiftSelected(-1)} disabled={STAGE_ORDER.indexOf(selected.stage) === 0} aria-label="Fase anterior">‹</button>
                <button type="button" onClick={() => shiftSelected(1)} disabled={STAGE_ORDER.indexOf(selected.stage) === STAGE_ORDER.length - 1} aria-label="Fase següent">›</button>
              </div>
            </div>

            <div className="sl-cockpit-grid">
              <div className="sl-cell" data-pay={pay}>
                <span>Cobrament</span>
                <strong>{paymentLabel(selected)}</strong>
                <div className="sl-pay-track" aria-hidden="true">
                  <i className={selected.deposit ? 'is-on' : ''} />
                  <i className={selected.remaining ? 'is-on' : ''} />
                </div>
              </div>
              <div className="sl-cell">
                <span>Producció</span>
                <strong>{selected.stage === 'guanyat' ? `${selected.checklist}% llest` : '—'}</strong>
                <div className="sl-progress" aria-hidden="true">
                  <i style={{ width: `${selected.stage === 'guanyat' ? selected.checklist : 0}%` }} />
                </div>
              </div>
            </div>

            <div className="sl-crew" aria-label="Equip necessari">
              {selected.resources.map((r) => (
                <span key={r} className={`sl-chip${selectedConflictResources.has(r) ? ' is-conflict' : ''}`}>
                  {RESOURCES[r]}{selectedConflictResources.has(r) ? ' ⚠' : ''}
                </span>
              ))}
            </div>

            <p className="sl-decision__action">{nextBestAction(selected)}</p>

            <div className="sl-command-stack">
              {ACTIONS_BY_STAGE[selected.stage].map((cmd, i) => (
                <button key={cmd} type="button" className={i === 0 ? 'is-primary' : ''} onClick={() => runCommand(cmd)}>
                  {cmd}
                </button>
              ))}
            </div>

            <div className="sl-command-log" aria-live="polite">
              <span>Últim moviment</span>
              <strong>{lastCommand}</strong>
            </div>
          </article>

          <aside className="sl-signal-grid" aria-label="Decisions en cua">
            <header className="sl-signal-grid__head">Cua de decisions</header>
            {triage.map((item) => (
              <button
                key={`q-${item.id}`}
                type="button"
                className={`sl-signal${item.boloId === selectedId ? ' is-selected' : ''}`}
                data-stage={item.tone === 'conflict' ? 'perdut' : item.tone}
                onClick={() => selectBolo(item.boloId, `${item.kicker}: ${item.title}.`)}
              >
                <span>{item.kicker}</span>
                <strong>{item.title}</strong>
              </button>
            ))}
            {triage.length === 0 && <p className="sl-col__empty">Cua buida.</p>}
          </aside>
        </section>
      </div>
    </main>
  );
}
