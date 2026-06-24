'use client';

import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import { formatDate } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_CUSTOMER_PANEL_HELP_2, helpAttrs } from '@/app/admin/components/adminHelpContent';
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
    <section className="ch__tasks-panel" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.tasks.root)}>
      <div className="ch__tasks-head">
        <div>
          <h2 className="ch__tasks-heading">Tasques / Notes</h2>
          <p className="ch__tasks-summary">Checklist operativa vinculada al client.</p>
        </div>
        <Link
          href={customerTaskCreateHref}
          className="ap-btn ap-btn--primary ap-btn--xs"
          {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.tasks.newTask)}
        >
          Nova tasca
        </Link>
      </div>
      {notice && (
        <div className="ch__tasks-notice" role="alert">
          <p>{notice}</p>
          {onDismissNotice && (
            <button
              type="button"
              onClick={onDismissNotice}
              className="ch__tasks-dismiss"
            >
              Tancar
            </button>
          )}
        </div>
      )}
      {error && <p className="ch__tasks-error">{error}</p>}
      <div className="ch__tasks-grid">
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
    </section>
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
    <div className="ch__tasks-column" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.tasks.column(title))}>
      <p className="ch__tasks-column-label">{title}</p>
      <div className="ch__tasks-list">
        {items.length === 0 ? (
          <p className="ch__tasks-empty">Sense tasques.</p>
        ) : (
          items.map((task) => (
            <article
              key={task.id}
              className="ch__task-card"
              {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.tasks.task(task.title))}
            >
              <p className="ch__task-title">{task.title}</p>
              <p className="ch__task-date">{task.dueDate ? formatDate(task.dueDate) : 'Sense venciment'}</p>
              <div className="ch__task-actions">
                <button
                  type="button"
                  onClick={() => onToggleDone(task.id)}
                  disabled={busyTaskId === task.id}
                  className="ch__task-action"
                >
                  {busyTaskId === task.id ? 'Desant...' : doneColumn ? 'Reobrir' : 'Marcar feta'}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  disabled={busyTaskId === task.id}
                  className={`ch__task-action ${confirmingDeleteId === task.id ? 'ch__task-action--danger' : ''}`}
                >
                  {confirmingDeleteId === task.id ? 'Segur?' : 'Eliminar'}
                </button>
                {task.leadId && (
                  <Link href={buildCustomerWorkspaceTabHref(customerId, 'tasks')} className="ch__task-link">
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
