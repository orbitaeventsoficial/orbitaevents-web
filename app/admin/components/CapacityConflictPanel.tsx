import Link from 'next/link';
import type { CapacityConflictReport, CapacityConflict } from '@/lib/services/capacityConflictService';

function ConflictRow({ conflict }: { conflict: CapacityConflict }) {
  const pct = Math.round((conflict.totalDemanded / Math.max(conflict.stockAvailable, 1)) * 100);
  const barWidth = Math.min(pct, 200);
  const severity = conflict.deficit >= 3 ? 'danger' : 'warning';
  const barColor = severity === 'danger' ? 'bg-[var(--o-danger)]' : 'bg-[var(--o-warning)]';
  const badgeStyle = severity === 'danger' ? 'admin-tone-bg-danger admin-tone-text-danger' : 'admin-tone-bg-warning admin-tone-text-warning';

  return (
    <div className="admin-stagger-item flex items-center gap-3 rounded-xl border admin-tone-border-danger admin-tone-bg-danger px-4 py-3 adm-row-hover transition-colors">
      <span className="text-lg shrink-0">⚡</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {conflict.itemName} <span className="opacity-50 text-xs">({conflict.itemCode})</span>
        </p>
        <p className="text-xs opacity-60 truncate">
          {conflict.date} · {conflict.bookings.map((b) => b.clientName).join(' + ')}
        </p>
      </div>
      <div className="h-1.5 w-16 rounded-full bg-white/[0.06] overflow-hidden shrink-0">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(barWidth / 2, 100)}%` }} />
      </div>
      <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${badgeStyle}`}>
        -{conflict.deficit}
      </span>
    </div>
  );
}

export default function CapacityConflictPanel({ report }: { report: CapacityConflictReport }) {
  if (report.conflicts.length === 0) return null;

  return (
    <section className="rounded-[var(--o-r-md)] border admin-tone-border-danger bg-[var(--panel)] p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <span>⚡</span>
            <span>Conflictes de capacitat</span>
          </h2>
          <p className="mt-1 text-xs opacity-60">{report.verdict}</p>
        </div>
        <Link
          href="/admin/bookings"
          className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold transition-colors hover:bg-white/10"
        >
          Reserves →
        </Link>
      </div>
      <div className="space-y-2">
        {report.conflicts.slice(0, 5).map((conflict) => (
          <ConflictRow key={`${conflict.date}-${conflict.itemId}`} conflict={conflict} />
        ))}
        {report.conflicts.length > 5 && (
          <p className="text-center text-xs opacity-40">
            +{report.conflicts.length - 5} conflictes més
          </p>
        )}
      </div>
    </section>
  );
}
