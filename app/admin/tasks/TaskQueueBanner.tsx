'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { TaskQueue } from '@/lib/services/tasks/taskQueueService';

type QueueCounts = Record<TaskQueue, number>;

const QUEUE_CONFIG: Array<{
  key: TaskQueue;
  label: string;
  icon: string;
}> = [
  { key: 'VENÇUT', label: 'Vençudes', icon: '🔴' },
  { key: 'AVUI', label: 'Avui', icon: '🟡' },
  { key: 'VIP', label: 'VIP', icon: '⭐' },
  { key: 'BLOQUEJAT', label: 'Bloquejades', icon: '🧊' },
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
    <div className="ap-card">
      <div className="ap-card-body flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--t3)]">
            Queue operativa
          </span>
          {activeQueue && (
            <button type="button" onClick={handleClearAll} className="ap-btn ap-btn--xs">
              Mostrar totes ({total})
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {QUEUE_CONFIG.map(({ key, label, icon }) => {
            const count = queues[key];
            if (count === 0 && activeQueue !== key) return null;
            const isActive = activeQueue === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleClick(key)}
                aria-pressed={isActive}
                className={`ap-btn ap-btn--xs ${isActive ? 'ap-btn--primary' : ''}`}
              >
                <span aria-hidden="true">{icon}</span>
                <span>{label}</span>
                <span className="rounded-full bg-[var(--raised)] px-1.5 font-bold text-[var(--t)]">{count}</span>
              </button>
            );
          })}
          {queues['NORMAL'] > 0 && (
            <span className="px-2 text-xs text-[var(--t3)]">+ {queues['NORMAL']} normals</span>
          )}
        </div>
      </div>
    </div>
  );
}
