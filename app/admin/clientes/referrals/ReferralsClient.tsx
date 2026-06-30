'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ReferralsSummary, ReferralCandidate } from '@/lib/services/referralsService';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { formatCurrency } from '@/lib/constants';
import { AdminSection, AdminEmptyState } from '../../components/AdminPage';

type Props = { summary: ReferralsSummary };

const BADGE_TONE: Record<ReferralCandidate['priority'], string> = {
  ALTA: 'ap-badge ap-badge--danger',
  MITJANA: 'ap-badge ap-badge--warning',
  BAIXA: 'ap-badge',
};

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function ReferralsClient({ summary }: Props) {
  const [filter, setFilter] = useState<'ALL' | ReferralCandidate['priority']>('ALL');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const visibleCandidates = useMemo(() => {
    return summary.candidates.filter((c) => {
      if (dismissed.has(c.id)) return false;
      if (filter === 'ALL') return true;
      return c.priority === filter;
    });
  }, [summary.candidates, filter, dismissed]);

  function handleDismiss(customerId: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(customerId);
      return next;
    });
  }

  async function handleCopyMessage(candidate: ReferralCandidate) {
    try {
      await navigator.clipboard.writeText(candidate.suggestedMessage);
      setCopied(candidate.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // navigator.clipboard not available
    }
  }

  return (
    <>
      {/* KPIs globals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="ap-kpi">
          <span className="ap-kpi-label">Referrers actius</span>
          <span className="ap-kpi-value">{summary.stats.totalReferrers}</span>
        </div>
        <div className="ap-kpi ap-kpi--success">
          <span className="ap-kpi-label">Clients referits</span>
          <span className="ap-kpi-value">{summary.stats.totalReferred}</span>
        </div>
        <div className="ap-kpi">
          <span className="ap-kpi-label">Taxa referral</span>
          <span className="ap-kpi-value">{formatPercent(summary.stats.referralRate)}</span>
        </div>
        <div className="ap-kpi ap-kpi--info">
          <span className="ap-kpi-label">Valor generat</span>
          <span className="ap-kpi-value">{formatCurrency(summary.stats.totalReferralValue)}</span>
        </div>
      </div>

      {/* Top referrers */}
      <AdminSection title="Top referrers">
        {summary.topReferrers.length === 0 ? (
          <AdminEmptyState
            title="Encara no hi ha clients que hagin portat referrals"
          />
        ) : (
          <div className="grid gap-2">
            {summary.topReferrers.map((r, idx) => (
              <article key={r.id} className="ap-card">
                <div className="ap-card-body flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 basis-72 items-center gap-3">
                    <span className="shrink-0 text-lg font-bold text-[var(--t3)]">#{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={buildCustomerHubHref(r.id)}
                        className="text-sm font-bold text-[var(--t)] transition-colors hover:text-[var(--gold-bright)]"
                      >
                        {r.name}
                      </Link>
                      <p className="truncate text-xs text-[var(--t2)]">
                        {r.lifecycleStage} · {r.email}
                      </p>
                      <p className="truncate text-xs text-[var(--t3)]">
                        Ha portat: {r.referralsNames.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-4">
                    <div className="text-right max-[720px]:text-left">
                      <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--t3)]">Clients</p>
                      <p className="text-sm font-bold text-[var(--t)]">{r.referralsCount}</p>
                    </div>
                    <div className="text-right max-[720px]:text-left">
                      <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--t3)]">Valor</p>
                      <p className="text-sm font-bold text-[var(--at-blue)]">{formatCurrency(r.referralsValue)}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminSection>

      {/* Candidats per preguntar */}
      <AdminSection
        title={`Candidats per preguntar (${summary.candidates.length})`}
        actions={
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              aria-pressed={filter === 'ALL'}
              className={`ap-btn ap-btn--xs ${filter === 'ALL' ? 'ap-btn--primary' : ''}`}
            >
              Tots
            </button>
            {(['ALTA', 'MITJANA', 'BAIXA'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFilter(filter === p ? 'ALL' : p)}
                aria-pressed={filter === p}
                className={`ap-btn ap-btn--xs ${filter === p ? 'ap-btn--primary' : ''}`}
              >
                {p}
              </button>
            ))}
          </div>
        }
      >
        {visibleCandidates.length === 0 ? (
          <AdminEmptyState
            icon="✨"
            title={
              summary.candidates.length === 0
                ? 'Cap candidat disponible ara mateix'
                : 'Tots els candidats visibles estan filtrats o descartats'
            }
            description={
              summary.candidates.length === 0
                ? 'Els clients satisfets amb events complets apareixeran aquí com a candidats.'
                : 'Ajusta el filtre per tornar a veure candidats.'
            }
          />
        ) : (
          <div className="grid gap-3">
            {visibleCandidates.map((c) => (
              <article key={c.id} className="ap-card">
                <div className="ap-card-body">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--t3)]">
                    <span className={BADGE_TONE[c.priority]}>{c.priority}</span>
                    <span>{c.reasonLabel}</span>
                    <span className="text-[var(--line2)]">·</span>
                    <span>Score {c.score}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--t2)]">
                    <Link
                      href={buildCustomerHubHref(c.id)}
                      className="text-sm font-bold text-[var(--t)] transition-colors hover:text-[var(--gold-bright)]"
                    >
                      {c.name}
                    </Link>
                    <span className="text-[var(--line2)]">·</span>
                    <span>{c.email}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--t3)]">
                    <span>{c.lifecycleStage}</span>
                    <span>·</span>
                    <span>
                      {c.totalEvents} event{c.totalEvents === 1 ? '' : 's'}
                    </span>
                    <span>·</span>
                    <span>{formatCurrency(c.totalSpent)}</span>
                    {c.healthScore != null && (
                      <>
                        <span>·</span>
                        <span>Health {c.healthScore}</span>
                      </>
                    )}
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
                    className="ap-btn ap-btn--xs flex-1 sm:flex-none"
                  >
                    {copied === c.id ? '✓ Copiat' : 'Copiar missatge'}
                  </button>
                  <Link
                    href={buildCustomerHubHref(c.id)}
                    className="ap-btn ap-btn--xs flex-1 sm:flex-none"
                  >
                    Veure fitxa →
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDismiss(c.id)}
                    className="ap-btn ap-btn--xs flex-1 sm:flex-none sm:ml-auto"
                  >
                    Descartar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminSection>
    </>
  );
}
