import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import Link from 'next/link';

export default function TasksNotesPanel({ data }: { data: CustomerHubDTO }) {
  const openTasks = data.tasks.filter((task) => !task.done);
  const doneTasks = data.tasks.filter((task) => task.done);

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Tasques / Notes</h2>
          <p className="text-sm text-slate-400">Checklist operativa vinculada al client.</p>
        </div>
        <Link
          href={`/admin/tasks?customerId=${data.customer.id}`}
          className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600"
        >
          Nova tasca
        </Link>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TaskColumn title="Pendents" items={openTasks} />
        <TaskColumn title="Completades" items={doneTasks} />
      </div>
    </section>
  );
}

function TaskColumn({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; title: string; dueDate?: string; leadId?: string }>;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
      <div className="mt-2 space-y-2">
        {items.length === 0 ? (
          <p className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-3 text-xs text-slate-400">
            Sense tasques.
          </p>
        ) : (
          items.map((task) => (
            <article key={task.id} className="rounded-lg border border-slate-700/60 bg-slate-800/60 p-3">
              <p className="text-sm text-slate-100">{task.title}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Sense venciment'}
              </p>
              {task.leadId && (
                <Link href={`/admin/leads/${task.leadId}`} className="mt-1 inline-block text-xs text-cyan-300 hover:text-cyan-200">
                  Obrir lead
                </Link>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

