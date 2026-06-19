'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ReactivationCandidate, ReactivationPriority } from '@/lib/services/reactivationService';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { formatCurrency } from '@/lib/constants';

type Props = { initialCandidates: ReactivationCandidate[] };

const PRIORITY_TONE: Record<ReactivationPriority, string> = {
  ALTA: 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger',
  MITJANA: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  BAIXA: 'border-[var(--line)] bg-[var(--panel)] text-white/60',
};

const CHANNEL_ICON: Record<string, string> = {
  whatsapp: '💬',
  email: '✉️',
  instagram: '📷',
};

export default function ReactivationClient({ initialCandidates }: Props) {
  const [filter, setFilter] = useState<'ALL' | ReactivationPriority>('ALL');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const visible = useMemo(() => {
    return initialCandidates.filter((c) => {
      if (dismissed.has(c.customerId)) return false;
      if (filter === 'ALL') return true;
      return c.priority === filter;
    });
  }, [initialCandidates, filter, dismissed]);

  const stats = useMemo(() => {
    const counts: Record<ReactivationPriority | 'total', number> = {
      total: 0,
      ALTA: 0,
      MITJANA: 0,
      BAIXA: 0,
    };
    for (const c of initialCandidates) {
      if (dismissed.has(c.customerId)) continue;
      counts.total++;
      counts[c.priority]++;
    }
    return counts;
  }, [initialCandidates, dismissed]);

  function handleDismiss(customerId: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(customerId);
      return next;
    });
  }

  async function handleCopyMessage(candidate: ReactivationCandidate) {
    try {
      await navigator.clipboard.writeText(candidate.suggestedMessage);
      setCopied(candidate.customerId);
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
          className={`rounded-xl border p-3 text-left transition-colors ${filter === 'ALL' ? 'admin-tone-border-info admin-tone-bg-info' : 'border-[var(--line)] bg-[var(--panel)] adm-row-hover'}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Total</p>
          <p className="mt-1 text-xl font-bold">{stats.total}</p>
        </button>
        {(['ALTA', 'MITJANA', 'BAIXA'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setFilter(filter === p ? 'ALL' : p)}
            className={`rounded-xl border p-3 text-left transition-colors ${filter === p ? PRIORITY_TONE[p] : 'border-[var(--line)] bg-[var(--panel)] adm-row-hover'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Prioritat {p}</p>
            <p className="mt-1 text-xl font-bold">{stats[p]}</p>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="ap-card p-12 text-center">
          <p className="text-4xl">✨</p>
          <p className="mt-3 text-sm font-semibold opacity-80">
            {initialCandidates.length === 0
              ? 'Cap client a reactivar ara mateix'
              : 'Tots els candidats visibles estan filtrats o descartats'}
          </p>
          <p className="mt-1 text-xs opacity-50">
            {initialCandidates.length === 0
              ? 'Els clients apareixen aquí quan estan dormants, en risc de pèrdua o amb health score baix.'
              : 'Ajusta el filtre per tornar a veure candidats.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((c) => (
            <article
              key={c.customerId}
              className="ap-card p-4 adm-row-hover transition-colors"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${PRIORITY_TONE[c.priority]}`}>
                      {c.priority}
                    </span>
                    <span className="text-xs opacity-60">{c.reasonLabel}</span>
                    <span className="text-xs opacity-40">·</span>
                    <span className="text-xs opacity-60">Score {c.score}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <Link
                      href={buildCustomerHubHref(c.customerId)}
                      className="text-sm font-semibold hover:admin-tone-text-info transition-colors"
                    >
                      {c.name}
                    </Link>
                    <span className="text-xs opacity-50">·</span>
                    <span className="text-xs opacity-60">{c.email}</span>
                    {c.phone && (
                      <>
                        <span className="text-xs opacity-50">·</span>
                        <span className="text-xs opacity-60">{c.phone}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 text-xs opacity-50 flex items-center gap-2 flex-wrap">
                    <span>{c.totalEvents} event{c.totalEvents === 1 ? '' : 's'}</span>
                    <span>·</span>
                    <span>{formatCurrency(c.totalSpent)}</span>
                    <span>·</span>
                    <span>{c.lifecycleStage}</span>
                    {c.healthScore != null && (
                      <>
                        <span>·</span>
                        <span>Health {c.healthScore}</span>
                      </>
                    )}
                    {c.daysSinceLastEvent != null && (
                      <>
                        <span>·</span>
                        <span>Últim event fa {c.daysSinceLastEvent}d</span>
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
                  <span className="text-xs opacity-40">{c.preferredLocale.toUpperCase()}</span>
                </div>
              </div>

              <details className="mt-3 group">
                <summary className="cursor-pointer text-xs font-semibold opacity-70 hover:opacity-100 list-none">
                  <span className="group-open:hidden">▶ Veure missatge suggerit</span>
                  <span className="hidden group-open:inline">▼ Amagar missatge</span>
                </summary>
                <div className="mt-2 rounded-lg border border-[var(--line)] bg-[var(--sunk)] p-3">
                  <p className="text-xs font-semibold opacity-70">Assumpte</p>
                  <p className="mt-0.5 text-xs">{c.suggestedSubject}</p>
                  <p className="mt-2 text-xs font-semibold opacity-70">Missatge</p>
                  <pre className="mt-0.5 text-xs whitespace-pre-wrap font-sans opacity-80">{c.suggestedMessage}</pre>
                </div>
              </details>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {c.whatsappUrl && (
                  <a
                    href={c.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border admin-tone-border-success admin-tone-bg-success px-3 py-1.5 text-xs font-medium admin-tone-text-success hover:opacity-80"
                  >
                    💬 WhatsApp
                  </a>
                )}
                <a
                  href={c.mailtoUrl}
                  className="rounded-lg border admin-tone-border-info admin-tone-bg-info px-3 py-1.5 text-xs font-medium admin-tone-text-info hover:admin-tone-bg-info"
                >
                  ✉️ Email
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyMessage(c)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                >
                  {copied === c.customerId ? '✓ Copiat' : 'Copiar missatge'}
                </button>
                <Link
                  href={buildCustomerHubHref(c.customerId)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                >
                  Veure fitxa →
                </Link>
                <button
                  type="button"
                  onClick={() => handleDismiss(c.customerId)}
                  className="ml-auto rounded-lg border border-white/10 px-2 py-1 text-xs opacity-60 hover:bg-white/5"
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
