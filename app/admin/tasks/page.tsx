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
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildCustomerHubHref, buildCustomerWorkspaceTabHref } from '@/lib/admin/customerWorkspaceHref';

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
  const openTasks = tasks.filter((task) => task.status === 'OPEN' || task.status === 'IN_PROGRESS').length;
  const overdueTasks = tasks.filter(
    (task) => task.dueDate && task.dueDate < todayStart && task.status !== 'DONE' && task.status !== 'CANCELLED'
  ).length;
  const dueTodayTasks = tasks.filter(
    (task) => task.dueDate && task.dueDate.getTime() === todayStart.getTime() && task.status !== 'DONE' && task.status !== 'CANCELLED'
  ).length;
  const reactivationTasks = tasks.filter((task) => task.source === 'reactivation').length;
  const blockedQueueCount = queueSummary.queues.BLOQUEJAT || 0;
  const vipQueueCount = queueSummary.queues.VIP || 0;
  const automaticSignals = [
    queueSummary.total > 0 ? `${queueSummary.total} tasca${queueSummary.total > 1 ? 'ques' : ''} dins la queue operativa` : null,
    dueTodayTasks > 0 ? `${dueTodayTasks} tasca${dueTodayTasks > 1 ? 'ques' : ''} per avui` : null,
    vipQueueCount > 0 ? `${vipQueueCount} tasca${vipQueueCount > 1 ? 'ques' : ''} VIP` : null,
    reactivationTasks > 0 ? `${reactivationTasks} reactivació${reactivationTasks > 1 ? 'ns' : ''} activa${reactivationTasks > 1 ? 'es' : ''}` : null,
  ].filter(Boolean) as string[];
  const manualSignals = [
    overdueTasks > 0 ? `${overdueTasks} tasca${overdueTasks > 1 ? 'ques' : ''} vençuda${overdueTasks > 1 ? 'es' : ''}` : null,
    blockedQueueCount > 0 ? `${blockedQueueCount} tasca${blockedQueueCount > 1 ? 'ques' : ''} bloquejada${blockedQueueCount > 1 ? 'es' : ''}` : null,
    openTasks > 0 ? `${openTasks} tasca${openTasks > 1 ? 'ques' : ''} oberta${openTasks > 1 ? 'es' : ''}` : null,
  ].filter(Boolean) as string[];
  const nextStepHref = overdueTasks > 0
    ? customerId
      ? buildTaskListHref(customerId, false, status, 'VENÇUT')
      : '/admin/tasks?view=list&queue=VENÇUT'
    : blockedQueueCount > 0
      ? customerId
        ? buildTaskListHref(customerId, false, status, 'BLOQUEJAT')
        : '/admin/tasks?view=list&queue=BLOQUEJAT'
      : customerId
        ? buildCustomerWorkspaceTabHref(customerId!, 'tasks')
        : '/admin/tasks/new';
  const nextStepLabel = overdueTasks > 0
    ? 'Desbloquejar tasques vençudes'
    : blockedQueueCount > 0
      ? 'Revisar tasques bloquejades'
      : customerId
        ? 'Tornar al client'
        : 'Crear tasca nova';
  const nextStepDetail = overdueTasks > 0
    ? 'La prioritat és recuperar execució que ja ha passat de data.'
    : blockedQueueCount > 0
      ? 'Hi ha feina parada que necessita decisió o context.'
      : customerId
        ? 'No hi ha tensió forta a la cua actual del client.'
        : 'No hi ha cap front calent; pots crear o revisar feina nova.';

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
    <div className="tk__root">
      <header className="tk__header">
        <div className="tk__header-left">
          <span className="tk__eyebrow">Operativa</span>
          <h1 className="tk__title">Tasques</h1>
          <p className="tk__subtitle">{total} tasques{customerId ? ' del client' : ''}</p>
        </div>
        <div className="tk__header-right">
          <TaskPageToolbar isKanban={isKanban} status={status} customerId={customerId} />
        </div>
      </header>

      <div className="tk__body">
        {!isKanban && (
          <div className="tk__strip">
            <OwnerControlStrip
              system={{
                eyebrow: 'Automàtic',
                title: 'Què vigila el sistema',
                tone: 'info',
                items: automaticSignals,
                emptyText: 'Sense senyals automàtiques destacades ara mateix.',
              }}
              manual={{
                eyebrow: 'Manual',
                title: 'Què et reclama decisió',
                tone: manualSignals.length > 0 ? 'warning' : 'success',
                items: manualSignals,
                emptyText: 'No hi ha cap front manual calent a la cua actual.',
              }}
              nextStep={{
                title: nextStepLabel,
                detail: nextStepDetail,
                href: nextStepHref,
              }}
            />
          </div>
        )}
        {!isKanban && queueSummary.total > 0 && (
          <div className="tk__section">
            <TaskQueueBanner queues={queueSummary.queues} total={queueSummary.total} />
          </div>
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
      </div>
    </div>
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
