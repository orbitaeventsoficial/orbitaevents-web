import { AdminPage } from '@/app/admin/components/AdminPage';
import Link from 'next/link';
import { loadCrewSchedule, OWNER_KEY, OWNER_NAME, type CrewAssignment } from '@/lib/services/crewScheduleService';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import type { BookingServiceLineKind } from '@prisma/client';
import CrewBlockManager, { type BlockManagerPerson, type BlockManagerBlock } from './CrewBlockManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cuadrant operatiu | Òrbita Admin' };

const KIND_LABEL: Record<BookingServiceLineKind, string> = {
  DJ: 'DJ',
  SOUND_TECH: 'Tècnic so',
  PROVIDER_SERVICE: 'Servei',
  EQUIPMENT: 'Equip',
  OTHER: 'Altres',
};

const WINDOWS = [
  { days: 7, label: '7 dies' },
  { days: 14, label: '14 dies' },
  { days: 30, label: '30 dies' },
  { days: 90, label: '90 dies' },
];

function assignmentHref(a: CrewAssignment): string {
  return a.origin === 'booking' ? buildBookingHref(a.parentId) : buildLeadWorkspaceHref(a.parentId);
}

function formatDateKey(dateKey: string): string {
  // YYYY-MM-DD → DD/MM
  const [, m, d] = dateKey.split('-');
  return `${d}/${m}`;
}

export default async function CuadrantPage({ searchParams }: { searchParams: { days?: string } }) {
  const days = Number(searchParams.days) || 30;
  const now = new Date();
  const schedule = await loadCrewSchedule(now, days);

  const totalAssignments = schedule.people.reduce((s, p) => s + p.assignments.length, 0);
  const overlapCount = schedule.overlaps.length;

  // Opcions de persona per al gestor de bloquejos (sempre amb el propietari).
  const blockPeople: BlockManagerPerson[] = (() => {
    const list: BlockManagerPerson[] = schedule.people.map((p) => ({ key: p.personKey, name: p.personName, isOwner: p.isOwner }));
    if (!list.some((p) => p.key === OWNER_KEY)) list.unshift({ key: OWNER_KEY, name: OWNER_NAME, isOwner: true });
    return list;
  })();
  const blockList: BlockManagerBlock[] = schedule.people.flatMap((p) =>
    p.blocks.map((b) => ({ ...b, personName: p.personName })),
  );

  return (
    <AdminPage
      eyebrow="Operacions"
      title="Cuadrant operatiu"
      subtitle={`${totalAssignments} assignacions · ${schedule.people.length} persones · ${overlapCount} solapaments`}
      back={{ href: '/admin/calendario', label: 'Calendari' }}
    >
      {/* Selector de finestra + accés al repartiment */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {WINDOWS.map((w) => (
            <Link
              key={w.days}
              href={`/admin/cuadrant?days=${w.days}`}
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                days === w.days
                  ? 'admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan'
                  : 'border-[var(--line)] bg-[var(--panel)] text-white/60 adm-row-hover'
              }`}
            >
              {w.label}
            </Link>
          ))}
        </div>
        <Link
          href="/admin/cuadrant/repartiment"
          className="rounded-lg border admin-tone-border-warning admin-tone-bg-warning px-3 py-1 text-xs font-semibold admin-tone-text-warning hover:opacity-80 transition-opacity"
        >
          Repartiment de pasta →
        </Link>
      </div>

      {/* Panell d'alertes de solapaments */}
      {overlapCount > 0 && (
        <section className="mb-5 rounded-xl border admin-tone-border-danger admin-tone-bg-danger p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider admin-tone-text-danger">
            ⚠ {overlapCount} {overlapCount === 1 ? 'solapament' : 'solapaments'}
          </h2>
          <ul className="space-y-1.5">
            {schedule.overlaps.map((o, i) => (
              <li key={i} className="text-xs admin-tone-text-danger opacity-90">
                <span className="font-semibold">{o.personName}</span> · {formatDateKey(o.dateKey)}:{' '}
                <span className="opacity-80">{o.a.parentRef}</span> ({o.a.startLabel}–{o.a.endLabel}) xoca amb{' '}
                <span className="opacity-80">{o.b.parentRef}</span> ({o.b.startLabel}–{o.b.endLabel})
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Cuadrant per persona */}
      {schedule.people.length === 0 ? (
        <p className="ap-card p-6 text-center text-sm opacity-50">
          Cap assignació en aquesta finestra. Munta bolos amb data i serveis per veure'ls aquí.
        </p>
      ) : (
        <div className="space-y-4">
          {schedule.people.map((person) => {
            // agrupa assignacions per dia
            const byDay = new Map<string, CrewAssignment[]>();
            for (const a of person.assignments) {
              const arr = byDay.get(a.dateKey) ?? [];
              arr.push(a);
              byDay.set(a.dateKey, arr);
            }
            const personOverlaps = person.assignments.filter((a) => a.overlaps).length;
            return (
              <section
                key={person.personKey}
                className={`rounded-xl border p-3 ${
                  person.isOwner ? 'admin-tone-border-cyan admin-tone-bg-cyan' : 'border-[var(--line)] bg-[var(--panel)]'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-bold">
                    <span className={`inline-block h-2 w-2 rounded-full ${person.isOwner ? 'bg-[var(--o-info)]' : 'bg-white/40'}`} />
                    {person.personName}
                    {person.isOwner && <span className="text-xs font-normal opacity-50">(tu)</span>}
                  </h3>
                  <span className="text-xs opacity-50">
                    {person.assignments.length} {person.assignments.length === 1 ? 'feina' : 'feines'}
                    {personOverlaps > 0 && <span className="ml-1 admin-tone-text-danger">· {personOverlaps} en conflicte</span>}
                  </span>
                </div>

                <div className="space-y-2">
                  {[...byDay.entries()].map(([dateKey, dayAssignments]) => (
                    <div key={dateKey} className="flex gap-2">
                      <div className="w-10 flex-none pt-1 text-xs font-semibold tabular-nums opacity-60">
                        {formatDateKey(dateKey)}
                      </div>
                      <div className="flex-1 space-y-1">
                        {dayAssignments.map((a) => (
                          <Link
                            key={a.lineId}
                            href={assignmentHref(a)}
                            className={`block rounded-lg border px-2.5 py-1.5 text-xs transition-colors adm-row-hover ${
                              a.overlaps ? 'admin-tone-border-danger admin-tone-bg-danger' : 'border-[var(--line)] bg-[var(--panel)]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate font-medium">{a.parentRef}</span>
                              <span className="flex-none tabular-nums opacity-70">
                                {a.startLabel ? `${a.startLabel}–${a.endLabel}` : 'sense hora'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 opacity-55">
                              <span className="rounded bg-white/10 px-1.5 text-xs font-semibold uppercase tracking-wide">
                                {KIND_LABEL[a.kind]}
                              </span>
                              <span className="truncate">{a.label}</span>
                              {a.location && <span className="truncate opacity-70">· {a.location}</span>}
                              {a.overlaps && <span className="flex-none font-semibold admin-tone-text-danger">⚠ conflicte</span>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <CrewBlockManager people={blockPeople} blocks={blockList} />
    </AdminPage>
  );
}
