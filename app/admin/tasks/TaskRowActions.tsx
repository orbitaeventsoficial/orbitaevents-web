'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import { log } from '@/lib/logger';

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
  const toast = useToast();
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
        throw new Error(data?.error || "No s'ha pogut actualitzar la tasca");
      }
      router.refresh();
    } catch (error) {
      log.error('[TaskRowActions] Error actualitzant tasca', error);
      toast.error('Error actualitzant la tasca');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tk__row-acts">
      <Link href={destinationHref} className="ap-btn ap-btn--xs">
        Obrir destí
      </Link>
      <button
        type="button"
        onClick={toggleStatus}
        disabled={saving}
        className="ap-btn ap-btn--xs"
      >
        {saving ? 'Desant...' : isDone ? 'Reobrir' : 'Marcar feta'}
      </button>
    </div>
  );
}
