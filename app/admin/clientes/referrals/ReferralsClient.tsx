'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ReferralsSummary, ReferralCandidate } from '@/lib/services/referralsService';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { formatCurrency } from '@/lib/constants';

type Props = { summary: ReferralsSummary };

const PRIORITY_TONE: Record<ReferralCandidate['priority'], string> = {
  ALTA: 'rf__tone rf__tone--high',
  MITJANA: 'rf__tone rf__tone--medium',
  BAIXA: 'rf__tone rf__tone--low',
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
    <div className="rf">
      {/* KPIs globals */}
      <div className="rf__stats">
        <div className="ap-card rf__stat">
          <p className="rf__label">Referrers actius</p>
          <p className="rf__stat-value">{summary.stats.totalReferrers}</p>
        </div>
        <div className="ap-card rf__stat">
          <p className="rf__label">Clients referits</p>
          <p className="rf__stat-value rf__stat-value--success">{summary.stats.totalReferred}</p>
        </div>
        <div className="ap-card rf__stat">
          <p className="rf__label">Taxa referral</p>
          <p className="rf__stat-value">{formatPercent(summary.stats.referralRate)}</p>
        </div>
        <div className="ap-card rf__stat">
          <p className="rf__label">Valor generat</p>
          <p className="rf__stat-value rf__stat-value--info">{formatCurrency(summary.stats.totalReferralValue)}</p>
        </div>
      </div>

      {/* Top referrers */}
      <section className="rf__section">
        <h2 className="rf__section-title">Top referrers</h2>
        {summary.topReferrers.length === 0 ? (
          <div className="ap-card rf__empty rf__empty--compact">
            <p className="rf__empty-copy">Encara no hi ha clients que hagin portat referrals</p>
          </div>
        ) : (
          <div className="rf__top-list">
            {summary.topReferrers.map((r, idx) => (
              <article
                key={r.id}
                className="ap-card rf__top-card"
              >
                <div className="rf__top-row">
                  <div className="rf__top-main">
                    <span className="rf__rank">#{idx + 1}</span>
                    <div className="rf__top-copy">
                      <Link
                        href={buildCustomerHubHref(r.id)}
                        className="rf__name"
                      >
                        {r.name}
                      </Link>
                      <p className="rf__line">
                        {r.lifecycleStage} · {r.email}
                      </p>
                      <p className="rf__line rf__line--muted">
                        Ha portat: {r.referralsNames.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="rf__top-metrics">
                    <div className="rf__metric">
                      <p className="rf__metric-label">Clients</p>
                      <p className="rf__metric-value">{r.referralsCount}</p>
                    </div>
                    <div className="rf__metric">
                      <p className="rf__metric-label">Valor</p>
                      <p className="rf__metric-value rf__metric-value--info">{formatCurrency(r.referralsValue)}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Candidats per preguntar */}
      <section className="rf__section">
        <div className="rf__section-head">
          <h2 className="rf__section-title">
            Candidats per preguntar ({summary.candidates.length})
          </h2>
          <div className="rf__filters">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`rf__filter ${filter === 'ALL' ? 'rf__filter--active' : ''}`}
            >
              Tots
            </button>
            {(['ALTA', 'MITJANA', 'BAIXA'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFilter(filter === p ? 'ALL' : p)}
                className={`rf__filter ${filter === p ? PRIORITY_TONE[p] : ''}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {visibleCandidates.length === 0 ? (
          <div className="ap-card rf__empty">
            <p className="rf__empty-icon">✨</p>
            <p className="rf__empty-title">
              {summary.candidates.length === 0
                ? 'Cap candidat disponible ara mateix'
                : 'Tots els candidats visibles estan filtrats o descartats'}
            </p>
            <p className="rf__empty-copy">
              {summary.candidates.length === 0
                ? 'Els clients satisfets amb events complets apareixeran aquí com a candidats.'
                : 'Ajusta el filtre per tornar a veure candidats.'}
            </p>
          </div>
        ) : (
          <div className="rf__candidate-list">
            {visibleCandidates.map((c) => (
              <article
                key={c.id}
                className="ap-card rf__candidate"
              >
                <div className="rf__candidate-head">
                  <div className="rf__candidate-main">
                    <div className="rf__meta">
                      <span className={PRIORITY_TONE[c.priority]}>
                        {c.priority}
                      </span>
                      <span>{c.reasonLabel}</span>
                      <span className="rf__dot">·</span>
                      <span>Score {c.score}</span>
                    </div>
                    <div className="rf__identity">
                      <Link
                        href={buildCustomerHubHref(c.id)}
                        className="rf__name"
                      >
                        {c.name}
                      </Link>
                      <span className="rf__dot">·</span>
                      <span>{c.email}</span>
                    </div>
                    <div className="rf__facts">
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
                </div>

                <details className="rf__message">
                  <summary className="rf__message-summary">
                    <span className="rf__message-closed">▶ Veure missatge suggerit</span>
                    <span className="rf__message-open">▼ Amagar missatge</span>
                  </summary>
                  <div className="rf__message-box">
                    <p className="rf__label">Assumpte</p>
                    <p className="rf__message-text">{c.suggestedSubject}</p>
                    <p className="rf__label rf__label--spaced">Missatge</p>
                    <pre className="rf__message-pre">{c.suggestedMessage}</pre>
                  </div>
                </details>

                <div className="rf__actions">
                  {c.whatsappUrl && (
                    <a
                      href={c.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rf__action rf__action--success"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                  <a
                    href={c.mailtoUrl}
                    className="rf__action rf__action--info"
                  >
                    ✉️ Email
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(c)}
                    className="rf__action rf__action--ghost"
                  >
                    {copied === c.id ? '✓ Copiat' : 'Copiar missatge'}
                  </button>
                  <Link
                    href={buildCustomerHubHref(c.id)}
                    className="rf__action rf__action--ghost"
                  >
                    Veure fitxa →
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDismiss(c.id)}
                    className="rf__action rf__action--dismiss"
                  >
                    Descartar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
