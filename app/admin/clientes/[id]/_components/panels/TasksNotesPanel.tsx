'use client';

import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import { formatDate } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_CUSTOMER_PANEL_HELP_2, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { AdminSection } from '@/app/admin/components/AdminPage';
import {
  buildCustomerTaskCreateHref,
  buildCustomerWorkspaceTabHref,
} from '@/lib/admin/customerWorkspaceHref';

export default function TasksNotesPanel({
  data,
  notice,
  onDismissNotice,
}: {
  data: CustomerHubDTO;
  notice?: string | null;
  onDismissNotice?: () => void;
}) {
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
  const customerTaskCreateHref = buildCustomerTaskCreateHref(data.customer.id);

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
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || 'No s’ha pogut actualitzar la tasca');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualitzant tasca');
    } finally {
      setBusyTaskId(null);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (confirmingDeleteId !== taskId) {
      setConfirmingDeleteId(taskId);
      return;
    }

    setConfirmingDeleteId(null);
    setBusyTaskId(taskId);
    setError(null);

    try {
      const res = await fetchWithCsrf(`/api/admin/tasks/${taskId}`, { method: 'DELETE' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || 'No s’ha pogut eliminar la tasca');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminant tasca');
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <AdminSection
      title="Tasques / Notes"
      description="Checklist operativa vinculada al client."
      actions={
        <Link
          href={customerTaskCreateHref}
          className="ap-btn ap-btn--primary ap-btn--xs"
          {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.tasks.newTask)}
        >
          Nova tasca
        </Link>
      }
      help={ADMIN_CUSTOMER_PANEL_HELP_2.tasks.root}
    >
      {notice && (
        <div className="mb-3 flex items-start justify-between gap-3 rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-2)] p-3 text-sm leading-snug text-[var(--t2)]" role="alert">
          <p className="m-0 min-w-0 flex-1">{notice}</p>
          {onDismissNotice && (
            <button
              type="button"
              onClick={onDismissNotice}
              className="ap-btn ap-btn--xs shrink-0"
            >
              Tancar
            </button>
          )}
        </div>
      )}
      {error && <p className="m-0 mb-3 rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-2)] px-2.5 py-2 text-xs leading-snug text-[var(--o-danger)]">{error}</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TaskColumn
          title="Pendents"
          items={openTasks}
          customerId={data.customer.id}
          busyTaskId={busyTaskId}
          confirmingDeleteId={confirmingDeleteId}
          onToggleDone={(taskId) => updateTaskStatus(taskId, true)}
          onDelete={deleteTask}
        />
        <TaskColumn
          title="Completades"
          items={doneTasks}
          customerId={data.customer.id}
          busyTaskId={busyTaskId}
          confirmingDeleteId={confirmingDeleteId}
          onToggleDone={(taskId) => updateTaskStatus(taskId, false)}
          onDelete={deleteTask}
          doneColumn
        />
      </div>
    </AdminSection>
  );
}

type TaskColumnItem = {
  id: string;
  title: string;
  dueDate?: string;
  leadId?: string;
};

function TaskColumn({
  title,
  items,
  customerId,
  busyTaskId,
  confirmingDeleteId,
  onToggleDone,
  onDelete,
  doneColumn = false,
}: {
  title: string;
  items: TaskColumnItem[];
  customerId: string;
  busyTaskId: string | null;
  confirmingDeleteId: string | null;
  onToggleDone: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  doneColumn?: boolean;
}) {
  return (
    <div className="min-w-0" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.tasks.column(title))}>
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] leading-tight text-[var(--t3)]">{title}</p>
      <div className="mt-2 flex min-w-0 flex-col gap-2">
        {items.length === 0 ? (
          <p className="m-0 rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-2)] p-3 text-xs text-[var(--t2)]">Sense tasques.</p>
        ) : (
          items.map((task) => (
            <article
              key={task.id}
              className="min-w-0 overflow-hidden rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-2)] p-3"
              {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.tasks.task(task.title))}
            >
              <p className="m-0 break-words text-sm leading-snug text-[var(--t)]">{task.title}</p>
              <p className="m-0 mt-1 text-xs leading-snug text-[var(--t3)]">{task.dueDate ? formatDate(task.dueDate) : 'Sense venciment'}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleDone(task.id)}
                  disabled={busyTaskId === task.id}
                  className="ap-btn ap-btn--xs"
                >
                  {busyTaskId === task.id ? 'Desant...' : doneColumn ? 'Reobrir' : 'Marcar feta'}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  disabled={busyTaskId === task.id}
                  className={`ap-btn ap-btn--xs ${confirmingDeleteId === task.id ? 'ap-btn--danger' : ''}`}
                >
                  {confirmingDeleteId === task.id ? 'Segur?' : 'Eliminar'}
                </button>
                {task.leadId && (
                  <Link href={buildCustomerWorkspaceTabHref(customerId, 'tasks')} className="min-w-0 max-w-full truncate text-xs text-[var(--gold)] no-underline transition-colors hover:text-[var(--gold-bright)]">
                    Obrir Customer Hub
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
