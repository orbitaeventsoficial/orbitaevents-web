import { formatEUR } from './studio-utils';

type ProposalFinancialSummary = {
  directCost: number;
  netMargin: number;
  marginPct: number;
  acquisitionCost?: number;
  marginTone: {
    tone: 'emerald' | 'amber' | 'orange' | 'rose';
    label: string;
  };
};

export type ProposalCommercialGuard = {
  tone: 'ok' | 'watch' | 'danger' | 'unknown';
  label: string;
  detail: string;
  className: string;
  facts: Array<{ label: string; value: string }>;
};

const TONE_CLASS: Record<ProposalCommercialGuard['tone'], string> = {
  ok: 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-200',
  watch: 'border-amber-500/30 bg-amber-500/[0.06] text-amber-200',
  danger: 'border-rose-500/35 bg-rose-500/[0.08] text-rose-200',
  unknown: 'border-[var(--line)] bg-[var(--raised)] text-[var(--t2)]',
};

export function buildProposalCommercialGuard(
  summary: ProposalFinancialSummary | null | undefined,
): ProposalCommercialGuard {
  if (!summary) {
    return {
      tone: 'unknown',
      label: 'Marge pendent',
      detail: 'No hi ha lectura economica carregada; revisa preu, transport i extres abans d\'enviar.',
      className: TONE_CLASS.unknown,
      facts: [],
    };
  }

  const tone = mapTone(summary.marginTone.tone);
  const label = tone === 'danger'
    ? 'Risc alt abans d\'enviar'
    : tone === 'watch'
      ? 'Vigila abans d\'enviar'
      : 'Marge sa per enviar';

  return {
    tone,
    label,
    detail: `${summary.marginTone.label}: ${summary.marginPct.toFixed(1)}% de marge.`,
    className: TONE_CLASS[tone],
    facts: [
      { label: 'Cost directe', value: formatEUR(summary.directCost) },
      { label: 'Marge net', value: formatEUR(summary.netMargin) },
      { label: 'CAC estimat', value: formatEUR(summary.acquisitionCost ?? 0) },
    ],
  };
}

function mapTone(tone: ProposalFinancialSummary['marginTone']['tone']): ProposalCommercialGuard['tone'] {
  if (tone === 'rose') return 'danger';
  if (tone === 'orange' || tone === 'amber') return 'watch';
  return 'ok';
}
