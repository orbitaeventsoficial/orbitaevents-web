/**
 * Tests del cuadrant operatiu + repartiment (funcions pures).
 * No toquen Prisma: només la lògica d'intervals, solapaments i repartiment de caixa.
 */
import { describe, it, expect } from 'vitest';
import {
  parseHhmmToMin,
  minToHhmm,
  deriveInterval,
  intervalsOverlap,
  buildCrewSchedule,
  buildPayoutSummary,
  OWNER_KEY,
  DEFAULT_ASSIGNMENT_HOURS,
  type CrewLineInput,
} from '@/lib/services/crewScheduleService';

const names = new Map<string, string>([['col_carlos', 'Carlos Lucas']]);

function line(partial: Partial<CrewLineInput>): CrewLineInput {
  return {
    lineId: Math.random().toString(36).slice(2),
    origin: 'lead',
    parentId: 'lead1',
    parentRef: 'Client',
    collaboratorId: null,
    kind: 'OTHER',
    label: 'Línia',
    revenueAmount: 100,
    costAmount: null,
    quantity: 1,
    hours: null,
    eventDate: new Date('2026-07-11T00:00:00Z'),
    eventStartTime: '18:00',
    eventEndTime: null,
    eventLocation: 'Arenys',
    ...partial,
  };
}

describe('parseHhmmToMin / minToHhmm', () => {
  it('converteix "HH:MM" a minuts', () => {
    expect(parseHhmmToMin('18:00')).toBe(1080);
    expect(parseHhmmToMin('00:30')).toBe(30);
    expect(parseHhmmToMin('9:05')).toBe(545);
  });
  it('rebutja valors invàlids', () => {
    expect(parseHhmmToMin('')).toBeNull();
    expect(parseHhmmToMin(null)).toBeNull();
    expect(parseHhmmToMin('25:00')).toBeNull();
    expect(parseHhmmToMin('abc')).toBeNull();
  });
  it('minToHhmm normalitza i passat mitjanit', () => {
    expect(minToHhmm(1080)).toBe('18:00');
    expect(minToHhmm(1500)).toBe('01:00'); // 25:00 → 01:00
  });
});

describe('deriveInterval', () => {
  it('usa hours per al final si hi és', () => {
    const r = deriveInterval(line({ eventStartTime: '18:00', hours: 1 }));
    expect(r.startMin).toBe(1080);
    expect(r.endMin).toBe(1140);
    expect(r.endLabel).toBe('19:00');
  });
  it('usa eventEndTime si no hi ha hours', () => {
    const r = deriveInterval(line({ eventStartTime: '18:00', eventEndTime: '20:00', hours: null }));
    expect(r.endMin).toBe(1200);
  });
  it('default de DEFAULT_ASSIGNMENT_HOURS si no hi ha hours ni fi', () => {
    const r = deriveInterval(line({ eventStartTime: '18:00', eventEndTime: null, hours: null }));
    expect(r.endMin).toBe(1080 + DEFAULT_ASSIGNMENT_HOURS * 60);
  });
  it('creua mitjanit quan fi <= inici', () => {
    const r = deriveInterval(line({ eventStartTime: '22:00', eventEndTime: '03:00', hours: null }));
    expect(r.endMin).toBe(22 * 60 + 5 * 60); // 22:00 → 03:00 = +5h
  });
  it('sense hora d\'inici → interval nul', () => {
    const r = deriveInterval(line({ eventStartTime: null }));
    expect(r.startMin).toBeNull();
    expect(r.endMin).toBeNull();
  });
});

describe('intervalsOverlap', () => {
  it('detecta encavalcament', () => {
    expect(intervalsOverlap(1080, 1200, 1140, 1260)).toBe(true); // 18-20 vs 19-21
  });
  it('contigus NO solapen', () => {
    expect(intervalsOverlap(1080, 1140, 1140, 1200)).toBe(false); // 18-19 vs 19-20
  });
  it('separats NO solapen', () => {
    expect(intervalsOverlap(1080, 1140, 1200, 1260)).toBe(false);
  });
});

describe('buildCrewSchedule', () => {
  it('agrupa per persona (propietari vs col·laborador)', () => {
    const r = buildCrewSchedule([
      line({ collaboratorId: null }),
      line({ collaboratorId: 'col_carlos' }),
    ], names);
    expect(r.people).toHaveLength(2);
    const owner = r.people.find((p) => p.personKey === OWNER_KEY);
    expect(owner?.isOwner).toBe(true);
    expect(r.people.find((p) => p.personKey === 'col_carlos')?.personName).toBe('Carlos Lucas');
  });

  it('el propietari surt primer', () => {
    const r = buildCrewSchedule([
      line({ collaboratorId: 'col_carlos' }),
      line({ collaboratorId: null }),
    ], names);
    expect(r.people[0].isOwner).toBe(true);
  });

  it('detecta solapament de la mateixa persona el mateix dia (events diferents)', () => {
    const r = buildCrewSchedule([
      line({ collaboratorId: null, parentId: 'A', eventStartTime: '18:00', hours: 2, parentRef: 'Bolo A' }), // 18-20
      line({ collaboratorId: null, parentId: 'B', eventStartTime: '19:00', hours: 2, parentRef: 'Bolo B' }), // 19-21
    ], names);
    expect(r.overlaps).toHaveLength(1);
    expect(r.people[0].assignments.every((a) => a.overlaps)).toBe(true);
  });

  it('diverses línies del MATEIX event NO són conflicte', () => {
    const r = buildCrewSchedule([
      line({ collaboratorId: 'col_carlos', parentId: 'X', eventStartTime: '18:00', hours: 2, label: 'Animació' }),
      line({ collaboratorId: 'col_carlos', parentId: 'X', eventStartTime: '18:00', hours: 2, label: 'Pintacares' }),
    ], names);
    expect(r.overlaps).toHaveLength(0);
  });

  it('NO solapa si són persones diferents', () => {
    const r = buildCrewSchedule([
      line({ collaboratorId: null, eventStartTime: '18:00', hours: 2 }),
      line({ collaboratorId: 'col_carlos', eventStartTime: '18:00', hours: 2 }),
    ], names);
    expect(r.overlaps).toHaveLength(0);
  });

  it('NO solapa si són dies diferents', () => {
    const r = buildCrewSchedule([
      line({ collaboratorId: null, eventDate: new Date('2026-07-11T00:00:00Z'), eventStartTime: '18:00', hours: 2 }),
      line({ collaboratorId: null, eventDate: new Date('2026-07-12T00:00:00Z'), eventStartTime: '18:00', hours: 2 }),
    ], names);
    expect(r.overlaps).toHaveLength(0);
  });

  it('ignora línies sense data', () => {
    const r = buildCrewSchedule([line({ eventDate: null })], names);
    expect(r.people).toHaveLength(0);
  });
});

describe('buildCrewSchedule — bloquejos', () => {
  const block = (partial: Partial<import('@/lib/services/crewScheduleService').CrewBlockInput> = {}) => ({
    id: 'blk1',
    collaboratorId: null,
    date: new Date('2026-07-11T00:00:00Z'),
    startTime: null,
    endTime: null,
    reason: 'Vacances',
    ...partial,
  });

  it('un bloqueig de tot el dia marca conflicte amb la feina', () => {
    const r = buildCrewSchedule(
      [line({ collaboratorId: null, parentId: 'A', eventStartTime: '18:00', hours: 2 })],
      names,
      [block()],
    );
    expect(r.overlaps.some((o) => o.kind === 'block')).toBe(true);
    expect(r.people[0].assignments[0].overlaps).toBe(true);
  });

  it('un bloqueig en una altra franja NO xoca', () => {
    const r = buildCrewSchedule(
      [line({ collaboratorId: null, parentId: 'A', eventStartTime: '18:00', hours: 2 })], // 18-20
      names,
      [block({ startTime: '09:00', endTime: '12:00' })],
    );
    expect(r.overlaps.filter((o) => o.kind === 'block')).toHaveLength(0);
  });

  it('el bloqueig s\'adjunta a la persona', () => {
    const r = buildCrewSchedule([], names, [block({ collaboratorId: 'col_carlos' })]);
    const carlos = r.people.find((p) => p.personKey === 'col_carlos');
    expect(carlos?.blocks).toHaveLength(1);
    expect(carlos?.blocks[0].allDay).toBe(true);
  });
});

describe('buildPayoutSummary', () => {
  it('reparteix cash: col·laborador cobra costAmount, propietari es queda la resta', () => {
    const r = buildPayoutSummary([
      line({ collaboratorId: 'col_carlos', revenueAmount: 195, costAmount: 160, quantity: 1, parentRef: 'Cristina' }),
      line({ collaboratorId: 'col_carlos', revenueAmount: 85, costAmount: 70, quantity: 1, parentRef: 'Cristina' }),
      line({ collaboratorId: null, revenueAmount: 100, costAmount: null, quantity: 1, parentRef: 'Cristina' }),
    ], names);
    expect(r.totals.revenue).toBe(380);
    expect(r.totals.collaboratorCost).toBe(230); // 160 + 70
    expect(r.totals.ownerNet).toBe(150); // 380 - 230
    const carlos = r.people.find((p) => p.personKey === 'col_carlos');
    expect(carlos?.amount).toBe(230);
    expect(carlos?.assignments).toBe(2);
    const owner = r.people.find((p) => p.isOwner);
    expect(owner?.amount).toBe(150);
  });

  it('multiplica per quantitat', () => {
    const r = buildPayoutSummary([
      line({ collaboratorId: 'col_carlos', revenueAmount: 50, costAmount: 40, quantity: 3 }),
    ], names);
    expect(r.totals.collaboratorCost).toBe(120);
    expect(r.totals.revenue).toBe(150);
    expect(r.totals.ownerNet).toBe(30);
  });
});
