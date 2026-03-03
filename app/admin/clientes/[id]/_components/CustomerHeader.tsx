'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import type { CustomerHubDTO, HubStatus } from '@/lib/customer-hub/dto';
import { labelEstatClient } from '@/lib/customer-hub/labels';
import { fetchWithCsrf } from '@/lib/csrf';
import { useHubContext } from './CustomerHubClient';
import { useToast } from '@/app/admin/components/ToastProvider';
import { formatDate, formatNumber } from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES I CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

type TabKey = 'summary' | 'proposals' | 'bookings' | 'margin' | 'comms' | 'tasks' | 'discounts' | 'leads';

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
  {
    key: 'discounts',
    label: 'Descomptes',
    icon: '🏷️',
    badge: (data) => (data.discountCodes || []).filter((dc) => dc.isActive && dc.currentUses < dc.maxUses && new Date(dc.validUntil) > new Date()).length || null,
  },
  {
    key: 'leads',
    label: 'Entrades',
    icon: '📋',
    badge: (data) => (data.leads || []).length || null,
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
    bg: 'bg-white/10',
    text: 'text-white/70',
    border: 'border-white/15',
  },
  default: {
    bg: 'bg-white/10',
    text: 'text-white/70',
    border: 'border-white/15',
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
  const { refresh } = useHubContext();
  const toast = useToast();
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

  const stageOrder: HubStatus[] = ['LEAD', 'NEGOTIATION', 'CONFIRMED', 'POSTEVENT', 'LOST'];
  const currentStageIndex = stageOrder.indexOf(status);
  const stageLabel: Record<HubStatus, string> = {
    LEAD: 'Entrada',
    NEGOTIATION: 'Negociació',
    CONFIRMED: 'Confirmat',
    POSTEVENT: 'Post-esdeveniment',
    LOST: 'Perdut',
  };

  const nextAction = (() => {
    if (status === 'LEAD') {
      return {
        label: 'Crear pressupost',
        href: `/admin/presupuestos?customerId=${id}`,
        description: 'Primer pas per avançar aquest client.',
      };
    }
    if (status === 'NEGOTIATION') {
      return {
        label: 'Enviar seguiment',
        href: `/admin/inbox/compose?customerId=${id}&template=recordatori`,
        description: 'Fer seguiment de proposta i desbloquejar decisió.',
      };
    }
    if (status === 'CONFIRMED') {
      return {
        label: 'Revisar reserva',
        href: `/admin/bookings?customerId=${id}`,
        description: 'Validar preparació d’equip, horari i logística.',
      };
    }
    if (status === 'POSTEVENT') {
      return {
        label: 'Tancar post-esdeveniment',
        href: '/admin/post-event',
        description: 'Enviar post-event, feedback i tancar cicle.',
      };
    }
    return {
      label: 'Reactivar oportunitat',
      href: `/admin/leads?q=${encodeURIComponent(data.customer.email || data.customer.name)}`,
      description: 'Revisa context i decideix si es pot reobrir.',
    };
  })();

  // Handler per canviar estat del client manualment
  const changeStatus = useCallback(async (newStatus: HubStatus) => {
    setActionLoading(`status-${newStatus}`);
    setMenuOpen(false);
    try {
      const res = await fetchWithCsrf(`/api/admin/customers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        refresh();
      }
    } catch (err) {
      console.error('Error canviant estat del client', err);
      toast.error('Error canviant l\'estat del client');
    } finally {
      setActionLoading(null);
    }
  }, [id, refresh]);

  return (
    <header className="sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 space-y-3">
        {/* Top row: Navigation + Status + Name */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {/* Breadcrumb + Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/admin/clientes"
                className="text-xs transition-colors"
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
                    <div className="absolute left-0 top-full z-50 mt-1 rounded-xl border py-1 shadow-xl min-w-[140px]">
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
                                ? 'bg-white/10 font-semibold'
                                : 'hover:bg-white/10'
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
              <span className="text-[10px]">
                · Últim contacte: {lastContactText}
              </span>
            </div>

            {/* Client name */}
            <h1 className="mt-1 truncate text-xl font-semibold">
              {data.customer.name}
            </h1>

            {/* Contact info */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {data.customer.email && (
                <a
                  href={`mailto:${data.customer.email}`}
                  className="transition-colors"
                >
                  {data.customer.email}
                </a>
              )}
              {data.customer.phone && (
                <>
                  <span>·</span>
                  <a
                    href={`tel:${data.customer.phone}`}
                    className="transition-colors"
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
                  className="ml-1"
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

        {/* Estat del procés + següent acció */}
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider">On està aquest client</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {stageOrder.map((stage, idx) => {
                const isCurrent = stage === status;
                const isDone = status !== 'LOST' && idx < currentStageIndex;
                return (
                  <span
                    key={stage}
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      isCurrent
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : isDone
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/5 text-white/40 border border-white/10'
                    }`}
                  >
                    {stageLabel[stage]}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider">Següent millor acció</p>
            <p className="mt-1 text-sm">{nextAction.description}</p>
            <Link
              href={nextAction.href}
              className="mt-2 inline-flex rounded-xl border px-3 py-1.5 text-xs font-semibold"
            >
              {nextAction.label}
            </Link>
          </div>
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
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5 ${
                  tab === item.key
                    ? 'bg-white text-black shadow-sm'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                {badge != null && badge > 0 && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      tab === item.key
                        ? 'bg-black/60 text-white'
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
            className="w-full rounded-xl border px-3 py-2.5 text-sm appearance-none"
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
    slate: 'bg-white/5 border border-white/15 hover:bg-white/10 text-white/80',
  };

  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${colorStyles[color]}`}
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
          : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <p className="text-[11px] uppercase tracking-wider">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold ${
          highlight ? 'text-cyan-200' : 'text-white/90'
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
  return `${formatNumber(value, { maximumFractionDigits: 0 })}€`;
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
