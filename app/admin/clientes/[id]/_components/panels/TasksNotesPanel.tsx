'use client';

import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import { formatDate } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';

export default function TasksNotesPanel({ data }: { data: CustomerHubDTO }) {
  const router = useRouter();
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmingDeleteId) return;
    const t = setTimeout(() => setConfirmingDeleteId(null), 3000);
    return () => clearTimeout(t);
  }, [confirmingDeleteId]);

  const openTasks = data.tasks.filter((task) => !task.done);
  const doneTasks = data.tasks.filter((task) => task.done);

  const updateTaskStatus = async (taskId: string, done: boolean) => {
    setBusyTaskId(taskId);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: done ? 'DONE' : 'OPEN' }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || 'No s’ha pogut actualitzar la tasca');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualitzant tasca');
    } finally {
      setBusyTaskId(null);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (confirmingDeleteId !== taskId) { setConfirmingDeleteId(taskId); return; }
    setConfirmingDeleteId(null);
    setBusyTaskId(taskId);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE',
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || 'No s’ha pogut eliminar la tasca');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminant tasca');
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <section className="rounded-2xl border p-5" data-help-title="Tasques i notes" data-help-desc="Checklist operativa del client. Pots crear, completar, reobrir o eliminar tasques. Les tasques pendents apareixen al tauler general.">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Tasques / Notes</h2>
          <p className="text-sm">Checklist operativa vinculada al client.</p>
        </div>
        <Link
          href={`/admin/tasks/new?customerId=${data.customer.id}`}
          className="rounded-xl px-3 py-2 text-xs font-semibold text-white"
        >
          Nova tasca
        </Link>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border p-2 text-xs">
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TaskColumn
          title="Pendents"
          items={openTasks}
          busyTaskId={busyTaskId}
          confirmingDeleteId={confirmingDeleteId}
          onToggleDone={(taskId) => updateTaskStatus(taskId, true)}
          onDelete={deleteTask}
        />
        <TaskColumn
          title="Completades"
          items={doneTasks}
          busyTaskId={busyTaskId}
          confirmingDeleteId={confirmingDeleteId}
          onToggleDone={(taskId) => updateTaskStatus(taskId, false)}
          onDelete={deleteTask}
          doneColumn
        />
      </div>
    </section>
  );
}

function TaskColumn({
  title,
  items,
  busyTaskId,
  confirmingDeleteId,
  onToggleDone,
  onDelete,
  doneColumn = false,
}: {
  title: string;
  items: Array<{ id: string; title: string; dueDate?: string; leadId?: string }>;
  busyTaskId: string | null;
  confirmingDeleteId: string | null;
  onToggleDone: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  doneColumn?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider">{title}</p>
      <div className="mt-2 space-y-2">
        {items.length === 0 ? (
          <p className="rounded-xl border p-3 text-xs">
            Sense tasques.
          </p>
        ) : (
          items.map((task) => (
            <article key={task.id} className="rounded-xl border p-3">
              <p className="text-sm">{task.title}</p>
              <p className="mt-1 text-[11px]">
                {task.dueDate
                  ? formatDate(task.dueDate)
                  : 'Sense venciment'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleDone(task.id)}
                  disabled={busyTaskId === task.id}
                  className="rounded border px-2 py-1 text-xs disabled:opacity-60"
                >
                  {busyTaskId === task.id ? 'Desant...' : doneColumn ? 'Reobrir' : 'Marcar feta'}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  disabled={busyTaskId === task.id}
                  className={`rounded border px-2 py-1 text-xs disabled:opacity-60 ${confirmingDeleteId === task.id ? 'border-rose-500 admin-tone-soft-danger' : ''}`}
                >
                  {confirmingDeleteId === task.id ? 'Segur?' : 'Eliminar'}
                </button>
                {task.leadId && (
                  <Link href={`/admin/leads/${task.leadId}`} className="text-xs">
                    Obrir entrada
                  </Link>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

