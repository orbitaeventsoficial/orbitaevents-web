'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger';
import { fetchWithCsrf } from '@/lib/csrf';

type StatusOption = {
  value: string;
  label: string;
};

export default function StatusQuickSelect({
  entityPath,
  currentStatus,
  title,
  options,
}: {
  entityPath: string;
  currentStatus: string;
  title: string;
  options: readonly StatusOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const onChange = async (nextStatus: string) => {
    if (saving || nextStatus === currentStatus) return;
    setSaving(true);
    try {
      const res = await fetchWithCsrf(entityPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch (err) {
      log.error('Failed to update entity status', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={currentStatus}
      onChange={(event) => onChange(event.target.value)}
      disabled={saving}
      className="rounded-xl border px-2 py-1 text-[11px]"
      title={title}
      aria-label={title}
      data-help-title={title}
      data-help-desc="Canvia l'estat directament des de la llista sense haver d'obrir la fitxa completa."
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
