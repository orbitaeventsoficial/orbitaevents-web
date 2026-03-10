'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger';
import { fetchWithCsrf } from '@/lib/csrf';

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'NEGOTIATING' | 'WON' | 'LOST';

export default function LeadStatusQuickActions({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: LeadStatus;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const onChange = async (nextStatus: LeadStatus) => {
    if (saving || nextStatus === currentStatus) return;
    setSaving(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch (err) {
      log.error('Failed to update lead status', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={currentStatus}
      onChange={(e) => onChange(e.target.value as LeadStatus)}
      disabled={saving}
      className="rounded-xl border px-2 py-1 text-[11px]"
      title="Canviar estat lead"
      aria-label="Canviar estat lead"
    >
      <option value="NEW">Entrada nova</option>
      <option value="CONTACTED">Contactat</option>
      <option value="QUOTE_SENT">Pressupost enviat</option>
      <option value="NEGOTIATING">Negociació</option>
      <option value="WON">Guanyat</option>
      <option value="LOST">Perdut</option>
    </select>
  );
}


