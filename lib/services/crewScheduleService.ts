/**
 * crewScheduleService.ts — Cuadrant operatiu + Repartiment de pasta
 *
 * Vistes OPERATIVES sobre les mateixes dades del bolo (vegeu
 * docs/cuadrant-repartiment-concept.md). No hi ha dada nova: creua les línies de
 * servei (LeadServiceLine + BookingServiceLine — porten `collaboratorId`, `hours`,
 * `costAmount`) amb la data/hora de l'event del seu pare.
 *
 * - Cuadrant: per PERSONA (col·laborador o propietari) × dia, amb detecció de
 *   SOLAPAMENTS (mateixa persona, franges que xoquen) i disponibilitat.
 * - Repartiment: qui cobra què per període (cash a col·laboradors + part del propietari).
 *
 * Diners: el repartiment separa caixa client, saldo de tercers, cost intern d'Òrbita
 * i benefici net conegut. El marge financer complet (CAC, operatiu general...) segueix
 * vivint a costEngine. No es reimplementa cap regla.
 */

import { prisma } from '@/lib/prisma';
import type { BookingServiceLineKind } from '@prisma/client';
import { computeBoloRepartiment, REPARTIMENT_OWNER_KEY, type BoloRepartiment } from '@/lib/services/repartimentService';

export const OWNER_KEY = 'OWNER';
export const OWNER_NAME = 'Òrbita (jo)';
/** Hores per defecte d'una assignació quan no hi ha `hours` ni hora de fi. */
export const DEFAULT_ASSIGNMENT_HOURS = 4;

// ─── Tipus ────────────────────────────────────────────────────────────────────

/** Línia de servei amb el context del seu event (lead o booking). */
export interface CrewLineInput {
  lineId: string;
  origin: 'lead' | 'booking';
  parentId: string;
  parentRef: string; // nom del client / referència
  collaboratorId: string | null;
  kind: BookingServiceLineKind;
  label: string;
  revenueAmount: number | null;
  costAmount: number | null;
  quantity: number | null;
  hours: number | null;
  eventDate: Date | null;
  eventStartTime: string | null; // "HH:MM"
  eventEndTime: string | null;
  eventLocation: string | null;
}

export interface CrewAssignment {
  lineId: string;
  origin: 'lead' | 'booking';
  parentId: string;
  parentRef: string;
  label: string;
  kind: BookingServiceLineKind;
  dateKey: string; // YYYY-MM-DD
  startMin: number | null; // minuts des de mitjanit (null = sense hora)
  endMin: number | null;
  startLabel: string | null;
  endLabel: string | null;
  hours: number | null;
  location: string | null;
  overlaps: boolean;
}

/** Bloqueig manual de disponibilitat (absència) d'una persona. */
export interface CrewBlockInput {
  id: string;
  collaboratorId: string | null; // null = propietari
  date: Date;
  startTime: string | null; // null = tot el dia
  endTime: string | null;
  reason: string | null;
}

export interface CrewBlockView {
  id: string;
  dateKey: string;
  startLabel: string | null;
  endLabel: string | null;
  allDay: boolean;
  reason: string | null;
}

export interface PersonSchedule {
  personKey: string;
  personName: string;
  isOwner: boolean;
  assignments: CrewAssignment[];
  blocks: CrewBlockView[];
}

export interface OverlapAlert {
  personKey: string;
  personName: string;
  dateKey: string;
  /** 'assignment' = dues feines que xoquen · 'block' = feina dins d'un bloqueig. */
  kind: 'assignment' | 'block';
  a: OverlapRef;
  b: OverlapRef;
}
interface OverlapRef {
  lineId: string;
  label: string;
  parentRef: string;
  startLabel: string | null;
  endLabel: string | null;
}

export interface CrewScheduleResult {
  people: PersonSchedule[];
  overlaps: OverlapAlert[];
}

// ─── Helpers de temps (purs) ──────────────────────────────────────────────────

/** "HH:MM" → minuts des de mitjanit, o null si no és vàlid. */
export function parseHhmmToMin(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** minuts (pot superar 1440 si creua mitjanit) → "HH:MM". */
export function minToHhmm(min: number): string {
  const norm = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Clau de dia YYYY-MM-DD en UTC. */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Deriva l'interval [startMin, endMin] d'una línia a partir de l'horari de l'event
 * i de les hores de la línia. Si creua mitjanit, endMin > 1440.
 */
export function deriveInterval(line: CrewLineInput): {
  startMin: number | null;
  endMin: number | null;
  startLabel: string | null;
  endLabel: string | null;
} {
  const startMin = parseHhmmToMin(line.eventStartTime);
  if (startMin === null) {
    return { startMin: null, endMin: null, startLabel: null, endLabel: null };
  }
  let endMin: number;
  if (typeof line.hours === 'number' && line.hours > 0) {
    endMin = startMin + Math.round(line.hours * 60);
  } else {
    const parsedEnd = parseHhmmToMin(line.eventEndTime);
    endMin = parsedEnd !== null ? parsedEnd : startMin + DEFAULT_ASSIGNMENT_HOURS * 60;
    if (endMin <= startMin) endMin += 24 * 60; // creua mitjanit
  }
  return {
    startMin,
    endMin,
    startLabel: minToHhmm(startMin),
    endLabel: minToHhmm(endMin),
  };
}

function personKeyOf(line: CrewLineInput): string {
  return line.collaboratorId ?? OWNER_KEY;
}

/** Minuts de muntatge i desmuntatge estàndard (decisió del propietari #1364). */
export const SETUP_MINUTES = 45;
export const TEARDOWN_MINUTES = 45;
/** Velocitat mitjana per estimar el temps de ruta (mateixa que travelLaborCost). */
const JORNADA_AVG_SPEED_KMH = 65;

export interface Jornada {
  departureTime: string | null; // sortida de casa
  arrivalTime: string | null;   // arribada al lloc (per començar a muntar)
  teardownEndTime: string | null; // fi de desmuntatge al lloc
  returnTime: string | null;    // tornada a casa
  workHours: number | null;     // jornada total (sortida → tornada), en hores
}

/**
 * Jornada d'un bolo (#1364): sortida de casa, arribada al lloc, tornada. Compta 45'
 * de muntatge abans de l'event i 45' de desmuntatge després, més el temps de ruta
 * (anada = meitat del round-trip). Retorna null si no hi ha hora d'inici de l'event.
 */
export function computeJornada(input: {
  eventStartTime: string | null;
  eventEndTime: string | null;
  roundTripKm: number | null;
}): Jornada {
  const startMin = parseHhmmToMin(input.eventStartTime);
  if (startMin === null) {
    return { departureTime: null, arrivalTime: null, teardownEndTime: null, returnTime: null, workHours: null };
  }
  const km = typeof input.roundTripKm === 'number' && input.roundTripKm > 0 ? input.roundTripKm : 0;
  const oneWayMin = Math.round((km / JORNADA_AVG_SPEED_KMH / 2) * 60);
  const endMin = parseHhmmToMin(input.eventEndTime) ?? startMin + DEFAULT_ASSIGNMENT_HOURS * 60;
  const safeEndMin = endMin > startMin ? endMin : startMin + DEFAULT_ASSIGNMENT_HOURS * 60;

  const arrivalMin = startMin - SETUP_MINUTES;
  const departureMin = arrivalMin - oneWayMin;
  const teardownEndMin = safeEndMin + TEARDOWN_MINUTES;
  const returnMin = teardownEndMin + oneWayMin;

  return {
    departureTime: minToHhmm(departureMin),
    arrivalTime: minToHhmm(arrivalMin),
    teardownEndTime: minToHhmm(teardownEndMin),
    returnTime: minToHhmm(returnMin),
    workHours: Math.round(((returnMin - departureMin) / 60) * 100) / 100,
  };
}

/** Dos intervals (en minuts) s'encavalquen? */
export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// ─── Cuadrant (pur) ────────────────────────────────────────────────────────────

/**
 * Construeix el cuadrant per persona i detecta solapaments dins cada persona+dia.
 * `names`: map collaboratorId → nom (el propietari ja té OWNER_NAME).
 */
export function buildCrewSchedule(
  lines: CrewLineInput[],
  names: Map<string, string>,
  blocks: CrewBlockInput[] = [],
): CrewScheduleResult {
  const byPerson = new Map<string, { name: string; isOwner: boolean; assignments: CrewAssignment[]; blocks: CrewBlockView[] }>();

  const ensure = (key: string) => {
    const isOwner = key === OWNER_KEY;
    const existing = byPerson.get(key);
    if (existing) return existing;
    const bucket = { name: isOwner ? OWNER_NAME : names.get(key) ?? 'Col·laborador', isOwner, assignments: [] as CrewAssignment[], blocks: [] as CrewBlockView[] };
    byPerson.set(key, bucket);
    return bucket;
  };

  for (const line of lines) {
    if (!line.eventDate) continue;
    const key = personKeyOf(line);
    const { startMin, endMin, startLabel, endLabel } = deriveInterval(line);
    ensure(key).assignments.push({
      lineId: line.lineId, origin: line.origin, parentId: line.parentId, parentRef: line.parentRef,
      label: line.label, kind: line.kind, dateKey: toDateKey(line.eventDate),
      startMin, endMin, startLabel, endLabel, hours: line.hours ?? null, location: line.eventLocation, overlaps: false,
    });
  }

  // Bloquejos per persona+dia (per a la vista i la detecció de conflictes).
  const blocksByPersonDay = new Map<string, CrewBlockInput[]>();
  for (const block of blocks) {
    const key = block.collaboratorId ?? OWNER_KEY;
    const dateKey = toDateKey(block.date);
    ensure(key).blocks.push({
      id: block.id, dateKey,
      startLabel: block.startTime, endLabel: block.endTime,
      allDay: !block.startTime, reason: block.reason,
    });
    const mapKey = `${key}|${dateKey}`;
    const arr = blocksByPersonDay.get(mapKey) ?? [];
    arr.push(block);
    blocksByPersonDay.set(mapKey, arr);
  }

  const overlaps: OverlapAlert[] = [];

  for (const [personKey, bucket] of byPerson) {
    bucket.assignments.sort((a, b) => {
      if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? -1 : 1;
      return (a.startMin ?? -1) - (b.startMin ?? -1);
    });
    const byDay = new Map<string, CrewAssignment[]>();
    for (const a of bucket.assignments) {
      const arr = byDay.get(a.dateKey) ?? [];
      arr.push(a);
      byDay.set(a.dateKey, arr);
    }
    for (const [dateKey, dayAssignments] of byDay) {
      // feina vs feina
      for (let i = 0; i < dayAssignments.length; i++) {
        for (let j = i + 1; j < dayAssignments.length; j++) {
          const a = dayAssignments[i];
          const b = dayAssignments[j];
          if (a.startMin === null || b.startMin === null) continue;
          // Diverses línies del MATEIX event no són conflicte (ets al mateix lloc).
          if (a.parentId === b.parentId) continue;
          if (intervalsOverlap(a.startMin, a.endMin!, b.startMin, b.endMin!)) {
            a.overlaps = true;
            b.overlaps = true;
            overlaps.push({
              personKey, personName: bucket.name, dateKey, kind: 'assignment',
              a: { lineId: a.lineId, label: a.label, parentRef: a.parentRef, startLabel: a.startLabel, endLabel: a.endLabel },
              b: { lineId: b.lineId, label: b.label, parentRef: b.parentRef, startLabel: b.startLabel, endLabel: b.endLabel },
            });
          }
        }
      }
      // feina vs bloqueig (mateix dia)
      const dayBlocks = blocksByPersonDay.get(`${personKey}|${dateKey}`) ?? [];
      for (const a of dayAssignments) {
        for (const block of dayBlocks) {
          const blockStart = parseHhmmToMin(block.startTime);
          const conflict = blockStart === null // tot el dia
            ? true
            : a.startMin !== null && intervalsOverlap(a.startMin, a.endMin!, blockStart, parseHhmmToMin(block.endTime) ?? blockStart + DEFAULT_ASSIGNMENT_HOURS * 60);
          if (conflict) {
            a.overlaps = true;
            overlaps.push({
              personKey, personName: bucket.name, dateKey, kind: 'block',
              a: { lineId: a.lineId, label: a.label, parentRef: a.parentRef, startLabel: a.startLabel, endLabel: a.endLabel },
              b: { lineId: block.id, label: block.reason ?? 'Bloqueig', parentRef: 'Bloqueig de disponibilitat', startLabel: block.startTime, endLabel: block.endTime },
            });
          }
        }
      }
    }
  }

  const people: PersonSchedule[] = [...byPerson.entries()]
    .map(([personKey, b]) => ({ personKey, personName: b.name, isOwner: b.isOwner, assignments: b.assignments, blocks: b.blocks }))
    .sort((x, y) => (x.isOwner ? -1 : y.isOwner ? 1 : x.personName.localeCompare(y.personName)));

  return { people, overlaps };
}

/**
 * Quan un lead ja té reserva vinculada, la font de veritat deixa de ser
 * LeadServiceLine i passa a BookingServiceLine. Cuadrant i repartiment no poden
 * comptar les dues fotos del mateix bolo.
 */
export function filterSupersededLeadLines(
  lines: CrewLineInput[],
  bookedLeadIds: ReadonlySet<string>,
): CrewLineInput[] {
  if (bookedLeadIds.size === 0) return lines;
  return lines.filter((line) => !(line.origin === 'lead' && bookedLeadIds.has(line.parentId)));
}

// ─── Repartiment (pur) ─────────────────────────────────────────────────────────

export interface PayoutEvent {
  parentRef: string;
  dateKey: string | null;
  amount: number; // cash d'aquesta persona en aquest event
}
export interface PayoutByPerson {
  personKey: string;
  personName: string;
  isOwner: boolean;
  assignments: number;
  amount: number; // cash total (col·laborador: el que cobra; propietari: la seva part)
  events: PayoutEvent[];
}
/** Detall d'un bolo per al drill-down (qui cobra què dins d'aquell event). */
export interface PayoutBolo {
  parentId: string;
  parentRef: string;
  dateKey: string | null;
  repartiment: BoloRepartiment;
}
export interface PayoutPeriodResult {
  people: PayoutByPerson[];
  totals: {
    revenue: number;
    collaboratorCost: number;
    collaboratorPayments: number;
    collaboratorSettlements: number;
    ownerGross: number;
    internalCost: number;
    ownerNet: number;
  };
  bolos: PayoutBolo[];
}

/**
 * Repartiment de caixa i cost: per col·laborador, el saldo net que cobra; per al
 * propietari, benefici net conegut = brut d'Òrbita − costos interns.
 */
export function buildPayoutSummary(
  lines: CrewLineInput[],
  names: Map<string, string>,
): PayoutPeriodResult {
  // Agrupa les línies per BOLO i reparteix cada bolo amb el motor canònic
  // (`computeBoloRepartiment`) → solidari amb la fitxa de lead/reserva (una sola
  // veritat). L'agregat del període és la suma dels repartiments per bolo.
  const byBolo = new Map<string, { parentRef: string; dateKey: string | null; lines: CrewLineInput[] }>();
  for (const line of lines) {
    const bucket = byBolo.get(line.parentId)
      ?? { parentRef: line.parentRef, dateKey: line.eventDate ? toDateKey(line.eventDate) : null, lines: [] };
    bucket.lines.push(line);
    byBolo.set(line.parentId, bucket);
  }

  const bolos: PayoutBolo[] = [];
  const person = new Map<string, { name: string; amount: number; count: number; events: PayoutEvent[] }>();
  let totalRevenue = 0;
  let totalCollaboratorCost = 0;
  let totalCollaboratorPayments = 0;
  let totalCollaboratorSettlements = 0;
  let totalOwnerGross = 0;
  let totalInternalCost = 0;
  let totalOwnerNet = 0;
  const roundMoney = (value: number) => Math.round(value * 100) / 100;

  for (const [parentId, bolo] of byBolo.entries()) {
    const repartiment = computeBoloRepartiment(bolo.lines);
    bolos.push({ parentId, parentRef: bolo.parentRef, dateKey: bolo.dateKey, repartiment });
    totalRevenue = roundMoney(totalRevenue + repartiment.totals.clientTotal);
    totalCollaboratorCost = roundMoney(totalCollaboratorCost + repartiment.totals.aCollaboradors);
    totalCollaboratorPayments = roundMoney(totalCollaboratorPayments + repartiment.totals.pagamentsCollaboradors);
    totalCollaboratorSettlements = roundMoney(totalCollaboratorSettlements + repartiment.totals.liquidacionsCapAOrbita);
    totalOwnerGross = roundMoney(totalOwnerGross + repartiment.totals.brutOrbita);
    totalInternalCost = roundMoney(totalInternalCost + repartiment.totals.costInternOrbita);
    totalOwnerNet = roundMoney(totalOwnerNet + repartiment.totals.partOrbita);

    for (const pp of repartiment.perPersona) {
      if (pp.rep === 0) continue;
      const key = pp.esOrbita ? OWNER_KEY : pp.personId;
      const name = pp.esOrbita ? OWNER_NAME : (names.get(pp.personId) ?? 'Col·laborador');
      const bucket = person.get(key) ?? { name, amount: 0, count: 0, events: [] };
      bucket.amount = roundMoney(bucket.amount + pp.rep);
      bucket.count += 1;
      bucket.events.push({ parentRef: bolo.parentRef, dateKey: bolo.dateKey, amount: pp.rep });
      person.set(key, bucket);
    }
  }

  const ownerBucket = person.get(OWNER_KEY);
  const people: PayoutByPerson[] = [
    {
      personKey: OWNER_KEY,
      personName: OWNER_NAME,
      isOwner: true,
      assignments: ownerBucket?.count ?? 0,
      amount: ownerBucket?.amount ?? 0,
      events: ownerBucket?.events ?? [],
    },
    ...[...person.entries()]
      .filter(([key]) => key !== OWNER_KEY)
      .map(([personKey, b]) => ({
        personKey, personName: b.name, isOwner: false,
        assignments: b.count, amount: b.amount, events: b.events,
      }))
      .sort((x, y) => y.amount - x.amount),
  ];

  bolos.sort((a, b) => (b.dateKey ?? '').localeCompare(a.dateKey ?? ''));

  return {
    people,
    totals: {
      revenue: roundMoney(totalRevenue),
      collaboratorCost: roundMoney(totalCollaboratorCost),
      collaboratorPayments: roundMoney(totalCollaboratorPayments),
      collaboratorSettlements: roundMoney(totalCollaboratorSettlements),
      ownerGross: roundMoney(totalOwnerGross),
      internalCost: roundMoney(totalInternalCost),
      ownerNet: roundMoney(totalOwnerNet),
    },
    bolos,
  };
}

// ─── Loaders (async) ───────────────────────────────────────────────────────────

export const LEAD_STATUSES_ACTIVE = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON'] as const;
export const BOOKING_STATUSES_ACTIVE = ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED'] as const;

/** Carrega totes les línies (lead + booking) amb event dins [from, to]. */
async function loadCrewLines(from: Date, to: Date): Promise<{ lines: CrewLineInput[]; names: Map<string, string> }> {
  const [leads, bookings] = await Promise.all([
    prisma.lead.findMany({
      where: { status: { in: [...LEAD_STATUSES_ACTIVE] }, eventDate: { gte: from, lte: to } },
      select: {
        id: true, name: true, eventDate: true, eventStartTime: true, eventEndTime: true, eventLocation: true,
        serviceLines: { select: { id: true, collaboratorId: true, kind: true, label: true, revenueAmount: true, costAmount: true, quantity: true, hours: true } },
      },
    }),
    prisma.booking.findMany({
      where: { status: { in: [...BOOKING_STATUSES_ACTIVE] }, eventDate: { gte: from, lte: to } },
      select: {
        id: true, reference: true, leadId: true, clientName: true, eventDate: true, eventStartTime: true, eventEndTime: true, eventLocation: true,
        serviceLines: { select: { id: true, collaboratorId: true, kind: true, label: true, revenueAmount: true, costAmount: true, quantity: true, hours: true } },
      },
    }),
  ]);

  const rawLines: CrewLineInput[] = [];
  const bookedLeadIds = new Set<string>();

  for (const lead of leads) {
    for (const l of lead.serviceLines) {
      rawLines.push({
        lineId: l.id, origin: 'lead', parentId: lead.id, parentRef: lead.name,
        collaboratorId: l.collaboratorId, kind: l.kind, label: l.label,
        revenueAmount: l.revenueAmount, costAmount: l.costAmount, quantity: l.quantity, hours: l.hours,
        eventDate: lead.eventDate, eventStartTime: lead.eventStartTime, eventEndTime: lead.eventEndTime, eventLocation: lead.eventLocation,
      });
    }
  }
  for (const bk of bookings) {
    if (bk.leadId) bookedLeadIds.add(bk.leadId);
    for (const l of bk.serviceLines) {
      rawLines.push({
        lineId: l.id, origin: 'booking', parentId: bk.id, parentRef: bk.clientName || bk.reference,
        collaboratorId: l.collaboratorId, kind: l.kind, label: l.label,
        revenueAmount: l.revenueAmount, costAmount: l.costAmount, quantity: l.quantity, hours: l.hours,
        eventDate: bk.eventDate, eventStartTime: bk.eventStartTime, eventEndTime: bk.eventEndTime, eventLocation: bk.eventLocation,
      });
    }
  }

  const lines = filterSupersededLeadLines(rawLines, bookedLeadIds);
  const collaboratorIds = new Set<string>();
  for (const line of lines) {
    if (line.collaboratorId) collaboratorIds.add(line.collaboratorId);
  }

  const names = new Map<string, string>();
  if (collaboratorIds.size > 0) {
    const collabs = await prisma.collaborator.findMany({
      where: { id: { in: [...collaboratorIds] } },
      select: { id: true, name: true },
    });
    for (const c of collabs) names.set(c.id, c.name);
  }

  return { lines, names };
}

/**
 * Carrega els bloquejos manuals d'una finestra. GRACEFUL: si la taula `crew_blocks`
 * encara no existeix a la BD (migració no desplegada), retorna [] sense petar.
 */
async function loadCrewBlocks(from: Date, to: Date): Promise<CrewBlockInput[]> {
  try {
    const rows = await prisma.crewBlock.findMany({
      where: { date: { gte: from, lte: to } },
      select: { id: true, collaboratorId: true, date: true, startTime: true, endTime: true, reason: true },
    });
    return rows;
  } catch {
    return [];
  }
}

/** Cuadrant operatiu d'una finestra (windowStart + nombre de dies). */
export async function loadCrewSchedule(windowStart: Date, days: number): Promise<CrewScheduleResult> {
  const from = new Date(Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth(), windowStart.getUTCDate(), 0, 0, 0));
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + Math.max(1, days));
  const [{ lines, names }, blocks] = await Promise.all([loadCrewLines(from, to), loadCrewBlocks(from, to)]);
  return buildCrewSchedule(lines, names, blocks);
}

/** Repartiment de pasta d'un període [from, to]. */
export async function loadPayoutSummary(from: Date, to: Date): Promise<PayoutPeriodResult> {
  const { lines, names } = await loadCrewLines(from, to);
  return buildPayoutSummary(lines, names);
}

// ─── Bloquejos manuals (CRUD) ──────────────────────────────────────────────────

/** Llista tots els bloquejos. GRACEFUL si la taula encara no existeix. */
export async function listCrewBlocks() {
  try {
    return await prisma.crewBlock.findMany({ orderBy: { date: 'asc' } });
  } catch {
    return [];
  }
}

export async function createCrewBlock(input: {
  collaboratorId?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const dateStr = String(input.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { status: 400, body: { error: 'Data invàlida (YYYY-MM-DD)' } };
  }
  const block = await prisma.crewBlock.create({
    data: {
      collaboratorId: input.collaboratorId?.trim() || null,
      date: new Date(`${dateStr}T00:00:00.000Z`),
      startTime: input.startTime?.trim() || null,
      endTime: input.endTime?.trim() || null,
      reason: input.reason?.trim() || null,
    },
  });
  return { status: 201, body: { ok: true, block } };
}

export async function deleteCrewBlock(id: string): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!id) return { status: 400, body: { error: 'Falta id' } };
  await prisma.crewBlock.delete({ where: { id } });
  return { status: 200, body: { ok: true } };
}
