import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { formatDateSimple } from '@/lib/constants';
import Link from 'next/link';
import type { LeadTaskStatus, Prisma } from '@prisma/client';
import { AdminEmptyState, AdminPage, AdminSection } from '@/app/admin/components/AdminPage';
import TaskRowActions from './TaskRowActions';
import GenerateDailyChecklistButton from './GenerateDailyChecklistButton';
import TaskKanbanView from './TaskKanbanView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tasques | Òrbita Admin',
};

const STATUS_LABELS: Record<LeadTaskStatus, string> = {
  OPEN: 'Oberta',
  IN_PROGRESS: 'En curs',
  DONE: 'Feta',
  CANCELLED: 'Cancel·lada',
};

const VALID_STATUS = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const satisfies readonly LeadTaskStatus[];

function isTaskStatus(value?: string): value is LeadTaskStatus {
  if (!value) return false;
  return (VALID_STATUS as readonly string[]).includes(value);
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(value || '1', 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

function resolveDestination(task: {
  title: string;
  customer?: { id: string; name: string };
  lead?: { id: string; name: string };
}) {
  if (task.customer) return `/admin/clientes/${task.customer.id}`;
  if (task.lead) return `/admin/leads/${task.lead.id}`;

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
  const isKanban = viewParam === 'list' ? false : true; // default kanban
  const statusParam = Array.isArray(searchParams?.status) ? searchParams?.status[0] : searchParams?.status;
  const status: LeadTaskStatus | undefined = isTaskStatus(statusParam) ? statusParam : undefined;
  const customerIdParam = Array.isArray(searchParams?.customerId) ? searchParams?.customerId[0] : searchParams?.customerId;
  const customerId = customerIdParam && customerIdParam.trim() ? customerIdParam.trim() : undefined;
  const pageParam = Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page;
  const page = parsePage(pageParam);
  const limit = 25;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let tasks: Array<{
    id: string;
    title: string;
    status: LeadTaskStatus;
    dueDate: Date | null;
    lead?: { id: string; name: string };
    customer?: { id: string; name: string };
  }> = [];
  let total = 0;

  try {
    const where = {
      ...(status ? { status: { equals: status } } : {}),
      ...(customerId ? { customerId } : {}),
      NOT: [
        {
          createdBy: 'system:daily-checklist',
          status: { in: ['OPEN', 'IN_PROGRESS'] as LeadTaskStatus[] },
          dueDate: { lt: todayStart },
        },
        {
          createdBy: 'system:daily-checklist',
          status: 'CANCELLED' as LeadTaskStatus,
        },
      ],
    };
    const [rows, count] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: limit,
        skip: (page - 1) * limit,
        include: {
          lead: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);
    tasks = rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      dueDate: row.dueDate,
      lead: row.lead ? { id: row.lead.id, name: row.lead.name } : undefined,
      customer: row.customer ? { id: row.customer.id, name: row.customer.name } : undefined,
    }));
    total = count;
  } catch (error) {
    log.error('[Tasks] Error carregant tasques universals, fallback legacy:', error);
    const where: Prisma.LeadTaskWhereInput = {
      ...(status ? { status: { equals: status } } : {}),
      ...(customerId ? { lead: { customerId } } : {}),
      NOT: [
        {
          createdBy: 'system:daily-checklist',
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          dueDate: { lt: todayStart },
        },
        {
          createdBy: 'system:daily-checklist',
          status: 'CANCELLED',
        },
      ],
    };
    const [legacyRows, legacyCount] = await Promise.all([
      prisma.leadTask.findMany({
        where,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: limit,
        skip: (page - 1) * limit,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              customer: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.leadTask.count({ where }),
    ]);
    tasks = legacyRows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      dueDate: row.dueDate,
      lead: { id: row.lead.id, name: row.lead.name },
      customer: row.lead.customer ? { id: row.lead.customer.id, name: row.lead.customer.name } : undefined,
    }));
    total = legacyCount;
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (customerId) params.set('customerId', customerId);
    params.set('page', String(targetPage));
    return `/admin/tasks?${params.toString()}`;
  };

  return (
    <AdminPage
      title="Tasques"
      subtitle={`${total} tasques${customerId ? ' del client' : ''}`}
      back={customerId ? { href: `/admin/clientes/${customerId}?tab=tasks`, label: 'Client' } : undefined}
      actions={
        <>
          <div className="flex items-center gap-1 rounded-xl border p-0.5">
            <Link
              href={`/admin/tasks?view=kanban${status ? `&status=${status}` : ''}${customerId ? `&customerId=${customerId}` : ''}`}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${isKanban ? 'bg-white/10 text-white' : ''}`}
            >
              Kanban
            </Link>
            <Link
              href={`/admin/tasks?view=list${status ? `&status=${status}` : ''}${customerId ? `&customerId=${customerId}` : ''}`}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${!isKanban ? 'bg-white/10 text-white' : ''}`}
            >
              Llista
            </Link>
          </div>
          <GenerateDailyChecklistButton />
          <Link href={customerId ? `/admin/tasks/new?customerId=${customerId}` : '/admin/tasks/new'} className="ap-btn ap-btn--primary">
            + Nova tasca
          </Link>
        </>
      }
    >
      {/* Vista Kanban */}
      {isKanban && (
        <AdminSection>
          <TaskKanbanView />
        </AdminSection>
      )}

      {/* Vista Llista */}
      {!isKanban && (
        <>
          <AdminSection compact>
            <form method="GET" action="/admin/tasks" className="flex flex-wrap items-center gap-2">
              {customerId && <input type="hidden" name="customerId" value={customerId} />}
              <input type="hidden" name="view" value="list" />
              <label htmlFor="task-status-filter" className="ap-subtitle">Estat</label>
              <select
                id="task-status-filter"
                name="status"
                defaultValue={status || ''}
              >
                <option value="">Totes</option>
                {VALID_STATUS.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value] || value}
                  </option>
                ))}
              </select>
              <button type="submit" className="ap-btn ap-btn--secondary">Aplicar</button>
            </form>
          </AdminSection>

          <AdminSection flush>
            {tasks.length === 0 ? (
              <AdminEmptyState
                icon="📝"
                title="No hi ha tasques"
                description="Crea una nova tasca per començar"
                action={
                  <Link href="/admin/tasks/new" className="ap-btn ap-btn--primary">
                    + Nova tasca
                  </Link>
                }
              />
            ) : (
              <div className="ap-table-body" style={{ borderColor: 'var(--at-border-sub)' }}>
                {tasks.map((task) => {
                  const destinationHref = resolveDestination(task);
                  return (
                    <article key={task.id} className="flex items-center justify-between gap-3 px-4 py-3" style={{ transition: 'background var(--at-transition)' }}>
                      <Link href={destinationHref} className="min-w-0 flex-1">
                        <p className="text-sm truncate">{task.title}</p>
                        <p className="ap-subtitle">
                          {(task.customer?.name || task.lead?.name || 'Sense relació')} · {STATUS_LABELS[task.status] || task.status}
                        </p>
                      </Link>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="ap-subtitle">
                          {task.dueDate ? formatDateSimple(task.dueDate) : 'Sense data'}
                        </span>
                        <TaskRowActions
                          taskId={task.id}
                          status={task.status}
                          destinationHref={destinationHref}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </AdminSection>
        </>
      )}

      {/* Paginació (només vista llista) */}
      {!isKanban && totalPages > 1 && (
        <div className="flex items-center justify-between ap-subtitle">
          <span>Pàgina {page} de {totalPages}</span>
          <div className="ap-header-actions">
            <Link
              href={buildHref(Math.max(1, page - 1))}
              className={`ap-btn ap-btn--secondary ${page === 1 ? 'pointer-events-none opacity-40' : ''}`}
            >
              ← Anterior
            </Link>
            <Link
              href={buildHref(Math.min(totalPages, page + 1))}
              className={`ap-btn ap-btn--secondary ${page === totalPages ? 'pointer-events-none opacity-40' : ''}`}
            >
              Següent →
            </Link>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
