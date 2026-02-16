'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { CustomerHubDTO, HubStatus } from '@/lib/customer-hub/dto';
import { labelEstatClient } from '@/lib/customer-hub/labels';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES I CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

type TabKey = 'summary' | 'proposals' | 'bookings' | 'margin' | 'comms' | 'tasks';

const TABS: Array<{ key: TabKey; label: string; icon: string; badge?: (data: CustomerHubDTO) => number | null }> = [
  { key: 'summary', label: 'Resum', icon: '📊' },
  {
    key: 'proposals',
    label: 'Pressupostos',
    icon: '📄',
    badge: (data) => data.proposals.filter((p) => p.status === 'DRAFT').length || null,
  },
  {
    key: 'bookings',
    label: 'Reserves',
    icon: '📅',
    badge: (data) => data.bookings.filter((b) => b.status === 'CONFIRMED').length || null,
  },
  { key: 'margin', label: 'Marge', icon: '💰' },
  { key: 'comms', label: 'Comunicacions', icon: '💬' },
  {
    key: 'tasks',
    label: 'Tasques',
    icon: '✅',
    badge: (data) => data.tasks.filter((t) => !t.done).length || null,
  },
];

const STATUS_STYLES: Record<HubStatus | 'default', { bg: string; text: string; border: string }> = {
  CONFIRMED: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
  },
  NEGOTIATION: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
  },
  POSTEVENT: {
    bg: 'bg-indigo-500/20',
    text: 'text-indigo-300',
    border: 'border-indigo-500/40',
  },
  LOST: {
    bg: 'bg-rose-500/20',
    text: 'text-rose-300',
    border: 'border-rose-500/40',
  },
  LEAD: {
    bg: 'bg-slate-500/20',
    text: 'text-slate-300',
    border: 'border-slate-500/40',
  },
  default: {
    bg: 'bg-slate-500/20',
    text: 'text-slate-300',
    border: 'border-slate-500/40',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function CustomerHeader({
  data,
  tab,
  setTab,
}: {
  data: CustomerHubDTO;
  tab: TabKey;
  setTab: (tab: TabKey) => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const id = data.customer.id;
  const status = data.customer.status;
  const statusLabel = labelEstatClient(status);
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.default;

  // Calcular temps des de l'últim contacte
  const lastContactText = data.kpis.lastContactAt
    ? formatRelativeTime(data.kpis.lastContactAt)
    : 'mai contactat';

  // Handler per canviar estat del client manualment
  const changeStatus = useCallback(async (newStatus: HubStatus) => {
    setActionLoading(`status-${newStatus}`);
    setMenuOpen(false);
    try {
      const res = await fetch(`/api/admin/customers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // Silently fail, user can retry
    } finally {
      setActionLoading(null);
    }
  }, [id, router]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-700/70 bg-zinc-900/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 space-y-3">
        {/* Top row: Navigation + Status + Name */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {/* Breadcrumb + Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/admin/contactes"
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Clients
              </Link>

              {/* Status badge amb dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} hover:opacity-80`}
                  disabled={actionLoading !== null}
                >
                  {actionLoading?.startsWith('status') ? '...' : statusLabel}
                  <span className="ml-1">▾</span>
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl min-w-[140px]">
                      {(['LEAD', 'NEGOTIATION', 'CONFIRMED', 'POSTEVENT', 'LOST'] as HubStatus[]).map((s) => {
                        const style = STATUS_STYLES[s];
                        const isActive = s === status;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => changeStatus(s)}
                            disabled={isActive}
                            className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                              isActive
                                ? 'bg-slate-700/50 font-semibold'
                                : 'hover:bg-slate-700/50'
                            } ${style.text}`}
                          >
                            {labelEstatClient(s)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Last contact indicator */}
              <span className="text-[10px] text-slate-500">
                · Últim contacte: {lastContactText}
              </span>
            </div>

            {/* Client name */}
            <h1 className="mt-1 truncate text-xl font-semibold text-slate-100">
              {data.customer.name}
            </h1>

            {/* Contact info */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              {data.customer.email && (
                <a
                  href={`mailto:${data.customer.email}`}
                  className="hover:text-slate-200 transition-colors"
                >
                  {data.customer.email}
                </a>
              )}
              {data.customer.phone && (
                <>
                  <span>·</span>
                  <a
                    href={`tel:${data.customer.phone}`}
                    className="hover:text-slate-200 transition-colors"
                  >
                    {data.customer.phone}
                  </a>
                </>
              )}
              {data.customer.phone && (
                <a
                  href={`https://wa.me/${data.customer.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-emerald-400 hover:text-emerald-300"
                  title="Obrir WhatsApp"
                >
                  💬
                </a>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2">
            <ActionButton
              href={`/admin/presupuestos?customerId=${id}`}
              label="Nou pressupost"
              color="cyan"
              icon="📄"
            />
            <ActionButton
              href={`/admin/bookings/new?customerId=${id}`}
              label="Nova reserva"
              color="indigo"
              icon="📅"
            />
            <ActionButton
              href={`/admin/tasks/new?customerId=${id}`}
              label="Nova tasca"
              color="amber"
              icon="✅"
            />
            <ActionButton
              href={`/admin/inbox/compose?customerId=${id}`}
              label="Missatge"
              color="slate"
              icon="✉️"
            />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <KpiChip
            label="Pròxim esdeveniment"
            value={formatDate(data.kpis.nextEventDate)}
            highlight={!!data.kpis.nextEventDate}
          />
          <KpiChip
            label="Total pressupostat"
            value={money(data.kpis.totalQuoted)}
          />
          <KpiChip
            label="Total cobrat"
            value={money(data.kpis.totalPaid)}
            highlight={Boolean(data.kpis.totalPaid && data.kpis.totalPaid > 0)}
          />
          <KpiChip
            label="Marge estimat"
            value={money(data.kpis.marginEstimated)}
          />
          <KpiChip
            label="Última comunicació"
            value={formatDate(data.kpis.lastContactAt)}
          />
        </div>

        {/* Tabs - Desktop */}
        <div className="hidden md:flex flex-wrap gap-1">
          {TABS.map((item) => {
            const badge = item.badge?.(data);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5 ${
                  tab === item.key
                    ? 'bg-slate-100 text-slate-900 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                {badge != null && badge > 0 && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      tab === item.key
                        ? 'bg-slate-800 text-slate-100'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tabs - Mobile */}
        <div className="md:hidden">
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value as TabKey)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 appearance-none"
          >
            {TABS.map((item) => {
              const badge = item.badge?.(data);
              return (
                <option key={item.key} value={item.key}>
                  {item.icon} {item.label}
                  {badge != null && badge > 0 ? ` (${badge})` : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ActionButton({
  href,
  label,
  color,
  icon,
}: {
  href: string;
  label: string;
  color: 'cyan' | 'indigo' | 'amber' | 'slate';
  icon: string;
}) {
  const colorStyles = {
    cyan: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    indigo: 'bg-indigo-500 hover:bg-indigo-600 text-white',
    amber: 'bg-amber-500 hover:bg-amber-600 text-white',
    slate: 'bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-200',
  };

  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${colorStyles[color]}`}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

function KpiChip({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 transition-colors ${
        highlight
          ? 'border-cyan-500/30 bg-cyan-500/5'
          : 'border-slate-700/70 bg-slate-900/60'
      }`}
    >
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold ${
          highlight ? 'text-cyan-200' : 'text-slate-100'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════

function money(value?: number): string {
  if (typeof value !== 'number') return '—';
  return `${value.toLocaleString('ca-ES', { maximumFractionDigits: 0 })}€`;
}

function formatDate(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'ara mateix';
  if (diffMins < 60) return `fa ${diffMins} min`;
  if (diffHours < 24) return `fa ${diffHours}h`;
  if (diffDays === 1) return 'ahir';
  if (diffDays < 7) return `fa ${diffDays} dies`;
  if (diffDays < 30) return `fa ${Math.floor(diffDays / 7)} setmanes`;
  return formatDate(dateStr);
}
