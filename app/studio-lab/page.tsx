'use client';

/* ============================================================================
   ÒRBITA COMMAND v2 — laboratori del nou admin (/studio-lab)
   ----------------------------------------------------------------------------
   Premissa: el sistema no organitza pantalles, organitza decisions.
   Re-centrat en el TEMPS (cada bolo és una data immòbil amb recursos limitats)
   i en l'EXECUCIÓ, no només la venda.

   COLOR amb UN sol significat (semàfor d'atenció), igual a tota la pàgina:
     · Actua ara (urgent)  · En marxa (watch)  · Tancat (ok)  · Inactiu (idle)
   La fase la diuen columna i títol, no el color (amb llegenda visible).

   Capacitat: finestra de 3 mesos navegable per tot l'any, amb el dia de la
   setmana i els forats de cap de setmana visibles (dissabtes lliures = a omplir).

   Prototip intern (noindex). Dades de mostra. Iterable lliurement.
============================================================================ */

import { useEffect, useMemo, useState } from 'react';
import './studio-lab.css';

type Stage = 'nou' | 'contactat' | 'pressupost' | 'guanyat' | 'perdut';
type LensId = 'time' | 'money' | 'people' | 'ops';
type Risk = 'alt' | 'mitjà' | 'baix';
type ResourceId = 'dj' | 'so' | 'llums' | 'furgo' | 'foto';
type TriageKind = 'conflict' | 'signal' | 'speed' | 'close' | 'prod' | 'rest';
type Health = 'urgent' | 'watch' | 'ok' | 'idle';

/* Avui de referència per a la temporada de mostra (estable per captures). */
const REF_TODAY = '2026-05-23';
const SEASON_YEAR = 2026;
const SEASON_WINDOW = 3; // mesos visibles alhora (apilats), navegables per tot l'any

const STAGE_ORDER: Stage[] = ['nou', 'contactat', 'pressupost', 'guanyat', 'perdut'];

const STAGES: { id: Stage; label: string }[] = [
  { id: 'nou', label: 'Noves' },
  { id: 'contactat', label: 'Contactades' },
  { id: 'pressupost', label: 'Negociant' },
  { id: 'guanyat', label: 'Guanyades' },
  { id: 'perdut', label: 'Perdudes' },
];

const HEALTH_LABEL: Record<Health, string> = {
  urgent: 'Actua ara',
  watch: 'En marxa',
  ok: 'Tancat',
  idle: 'Inactiu',
};

const HEALTH_LEGEND: { id: Health; label: string; hint: string }[] = [
  { id: 'urgent', label: 'Actua ara', hint: 'urgent' },
  { id: 'watch', label: 'En marxa', hint: 'obert' },
  { id: 'ok', label: 'Tancat', hint: 'ok' },
  { id: 'idle', label: 'Inactiu', hint: 'pausat' },
];

const RESOURCES: Record<ResourceId, string> = {
  dj: 'DJ principal',
  so: 'Tècnic de so',
  llums: 'Pack de llums',
  furgo: 'Furgoneta',
  foto: 'Fotògraf',
};

const MONTHS_CA = ['gen', 'feb', 'març', 'abr', 'maig', 'juny', 'jul', 'ago', 'set', 'oct', 'nov', 'des'];
const MONTHS_FULL_CA = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
const WEEKDAYS_CA = ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte'];
const WEEKDAYS_SHORT_CA = ['dg', 'dl', 'dt', 'dc', 'dj', 'dv', 'ds'];

const LENSES: { id: LensId; label: string; effect: string }[] = [
  { id: 'time', label: 'Temps', effect: 'Pipeline ordenat per data més propera. El que crema primer, a dalt.' },
  { id: 'money', label: 'Diners', effect: 'Pipeline ordenat per import. Primer el que mou més caixa.' },
  { id: 'people', label: 'Persones', effect: 'Pipeline ordenat per risc. Els clients tensos, primer.' },
  { id: 'ops', label: 'Operació', effect: 'Pipeline ordenat per preparació. El menys llest, primer.' },
];

/* Àrees de treball del nou admin (navegació superior amb desplegables). */
const NAV_GROUPS: { id: string; label: string; hint: string; items: string[] }[] = [
  { id: 'comercial', label: 'Comercial', hint: 'entrades · clients', items: ['Entrades', 'Clients', 'Pressupostos', 'Pipeline'] },
  { id: 'operacio', label: 'Operació', hint: 'reserves · agenda', items: ['Reserves', 'Calendari', 'Tasques', 'Equip i inventari'] },
  { id: 'diners', label: 'Diners', hint: 'factures · marges', items: ['Facturació', 'Cobraments', 'Marges', 'Preus i packs'] },
  { id: 'marqueting', label: 'Màrqueting', hint: 'catàleg · ads', items: ['Catàleg', 'Ressenyes', 'Blog', 'Integracions'] },
  { id: 'sistema', label: 'Sistema', hint: 'safata · ajustos', items: ['Safata', 'Correus', 'Informes', 'Configuració'] },
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
  { id: 'b11', client: 'Tardor Corporativa', type: 'Empresa', date: '2026-09-12', value: 3800, stage: 'contactat', risk: 'mitjà', resources: ['dj', 'so', 'llums'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 5 },
  { id: 'b12', client: 'Boda de tardor', type: 'Boda', date: '2026-10-03', value: 2900, stage: 'nou', risk: 'baix', resources: ['dj', 'so', 'foto'], deposit: false, remaining: false, checklist: 0, lastTouchDays: 2 },
];

/* ── Helpers purs ──────────────────────────────────────────────────────── */

function euro(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '€';
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

function isWeekend(iso: string): boolean {
  const wd = weekdayIndex(iso);
  return wd === 0 || wd === 5 || wd === 6; // dg, dv, ds
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

function riskRank(risk: Risk): number {
  return risk === 'alt' ? 3 : risk === 'mitjà' ? 2 : 1;
}

function paymentHealth(b: Bolo): Health {
  if (b.deposit && b.remaining) return 'ok';
  if (b.deposit) return 'watch';
  return 'urgent';
}

function paymentLabel(b: Bolo): string {
  if (b.deposit && b.remaining) return 'Cobrat del tot';
  if (b.deposit) return 'Senyal cobrada · resta pendent';
  return 'Sense senyal';
}

/* Salut = un sol significat per al color. */
function healthOf(b: Bolo, conflictIds: Set<string>): Health {
  if (b.stage === 'perdut') return 'idle';
  if (conflictIds.has(b.id)) return 'urgent';
  if (b.stage === 'nou' && b.lastTouchDays >= 3) return 'urgent';
  if (b.stage === 'guanyat' && !b.deposit) return 'urgent';
  if (b.stage === 'guanyat' && b.deposit && b.remaining && b.checklist >= 100) return 'ok';
  return 'watch';
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

const KIND_HEALTH: Record<TriageKind, Health> = {
  conflict: 'urgent',
  speed: 'urgent',
  signal: 'urgent',
  close: 'watch',
  rest: 'watch',
  prod: 'watch',
};

export default function StudioLabPage() {
  const [bolos, setBolos] = useState<Bolo[]>(INITIAL_BOLOS);
  const [selectedId, setSelectedId] = useState<string>('b4');
  const [activeLens, setActiveLens] = useState<LensId>('time');
  const [activeStage, setActiveStage] = useState<Stage>('guanyat');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [monthAnchor, setMonthAnchor] = useState<number>(6); // Juny
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);
  const [lastCommand, setLastCommand] = useState<string>('A punt.');
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
    type Item = { id: string; kind: TriageKind; kicker: string; title: string; sub: string; boloId: string; weight: number; days: number };
    const items: Item[] = [];

    conflicts.forEach((c, i) => {
      const days = daysUntil(c.date);
      items.push({
        id: `cf-${i}`,
        kind: 'conflict',
        kicker: 'Conflicte de capacitat',
        title: `${RESOURCES[c.resource]} duplicat el ${dayLabel(c.date)}`,
        sub: c.bolos.map((b) => b.client).join(' + '),
        boloId: c.bolos[0].id,
        weight: 100,
        days,
      });
    });

    for (const b of bolos) {
      const days = daysUntil(b.date);
      if (b.stage === 'nou' && b.lastTouchDays >= 3) {
        items.push({ id: `sp-${b.id}`, kind: 'speed', kicker: 'Resposta pendent', title: `Respon ${b.client}`, sub: `${b.lastTouchDays} dies`, boloId: b.id, weight: 92, days });
      }
      if (b.stage === 'guanyat' && !b.deposit) {
        items.push({ id: `sg-${b.id}`, kind: 'signal', kicker: 'Caixa en risc', title: `Cobra ${b.client}`, sub: euro(b.value), boloId: b.id, weight: 88, days });
      }
      if (b.stage === 'guanyat' && b.deposit && !b.remaining && days <= 21 && days >= 0) {
        items.push({ id: `sr-${b.id}`, kind: 'rest', kicker: 'Resta a cobrar', title: `Resta ${b.client}`, sub: `${days} dies`, boloId: b.id, weight: 80, days });
      }
      if (b.stage === 'pressupost') {
        items.push({ id: `cl-${b.id}`, kind: 'close', kicker: 'Tancar', title: b.client, sub: euro(b.value), boloId: b.id, weight: 76, days });
      }
      if (b.stage === 'guanyat' && b.checklist < 50 && days <= 60 && days >= 0) {
        items.push({ id: `pr-${b.id}`, kind: 'prod', kicker: 'Producció', title: `Prepara ${b.client}`, sub: `${b.checklist}%`, boloId: b.id, weight: 70, days });
      }
    }

    return items.sort((a, b) => b.weight - a.weight || a.days - b.days).slice(0, 5);
  }, [bolos, conflicts]);

  const lens = LENSES.find((l) => l.id === activeLens) ?? LENSES[0];

  /* Finestra de 2-3 mesos apilats. Cada mes és un calendari de caps de setmana
     (Dv/Ds/Dg) a tot l'ample, perquè quadrin sense atapeir-se horitzontalment.
     Casella ocupada → bolo; casella sense bolo → lliure visible. */
  const monthsPlan = useMemo(() => {
    const boloByDate = new Map<string, Bolo>();
    for (const b of bolos) if (b.stage !== 'perdut' && !boloByDate.has(b.date)) boloByDate.set(b.date, b);

    const months = Array.from({ length: SEASON_WINDOW }, (_, i) => monthAnchor + i).filter((m) => m >= 1 && m <= 12);
    return months.map((m) => {
      const items = bolos
        .filter((b) => monthIndex(b.date) === m)
        .sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
      const total = items.reduce((sum, b) => sum + b.value, 0);
      const won = items.filter((b) => b.stage === 'guanyat').length;
      const weekends = saturdaysInMonth(SEASON_YEAR, m).map((sat) => ({
        sat,
        days: [shiftIso(sat, -1), sat, shiftIso(sat, 1)].map((iso) => ({
          iso,
          day: parseISO(iso).d,
          wd: weekdayShort(iso),
          inMonth: monthIndex(iso) === m,
          bolo: boloByDate.get(iso) ?? null,
        })),
      }));
      const freeWeekends = weekends.filter((w) => !w.days.some((d) => d.bolo)).length;
      const weekdayItems = items.filter((b) => !isWeekend(b.date));
      return { m, label: MONTHS_FULL_CA[m - 1], items, total, won, weekends, freeWeekends, weekdayItems };
    });
  }, [monthAnchor, bolos]);

  const rangeLabel = monthsPlan.length
    ? `${monthsPlan[0].label} – ${monthsPlan[monthsPlan.length - 1].label} ${SEASON_YEAR}`
    : '';

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

  const selectedHealth = healthOf(selected, conflictBoloIds);

  return (
    <main className="sl-root">
      <div className="sl-shell">
        {/* Capçalera */}
        <header className="sl-header">
          <div className="sl-brand">
            <span className="sl-glyph">Ò</span>
            <div>
              <strong>Òrbita Command</strong>
              <em>events ops</em>
            </div>
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
                      <button
                        key={it}
                        type="button"
                        role="menuitem"
                        onClick={() => { setLastCommand(`Navegaria a ${g.label} › ${it}.`); setOpenMenu(null); }}
                      >
                        {it}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="sl-clock">
            <span>Ara</span>
            <strong>{clock || '—'}</strong>
          </div>
        </header>
        {openMenu && <button type="button" className="sl-nav__backdrop" aria-label="Tanca el menú" onClick={() => setOpenMenu(null)} />}

        {/* Triage "Avui" — el cor: les decisions reals d'ara */}
        <section className="sl-triage" aria-label="Decisions d'avui">
          <header className="sl-triage__head">
            <div>
              <span>Avui</span>
              <strong>{triage.length} decisions</strong>
            </div>
          </header>
          <div className="sl-triage__row">
            {triage.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sl-triage-card${item.boloId === selectedId ? ' is-selected' : ''}`}
                data-health={KIND_HEALTH[item.kind]}
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

        {/* KPIs — línia fina */}
        <section className="sl-kpis" aria-label="Indicadors">
          <button type="button" className="sl-kpi sl-kpi--accent" title={`${bolos.filter((b) => b.stage !== 'perdut' && b.stage !== 'guanyat').length} oportunitats obertes`} onClick={() => setLastCommand(`Pipeline viu: ${euro(pipelineValue)} en joc.`)}>
            <span>Pipeline viu</span>
            <strong>{euro(pipelineValue)}</strong>
          </button>
          <button type="button" className="sl-kpi" title={`${euro(wonBolos.reduce((a, b) => a + b.value, 0))} a executar`} onClick={() => { if (wonBolos[0]) selectBolo(wonBolos[0].id, 'Bolos guanyats: revisant producció.'); }}>
            <span>Guanyats</span>
            <strong>{wonBolos.length}</strong>
          </button>
          <button type="button" className="sl-kpi" title="El triage les ordena per tu" onClick={() => { if (triage[0]) selectBolo(triage[0].boloId, 'Decisions obertes: anant a la més urgent.'); }}>
            <span>Decisions</span>
            <strong>{triage.length}</strong>
          </button>
          <button
            type="button"
            className={conflicts.length ? 'sl-kpi sl-kpi--danger' : 'sl-kpi'}
            title={conflicts.length ? 'dia/recurs duplicat' : 'agenda neta'}
            onClick={() => { if (conflicts[0]) selectBolo(conflicts[0].bolos[0].id, `Conflicte: ${RESOURCES[conflicts[0].resource]} el ${dayLabel(conflicts[0].date)}.`); }}
          >
            <span>Conflictes</span>
            <strong>{conflicts.length}</strong>
          </button>
        </section>

        {/* Capacitat — 2-3 mesos apilats, cada mes com a calendari de caps de setmana (Dv/Ds/Dg) */}
        <section className="sl-month-plan" aria-label="Capacitat de temporada">
          <header className="sl-section-head">
            <div>
              <span>Agenda</span>
              <strong>{rangeLabel}</strong>
            </div>
            <div className="sl-monthnav" role="group" aria-label="Navega pels mesos">
              <button type="button" onClick={() => setMonthAnchor((a) => Math.max(1, a - 1))} disabled={monthAnchor <= 1} aria-label="Mesos anteriors">‹</button>
              <button type="button" onClick={() => setMonthAnchor((a) => Math.min(12 - SEASON_WINDOW + 1, a + 1))} disabled={monthAnchor >= 12 - SEASON_WINDOW + 1} aria-label="Mesos següents">›</button>
            </div>
          </header>
          {conflicts.length > 0 && (
            <div className="sl-conflict-banner" role="status">
              <strong>{conflicts.length} conflicte{conflicts.length > 1 ? 's' : ''} de capacitat</strong>
              <span>{conflicts.map((c) => `${RESOURCES[c.resource]} · ${dayLabel(c.date)}`).join('  ·  ')}</span>
            </div>
          )}
          <div className="sl-season">
            {monthsPlan.map((month) => (
              <article className="sl-month-block" key={month.m}>
                <header className="sl-month-block__head">
                  <strong>{month.label}</strong>
                  <div className="sl-month-meta">
                    <span><b>{month.items.length}</b> bolos</span>
                    <span><b>{euro(month.total)}</b></span>
                    <span><b>{month.won}/{month.items.length}</b> tancats</span>
                    <span>{month.freeWeekends
                      ? `${month.freeWeekends} cap${month.freeWeekends > 1 ? 's' : ''} de setmana lliure${month.freeWeekends > 1 ? 's' : ''}`
                      : 'agenda plena'}</span>
                  </div>
                </header>
                <div className="sl-wkcal" aria-label={`Caps de setmana de ${month.label}`}>
                  <span className="sl-wkcal__h">Divendres</span>
                  <span className="sl-wkcal__h">Dissabte</span>
                  <span className="sl-wkcal__h">Diumenge</span>
                  {month.weekends.map((w) =>
                    w.days.map((d) => {
                      const b = d.bolo;
                      if (!b) {
                        return (
                          <div key={d.iso} className={`sl-slot is-free${d.inMonth ? '' : ' is-out'}`}>
                            <span className="sl-slot__day"><i>{d.wd}</i> {d.day}</span>
                            <em className="sl-slot__free">Lliure</em>
                          </div>
                        );
                      }
                      return (
                        <button
                          key={d.iso}
                          type="button"
                          className={`sl-slot${b.id === selectedId ? ' is-selected' : ''}${conflictBoloIds.has(b.id) ? ' is-conflict' : ''}${d.inMonth ? '' : ' is-out'}`}
                          data-health={healthOf(b, conflictBoloIds)}
                          onClick={() => selectBolo(b.id, `${month.label}: revisant ${b.client}.`)}
                        >
                          <span className="sl-slot__day"><i>{d.wd}</i> {d.day}</span>
                          <strong className="sl-slot__client">{b.client}</strong>
                          <em className="sl-slot__type">{b.type} · {STAGES.find((s) => s.id === b.stage)?.label}</em>
                          <b className="sl-slot__value">{euro(b.value)}</b>
                        </button>
                      );
                    }),
                  )}
                </div>
                {month.weekdayItems.length > 0 && (
                  <div className="sl-weekday-list" aria-label={`Bolos entre setmana de ${month.label}`}>
                    <span className="sl-weekday-list__label">Entre setmana</span>
                    {month.weekdayItems.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        className={`sl-weekday-chip${b.id === selectedId ? ' is-selected' : ''}${conflictBoloIds.has(b.id) ? ' is-conflict' : ''}`}
                        data-health={healthOf(b, conflictBoloIds)}
                        onClick={() => selectBolo(b.id, `${month.label}: revisant ${b.client}.`)}
                      >
                        <i>{weekdayShort(b.date)} {parseISO(b.date).d}</i>
                        <strong>{b.client}</strong>
                        <b>{euro(b.value)}</b>
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Llegenda del color (un sol significat: urgència) */}
        <div className="sl-legend" aria-label="Què vol dir cada color">
          <span className="sl-legend__title">El color = atenció</span>
          {HEALTH_LEGEND.map((item) => (
            <span key={item.id} className="sl-legend__item" data-health={item.id}>
              <i aria-hidden="true" />
              <b>{item.label}</b>
            </span>
          ))}
        </div>

        {/* Selector d'estat (mòbil) */}
        <nav className="sl-stage-strip" aria-label="Estat visible en mòbil">
          {STAGES.map((stage) => {
            const count = bolos.filter((b) => b.stage === stage.id).length;
            return (
              <button
                key={stage.id}
                type="button"
                className={stage.id === activeStage ? 'is-active' : ''}
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

        {/* Lent d'ordre del pipeline */}
        <div className="sl-lensbar">
          <span className="sl-lensbar__label">Ordena</span>
          <div className="sl-lens" role="group" aria-label="Criteri d'ordre">
            {LENSES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === activeLens ? 'is-active' : ''}
                aria-pressed={item.id === activeLens}
                title={item.effect}
                onClick={() => { setActiveLens(item.id); setLastCommand(`Ordre ${item.label}: ${item.effect}`); }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

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
                      className={`sl-card${b.id === selectedId ? ' is-selected' : ''}${b.id === draggingId ? ' is-dragging' : ''}${conflictBoloIds.has(b.id) ? ' is-conflict' : ''}`}
                      data-health={healthOf(b, conflictBoloIds)}
                      draggable
                      onDragStart={() => setDraggingId(b.id)}
                      onDragEnd={() => { setDraggingId(null); setDragOver(null); }}
                      onClick={() => selectBolo(b.id)}
                    >
                      <span className="sl-card__top">
                        <span className={`sl-card__date${isWeekend(b.date) ? ' is-weekend' : ''}`}>{weekdayShort(b.date)} {dayLabel(b.date)}</span>
                        <span className="sl-card__type">{b.type}</span>
                      </span>
                      <strong className="sl-card__client">{b.client}</strong>
                      <b className="sl-card__value">{euro(b.value)}</b>
                    </button>
                  ))}
                  {items.length === 0 && <p className="sl-col__empty">Deixa-hi anar un bolo</p>}
                </div>
              </div>
            );
          })}
        </section>

        {/* Cockpit del bolo + cua de decisions */}
        <section className="sl-bottom">
          <article className="sl-decision" data-health={selectedHealth}>
            <div className="sl-decision__head">
              <div>
                <span className="sl-kicker">{STAGES.find((s) => s.id === selected.stage)?.label} · {HEALTH_LABEL[selectedHealth]}</span>
                <h2>{selected.client}</h2>
                <p className="sl-decision__meta">
                  {selected.type} · {weekdayName(selected.date)} {dayLabel(selected.date)} · {euro(selected.value)} · risc {selected.risk}
                </p>
              </div>
              <div className="sl-move" role="group" aria-label="Mou de fase">
                <button type="button" onClick={() => shiftSelected(-1)} disabled={STAGE_ORDER.indexOf(selected.stage) === 0} aria-label="Fase anterior">‹</button>
                <button type="button" onClick={() => shiftSelected(1)} disabled={STAGE_ORDER.indexOf(selected.stage) === STAGE_ORDER.length - 1} aria-label="Fase següent">›</button>
              </div>
            </div>

            <div className="sl-cockpit-grid">
              <div className="sl-cell" data-health={paymentHealth(selected)}>
                <span>Cobrament</span>
                <strong>{paymentLabel(selected)}</strong>
                <div className="sl-pay-track" aria-hidden="true">
                  <i className={selected.deposit ? 'is-on' : ''} />
                  <i className={selected.remaining ? 'is-on' : ''} />
                </div>
              </div>
              <div className="sl-cell" data-health={selected.stage === 'guanyat' && selected.checklist < 100 ? 'watch' : 'ok'}>
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
        </section>
      </div>
    </main>
  );
}
