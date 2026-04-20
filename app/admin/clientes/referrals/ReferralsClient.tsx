'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ReferralsSummary, ReferralCandidate } from '@/lib/services/referralsService';

type Props = { summary: ReferralsSummary };

const PRIORITY_TONE: Record<ReferralCandidate['priority'], string> = {
  ALTA: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  MITJANA: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  BAIXA: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

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
    <div className="space-y-6 p-6">
      {/* KPIs globals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Referrers actius</p>
          <p className="mt-1 text-xl font-bold">{summary.stats.totalReferrers}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Clients referits</p>
          <p className="mt-1 text-xl font-bold text-emerald-300">{summary.stats.totalReferred}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Taxa referral</p>
          <p className="mt-1 text-xl font-bold">{formatPercent(summary.stats.referralRate)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Valor generat</p>
          <p className="mt-1 text-xl font-bold text-cyan-300">{formatCurrency(summary.stats.totalReferralValue)}</p>
        </div>
      </div>

      {/* Top referrers */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-70">Top referrers</h2>
        {summary.topReferrers.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
            <p className="text-xs opacity-60">Encara no hi ha clients que hagin portat referrals</p>
          </div>
        ) : (
          <div className="space-y-2">
            {summary.topReferrers.map((r, idx) => (
              <article
                key={r.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-lg font-bold opacity-60 shrink-0">#{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/clientes/${r.id}`}
                        className="text-sm font-semibold hover:text-cyan-300 transition-colors"
                      >
                        {r.name}
                      </Link>
                      <p className="text-[11px] opacity-60 truncate">
                        {r.lifecycleStage} · {r.email}
                      </p>
                      <p className="mt-0.5 text-[10px] opacity-50 truncate">
                        Ha portat: {r.referralsNames.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-[9px] opacity-50 uppercase tracking-wider">Clients</p>
                      <p className="text-sm font-bold">{r.referralsCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] opacity-50 uppercase tracking-wider">Valor</p>
                      <p className="text-sm font-bold text-cyan-300">{formatCurrency(r.referralsValue)}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Candidats per preguntar */}
      <section>
        <div className="mb-2 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xs font-semibold uppercase tracking-wider opacity-70">
            Candidats per preguntar ({summary.candidates.length})
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${filter === 'ALL' ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}
            >
              Tots
            </button>
            {(['ALTA', 'MITJANA', 'BAIXA'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFilter(filter === p ? 'ALL' : p)}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${filter === p ? PRIORITY_TONE[p] : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {visibleCandidates.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-4xl">✨</p>
            <p className="mt-3 text-sm font-semibold opacity-80">
              {summary.candidates.length === 0
                ? 'Cap candidat disponible ara mateix'
                : 'Tots els candidats visibles estan filtrats o descartats'}
            </p>
            <p className="mt-1 text-xs opacity-50">
              {summary.candidates.length === 0
                ? 'Els clients satisfets amb events complets apareixeran aquí com a candidats.'
                : 'Ajusta el filtre per tornar a veure candidats.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleCandidates.map((c) => (
              <article
                key={c.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_TONE[c.priority]}`}>
                        {c.priority}
                      </span>
                      <span className="text-[10px] opacity-60">{c.reasonLabel}</span>
                      <span className="text-[10px] opacity-40">·</span>
                      <span className="text-[10px] opacity-60">Score {c.score}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="text-sm font-semibold hover:text-cyan-300 transition-colors"
                      >
                        {c.name}
                      </Link>
                      <span className="text-[11px] opacity-50">·</span>
                      <span className="text-[11px] opacity-60">{c.email}</span>
                    </div>
                    <div className="mt-1 text-[11px] opacity-50 flex items-center gap-2 flex-wrap">
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
                    {copied === c.id ? '✓ Copiat' : 'Copiar missatge'}
                  </button>
                  <Link
                    href={`/admin/clientes/${c.id}`}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] hover:bg-white/10"
                  >
                    Veure fitxa →
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDismiss(c.id)}
                    className="ml-auto rounded-lg border border-white/10 px-2 py-1 text-[10px] opacity-60 hover:bg-white/5"
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
