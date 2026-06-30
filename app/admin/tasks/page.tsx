import { TASK_QUEUE_VALUES, TASK_STATUS_VALUES } from '@/lib/constants';
import type { TaskStatus } from '@/lib/services/tasks/leadScopedTaskService';
import './tasks.css';
import {
  TaskFiltersSection,
  TaskKanbanSection,
  TaskListSection,
  TaskPageToolbar,
  TaskPagination,
  type TaskListItem,
} from './TaskPageSections';
import { fetchAdminTaskList } from '@/lib/services/tasks/taskList';
import { loadTaskQueue, type TaskQueue } from '@/lib/services/tasks/taskQueueService';
import TaskQueueBanner from './TaskQueueBanner';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { AdminPage } from '../components/AdminPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tasques | Òrbita Admin',
};

function isTaskStatus(value?: string): value is TaskStatus {
  if (!value) return false;
  return (TASK_STATUS_VALUES as readonly string[]).includes(value);
}


function isTaskQueue(value?: string): value is TaskQueue {
  if (!value) return false;
  return (TASK_QUEUE_VALUES as readonly string[]).includes(value);
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(value || '1', 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

function resolveDestination(task: TaskListItem) {
  if (task.customer) return buildCustomerHubHref(task.customer.id);
  if (task.lead) return buildLeadWorkspaceHref(task.lead.id);

  const title = task.title.toLowerCase();
  if (title.includes('entrades')) return '/admin/leads?status=NEW';
  if (title.includes('pressupost')) return '/admin/presupuestos';
  if (title.includes('reserves') || title.includes('calendari')) return '/admin/calendario';
  if (title.includes('post-esdeveniment')) return '/admin/emails';
  if (title.includes('tasques')) return '/admin/tasks?status=OPEN';
  return '/admin/tasks';
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const viewParam = Array.isArray(searchParams?.view) ? searchParams?.view[0] : searchParams?.view;
  const isKanban = viewParam !== 'list';
  const statusParam = Array.isArray(searchParams?.status) ? searchParams?.status[0] : searchParams?.status;
  const status: TaskStatus | undefined = isTaskStatus(statusParam) ? statusParam : undefined;
  const customerIdParam = Array.isArray(searchParams?.customerId) ? searchParams?.customerId[0] : searchParams?.customerId;
  const customerId = customerIdParam && customerIdParam.trim() ? customerIdParam.trim() : undefined;
  const queueParam = Array.isArray(searchParams?.queue) ? searchParams?.queue[0] : searchParams?.queue;
  const queueFilter = isTaskQueue(queueParam) ? queueParam : undefined;
  const pageParam = Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page;
  const page = parsePage(pageParam);
  const limit = 25;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let taskResult: Awaited<ReturnType<typeof fetchAdminTaskList>>;
  let queueSummary: Awaited<ReturnType<typeof loadTaskQueue>>;

  if (queueFilter && !isKanban) {
    queueSummary = await loadTaskQueue(todayStart);
    const taskIds = queueSummary.items
      .filter((item) => item.queue === queueFilter)
      .map((item) => item.id);
    taskResult = await fetchAdminTaskList({ status, customerId, taskIds, page, limit, todayStart });
  } else {
    [taskResult, queueSummary] = await Promise.all([
      fetchAdminTaskList({ status, customerId, page, limit, todayStart }),
      loadTaskQueue(todayStart),
    ]);
  }

  const { tasks, total } = taskResult;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (!isKanban) params.set('view', 'list');
    if (status) params.set('status', status);
    if (customerId) params.set('customerId', customerId);
    params.set('page', String(targetPage));
    const query = params.toString();
    return query ? '/admin/tasks?' + query : '/admin/tasks';
  };

  return (
    <AdminPage
      title="Tasques"
      subtitle={`${total} tasques${customerId ? ' del client' : ''}`}
      actions={<TaskPageToolbar isKanban={isKanban} status={status} customerId={customerId} />}
    >
      {!isKanban && queueSummary.total > 0 && (
        <TaskQueueBanner queues={queueSummary.queues} total={queueSummary.total} />
      )}
      {isKanban ? (
        <TaskKanbanSection />
      ) : (
        <>
          <TaskFiltersSection status={status} customerId={customerId} />
          <TaskListSection tasks={tasks} resolveDestination={resolveDestination} />
        </>
      )}
      {!isKanban && <TaskPagination page={page} totalPages={totalPages} buildHref={buildHref} />}
    </AdminPage>
  );
}

function buildTaskListHref(customerId: string | undefined, isKanban: boolean, status?: TaskStatus, queue?: TaskQueue) {
  const params = new URLSearchParams();
  if (!isKanban) params.set('view', 'list');
  if (status) params.set('status', status);
  if (queue) params.set('queue', queue);
  if (customerId) params.set('customerId', customerId);
  const query = params.toString();
  return query ? `/admin/tasks?${query}` : '/admin/tasks';
}
