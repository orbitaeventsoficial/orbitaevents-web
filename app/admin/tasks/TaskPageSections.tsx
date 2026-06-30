import Link from 'next/link';
import type { TaskStatus } from '@/lib/services/tasks/leadScopedTaskService';
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
      <div className="tk__view-toggle" {...helpAttrs(ADMIN_TASKS_HELP.viewToggle)}>
        <Link
          href={customerId ? buildCustomerTaskListHref(customerId, { view: 'kanban', status }) : `/admin/tasks?view=kanban${status ? `&status=${status}` : ''}`}
          className={`tk__view-btn${isKanban ? ' tk__view-btn--active' : ''}`}
        >
          Kanban
        </Link>
        <Link
          href={customerId ? buildCustomerTaskListHref(customerId, { view: 'list', status }) : `/admin/tasks?view=list${status ? `&status=${status}` : ''}`}
          className={`tk__view-btn${!isKanban ? ' tk__view-btn--active' : ''}`}
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
    <form method="GET" action="/admin/tasks" className="tk__filters" {...helpAttrs(ADMIN_TASKS_HELP.filters)}>
      {customerId && <input type="hidden" name="customerId" value={customerId} />}
      <input type="hidden" name="view" value="list" />
      <label htmlFor="task-status-filter" className="tk__filter-label">Estat</label>
      <select id="task-status-filter" name="status" defaultValue={status || ''} className="tk__filter-select">
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
      <div className="tk__list">
        <div className="tk__empty" {...helpAttrs(ADMIN_TASKS_HELP.list)}>
          <span className="tk__empty-icon">📝</span>
          <h3 className="tk__empty-title">No hi ha tasques</h3>
          <p className="tk__empty-desc">Crea una nova tasca per començar</p>
          <Link href="/admin/tasks/new" className="ap-btn ap-btn--primary">+ Nova tasca</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tk__list" {...helpAttrs(ADMIN_TASKS_HELP.list)}>
      {tasks.map((task) => {
        const destinationHref = resolveDestination(task);
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' && task.status !== 'CANCELLED';
        return (
          <article key={task.id} className={`tk__row admin-stagger-item${isOverdue ? ' tk__row--overdue' : ''}`}>
            <Link href={destinationHref} className="tk__row-main">
              <p className="tk__row-title">{task.title}</p>
              <div className="tk__row-meta">
                <span className="tk__row-sub">
                  {(task.customer?.name || task.lead?.name || 'Sense relació')} · {getTaskStatusLabel(task.status)}
                </span>
                {task.source === TASK_SOURCE.REACTIVATION && (
                  <span className="tk__row-badge">Reactivació</span>
                )}
              </div>
            </Link>
            <div className="tk__row-side">
              <span className={`tk__row-date${isOverdue ? ' tk__row-date--overdue' : ''}`}>
                {task.dueDate ? formatDateSimple(task.dueDate) : 'Sense data'}
              </span>
              <TaskRowActions taskId={task.id} status={task.status} destinationHref={destinationHref} />
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
    <div className="tk__pagination" {...helpAttrs(ADMIN_TASKS_HELP.pagination)}>
      <span>Pàgina {page} de {totalPages}</span>
      <div className="tk__pagination-btns">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          className={`ap-btn--xs${page === 1 ? ' pointer-events-none' : ''}`}
          style={page === 1 ? { opacity: 0.4 } : undefined}
          {...helpAttrs(ADMIN_TASKS_HELP.previousPage)}
        >
          ← Anterior
        </Link>
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          className={`ap-btn--xs${page === totalPages ? ' pointer-events-none' : ''}`}
          style={page === totalPages ? { opacity: 0.4 } : undefined}
          {...helpAttrs(ADMIN_TASKS_HELP.nextPage)}
        >
          Següent →
        </Link>
      </div>
    </div>
  );
}
