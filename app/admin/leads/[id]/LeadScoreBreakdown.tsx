'use client';

import { useState } from 'react';
import { generateScoreBreakdown, type ScoreBreakdown } from '@/lib/services/leadScoreBreakdownService';

const BAND_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  HIGH: { label: 'Alt', color: 'text-emerald-300', bg: 'bg-emerald-500/20' },
  MEDIUM: { label: 'Mitjà', color: 'text-amber-300', bg: 'bg-amber-500/20' },
  LOW: { label: 'Baix', color: 'text-rose-300', bg: 'bg-rose-500/20' },
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 45 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="h-2 w-full rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export default function LeadScoreBreakdown({
  lead,
}: {
  lead: {
    status: string;
    createdAt: string;
    updatedAt: string;
    eventDate?: string | null;
    budget?: string | null;
    phone?: string | null;
    eventLocation?: string | null;
    guestCount?: number | null;
    interestedPackId?: string | null;
    source?: string | null;
  };
}) {
  const [expanded, setExpanded] = useState(false);
  const breakdown: ScoreBreakdown = generateScoreBreakdown({
    ...lead,
    now: new Date(),
  });

  const band = BAND_CONFIG[breakdown.band] || BAND_CONFIG.LOW;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Scoring</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${band.bg} ${band.color}`}>
              {breakdown.score}/100 · {band.label}
            </span>
            <span className="text-[10px] opacity-40">
              ({(breakdown.probability * 100).toFixed(0)}% prob.)
            </span>
          </div>
          <span className="text-xs opacity-40">{expanded ? '▲' : '▼'}</span>
        </div>
        <div className="mt-1.5">
          <ScoreBar score={breakdown.score} />
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-1.5">
          {breakdown.factors.map((factor, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] ${
                factor.type === 'NEGATIVE'
                  ? 'bg-rose-500/[0.06] text-rose-200'
                  : factor.type === 'POSITIVE'
                  ? 'bg-emerald-500/[0.06] text-emerald-200'
                  : 'bg-white/[0.04] text-white/70'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>{factor.icon}</span>
                <span>{factor.label}</span>
              </span>
              <span className="font-mono font-semibold">
                {factor.type === 'BASE'
                  ? `${factor.points}`
                  : factor.points > 0
                  ? `+${factor.points}`
                  : factor.points < 0
                  ? `${factor.points}`
                  : '—'}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-[11px]">
            <span className="opacity-50">Positius / Negatius</span>
            <span>
              <span className="text-emerald-300">+{breakdown.positiveTotal}</span>
              {' / '}
              <span className="text-rose-300">{breakdown.negativeTotal}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
