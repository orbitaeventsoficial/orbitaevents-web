'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { buildLeadComposeHref, buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import type { FollowUpSummary, PendingFollowUp } from '@/lib/services/responseTrackingService';

const URGENCY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  URGENT: { bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-300', label: 'Urgent' },
  NORMAL: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-300', label: 'Normal' },
  LOW: { bg: 'bg-white/[0.03] border-white/10', text: 'opacity-60', label: 'Baix' },
};

export default function PendingFollowUpsPanel() {
  const [data, setData] = useState<FollowUpSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/leads/follow-ups');
      if (!res.ok) return;
      const json: FollowUpSummary = await res.json();
      setData(json);
    } catch {
      // silently fail — optional panel
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !data || data.total === 0) return null;

  const visibleItems = expanded ? data.items : data.items.slice(0, 5);

  return (
    <div className="admin-card-glass rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span>📬</span>
            <span>Seguiment pendent</span>
            {data.urgent > 0 && (
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-200">
                {data.urgent} urgent{data.urgent > 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <p className="mt-0.5 text-[11px] opacity-50">
            {data.total} lead{data.total > 1 ? 's' : ''} contactat{data.total > 1 ? 's' : ''} sense resposta
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs opacity-50">
          <span>{data.urgent} urgents · {data.normal} normals · {data.low} baixos</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {visibleItems.map((item: PendingFollowUp) => {
          const style = URGENCY_STYLE[item.urgency] || URGENCY_STYLE.LOW;
          return (
            <div
              key={item.leadId}
              className={`admin-stagger-item flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${style.bg}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}>
                    {style.label} · {item.daysSinceOutbound}d
                  </span>
                  <Link
                    href={buildLeadWorkspaceHref(item.leadId)}
                    className="text-sm font-medium hover:underline truncate"
                  >
                    {item.name}
                  </Link>
                  <span className="text-[10px] opacity-50">{item.email}</span>
                </div>
                <p className="mt-1 text-[11px] opacity-60">{item.suggestedAction}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Link
                  href={buildLeadComposeHref(item.leadId, 'seguiment')}
                  className="rounded border border-white/10 px-2 py-1 text-[10px] hover:bg-white/5"
                >
                  ✉️ Email
                </Link>
                {item.phone && (
                  <a
                    href={`https://wa.me/${item.phone.replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded border border-white/10 px-2 py-1 text-[10px] hover:bg-white/5"
                  >
                    💬 WhatsApp
                  </a>
                )}
                <Link
                  href={buildLeadWorkspaceHref(item.leadId)}
                  className="rounded border border-white/10 px-2 py-1 text-[10px] hover:bg-white/5"
                >
                  Obrir
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {data.total > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          type="button"
          className="mt-2 w-full text-center text-[11px] opacity-50 hover:opacity-80 transition-opacity"
        >
          {expanded ? 'Mostrar menys' : `Veure tots (${data.total})`}
        </button>
      )}
    </div>
  );
}
