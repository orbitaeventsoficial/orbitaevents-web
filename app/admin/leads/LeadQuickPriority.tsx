'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export default function LeadQuickPriority({
  leadId,
  currentPriority,
}: {
  leadId: string;
  currentPriority: LeadPriority;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const onChange = async (nextPriority: LeadPriority) => {
    if (saving || nextPriority === currentPriority) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads-new/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: nextPriority }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      // Silent fail for compact control
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={currentPriority}
      onChange={(e) => onChange(e.target.value as LeadPriority)}
      disabled={saving}
      className="rounded-lg border px-2 py-1 text-[11px]"
      title="Canviar prioritat"
    >
      <option value="LOW">Baixa</option>
      <option value="MEDIUM">Mitjana</option>
      <option value="HIGH">Alta</option>
      <option value="URGENT">Urgent</option>
    </select>
  );
}

