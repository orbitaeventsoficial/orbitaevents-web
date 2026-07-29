import Link from 'next/link';
import type { TaskStatus } from '@/lib/services/tasks/leadScopedTaskService';
import { ADMIN_TASKS_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { AdminEmptyState } from '@/app/admin/components/AdminPage';
import { formatDateSimple, getTaskStatusLabel, TASK_STATUS_VALUES, TASK_SOURCE } from '@/lib/constants';
import {
  buildCustomerTaskCreateHref,
  buildCustomerTaskListHref,
} from '@/lib/admin/customerWorkspaceHref';
import GenerateDailyChecklistButton from './GenerateDailyChecklistButton';
import RunAutoTasksButton from './RunAutoTasksButton';
import TaskKanbanView from './TaskKanbanView';
import TaskRowActions from './TaskRowActions';

export interface TaskListItem {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: Date | null;
  source?: string | null;
  customer?: { id: string; name: string } | null;
  lead?: { id: string; name: string } | null;
}

export function TaskPageToolbar({
  isKanban,
  status,
  customerId,
}: {
  isKanban: boolean;
  status?: TaskStatus;
  customerId?: string;
}) {
  return (
    <>
      <div className="inline-flex gap-1.5" {...helpAttrs(ADMIN_TASKS_HELP.viewToggle)}>
        <Link
          href={customerId ? buildCustomerTaskListHref(customerId, { view: 'kanban', status }) : `/admin/tasks?view=kanban${status ? `&status=${status}` : ''}`}
          className={`ap-tab ${isKanban ? 'ap-tab--active' : 'ap-tab--idle'}`}
        >
          Kanban
        </Link>
        <Link
          href={customerId ? buildCustomerTaskListHref(customerId, { view: 'list', status }) : `/admin/tasks?view=list${status ? `&status=${status}` : ''}`}
          className={`ap-tab ${!isKanban ? 'ap-tab--active' : 'ap-tab--idle'}`}
        >
          Llista
        </Link>
      </div>
      <RunAutoTasksButton />
      <GenerateDailyChecklistButton />
      <Link
        href={customerId ? buildCustomerTaskCreateHref(customerId) : '/admin/tasks/new'}
        className="ap-btn ap-btn--primary"
        {...helpAttrs(ADMIN_TASKS_HELP.newTask)}
      >
        + Nova tasca
      </Link>
    </>
  );
}

export function TaskKanbanSection() {
  return (
    <div {...helpAttrs(ADMIN_TASKS_HELP.kanban)}>
      <TaskKanbanView />
    </div>
  );
}

export function TaskFiltersSection({
  status,
  customerId,
}: {
  status?: TaskStatus;
  customerId?: string;
}) {
  return (
    <form method="GET" action="/admin/tasks" className="flex flex-wrap items-center gap-2.5" {...helpAttrs(ADMIN_TASKS_HELP.filters)}>
      {customerId && <input type="hidden" name="customerId" value={customerId} />}
      <input type="hidden" name="view" value="list" />
      <label htmlFor="task-status-filter" className="text-xs font-semibold text-[var(--t3)]">Estat</label>
      <select id="task-status-filter" name="status" defaultValue={status || ''} className="adm-input max-w-[12rem]">
        <option value="">Totes</option>
        {TASK_STATUS_VALUES.map((value) => (
          <option key={value} value={value}>
            {getTaskStatusLabel(value)}
          </option>
        ))}
      </select>
      <button type="submit" className="ap-btn ap-btn--xs">Aplicar</button>
    </form>
  );
}

export function TaskListSection({
  tasks,
  resolveDestination,
}: {
  tasks: TaskListItem[];
  resolveDestination: (task: TaskListItem) => string;
}) {
  if (tasks.length === 0) {
    return (
      <div {...helpAttrs(ADMIN_TASKS_HELP.list)}>
        <AdminEmptyState
          icon="📝"
          title="No hi ha tasques"
          description="Crea una nova tasca per començar"
          action={<Link href="/admin/tasks/new" className="ap-btn ap-btn--primary">+ Nova tasca</Link>}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5" {...helpAttrs(ADMIN_TASKS_HELP.list)}>
      {tasks.map((task) => {
        const destinationHref = resolveDestination(task);
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' && task.status !== 'CANCELLED';
        return (
          <article key={task.id} className={`ap-card ${isOverdue ? 'border-l-2 border-l-[var(--at-red)]' : ''}`}>
            <div className="ap-card-body flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Link href={destinationHref} className="block min-w-0 flex-1 text-inherit no-underline">
                <p className="truncate text-sm font-semibold text-[var(--t)]">{task.title}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--t3)]">
                    {(task.customer?.name || task.lead?.name || 'Sense relació')} · {getTaskStatusLabel(task.status)}
                  </span>
                  {task.source === TASK_SOURCE.REACTIVATION && (
                    <span className="ap-badge ap-badge--warning">Reactivació</span>
                  )}
                </div>
              </Link>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                <span className={`text-xs ${isOverdue ? 'admin-tone-text-danger font-bold' : 'text-[var(--t3)]'}`}>
                  {task.dueDate ? formatDateSimple(task.dueDate) : 'Sense data'}
                </span>
                <TaskRowActions taskId={task.id} status={task.status} destinationHref={destinationHref} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function TaskPagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (targetPage: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 font-mono text-xs text-[var(--t3)]" {...helpAttrs(ADMIN_TASKS_HELP.pagination)}>
      <span>Pàgina {page} de {totalPages}</span>
      <div className="flex gap-2">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          className={`ap-btn ap-btn--xs${page === 1 ? ' pointer-events-none opacity-40' : ''}`}
          {...helpAttrs(ADMIN_TASKS_HELP.previousPage)}
        >
          ← Anterior
        </Link>
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          className={`ap-btn ap-btn--xs${page === totalPages ? ' pointer-events-none opacity-40' : ''}`}
          {...helpAttrs(ADMIN_TASKS_HELP.nextPage)}
        >
          Següent →
        </Link>
      </div>
    </div>
  );
}
