'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ReactivationCandidate, ReactivationPriority } from '@/lib/services/reactivationService';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { formatCurrency } from '@/lib/constants';
import { AdminEmptyState } from '../../components/AdminPage';

type Props = { initialCandidates: ReactivationCandidate[] };

const KPI_TONE: Record<ReactivationPriority, string> = {
  ALTA: 'ap-kpi--danger',
  MITJANA: 'ap-kpi--warning',
  BAIXA: 'ap-kpi--info',
};

const BADGE_TONE: Record<ReactivationPriority, string> = {
  ALTA: 'ap-badge ap-badge--danger',
  MITJANA: 'ap-badge ap-badge--warning',
  BAIXA: 'ap-badge',
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
  const [copyError, setCopyError] = useState<{ customerId: string; message: string } | null>(null);

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
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(candidate.suggestedMessage);
      setCopied(candidate.customerId);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('[ReactivationClient] Error copiant missatge de reactivacio', {
        customerId: candidate.customerId,
        error,
      });
      setCopyError({
        customerId: candidate.customerId,
        message: 'No s\'ha pogut copiar el missatge.',
      });
    }
  }

  return (
    <>
      {/* KPIs / filtres */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          aria-pressed={filter === 'ALL'}
          className={`ap-kpi cursor-pointer text-left hover:border-[var(--line2)] ${filter === 'ALL' ? 'ap-kpi--info' : ''}`}
        >
          <span className="ap-kpi-label">Total</span>
          <span className="ap-kpi-value">{stats.total}</span>
        </button>
        {(['ALTA', 'MITJANA', 'BAIXA'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setFilter(filter === p ? 'ALL' : p)}
            aria-pressed={filter === p}
            className={`ap-kpi cursor-pointer text-left hover:border-[var(--line2)] ${filter === p ? KPI_TONE[p] : ''}`}
          >
            <span className="ap-kpi-label">Prioritat {p}</span>
            <span className="ap-kpi-value">{stats[p]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <AdminEmptyState
          icon="✨"
          title={
            initialCandidates.length === 0
              ? 'Cap client a reactivar ara mateix'
              : 'Tots els candidats visibles estan filtrats o descartats'
          }
          description={
            initialCandidates.length === 0
              ? 'Els clients apareixen aquí quan estan dormants, en risc de pèrdua o amb health score baix.'
              : 'Ajusta el filtre per tornar a veure candidats.'
          }
        />
      ) : (
        <div className="grid gap-3">
          {visible.map((c) => (
            <article key={c.customerId} className="ap-card">
              <div className="ap-card-body flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 basis-72">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--t3)]">
                    <span className={BADGE_TONE[c.priority]}>{c.priority}</span>
                    <span>{c.reasonLabel}</span>
                    <span className="text-[var(--line2)]">·</span>
                    <span>Score {c.score}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--t2)]">
                    <Link
                      href={buildCustomerHubHref(c.customerId)}
                      className="text-sm font-bold text-[var(--t)] transition-colors hover:text-[var(--gold-bright)]"
                    >
                      {c.name}
                    </Link>
                    <span className="text-[var(--line2)]">·</span>
                    <span>{c.email}</span>
                    {c.phone && (
                      <>
                        <span className="text-[var(--line2)]">·</span>
                        <span>{c.phone}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--t3)]">
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
                <div className="flex shrink-0 flex-col items-start gap-1 text-xs text-[var(--t3)] sm:items-end">
                  <div className="flex flex-wrap items-center gap-1">
                    {c.suggestedChannels.map((ch) => (
                      <span key={ch} title={ch}>
                        {CHANNEL_ICON[ch] || ch}
                      </span>
                    ))}
                  </div>
                  <span>{c.preferredLocale.toUpperCase()}</span>
                </div>
              </div>

              <details className="group ap-card-body pt-0">
                <summary className="cursor-pointer list-none text-xs font-bold text-[var(--t3)] transition-colors hover:text-[var(--t)] [&::-webkit-details-marker]:hidden">
                  <span className="group-open:hidden">▶ Veure missatge suggerit</span>
                  <span className="hidden group-open:inline">▼ Amagar missatge</span>
                </summary>
                <div className="mt-2 rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--sunk)] p-3">
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--t3)]">Assumpte</p>
                  <p className="mt-0.5 text-xs text-[var(--t)]">{c.suggestedSubject}</p>
                  <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--t3)]">Missatge</p>
                  <pre className="mt-0.5 whitespace-pre-wrap font-[inherit] text-xs text-[var(--t)]">{c.suggestedMessage}</pre>
                </div>
              </details>

              <div className="ap-card-body flex flex-wrap items-center gap-2 pt-0">
                {c.whatsappUrl && (
                  <a
                    href={c.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ap-btn ap-btn--xs flex-1 sm:flex-none"
                  >
                    💬 WhatsApp
                  </a>
                )}
                <a href={c.mailtoUrl} className="ap-btn ap-btn--xs flex-1 sm:flex-none">
                  ✉️ Email
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyMessage(c)}
                  aria-invalid={copyError?.customerId === c.customerId ? true : undefined}
                  aria-describedby={
                    copyError?.customerId === c.customerId
                      ? `reactivation-copy-error-${c.customerId}`
                      : undefined
                  }
                  className="ap-btn ap-btn--xs flex-1 sm:flex-none"
                >
                  {copied === c.customerId ? '✓ Copiat' : 'Copiar missatge'}
                </button>
                <Link
                  href={buildCustomerHubHref(c.customerId)}
                  className="ap-btn ap-btn--xs flex-1 sm:flex-none"
                >
                  Veure fitxa →
                </Link>
                <button
                  type="button"
                  onClick={() => handleDismiss(c.customerId)}
                  className="ap-btn ap-btn--xs flex-1 sm:flex-none sm:ml-auto"
                >
                  Descartar
                </button>
              </div>
              {copyError?.customerId === c.customerId && (
                <p
                  id={`reactivation-copy-error-${c.customerId}`}
                  role="alert"
                  className="ap-card-body pt-0 text-xs admin-tone-text-danger"
                >
                  {copyError.message}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
