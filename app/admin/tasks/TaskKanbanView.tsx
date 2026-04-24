'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
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
  toneClass?: string;
  cardTone: string;
  tasks: KanbanTask[];
};

const COLUMNS_DEF: Omit<KanbanColumn, 'tasks'>[] = [...TASK_KANBAN_COLUMNS];

function getDueDateColor(dueDate: string | null): string {
  if (!dueDate) return '';
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return 'text-rose-400 font-semibold';
  if (diffDays === 0) return 'text-amber-400 font-semibold';
  return 'text-white/40';
}

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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-1.5 md:hidden" aria-label="Columnes del kanban de tasques">
        {columns.map((col, index) => (
          <button
            key={col.status}
            type="button"
            onClick={() => {
              const column = boardRef.current?.querySelector<HTMLElement>(`[data-task-column="${col.status}"]`);
              column?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }}
            className={`h-2.5 rounded-full transition-all ${index === activeColumnIndex ? 'w-6 bg-[var(--admin-accent)]' : 'w-2.5 bg-white/20'}`}
            aria-label={`Anar a ${col.label}`}
            aria-pressed={index === activeColumnIndex}
          />
        ))}
      </div>

      <div ref={boardRef} onScroll={handleBoardScroll} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
        {columns.map((col, index) => (
          <div
            key={col.status}
            data-task-column={col.status}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverStatus(col.status); }}
            onDragLeave={() => { if (dragOverStatus === col.status) setDragOverStatus(null); }}
            onDrop={(e) => { e.preventDefault(); handleDrop(col.status); }}
            className={`min-w-[86vw] shrink-0 snap-center rounded-2xl border flex min-h-[320px] flex-col transition-all md:min-w-0 ${col.toneClass} ${
              dragOverStatus === col.status ? 'admin-drop-active' : ''
            }`}
          >
            <div className="px-3 py-2.5 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold">{col.tasks.length}</span>
              </div>
              <p className="mt-1 text-[11px] opacity-60 md:hidden">Columna {index + 1} de {columns.length}</p>
            </div>

            <div className="flex-1 p-2 space-y-2">
              {dragOverStatus === col.status && (
                <div className="admin-drag-placeholder rounded-xl px-2 py-3 text-center text-[10px]">
                  Deixa anar aquí
                </div>
              )}
              {col.tasks.length === 0 && !dragOverStatus && (
                <div className="rounded-xl border border-dashed p-4 text-center text-xs">
                  Cap tasca
                </div>
              )}
              {col.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.effectAllowed = 'move'; setDraggingId(task.id); }}
                  onDragEnd={() => { setDraggingId(null); setDragOverStatus(null); }}
                  data-dragging={draggingId === task.id || undefined}
                  className={`admin-drag-item rounded-xl border p-3 transition-all hover:brightness-105 cursor-grab active:cursor-grabbing ${col.cardTone}`}
                >
                  <p className="text-sm font-semibold line-clamp-2">{task.title}</p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    {task.customerId && (
                      <Link href={`/admin/clientes/${task.customerId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                        👤 {task.customerName || 'Client'}
                      </Link>
                    )}
                    {task.leadId && (
                      <Link href={buildLeadWorkspaceHref(task.leadId)} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                        👥 {task.leadName || 'Entrada'}
                      </Link>
                    )}
                  </div>

                  {task.dueDate && (
                    <p className={`mt-1 text-[10px] ${getDueDateColor(task.dueDate)}`}>
                      📅 {formatDateShort(task.dueDate)}{getDueDateSuffix(task.dueDate)}
                    </p>
                  )}

                  <div className="mt-2 flex gap-1 md:hidden">
                    {COLUMNS_DEF.filter((c) => c.status !== col.status).map((target) => (
                      <button
                        key={target.status}
                        type="button"
                        onClick={() => moveTask(task.id, target.status)}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium transition-colors hover:bg-white/10 active:bg-white/20"
                      >
                        {target.label}
                      </button>
                    ))}
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
