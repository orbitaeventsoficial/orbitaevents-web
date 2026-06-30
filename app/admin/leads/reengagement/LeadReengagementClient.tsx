'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildLeadComposeHref } from '@/lib/admin/leadWorkspaceHref';
import type { ReengagementCandidate, ReengagementPriority } from '@/lib/services/leadReengagementService';
import { AdminEmptyState } from '../../components/AdminPage';

type SerializedCandidate = Omit<ReengagementCandidate, 'eventDate'> & { eventDate: string | null };
type Props = { initialCandidates: SerializedCandidate[] };

const KPI_TONE: Record<ReengagementPriority, string> = {
  ALTA: 'ap-kpi--danger',
  MITJANA: 'ap-kpi--warning',
  BAIXA: 'ap-kpi--info',
};

const BADGE_TONE: Record<ReengagementPriority, string> = {
  ALTA: 'ap-badge ap-badge--danger',
  MITJANA: 'ap-badge ap-badge--warning',
  BAIXA: 'ap-badge',
};

const ACCENT_TONE: Record<ReengagementPriority, string> = {
  ALTA: 'border-l-[3px] border-l-[var(--o-danger)]',
  MITJANA: 'border-l-[3px] border-l-[var(--o-warning)]',
  BAIXA: 'border-l-[3px] border-l-[var(--line2)]',
};

const CHANNEL_ICON: Record<string, string> = {
  whatsapp: '💬',
  email: '✉️',
};

export default function LeadReengagementClient({ initialCandidates }: Props) {
  const [filter, setFilter]           = useState<'ALL' | ReengagementPriority>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string | null>(null);
  const [dismissed, setDismissed]     = useState<Set<string>>(new Set());
  const [copied, setCopied]           = useState<string | null>(null);

  const visible = useMemo(() =>
    initialCandidates.filter((c) => {
      if (dismissed.has(c.leadId))                           return false;
      if (filter !== 'ALL' && c.reengagementPriority !== filter) return false;
      if (reasonFilter && c.reason !== reasonFilter)         return false;
      return true;
    }),
    [initialCandidates, filter, reasonFilter, dismissed]
  );

  const stats = useMemo(() => {
    const counts: Record<ReengagementPriority | 'total', number> = { total: 0, ALTA: 0, MITJANA: 0, BAIXA: 0 };
    const byReason = new Map<string, { label: string; count: number }>();
    for (const c of initialCandidates) {
      if (dismissed.has(c.leadId)) continue;
      counts.total++;
      counts[c.reengagementPriority]++;
      const ex = byReason.get(c.reason);
      if (ex) ex.count++;
      else byReason.set(c.reason, { label: c.reasonLabel, count: 1 });
    }
    return { counts, byReason: Array.from(byReason.entries()) };
  }, [initialCandidates, dismissed]);

  function handleDismiss(leadId: string) {
    setDismissed((prev) => { const s = new Set(prev); s.add(leadId); return s; });
  }

  async function handleCopyMessage(candidate: SerializedCandidate) {
    try {
      await navigator.clipboard.writeText(candidate.suggestedMessage);
      setCopied(candidate.leadId);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard no disponible
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* KPIs / filtres de prioritat */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          aria-pressed={filter === 'ALL'}
          className={`ap-kpi cursor-pointer text-left hover:border-[var(--line2)] ${filter === 'ALL' ? 'ap-kpi--info' : ''}`}
        >
          <span className="ap-kpi-label">Total</span>
          <span className="ap-kpi-value">{stats.counts.total}</span>
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
            <span className="ap-kpi-value">{stats.counts[p]}</span>
          </button>
        ))}
      </div>

      {/* Filtres per motiu */}
      {stats.byReason.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setReasonFilter(null)}
            aria-pressed={reasonFilter === null}
            className={`ap-btn ap-btn--xs ${reasonFilter === null ? 'border-[var(--gold)] text-[var(--gold)]' : ''}`}
          >
            Tots els motius
          </button>
          {stats.byReason.map(([reason, info]) => (
            <button
              key={reason}
              type="button"
              onClick={() => setReasonFilter(reasonFilter === reason ? null : reason)}
              aria-pressed={reasonFilter === reason}
              className={`ap-btn ap-btn--xs ${reasonFilter === reason ? 'border-[var(--gold)] text-[var(--gold)]' : ''}`}
            >
              {info.label} · {info.count}
            </button>
          ))}
        </div>
      )}

      {/* Llista de candidats / empty state */}
      {visible.length === 0 ? (
        <AdminEmptyState
          icon="✨"
          title={
            initialCandidates.length === 0
              ? 'Cap lead pendent de reengagement'
              : 'Tots els candidats visibles estan filtrats o descartats'
          }
          description={
            initialCandidates.length === 0
              ? 'Els leads apareixen aquí quan tenen pressupost sense resposta, negociació refredada o silenci prolongat.'
              : 'Ajusta els filtres per tornar a veure candidats.'
          }
        />
      ) : (
        <div className="grid gap-3">
          {visible.map((c) => (
            <article
              key={c.leadId}
              className={`ap-card ${ACCENT_TONE[c.reengagementPriority]}`}
            >
              <div className="ap-card-body flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 basis-72">
                  {/* Meta: prioritat + motiu + score + estat */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--t3)]">
                    <span className={BADGE_TONE[c.reengagementPriority]}>{c.reengagementPriority}</span>
                    <span>{c.reasonLabel}</span>
                    <span className="text-[var(--line2)]">·</span>
                    <span>Score {c.score}</span>
                    <span className="text-[var(--line2)]">·</span>
                    <span>{c.status}</span>
                  </div>

                  {/* Nom + contacte */}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--t2)]">
                    <Link
                      href={buildLeadWorkspaceHref(c.leadId)}
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

                  {/* Event meta */}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--t3)]">
                    {c.eventType && <span>{c.eventType}</span>}
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
                        <span className={c.daysUntilEvent <= 30 ? 'text-[var(--o-warning)]' : ''}>Event en {c.daysUntilEvent}d</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Canals + locale */}
                <div className="flex shrink-0 flex-col items-start gap-1 text-xs text-[var(--t3)] sm:items-end">
                  <div className="flex flex-wrap items-center gap-1">
                    {c.suggestedChannels.map((ch) => (
                      <span key={ch} title={ch}>
                        {CHANNEL_ICON[ch] || ch}
                      </span>
                    ))}
                  </div>
                  <span className="uppercase tracking-[0.08em]">{c.preferredLocale}</span>
                </div>
              </div>

              {/* Missatge suggerit (desplegable) */}
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

              {/* Accions */}
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
                <Link
                  href={buildLeadComposeHref(c.leadId, 'seguiment')}
                  className="ap-btn ap-btn--xs flex-1 sm:flex-none"
                >
                  ✉️ Email
                </Link>
                <button
                  type="button"
                  onClick={() => handleCopyMessage(c)}
                  className="ap-btn ap-btn--xs flex-1 sm:flex-none"
                >
                  {copied === c.leadId ? '✓ Copiat' : 'Copiar missatge'}
                </button>
                <Link
                  href={buildLeadWorkspaceHref(c.leadId)}
                  className="ap-btn ap-btn--xs flex-1 sm:flex-none"
                >
                  Veure fitxa →
                </Link>
                <button
                  type="button"
                  onClick={() => handleDismiss(c.leadId)}
                  className="ap-btn ap-btn--xs flex-1 sm:flex-none sm:ml-auto"
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
