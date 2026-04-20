'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ReengagementCandidate, ReengagementPriority } from '@/lib/services/leadReengagementService';

type SerializedCandidate = Omit<ReengagementCandidate, 'eventDate'> & { eventDate: string | null };

type Props = { initialCandidates: SerializedCandidate[] };

const PRIORITY_TONE: Record<ReengagementPriority, string> = {
  ALTA: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  MITJANA: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  BAIXA: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
};

const CHANNEL_ICON: Record<string, string> = {
  whatsapp: '💬',
  email: '✉️',
};

export default function LeadReengagementClient({ initialCandidates }: Props) {
  const [filter, setFilter] = useState<'ALL' | ReengagementPriority>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const visible = useMemo(() => {
    return initialCandidates.filter((c) => {
      if (dismissed.has(c.leadId)) return false;
      if (filter !== 'ALL' && c.reengagementPriority !== filter) return false;
      if (reasonFilter && c.reason !== reasonFilter) return false;
      return true;
    });
  }, [initialCandidates, filter, reasonFilter, dismissed]);

  const stats = useMemo(() => {
    const counts: Record<ReengagementPriority | 'total', number> = {
      total: 0,
      ALTA: 0,
      MITJANA: 0,
      BAIXA: 0,
    };
    const byReason = new Map<string, { label: string; count: number }>();
    for (const c of initialCandidates) {
      if (dismissed.has(c.leadId)) continue;
      counts.total++;
      counts[c.reengagementPriority]++;
      const existing = byReason.get(c.reason);
      if (existing) existing.count++;
      else byReason.set(c.reason, { label: c.reasonLabel, count: 1 });
    }
    return { counts, byReason: Array.from(byReason.entries()) };
  }, [initialCandidates, dismissed]);

  function handleDismiss(leadId: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(leadId);
      return next;
    });
  }

  async function handleCopyMessage(candidate: SerializedCandidate) {
    try {
      await navigator.clipboard.writeText(candidate.suggestedMessage);
      setCopied(candidate.leadId);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // navigator.clipboard not available
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`rounded-xl border p-3 text-left transition-colors ${filter === 'ALL' ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Total</p>
          <p className="mt-1 text-xl font-bold">{stats.counts.total}</p>
        </button>
        {(['ALTA', 'MITJANA', 'BAIXA'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setFilter(filter === p ? 'ALL' : p)}
            className={`rounded-xl border p-3 text-left transition-colors ${filter === p ? PRIORITY_TONE[p] : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Prioritat {p}</p>
            <p className="mt-1 text-xl font-bold">{stats.counts[p]}</p>
          </button>
        ))}
      </div>

      {/* Reason filters */}
      {stats.byReason.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setReasonFilter(null)}
            className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${reasonFilter === null ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}
          >
            Tots els motius
          </button>
          {stats.byReason.map(([reason, info]) => (
            <button
              key={reason}
              type="button"
              onClick={() => setReasonFilter(reasonFilter === reason ? null : reason)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${reasonFilter === reason ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}
            >
              {info.label} · {info.count}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <p className="text-4xl">✨</p>
          <p className="mt-3 text-sm font-semibold opacity-80">
            {initialCandidates.length === 0
              ? 'Cap lead pendent de reengagement'
              : 'Tots els candidats visibles estan filtrats o descartats'}
          </p>
          <p className="mt-1 text-xs opacity-50">
            {initialCandidates.length === 0
              ? 'Els leads apareixen aquí quan tenen pressupost sense resposta, negociació refredada o silenci prolongat.'
              : 'Ajusta els filtres per tornar a veure candidats.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((c) => (
            <article
              key={c.leadId}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_TONE[c.reengagementPriority]}`}>
                      {c.reengagementPriority}
                    </span>
                    <span className="text-[10px] opacity-60">{c.reasonLabel}</span>
                    <span className="text-[10px] opacity-40">·</span>
                    <span className="text-[10px] opacity-60">Score {c.score}</span>
                    <span className="text-[10px] opacity-40">·</span>
                    <span className="text-[10px] opacity-60">{c.status}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/admin/leads/${c.leadId}`}
                      className="text-sm font-semibold hover:text-cyan-300 transition-colors"
                    >
                      {c.name}
                    </Link>
                    <span className="text-[11px] opacity-50">·</span>
                    <span className="text-[11px] opacity-60">{c.email}</span>
                    {c.phone && (
                      <>
                        <span className="text-[11px] opacity-50">·</span>
                        <span className="text-[11px] opacity-60">{c.phone}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] opacity-50 flex items-center gap-2 flex-wrap">
                    <span>{c.eventType}</span>
                    {c.eventLocation && (
                      <>
                        <span>·</span>
                        <span>{c.eventLocation}</span>
                      </>
                    )}
                    {c.budget && (
                      <>
                        <span>·</span>
                        <span>{c.budget}€</span>
                      </>
                    )}
                    {c.daysSinceCreation != null && (
                      <>
                        <span>·</span>
                        <span>Creat fa {c.daysSinceCreation}d</span>
                      </>
                    )}
                    {c.daysSinceActivity != null && (
                      <>
                        <span>·</span>
                        <span>Sense activitat {c.daysSinceActivity}d</span>
                      </>
                    )}
                    {c.daysUntilEvent != null && c.daysUntilEvent > 0 && (
                      <>
                        <span>·</span>
                        <span className={c.daysUntilEvent <= 30 ? 'text-amber-300' : ''}>
                          Event en {c.daysUntilEvent}d
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1">
                    {c.suggestedChannels.map((ch) => (
                      <span key={ch} title={ch} className="text-xs opacity-70">
                        {CHANNEL_ICON[ch] || ch}
                      </span>
                    ))}
                  </div>
                  <span className="text-[9px] opacity-40">{c.preferredLocale.toUpperCase()}</span>
                </div>
              </div>

              <details className="mt-3 group">
                <summary className="cursor-pointer text-[11px] font-semibold opacity-70 hover:opacity-100 list-none">
                  <span className="group-open:hidden">▶ Veure missatge suggerit</span>
                  <span className="hidden group-open:inline">▼ Amagar missatge</span>
                </summary>
                <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-[11px] font-semibold opacity-70">Assumpte</p>
                  <p className="mt-0.5 text-xs">{c.suggestedSubject}</p>
                  <p className="mt-2 text-[11px] font-semibold opacity-70">Missatge</p>
                  <pre className="mt-0.5 text-[11px] whitespace-pre-wrap font-sans opacity-80">{c.suggestedMessage}</pre>
                </div>
              </details>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {c.whatsappUrl && (
                  <a
                    href={c.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/20"
                  >
                    💬 WhatsApp
                  </a>
                )}
                <a
                  href={c.mailtoUrl}
                  className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-[11px] font-medium text-blue-200 hover:bg-blue-500/20"
                >
                  ✉️ Email
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyMessage(c)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] hover:bg-white/10"
                >
                  {copied === c.leadId ? '✓ Copiat' : 'Copiar missatge'}
                </button>
                <Link
                  href={`/admin/leads/${c.leadId}`}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] hover:bg-white/10"
                >
                  Veure fitxa →
                </Link>
                <button
                  type="button"
                  onClick={() => handleDismiss(c.leadId)}
                  className="ml-auto rounded-lg border border-white/10 px-2 py-1 text-[10px] opacity-60 hover:bg-white/5"
                >
                  Descartar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
