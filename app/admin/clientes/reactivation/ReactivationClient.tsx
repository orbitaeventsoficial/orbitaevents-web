'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ReactivationCandidate, ReactivationPriority } from '@/lib/services/reactivationService';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { formatCurrency } from '@/lib/constants';

type Props = { initialCandidates: ReactivationCandidate[] };

const PRIORITY_TONE: Record<ReactivationPriority, string> = {
  ALTA: 'rc__tone rc__tone--high',
  MITJANA: 'rc__tone rc__tone--medium',
  BAIXA: 'rc__tone rc__tone--low',
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
    <div className="rc">
      {/* KPIs */}
      <div className="rc__stats">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`rc__stat ${filter === 'ALL' ? 'rc__stat--active' : ''}`}
        >
          <p className="rc__stat-label">Total</p>
          <p className="rc__stat-value">{stats.total}</p>
        </button>
        {(['ALTA', 'MITJANA', 'BAIXA'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setFilter(filter === p ? 'ALL' : p)}
            className={`rc__stat ${filter === p ? PRIORITY_TONE[p] : ''}`}
          >
            <p className="rc__stat-label">Prioritat {p}</p>
            <p className="rc__stat-value">{stats[p]}</p>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="ap-card rc__empty">
          <p className="rc__empty-icon">✨</p>
          <p className="rc__empty-title">
            {initialCandidates.length === 0
              ? 'Cap client a reactivar ara mateix'
              : 'Tots els candidats visibles estan filtrats o descartats'}
          </p>
          <p className="rc__empty-copy">
            {initialCandidates.length === 0
              ? 'Els clients apareixen aquí quan estan dormants, en risc de pèrdua o amb health score baix.'
              : 'Ajusta el filtre per tornar a veure candidats.'}
          </p>
        </div>
      ) : (
        <div className="rc__list">
          {visible.map((c) => (
            <article
              key={c.customerId}
              className="ap-card rc__candidate"
            >
              <div className="rc__candidate-head">
                <div className="rc__candidate-main">
                  <div className="rc__meta">
                    <span className={PRIORITY_TONE[c.priority]}>
                      {c.priority}
                    </span>
                    <span>{c.reasonLabel}</span>
                    <span className="rc__dot">·</span>
                    <span>Score {c.score}</span>
                  </div>
                  <div className="rc__identity">
                    <Link
                      href={buildCustomerHubHref(c.customerId)}
                      className="rc__name"
                    >
                      {c.name}
                    </Link>
                    <span className="rc__dot">·</span>
                    <span>{c.email}</span>
                    {c.phone && (
                      <>
                        <span className="rc__dot">·</span>
                        <span>{c.phone}</span>
                      </>
                    )}
                  </div>
                  <div className="rc__facts">
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
                <div className="rc__channels">
                  <div className="rc__channel-list">
                    {c.suggestedChannels.map((ch) => (
                      <span key={ch} title={ch}>
                        {CHANNEL_ICON[ch] || ch}
                      </span>
                    ))}
                  </div>
                  <span className="rc__locale">{c.preferredLocale.toUpperCase()}</span>
                </div>
              </div>

              <details className="rc__message">
                <summary className="rc__message-summary">
                  <span className="rc__message-closed">▶ Veure missatge suggerit</span>
                  <span className="rc__message-open">▼ Amagar missatge</span>
                </summary>
                <div className="rc__message-box">
                  <p className="rc__message-label">Assumpte</p>
                  <p className="rc__message-text">{c.suggestedSubject}</p>
                  <p className="rc__message-label rc__message-label--spaced">Missatge</p>
                  <pre className="rc__message-pre">{c.suggestedMessage}</pre>
                </div>
              </details>

              <div className="rc__actions">
                {c.whatsappUrl && (
                  <a
                    href={c.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rc__action rc__action--success"
                  >
                    💬 WhatsApp
                  </a>
                )}
                <a
                  href={c.mailtoUrl}
                  className="rc__action rc__action--info"
                >
                  ✉️ Email
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyMessage(c)}
                  className="rc__action rc__action--ghost"
                >
                  {copied === c.customerId ? '✓ Copiat' : 'Copiar missatge'}
                </button>
                <Link
                  href={buildCustomerHubHref(c.customerId)}
                  className="rc__action rc__action--ghost"
                >
                  Veure fitxa →
                </Link>
                <button
                  type="button"
                  onClick={() => handleDismiss(c.customerId)}
                  className="rc__action rc__action--dismiss"
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
