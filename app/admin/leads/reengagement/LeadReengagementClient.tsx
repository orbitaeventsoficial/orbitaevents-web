'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildLeadComposeHref } from '@/lib/admin/leadWorkspaceHref';
import type { ReengagementCandidate, ReengagementPriority } from '@/lib/services/leadReengagementService';

type SerializedCandidate = Omit<ReengagementCandidate, 'eventDate'> & { eventDate: string | null };
type Props = { initialCandidates: SerializedCandidate[] };

const PRIORITY_KEY: Record<ReengagementPriority, string> = {
  ALTA:   'alta',
  MITJANA: 'mitjana',
  BAIXA:  'baixa',
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
    <div className="lr__body">

      {/* KPIs / filtres de prioritat */}
      <div className="lr__kpis">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`lr__kpi${filter === 'ALL' ? ' lr__kpi--on' : ''}`}
        >
          <p className="lr__kpi-label">Total</p>
          <p className="lr__kpi-val">{stats.counts.total}</p>
        </button>
        {(['ALTA', 'MITJANA', 'BAIXA'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setFilter(filter === p ? 'ALL' : p)}
            className={`lr__kpi lr__kpi--${PRIORITY_KEY[p]}${filter === p ? ` lr__kpi--on lr__kpi--${PRIORITY_KEY[p]}--on` : ''}`}
          >
            <p className="lr__kpi-label">Prioritat {p}</p>
            <p className="lr__kpi-val">{stats.counts[p]}</p>
          </button>
        ))}
      </div>

      {/* Filtres per motiu */}
      {stats.byReason.length > 0 && (
        <div className="lr__reasons">
          <button
            type="button"
            onClick={() => setReasonFilter(null)}
            className={`lr__reason${reasonFilter === null ? ' lr__reason--on' : ''}`}
          >
            Tots els motius
          </button>
          {stats.byReason.map(([reason, info]) => (
            <button
              key={reason}
              type="button"
              onClick={() => setReasonFilter(reasonFilter === reason ? null : reason)}
              className={`lr__reason${reasonFilter === reason ? ' lr__reason--on' : ''}`}
            >
              {info.label} · {info.count}
            </button>
          ))}
        </div>
      )}

      {/* Llista de candidats / empty state */}
      {visible.length === 0 ? (
        <div className="lr__empty">
          <span className="lr__empty-icon">✨</span>
          <p className="lr__empty-title">
            {initialCandidates.length === 0
              ? 'Cap lead pendent de reengagement'
              : 'Tots els candidats visibles estan filtrats o descartats'}
          </p>
          <p className="lr__empty-sub">
            {initialCandidates.length === 0
              ? 'Els leads apareixen aquí quan tenen pressupost sense resposta, negociació refredada o silenci prolongat.'
              : 'Ajusta els filtres per tornar a veure candidats.'}
          </p>
        </div>
      ) : (
        <div className="lr__cards">
          {visible.map((c) => (
            <article
              key={c.leadId}
              className={`lr__card lr__card--${PRIORITY_KEY[c.reengagementPriority]}`}
            >
              <div className="lr__card-top">
                <div className="lr__card-main">
                  {/* Meta: prioritat + motiu + score + estat */}
                  <div className="lr__card-meta">
                    <span className={`lr__badge lr__badge--${PRIORITY_KEY[c.reengagementPriority]}`}>
                      {c.reengagementPriority}
                    </span>
                    <span className="lr__card-sep">·</span>
                    <span className="lr__card-tag">{c.reasonLabel}</span>
                    <span className="lr__card-sep">·</span>
                    <span className="lr__card-tag">Score {c.score}</span>
                    <span className="lr__card-sep">·</span>
                    <span className="lr__card-tag">{c.status}</span>
                  </div>

                  {/* Nom + contacte */}
                  <div className="lr__card-namerow">
                    <Link href={buildLeadWorkspaceHref(c.leadId)} className="lr__card-name">
                      {c.name}
                    </Link>
                    <span className="lr__card-contact">{c.email}</span>
                    {c.phone && <span className="lr__card-contact">{c.phone}</span>}
                  </div>

                  {/* Event meta */}
                  <div className="lr__card-eventrow">
                    {c.eventType && <span>{c.eventType}</span>}
                    {c.eventLocation && <><span className="lr__card-sep">·</span><span>{c.eventLocation}</span></>}
                    {c.budget && <><span className="lr__card-sep">·</span><span>{c.budget}€</span></>}
                    {c.daysSinceCreation != null && <><span className="lr__card-sep">·</span><span>Creat fa {c.daysSinceCreation}d</span></>}
                    {c.daysSinceActivity != null && <><span className="lr__card-sep">·</span><span>Sense activitat {c.daysSinceActivity}d</span></>}
                    {c.daysUntilEvent != null && c.daysUntilEvent > 0 && (
                      <><span className="lr__card-sep">·</span><span className={c.daysUntilEvent <= 30 ? 'lr__card-soon' : ''}>Event en {c.daysUntilEvent}d</span></>
                    )}
                  </div>
                </div>

                {/* Canals + locale */}
                <div className="lr__channels">
                  <div className="lr__channel-icons">
                    {c.suggestedChannels.map((ch) => (
                      <span key={ch} title={ch}>
                        {ch === 'whatsapp' ? '💬' : ch === 'email' ? '✉️' : ch}
                      </span>
                    ))}
                  </div>
                  <span className="lr__locale">{c.preferredLocale}</span>
                </div>
              </div>

              {/* Missatge suggerit (desplegable) */}
              <details>
                <summary className="lr__msg-toggle">▶ Veure missatge suggerit</summary>
                <div className="lr__msg-box">
                  <p className="lr__msg-label">Assumpte</p>
                  <p className="lr__msg-subject">{c.suggestedSubject}</p>
                  <p className="lr__msg-label">Missatge</p>
                  <pre className="lr__msg-body">{c.suggestedMessage}</pre>
                </div>
              </details>

              {/* Accions */}
              <div className="lr__acts">
                {c.whatsappUrl && (
                  <a href={c.whatsappUrl} target="_blank" rel="noopener noreferrer" className="lr__act lr__act--wa">
                    💬 WhatsApp
                  </a>
                )}
                <Link href={buildLeadComposeHref(c.leadId, 'seguiment')} className="lr__act lr__act--email">
                  ✉️ Email
                </Link>
                <button type="button" onClick={() => handleCopyMessage(c)} className="lr__act">
                  {copied === c.leadId ? '✓ Copiat' : 'Copiar missatge'}
                </button>
                <Link href={buildLeadWorkspaceHref(c.leadId)} className="lr__act">
                  Veure fitxa →
                </Link>
                <button type="button" onClick={() => handleDismiss(c.leadId)} className="lr__act lr__act--dismiss">
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
