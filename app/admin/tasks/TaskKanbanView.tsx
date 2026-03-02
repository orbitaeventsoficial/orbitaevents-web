'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatDateShort } from '@/lib/constants';
import { useToast } from '@/app/admin/components/ToastProvider';

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
  toneClass: string;
  cardTone: string;
  tasks: KanbanTask[];
};

const COLUMNS_DEF: Omit<KanbanColumn, 'tasks'>[] = [
  { status: 'OPEN', label: 'Obertes', toneClass: 'border-sky-500/30 bg-sky-500/5', cardTone: 'border-sky-500/20 bg-sky-500/10' },
  { status: 'IN_PROGRESS', label: 'En curs', toneClass: 'border-amber-500/30 bg-amber-500/5', cardTone: 'border-amber-500/20 bg-amber-500/10' },
  { status: 'DONE', label: 'Fetes', toneClass: 'border-emerald-500/30 bg-emerald-500/5', cardTone: 'border-emerald-500/20 bg-emerald-500/10' },
];

function getDueDateColor(dueDate: string | null): string {
  if (!dueDate) return '';
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return 'text-rose-400 font-semibold'; // vençuda
  if (diffDays === 0) return 'text-amber-400 font-semibold'; // avui
  return 'text-white/40'; // futur
}

export default function TaskKanbanView() {
  const toast = useToast();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tasks?limit=200&kanban=true', { credentials: 'include' });
      if (!res.ok) throw new Error('Error carregant tasques');
      const data = await res.json();
      const rows: KanbanTask[] = (data?.tasks || data?.data || []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        title: t.title as string,
        status: (t.status as string) || 'OPEN',
        dueDate: (t.dueDate as string) || null,
        leadId: (t.leadId as string) || (t.lead as Record<string, unknown>)?.id as string || null,
        leadName: (t.leadName as string) || (t.lead as Record<string, unknown>)?.name as string || null,
        customerId: (t.customerId as string) || (t.customer as Record<string, unknown>)?.id as string || null,
        customerName: (t.customerName as string) || (t.customer as Record<string, unknown>)?.name as string || null,
      }));
      setTasks(rows);
    } catch (error) {
      console.error('[TaskKanban] Error carregant tasques:', error);
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

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as KanbanTask['status'] } : t)));

    try {
      const res = await fetch(`/api/admin/tasks/${taskId}`, {
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
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t)));
      toast.error('Error de connexió');
    }
  };

  const handleDrop = (targetStatus: string) => {
    if (!draggingId) return;
    setDragOverStatus(null);
    void moveTask(draggingId, targetStatus);
    setDraggingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {columns.map((col) => (
        <div
          key={col.status}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverStatus(col.status); }}
          onDragLeave={() => { if (dragOverStatus === col.status) setDragOverStatus(null); }}
          onDrop={(e) => { e.preventDefault(); handleDrop(col.status); }}
          className={`rounded-2xl border flex min-h-[320px] flex-col transition-all ${col.toneClass} ${
            dragOverStatus === col.status ? 'ring-2 ring-cyan-400/50' : ''
          }`}
        >
          {/* Header */}
          <div className="px-3 py-2.5 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold">{col.tasks.length}</span>
            </div>
          </div>

          {/* Cards */}
          <div className="flex-1 p-2 space-y-2">
            {dragOverStatus === col.status && (
              <div className="rounded-xl border border-dashed px-2 py-1 text-center text-[10px]">
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
                className={`rounded-xl border p-3 transition-all hover:brightness-105 cursor-grab active:cursor-grabbing ${col.cardTone}`}
              >
                <p className="text-sm font-semibold line-clamp-2">{task.title}</p>

                {/* Entitat relacionada */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                  {task.customerId && (
                    <Link href={`/admin/clientes/${task.customerId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                      👤 {task.customerName || 'Client'}
                    </Link>
                  )}
                  {task.leadId && (
                    <Link href={`/admin/leads/${task.leadId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                      👥 {task.leadName || 'Entrada'}
                    </Link>
                  )}
                </div>

                {/* Data límit */}
                {task.dueDate && (
                  <p className={`mt-1 text-[10px] ${getDueDateColor(task.dueDate)}`}>
                    📅 {formatDateShort(task.dueDate)}
                    {(() => {
                      const due = new Date(task.dueDate!);
                      const now = new Date();
                      due.setHours(0, 0, 0, 0);
                      now.setHours(0, 0, 0, 0);
                      const diffDays = Math.floor((due.getTime() - now.getTime()) / 86400000);
                      if (diffDays < 0) return ` (fa ${Math.abs(diffDays)}d)`;
                      if (diffDays === 0) return ' (avui)';
                      return '';
                    })()}
                  </p>
                )}

                {/* Botons de moviment per a mòbil (alternativa a drag-drop) */}
                <div className="mt-2 flex gap-1 md:hidden">
                  {COLUMNS_DEF.filter((c) => c.status !== col.status).map((target) => (
                    <button
                      key={target.status}
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
  );
}
