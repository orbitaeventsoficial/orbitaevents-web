'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TaskRowActions({
  taskId,
  status,
  destinationHref,
}: {
  taskId: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  destinationHref: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const isDone = status === 'DONE';

  const toggleStatus = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: isDone ? 'OPEN' : 'DONE' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s’ha pogut actualitzar la tasca');
      }
      router.refresh();
    } catch {
      // keep silent in compact row actions
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={destinationHref}
        className="rounded border border-cyan-500/40 px-2 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-500/10"
      >
        Obrir destí
      </Link>
      <button
        type="button"
        onClick={toggleStatus}
        disabled={saving}
        className="rounded border border-amber-500/40 px-2 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/10 disabled:opacity-60"
      >
        {saving ? 'Guardant...' : isDone ? 'Reobrir' : 'Marcar feta'}
      </button>
    </div>
  );
}

