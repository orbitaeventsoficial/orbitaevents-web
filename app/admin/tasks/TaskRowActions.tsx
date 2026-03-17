'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/csrf';

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
      const res = await fetchWithCsrf(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: isDone ? 'OPEN' : 'DONE' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s’ha pogut actualitzar la tasca');
      }
      router.refresh();
    } catch (error) {
      console.error('[TaskRowActions] Error actualitzant tasca:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={destinationHref}
        className="rounded border px-2 py-1 text-xs font-medium"
      >
        Obrir destí
      </Link>
      <button
        type="button"
        onClick={toggleStatus}
        disabled={saving}
        className="rounded border px-2 py-1 text-xs font-medium disabled:opacity-60"
      >
        {saving ? 'Desant...' : isDone ? 'Reobrir' : 'Marcar feta'}
      </button>
    </div>
  );
}

