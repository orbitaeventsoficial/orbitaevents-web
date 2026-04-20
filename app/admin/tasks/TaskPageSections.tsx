import Link from 'next/link';
import type { TaskStatus } from '@/lib/services/tasks/leadScopedTaskService';
import { AdminEmptyState, AdminSection } from '@/app/admin/components/AdminPage';
import { ADMIN_TASKS_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
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
      <div className="flex items-center gap-1 rounded-xl border p-0.5" {...helpAttrs(ADMIN_TASKS_HELP.viewToggle)}>
        <Link
          href={customerId ? buildCustomerTaskListHref(customerId, { view: 'kanban', status }) : `/admin/tasks?view=kanban${status ? `&status=${status}` : ''}`}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${isKanban ? 'bg-white/10 text-white' : ''}`}
        >
          Kanban
        </Link>
        <Link
          href={customerId ? buildCustomerTaskListHref(customerId, { view: 'list', status }) : `/admin/tasks?view=list${status ? `&status=${status}` : ''}`}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${!isKanban ? 'bg-white/10 text-white' : ''}`}
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
    <AdminSection>
      <div {...helpAttrs(ADMIN_TASKS_HELP.kanban)}>
        <TaskKanbanView />
      </div>
    </AdminSection>
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
    <AdminSection compact>
      <form method="GET" action="/admin/tasks" className="flex flex-wrap items-center gap-2" {...helpAttrs(ADMIN_TASKS_HELP.filters)}>
        {customerId && <input type="hidden" name="customerId" value={customerId} />}
        <input type="hidden" name="view" value="list" />
        <label htmlFor="task-status-filter" className="ap-subtitle">Estat</label>
        <select id="task-status-filter" name="status" defaultValue={status || ''}>
          <option value="">Totes</option>
          {TASK_STATUS_VALUES.map((value) => (
            <option key={value} value={value}>
              {getTaskStatusLabel(value)}
            </option>
          ))}
        </select>
        <button type="submit" className="ap-btn ap-btn--secondary">Aplicar</button>
      </form>
    </AdminSection>
  );
}

export function TaskListSection({
  tasks,
  resolveDestination,
}: {
  tasks: TaskListItem[];
  resolveDestination: (task: TaskListItem) => string;
}) {
  return (
    <AdminSection flush>
      {tasks.length === 0 ? (
        <AdminEmptyState
          icon="📝"
          title="No hi ha tasques"
          description="Crea una nova tasca per començar"
          action={<Link href="/admin/tasks/new" className="ap-btn ap-btn--primary">+ Nova tasca</Link>}
        />
      ) : (
        <div className="space-y-2" {...helpAttrs(ADMIN_TASKS_HELP.list)}>
          {tasks.map((task) => {
            const destinationHref = resolveDestination(task);
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' && task.status !== 'CANCELLED';
            return (
              <article key={task.id} className={`admin-stagger-item flex flex-col gap-3 rounded-xl border border-white/10 px-4 py-3 admin-card-glass transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center ${isOverdue ? 'border-l-2 border-l-rose-500/60' : ''}`}>
                <Link href={destinationHref} className="min-w-0 flex-1">
                  <p className="text-sm truncate">{task.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="ap-subtitle">{(task.customer?.name || task.lead?.name || 'Sense relació')} · {getTaskStatusLabel(task.status)}</p>
                    {task.source === TASK_SOURCE.REACTIVATION && (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                        Reactivació
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center sm:gap-3">
                  <span className={`ap-subtitle ${isOverdue ? 'text-rose-400' : ''}`}>{task.dueDate ? formatDateSimple(task.dueDate) : 'Sense data'}</span>
                  <TaskRowActions taskId={task.id} status={task.status} destinationHref={destinationHref} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AdminSection>
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
    <div className="flex items-center justify-between ap-subtitle" {...helpAttrs(ADMIN_TASKS_HELP.pagination)}>
      <span>Pàgina {page} de {totalPages}</span>
      <div className="ap-header-actions">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          className={`ap-btn ap-btn--secondary ${page === 1 ? 'pointer-events-none opacity-40' : ''}`}
          {...helpAttrs(ADMIN_TASKS_HELP.previousPage)}
        >
          ← Anterior
        </Link>
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          className={`ap-btn ap-btn--secondary ${page === totalPages ? 'pointer-events-none opacity-40' : ''}`}
          {...helpAttrs(ADMIN_TASKS_HELP.nextPage)}
        >
          Següent →
        </Link>
      </div>
    </div>
  );
}
