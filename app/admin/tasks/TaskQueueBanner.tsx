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
    <div className="tk__queue">
      <div className="tk__queue-top">
        <span className="tk__queue-label">Queue operativa</span>
        {activeQueue && (
          <button type="button" onClick={handleClearAll} className="tk__queue-clear">
            Mostrar totes ({total})
          </button>
        )}
      </div>
      <div className="tk__queue-pills">
        {QUEUE_CONFIG.map(({ key, label, icon }) => {
          const count = queues[key];
          if (count === 0 && activeQueue !== key) return null;
          const isActive = activeQueue === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleClick(key)}
              data-queue={key}
              className={`tk__queue-pill${isActive ? ' is-active' : ''}`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              <span className="tk__queue-count">{count}</span>
            </button>
          );
        })}
        {queues['NORMAL'] > 0 && (
          <span className="tk__queue-normal">+ {queues['NORMAL']} normals</span>
        )}
      </div>
    </div>
  );
}
