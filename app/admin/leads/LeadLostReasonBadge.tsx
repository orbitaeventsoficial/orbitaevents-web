import { LEAD_LOST_REASON_LABELS, isAutoLossReason, isLeadLostReason } from '@/lib/constants/leadLoss';

type LeadLostReasonBadgeProps = {
  lostReason?: string | null;
  className?: string;
};

export default function LeadLostReasonBadge({ lostReason, className = '' }: LeadLostReasonBadgeProps) {
  if (!isLeadLostReason(lostReason)) return null;

  const auto = isAutoLossReason(lostReason);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
        auto
          ? 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning'
          : 'admin-tone-border-slate admin-tone-bg-slate admin-tone-text-slate'
      } ${className}`.trim()}
      title={auto ? 'Pèrdua classificada automàticament' : 'Motiu classificat manualment'}
    >
      <span>{auto ? 'Auto' : 'Motiu'}</span>
      <span className="truncate">{LEAD_LOST_REASON_LABELS[lostReason]}</span>
    </span>
  );
}
