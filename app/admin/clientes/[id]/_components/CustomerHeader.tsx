'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import type { CustomerHubDTO, HubStatus } from '@/lib/customer-hub/dto';
import { CUSTOMER_HUB_STAGE_LABELS, CUSTOMER_HUB_STAGE_ORDER, labelEstatClient } from '@/lib/customer-hub/labels';
import { fetchWithCsrf } from '@/lib/csrf';
import { useHubContext } from './CustomerHubClient';
import { useToast } from '@/app/admin/components/ToastProvider';
import ConfirmDialog from '@/app/admin/components/ConfirmDialog';
import { useConfirmDialog } from '@/app/admin/components/ConfirmDialog';
import { formatDate, formatNumber } from '@/lib/constants';
import { ADMIN_CUSTOMER_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { log } from '@/lib/logger';
import {
  buildCustomerBookingCreateHref,
  buildCustomerComposeHref,
  buildCustomerProposalHref,
  buildCustomerTaskCreateHref,
} from '@/lib/admin/customerWorkspaceHref';
import { buildCustomerNextActionLink } from '@/lib/customer-hub/nextActionLink';
import { buildCustomerCommercialPriority } from '@/lib/customer-hub/commercialPriority';
import InsightsBanner from './InsightsBanner';
import MobileQuickActions from '@/app/admin/components/MobileQuickActions';

type TabKey = 'summary' | 'proposals' | 'bookings' | 'margin' | 'comms' | 'tasks' | 'discounts' | 'leads' | 'privacy';

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
  { key: 'privacy', label: 'Privacitat', icon: '🔒' },
];

const STATUS_BTN_TONE: Record<string, string> = {
  confirmed: 'border-[var(--ax-success-strong)] bg-[var(--ax-success-bg)] text-[var(--o-success)]',
  negotiation: 'border-[var(--ax-warning-strong)] bg-[var(--ax-warning-bg)] text-[var(--o-warning)]',
  postevent: 'border-[var(--ax-vip)] bg-[var(--ax-vip-soft)] text-[var(--ax-vip)]',
  lost: 'border-[var(--ax-danger-strong)] bg-[var(--ax-danger-bg)] text-[var(--o-danger)]',
};
const STATUS_BTN_DEFAULT = 'border-[var(--o-admin-line-2)] bg-[var(--ax-fill-3)] text-[var(--t2)]';

const STATUS_OPT_TONE: Record<string, string> = {
  confirmed: 'text-[var(--o-success)]',
  negotiation: 'text-[var(--o-warning)]',
  postevent: 'text-[var(--ax-vip)]',
  lost: 'text-[var(--o-danger)]',
};

const AVATAR_TONE: Record<string, string> = {
  confirmed: 'border-[var(--ax-success-bg)] bg-[var(--ax-success-bg)]',
  negotiation: 'border-[var(--ax-warning-bg)] bg-[var(--ax-warning-bg)]',
  postevent: 'border-[var(--ax-vip-soft)] bg-[var(--ax-vip-soft)]',
  lost: 'border-[var(--ax-danger-bg)] bg-[var(--ax-danger-bg)]',
};
const AVATAR_DEFAULT = 'border-[var(--o-admin-line)] bg-[var(--ax-fill-3)]';

const STAGE_BASE = 'whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

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
  const router = useRouter();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { confirm, dialogProps } = useConfirmDialog();

  const id = data.customer.id;
  const customerProposalHref = buildCustomerProposalHref(id);
  const customerBookingCreateHref = buildCustomerBookingCreateHref(id);
  const customerTaskCreateHref = buildCustomerTaskCreateHref(id);
  const customerComposeHref = buildCustomerComposeHref(id);
  const status = data.customer.status;
  const statusLabel = labelEstatClient(status);
  const statusSlug = status.toLowerCase();

  const lastContactText = data.kpis.lastContactAt
    ? formatRelativeTime(data.kpis.lastContactAt)
    : 'mai contactat';

  const hasProtectedData = data.bookings.length > 0 || data.proposals.length > 0;

  const deleteCustomer = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Eliminar client',
      message: hasProtectedData
        ? `"${data.customer.name}" té reserves o pressupostos. S'anonimitzarà (les dades personals s'esborren, però es conserven registres financers). Segur?`
        : `Segur que vols eliminar "${data.customer.name}" de forma permanent? Aquesta acció no es pot desfer.`,
      variant: 'danger',
      confirmLabel: hasProtectedData ? 'Anonimitzar' : 'Eliminar',
    });
    if (!confirmed) return;
    setActionLoading('delete');
    try {
      const res = await fetchWithCsrf(`/api/admin/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(hasProtectedData ? 'Client anonimitzat' : 'Client eliminat');
        router.push('/admin/clientes');
      } else {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error || 'Error eliminant client');
      }
    } catch (err) {
      console.error('Error en acció de capçalera client', err);
      toast.error('Error de connexió');
    } finally {
      setActionLoading(null);
    }
  }, [confirm, hasProtectedData, data.customer.name, id, toast, router]);

  const currentStageIndex = CUSTOMER_HUB_STAGE_ORDER.indexOf(status);
  const nextActionLink = buildCustomerNextActionLink({
    customerId: id,
    customerName: data.customer.name,
    customerPhone: data.customer.phone,
    nextAction: data.insights.nextAction,
    commSummary: data.commSummary,
  });
  const commercialPriority = buildCustomerCommercialPriority({
    insights: data.insights,
    followUpSummary: data.followUpSummary,
  });

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
      log.error('Error canviant estat del client', err);
      toast.error('Error canviant l\'estat del client');
    } finally {
      setActionLoading(null);
    }
  }, [id, refresh, toast]);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--o-admin-line)] bg-[var(--ax-overlay-sm)] backdrop-blur-[20px]" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.root)}>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 pb-3 pt-3.5">

        {/* ── Top row ── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3.5">
            <div className={`hidden h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[var(--o-r-xl)] border text-lg font-bold text-[var(--t)] shadow-[var(--o-shadow-md)] sm:flex ${AVATAR_TONE[statusSlug] || AVATAR_DEFAULT}`}>
              {getInitials(data.customer.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-[3px] flex flex-wrap items-center gap-2">
                <Link href="/admin/clientes" className="text-xs text-[var(--t3)] no-underline transition-colors hover:text-[var(--t2)]" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.backToCustomers)}>
                  ← Clients
                </Link>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-60 ${STATUS_BTN_TONE[statusSlug] || STATUS_BTN_DEFAULT}`}
                    disabled={actionLoading !== null}
                    {...helpAttrs(ADMIN_CUSTOMER_HELP.header.statusToggle)}
                  >
                    {actionLoading?.startsWith('status') ? '…' : statusLabel}
                    <span>▾</span>
                  </button>

                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-[140px] rounded-[var(--o-r-lg)] border border-[var(--o-admin-line-2)] bg-[var(--raised)] py-1 shadow-[var(--o-shadow-lg)]">
                        {CUSTOMER_HUB_STAGE_ORDER.map((s) => {
                          const isActive = s === status;
                          const slug = s.toLowerCase();
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => changeStatus(s)}
                              disabled={isActive}
                              className={`w-full cursor-pointer border-none bg-transparent px-3 py-1.5 text-left text-xs transition-colors hover:bg-[var(--ax-fill-3)] disabled:cursor-default disabled:bg-[var(--ax-fill-3)] disabled:font-bold ${STATUS_OPT_TONE[slug] || 'text-[var(--t2)]'}`}
                              {...helpAttrs(ADMIN_CUSTOMER_HELP.header.statusOption(labelEstatClient(s)))}
                            >
                              {labelEstatClient(s)}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <span className="text-xs text-[var(--t3)]" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.lastContact)}>
                  · Últim contacte: {lastContactText}
                </span>
              </div>

              <h1 className="m-0 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-2xl font-extrabold leading-none tracking-[-0.018em] text-[var(--t)] [font-family:var(--display)]">
                {data.customer.customerNumber != null && (
                  <span className="mr-1.5 text-sm text-[var(--t3)] [font-family:var(--mono)]">
                    CLI-{String(data.customer.customerNumber).padStart(4, '0')}
                  </span>
                )}
                {data.customer.name}
              </h1>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--t2)]">
                {data.customer.email && (
                  <Link href={customerComposeHref} title="Obrir redactor amb aquest client" className="text-[var(--t2)] no-underline transition-colors hover:text-[var(--t)]">
                    {data.customer.email}
                  </Link>
                )}
                {data.customer.phone && (
                  <>
                    <span className="text-[var(--t3)]">·</span>
                    <a href={`tel:${data.customer.phone}`} className="text-[var(--t2)] no-underline transition-colors hover:text-[var(--t)]">{data.customer.phone}</a>
                  </>
                )}
                {data.customer.phone && (
                  <a
                    href={`https://wa.me/${data.customer.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={ADMIN_CUSTOMER_HELP.header.whatsapp.title}
                    className="text-[var(--t2)] no-underline transition-colors hover:text-[var(--t)]"
                    {...helpAttrs(ADMIN_CUSTOMER_HELP.header.whatsapp)}
                  >
                    💬
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex flex-wrap items-start gap-2" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.quickActions)}>
            <Link
              href={customerProposalHref}
              className="ap-btn ap-btn--primary ap-btn--xs"
              {...helpAttrs(ADMIN_CUSTOMER_HELP.header.action('Nou pressupost', 'Crea una proposta nova ja vinculada a aquest client.'))}
            >
              <span>📄</span>
              <span className="hidden sm:inline">Nou pressupost</span>
            </Link>
            <Link
              href={customerBookingCreateHref}
              className="ap-btn ap-btn--secondary ap-btn--xs"
              {...helpAttrs(ADMIN_CUSTOMER_HELP.header.action('Nova reserva', 'Crea una reserva nova vinculada a aquest client.'))}
            >
              <span>📅</span>
              <span className="hidden sm:inline">Nova reserva</span>
            </Link>
            <Link
              href={customerTaskCreateHref}
              className="ap-btn ap-btn--xs"
              {...helpAttrs(ADMIN_CUSTOMER_HELP.header.action('Nova tasca', 'Afegeix una tasca operativa o comercial associada al client.'))}
            >
              <span>✅</span>
              <span className="hidden sm:inline">Nova tasca</span>
            </Link>
            <Link
              href={customerComposeHref}
              className="ap-btn ap-btn--xs"
              {...helpAttrs(ADMIN_CUSTOMER_HELP.header.action('Missatge', 'Obre el redactor de correu amb aquest client ja preseleccionat.'))}
            >
              <span>✉️</span>
              <span className="hidden sm:inline">Missatge</span>
            </Link>
            <button
              type="button"
              onClick={deleteCustomer}
              disabled={actionLoading === 'delete'}
              className="ap-btn ap-btn--danger ap-btn--xs"
              title={hasProtectedData ? ADMIN_CUSTOMER_HELP.header.deleteProtected.title : ADMIN_CUSTOMER_HELP.header.deletePlain.title}
              {...helpAttrs(hasProtectedData ? ADMIN_CUSTOMER_HELP.header.deleteProtected : ADMIN_CUSTOMER_HELP.header.deletePlain)}
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">{actionLoading === 'delete' ? 'Eliminant...' : 'Eliminar'}</span>
            </button>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.kpis)}>
          <div className={`ap-kpi ${data.kpis.nextEventDate ? 'ap-kpi--warning' : ''}`} {...helpAttrs(ADMIN_CUSTOMER_HELP.header.kpi('Pròxim esdeveniment'))}>
            <span className="ap-kpi-label">Pròxim esdeveniment</span>
            <span className="ap-kpi-value">{formatDate(data.kpis.nextEventDate)}</span>
          </div>
          <div className="ap-kpi" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.kpi('Total pressupostat'))}>
            <span className="ap-kpi-label">Total pressupostat</span>
            <span className="ap-kpi-value">{money(data.kpis.totalQuoted)}</span>
          </div>
          <div className={`ap-kpi ${data.kpis.totalPaid && data.kpis.totalPaid > 0 ? 'ap-kpi--warning' : ''}`} {...helpAttrs(ADMIN_CUSTOMER_HELP.header.kpi('Total cobrat'))}>
            <span className="ap-kpi-label">Total cobrat</span>
            <span className="ap-kpi-value">{money(data.kpis.totalPaid)}</span>
          </div>
          <div className="ap-kpi" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.kpi('Marge estimat'))}>
            <span className="ap-kpi-label">Marge estimat</span>
            <span className="ap-kpi-value">{money(data.kpis.marginEstimated)}</span>
          </div>
          <div className="ap-kpi" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.kpi('Última comunicació'))}>
            <span className="ap-kpi-label">Última comunicació</span>
            <span className="ap-kpi-value">{formatDate(data.kpis.lastContactAt)}</span>
          </div>
        </div>

        {/* ── Owner strip + mobile quick actions ── */}
        <MobileQuickActions
          phone={data.customer.phone}
          email={data.customer.email}
          emailHref={customerComposeHref}
          whatsappMessage={data.customer.name ? `Hola ${data.customer.name}! Escric des d'Òrbita Events per seguir el teu expedient.` : null}
        />

        {/* ── Insights banner ── */}
        <InsightsBanner
          insights={data.insights}
          customerId={id}
          customerName={data.customer.name}
          customerPhone={data.customer.phone}
          commSummary={data.commSummary}
        />

        {/* ── Stage progress ── */}
        <div {...helpAttrs(ADMIN_CUSTOMER_HELP.header.stage)}>
          <div className="rounded-[var(--o-r-lg)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-1)] px-3 py-2.5" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.stageProgress)}>
            <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--t3)]">On està aquest client</p>
            <div className="flex items-center overflow-x-auto">
              {CUSTOMER_HUB_STAGE_ORDER.map((stage, idx) => {
                const isCurrent = stage === status;
                const isDone = status !== 'LOST' && idx < currentStageIndex;
                const isLost = stage === 'LOST' && status === 'LOST';
                let stageClass = `${STAGE_BASE} border-[var(--o-admin-line)] bg-transparent text-[var(--t3)]`;
                if (isCurrent) stageClass = `${STAGE_BASE} border-[var(--ax-info-strong)] bg-[var(--ax-info-bg)] text-[var(--o-info)] shadow-[0_0_0_3px_var(--ax-info-bg)]`;
                else if (isDone) stageClass = `${STAGE_BASE} border-[var(--ax-success-border)] bg-[var(--ax-success-bg)] text-[var(--o-success)]`;
                else if (isLost) stageClass = `${STAGE_BASE} border-[var(--ax-danger-border)] bg-[var(--ax-danger-bg)] text-[var(--o-danger)]`;
                return (
                  <div key={stage} className="contents">
                    {idx > 0 && (
                      <div className={`h-px w-7 shrink-0 ${isDone ? 'bg-[var(--ax-success-bg)]' : 'bg-[var(--o-admin-line)]'}`} />
                    )}
                    <span className={stageClass}>
                      {isDone && '✓ '}{CUSTOMER_HUB_STAGE_LABELS[stage]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Desktop tabs ── */}
        <div className="hidden flex-wrap gap-1 pb-1.5 md:flex" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.tabs)}>
          {TABS.map((item) => {
            const badge = item.badge?.(data);
            const isOn = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`ap-tab ${isOn ? 'ap-tab--active' : 'ap-tab--idle'}`}
                {...helpAttrs(ADMIN_CUSTOMER_HELP.header.tab(item.label))}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                {badge != null && badge > 0 && (
                  <span className="rounded-full bg-[var(--ax-warning-bg)] px-1.5 text-xs font-bold text-[var(--o-warning)]">{badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Mobile select ── */}
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value as TabKey)}
          className="adm-input mb-1.5 md:hidden"
          {...helpAttrs(ADMIN_CUSTOMER_HELP.header.mobileTabs)}
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
      <ConfirmDialog {...dialogProps} />
    </header>
  );
}

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
