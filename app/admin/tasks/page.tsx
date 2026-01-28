import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import type { LeadTaskStatus, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tasques | Òrbita Admin',
};

const STATUS_LABELS: Record<LeadTaskStatus, string> = {
  OPEN: 'Oberta',
  IN_PROGRESS: 'En curs',
  DONE: 'Feta',
  CANCELLED: 'Cancel·lada',
};

const VALID_STATUS = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const satisfies readonly LeadTaskStatus[];

function isTaskStatus(value?: string): value is LeadTaskStatus {
  if (!value) return false;
  return (VALID_STATUS as readonly string[]).includes(value);
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(value || '1', 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

export default async function TasksPage({ searchParams }: { searchParams?: { status?: string; page?: string } }) {
  const status = isTaskStatus(searchParams?.status) ? searchParams?.status : undefined;
  const page = parsePage(searchParams?.page);
  const limit = 30;
  const where: Prisma.LeadTaskWhereInput | undefined = status ? { status } : undefined;
  const [tasks, total] = await Promise.all([
    prisma.leadTask.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      skip: (page - 1) * limit,
      include: {
        lead: { select: { id: true, name: true } },
      },
    }),
    prisma.leadTask.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', String(targetPage));
    return `/admin/tasks?${params.toString()}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-100">Tasques</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {total} tasques
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center rounded-xl border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-xs sm:text-sm font-medium text-slate-200 hover:bg-slate-600/50 transition-colors"
        >
          ← Tornar
        </Link>
      </header>

      <section className="flex flex-wrap items-center gap-2 text-xs">
        {VALID_STATUS.map((value) => (
          <Link
            key={value}
            href={`/admin/tasks?status=${value}`}
            className={`rounded-full border px-3 py-1 ${
              status === value ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200' : 'border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {STATUS_LABELS[value] || value}
          </Link>
        ))}
        <Link
          href="/admin/tasks"
          className={`rounded-full border px-3 py-1 ${
            !status ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200' : 'border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          Totes
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <span className="text-4xl">📝</span>
            <p className="mt-2">No hi ha tasques</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/admin/leads/${task.lead.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm text-slate-100 truncate">{task.title}</p>
                  <p className="text-xs text-slate-500">
                    {task.lead.name} · {STATUS_LABELS[task.status] || task.status}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ca-ES') : 'Sense data'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Pàgina {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Link
              href={buildHref(Math.max(1, page - 1))}
              className={`rounded-lg border px-3 py-1 ${page === 1 ? 'border-slate-800 text-slate-600 pointer-events-none' : 'border-slate-700 hover:text-slate-200'}`}
            >
              ← Anterior
            </Link>
            <Link
              href={buildHref(Math.min(totalPages, page + 1))}
              className={`rounded-lg border px-3 py-1 ${page === totalPages ? 'border-slate-800 text-slate-600 pointer-events-none' : 'border-slate-700 hover:text-slate-200'}`}
            >
              Següent →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
