import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tasques | Òrbita Admin',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Oberta',
  IN_PROGRESS: 'En curs',
  DONE: 'Feta',
  CANCELLED: 'Cancel·lada',
};

export default async function TasksPage({ searchParams }: { searchParams?: { status?: string } }) {
  const status = searchParams?.status;
  const tasks = await prisma.leadTask.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    take: 200,
    include: {
      lead: { select: { id: true, name: true } },
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-100">Tasques</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {tasks.length} tasques
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
        {['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'].map((value) => (
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
    </div>
  );
}
