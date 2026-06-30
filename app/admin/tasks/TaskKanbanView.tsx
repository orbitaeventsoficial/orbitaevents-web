'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { TASK_KANBAN_COLUMNS, formatDateShort } from '@/lib/constants';
import { useToast } from '@/app/admin/components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';

type KanbanTask = {
  id: string;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  dueDate: string | null;
  leadId: string | null;
  leadName: string | null;
  customerId: string | null;
  customerName: string | null;
};

type KanbanColumn = {
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  label: string;
  tasks: KanbanTask[];
};

const COLUMNS_DEF: Omit<KanbanColumn, 'tasks'>[] = TASK_KANBAN_COLUMNS.map(({ status, label }) => ({ status, label }));

function getDueDateClass(dueDate: string | null): string {
  if (!dueDate) return '';
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return 'admin-tone-text-danger font-bold';
  if (diffDays === 0) return 'admin-tone-text-warning font-bold';
  return '';
}

const STATUS_CARD_TONE: Record<KanbanTask['status'], string> = {
  OPEN: 'ap-card--info',
  IN_PROGRESS: 'ap-card--warning',
  DONE: 'ap-card--success',
};

const STATUS_LABEL_TONE: Record<KanbanTask['status'], string> = {
  OPEN: 'admin-tone-text-info',
  IN_PROGRESS: 'admin-tone-text-warning',
  DONE: 'admin-tone-text-success',
};

function getDueDateSuffix(dueDate: string): string {
  const due = new Date(dueDate);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return ` (fa ${Math.abs(diffDays)}d)`;
  if (diffDays === 0) return ' (avui)';
  return '';
}

export default function TaskKanbanView() {
  const toast = useToast();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetchWithCsrf('/api/admin/tasks?limit=200&kanban=true', { credentials: 'include' });
      if (!res.ok) throw new Error('Error carregant tasques');
      const data = await res.json();
      const rows: KanbanTask[] = (data?.tasks || data?.data || []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        title: t.title as string,
        status: (t.status as KanbanTask['status']) || 'OPEN',
        dueDate: (t.dueDate as string) || null,
        leadId: (t.leadId as string) || ((t.lead as Record<string, unknown> | undefined)?.id as string) || null,
        leadName: (t.leadName as string) || ((t.lead as Record<string, unknown> | undefined)?.name as string) || null,
        customerId: (t.customerId as string) || ((t.customer as Record<string, unknown> | undefined)?.id as string) || null,
        customerName: (t.customerName as string) || ((t.customer as Record<string, unknown> | undefined)?.name as string) || null,
      }));
      setTasks(rows);
    } catch (error) {
      log.error('[TaskKanban] Error carregant tasques', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const columns: KanbanColumn[] = COLUMNS_DEF.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.status === col.status),
  }));

  const moveTask = async (taskId: string, newStatus: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    const prevStatus = task.status;

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as KanbanTask['status'] } : t)));

    try {
      const res = await fetchWithCsrf(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t)));
        toast.error('Error movent la tasca');
      } else {
        const targetLabel = COLUMNS_DEF.find((c) => c.status === newStatus)?.label || newStatus;
        toast.success(`Tasca moguda a ${targetLabel}`);
      }
    } catch (error) {
      console.error('Error movent tasca al kanban', error);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t)));
      toast.error(error instanceof Error ? error.message : 'Error de connexió');
    }
  };

  const handleDrop = (targetStatus: string) => {
    if (!draggingId) return;
    setDragOverStatus(null);
    void moveTask(draggingId, targetStatus);
    setDraggingId(null);
  };

  const handleBoardScroll = () => {
    const board = boardRef.current;
    if (!board) return;
    const columnEls = Array.from(board.querySelectorAll<HTMLElement>('[data-task-column]'));
    if (columnEls.length === 0) return;

    const boardCenter = board.scrollLeft + board.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    columnEls.forEach((column, index) => {
      const columnCenter = column.offsetLeft + column.offsetWidth / 2;
      const distance = Math.abs(columnCenter - boardCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveColumnIndex(nearestIndex);
  };

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-3" role="status" aria-live="polite" aria-label="Carregant tasques">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-80 rounded-[var(--o-r-md)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-center gap-1.5 md:hidden" aria-label="Columnes del kanban de tasques">
        {columns.map((col, index) => (
          <button
            key={col.status}
            type="button"
            onClick={() => {
              const column = boardRef.current?.querySelector<HTMLElement>(`[data-task-column="${col.status}"]`);
              column?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }}
            className={`h-2.5 rounded-full transition-all ${index === activeColumnIndex ? 'w-6 bg-[var(--gold)]' : 'w-2.5 bg-[var(--line2)]'}`}
            aria-label={`Anar a ${col.label}`}
            aria-pressed={index === activeColumnIndex}
          />
        ))}
      </div>

      <div
        ref={boardRef}
        onScroll={handleBoardScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0"
      >
        {columns.map((col, index) => (
          <div
            key={col.status}
            data-task-column={col.status}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverStatus(col.status); }}
            onDragLeave={() => { if (dragOverStatus === col.status) setDragOverStatus(null); }}
            onDrop={(e) => { e.preventDefault(); handleDrop(col.status); }}
            className={`flex min-h-[20rem] min-w-[86vw] shrink-0 snap-center flex-col rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--panel)] transition-colors md:min-w-0 ${dragOverStatus === col.status ? 'admin-drop-active' : ''}`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-3.5 py-2.5">
              <div>
                <h3 className={`text-sm font-bold ${STATUS_LABEL_TONE[col.status]}`}>{col.label}</h3>
                <p className="mt-0.5 text-xs text-[var(--t3)] opacity-60 md:hidden">Columna {index + 1} de {columns.length}</p>
              </div>
              <span className="rounded-full border border-[var(--line2)] px-2 text-xs font-bold text-[var(--t3)]">{col.tasks.length}</span>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-2">
              {dragOverStatus === col.status && (
                <div className="rounded-[var(--o-r-md)] border border-dashed border-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_8%,transparent)] p-3 text-center text-xs text-[var(--gold)] opacity-70">
                  Deixa anar aquí
                </div>
              )}
              {col.tasks.length === 0 && !dragOverStatus && (
                <div className="rounded-[var(--o-r-md)] border border-dashed border-[var(--line2)] p-4 text-center text-xs text-[var(--t3)]">
                  Cap tasca
                </div>
              )}
              {col.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.effectAllowed = 'move'; setDraggingId(task.id); }}
                  onDragEnd={() => { setDraggingId(null); setDragOverStatus(null); }}
                  className={`ap-card ${STATUS_CARD_TONE[task.status]} cursor-grab active:cursor-grabbing ${draggingId === task.id ? 'opacity-45' : ''}`}
                >
                  <div className="ap-card-body">
                    <p className="line-clamp-2 text-sm font-bold text-[var(--t)]">{task.title}</p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {task.customerId && (
                        <Link href={buildCustomerHubHref(task.customerId)} className="text-xs text-[var(--t3)] no-underline transition-colors hover:text-[var(--t2)]" onClick={(e) => e.stopPropagation()}>
                          👤 {task.customerName || 'Client'}
                        </Link>
                      )}
                      {task.leadId && (
                        <Link href={buildLeadWorkspaceHref(task.leadId)} className="text-xs text-[var(--t3)] no-underline transition-colors hover:text-[var(--t2)]" onClick={(e) => e.stopPropagation()}>
                          👥 {task.leadName || 'Entrada'}
                        </Link>
                      )}
                    </div>

                    {task.dueDate && (
                      <p className={`mt-1 text-xs text-[var(--t3)] ${getDueDateClass(task.dueDate)}`}>
                        📅 {formatDateShort(task.dueDate)}{getDueDateSuffix(task.dueDate)}
                      </p>
                    )}

                    <div className="mt-2 flex gap-1 md:hidden">
                      {COLUMNS_DEF.filter((c) => c.status !== col.status).map((target) => (
                        <button
                          key={target.status}
                          type="button"
                          onClick={() => moveTask(task.id, target.status)}
                          className="ap-btn ap-btn--xs flex-1"
                        >
                          {target.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
