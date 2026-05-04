'use client';

import { useEffect, useState } from 'react';
import type { CommChannel, CommTimelineSummary } from '@/lib/services/commTimelineService';

const CHANNEL_ICON: Record<CommChannel, string> = {
  EMAIL: '📧',
  WHATSAPP: '💬',
  CALL: '📞',
  NOTE: '📝',
  INSTAGRAM: '📷',
  FORM: '🧾',
  SYSTEM: '⚙️',
};

const CHANNEL_LABEL: Record<CommChannel, string> = {
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  CALL: 'Trucada',
  NOTE: 'Nota',
  INSTAGRAM: 'Instagram',
  FORM: 'Formulari',
  SYSTEM: 'Sistema',
};

const DIRECTION_ICON: Record<string, string> = {
  OUTBOUND: '→',
  INBOUND: '←',
  INTERNAL: '·',
};

export default function CommSummaryPanel({
  leadId,
  customerId = null,
}: {
  leadId: string;
  customerId?: string | null;
}) {
  const [timeline, setTimeline] = useState<CommTimelineSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTimeline(null);

    const params = new URLSearchParams();
    if (customerId) {
      params.set('customerId', customerId);
    }
    const href = params.size > 0
      ? `/api/admin/leads/${leadId}/comm-summary?${params.toString()}`
      : `/api/admin/leads/${leadId}/comm-summary`;

    fetch(href)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setTimeline(data as CommTimelineSummary);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [leadId, customerId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Comunicació</p>
        <p className="mt-1 text-xs opacity-30 animate-pulse">Carregant...</p>
      </div>
    );
  }

  if (!timeline || timeline.total === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Comunicació</p>
        <p className="mt-1 text-xs opacity-50">Sense comunicacions registrades</p>
      </div>
    );
  }

  const activeChannels = (['EMAIL', 'WHATSAPP', 'INSTAGRAM', 'FORM', 'CALL', 'NOTE'] as CommChannel[])
    .filter((ch) => timeline.channels[ch] > 0);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Comunicació</p>
        <span className="text-[10px] opacity-40">{timeline.total} interaccions</span>
      </div>

      {/* Channel counters */}
      <div className="flex flex-wrap gap-2">
        {activeChannels.map((ch) => (
          <span
            key={ch}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px]"
          >
            <span>{CHANNEL_ICON[ch]}</span>
            <span>{CHANNEL_LABEL[ch]}</span>
            <span className="font-bold">{timeline.channels[ch]}</span>
          </span>
        ))}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] opacity-50">
        {timeline.daysSinceLastContact != null && (
          <span>Últim contacte fa {timeline.daysSinceLastContact}d</span>
        )}
        {timeline.responseGap != null && (
          <span>Gap resposta: {timeline.responseGap}h</span>
        )}
      </div>

      {/* Last 3 entries */}
      <div className="space-y-1">
        {timeline.entries.slice(0, 3).map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-1.5 text-[11px] opacity-70"
          >
            <span className="shrink-0">{CHANNEL_ICON[entry.channel]}</span>
            <span className="shrink-0 opacity-50">{DIRECTION_ICON[entry.direction]}</span>
            <span className="truncate">{entry.title}</span>
            <span className="ml-auto shrink-0 opacity-40">
              {new Date(entry.occurredAt).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
