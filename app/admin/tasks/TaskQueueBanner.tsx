'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { TaskQueue } from '@/lib/services/tasks/taskQueueService';

type QueueCounts = Record<TaskQueue, number>;

const QUEUE_CONFIG: Array<{
  key: TaskQueue;
  label: string;
  icon: string;
  color: string;
  activeColor: string;
}> = [
  { key: 'VENÇUT', label: 'Vençudes', icon: '🔴', color: 'border-rose-500/30 bg-rose-500/[0.06] text-rose-200', activeColor: 'border-rose-500/60 bg-rose-500/[0.15] text-rose-100 ring-1 ring-rose-500/40' },
  { key: 'AVUI', label: 'Avui', icon: '🟡', color: 'border-amber-500/30 bg-amber-500/[0.06] text-amber-200', activeColor: 'border-amber-500/60 bg-amber-500/[0.15] text-amber-100 ring-1 ring-amber-500/40' },
  { key: 'VIP', label: 'VIP', icon: '⭐', color: 'border-purple-500/30 bg-purple-500/[0.06] text-purple-200', activeColor: 'border-purple-500/60 bg-purple-500/[0.15] text-purple-100 ring-1 ring-purple-500/40' },
  { key: 'BLOQUEJAT', label: 'Bloquejades', icon: '🧊', color: 'border-slate-500/30 bg-slate-500/[0.06] text-slate-300', activeColor: 'border-slate-500/60 bg-slate-500/[0.15] text-slate-200 ring-1 ring-slate-500/40' },
];

export default function TaskQueueBanner({
  queues,
  total,
}: {
  queues: QueueCounts;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeQueue = (searchParams?.get('queue') ?? null) as TaskQueue | null;

  const handleClick = (queue: TaskQueue) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (activeQueue === queue) {
      params.delete('queue');
    } else {
      params.set('queue', queue);
    }
    params.delete('page');
    router.push('/admin/tasks?' + params.toString());
  };

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('queue');
    params.delete('page');
    router.push('/admin/tasks?' + params.toString());
  };

  return (
    <div className="rounded-xl border border-white/10 p-3 admin-card-glass space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Queue operativa</p>
        {activeQueue && (
          <button
            onClick={handleClearAll}
            className="text-[10px] opacity-50 hover:opacity-80 transition-opacity"
          >
            Mostrar totes ({total})
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {QUEUE_CONFIG.map(({ key, label, icon, color, activeColor }) => {
          const count = queues[key];
          if (count === 0 && activeQueue !== key) return null;
          const isActive = activeQueue === key;
          return (
            <button
              key={key}
              onClick={() => handleClick(key)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${isActive ? activeColor : color} hover:scale-[1.02]`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
                {count}
              </span>
            </button>
          );
        })}
        {queues['NORMAL'] > 0 && (
          <span className="flex items-center gap-1 text-[11px] opacity-40 px-2">
            + {queues['NORMAL']} normals
          </span>
        )}
      </div>
    </div>
  );
}
