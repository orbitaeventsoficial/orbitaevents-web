import Link from 'next/link';
import { AdminPage } from '../../components/AdminPage';
import { loadPostEventPlaybook, type PlaybookActionStatus, type PlaybookPriority } from '@/lib/services/postEventPlaybookService';
import { formatDate, getEventLabel } from '@/lib/constants';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Playbook post-event | Òrbita Admin',
};

const STATUS_TONE: Record<PlaybookActionStatus, string> = {
  DONE: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  PENDING: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  OVERDUE: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  NOT_APPLICABLE: 'border-white/10 bg-white/[0.03] text-white/40',
};

const STATUS_ICON: Record<PlaybookActionStatus, string> = {
  DONE: '✓',
  PENDING: '○',
  OVERDUE: '!',
  NOT_APPLICABLE: '—',
};

const PRIORITY_TONE: Record<PlaybookPriority, string> = {
  ALTA: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  MITJANA: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  BAIXA: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  DONE: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
};

export default async function PlaybookPage() {
  const summary = await loadPostEventPlaybook();

  return (
    <AdminPage
      title="Playbook post-event"
      subtitle={`${summary.totalBookings} events recents · ${summary.fullyCompleted} completats · ${summary.pendingActionsTotal} accions pendents`}
      back={{ href: '/admin/post-event', label: 'Post-event' }}
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Events recents</p>
            <p className="mt-1 text-xl font-bold">{summary.totalBookings}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Completats</p>
            <p className="mt-1 text-xl font-bold text-emerald-300">{summary.fullyCompleted}</p>
          </div>
          <div
            className={`rounded-xl border p-3 ${summary.withOverdue > 0 ? 'border-rose-500/30 bg-rose-500/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Amb overdue</p>
            <p className={`mt-1 text-xl font-bold ${summary.withOverdue > 0 ? 'text-rose-300' : ''}`}>
              {summary.withOverdue}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Progrés global</p>
            <p className="mt-1 text-xl font-bold text-cyan-300">{summary.overallProgress}%</p>
          </div>
        </div>

        {/* Empty state */}
        {summary.items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-4xl">🎉</p>
            <p className="mt-3 text-sm font-semibold opacity-80">No hi ha events recents per gestionar</p>
            <p className="mt-1 text-xs opacity-50">
              Les reserves completades dels últims 90 dies apareixen aquí per fer-ne seguiment.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {summary.items.map((item) => (
              <article
                key={item.bookingId}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_TONE[item.priority]}`}
                      >
                        {item.priority}
                      </span>
                      <span className="text-[10px] opacity-60">{item.reference}</span>
                      <span className="text-[10px] opacity-40">·</span>
                      <span className="text-[10px] opacity-60">Fa {item.daysSinceEvent} dies</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <Link
                        href={buildBookingHref(item.bookingId)}
                        className="text-sm font-semibold hover:text-cyan-300 transition-colors"
                      >
                        {item.clientName}
                      </Link>
                      <span className="text-[11px] opacity-50">·</span>
                      <span className="text-[11px] opacity-60">{getEventLabel(item.eventType)}</span>
                      {item.eventLocation && (
                        <>
                          <span className="text-[11px] opacity-50">·</span>
                          <span className="text-[11px] opacity-60">{item.eventLocation}</span>
                        </>
                      )}
                      <span className="text-[11px] opacity-50">·</span>
                      <span className="text-[11px] opacity-60">{formatDate(item.eventDate)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] opacity-50 uppercase tracking-wider">Progrés</p>
                    <p className="text-sm font-bold">{item.progress}%</p>
                    <p className="text-[10px] opacity-50">
                      {item.completedCount}/{item.totalCount}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full transition-all ${
                      item.progress === 100
                        ? 'bg-emerald-400'
                        : item.progress >= 50
                          ? 'bg-cyan-400'
                          : 'bg-amber-400'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                {/* Actions grid */}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {item.actions.map((action) => (
                    <div
                      key={action.key}
                      className={`rounded-lg border px-2.5 py-2 ${STATUS_TONE[action.status]}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold">{STATUS_ICON[action.status]}</span>
                        <span className="text-[10px] font-semibold truncate">{action.label}</span>
                      </div>
                      {action.note && (
                        <p className="mt-0.5 text-[9px] opacity-70 truncate">{action.note}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Next action hint */}
                {item.nextAction && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                      Següent
                    </span>
                    <span className="text-[11px]">{item.nextAction.label}</span>
                    <Link
                      href={buildBookingHref(item.bookingId)}
                      className="ml-auto text-[11px] text-cyan-300 hover:text-cyan-200"
                    >
                      Gestionar →
                    </Link>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminPage>
  );
}
