'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import type { CustomerHubDTO, HubStatus } from '@/lib/customer-hub/dto';
import { CUSTOMER_HUB_AVATAR_TONES, CUSTOMER_HUB_STAGE_LABELS, CUSTOMER_HUB_STAGE_ORDER, CUSTOMER_HUB_STATUS_TONES, labelEstatClient } from '@/lib/customer-hub/labels';
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
import { OwnerControlStrip } from '@/app/admin/components/OwnerControlStrip';
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
  const statusStyle = CUSTOMER_HUB_STATUS_TONES[status] || CUSTOMER_HUB_STATUS_TONES.default;

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
  const openTasks = data.tasks.filter((task) => !task.done).length;
  const draftProposals = data.proposals.filter((proposal) => proposal.status === 'DRAFT').length;
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
  const ownerWatchItems = [
    data.insights.commercialRisk.level !== 'NONE'
      ? data.insights.commercialRisk.label
      : null,
    data.insights.relationalHealth === 'AT_RISK' || data.insights.relationalHealth === 'COLD' || data.insights.relationalHealth === 'LOST'
      ? `Salut relacional: ${data.insights.relationalHealth.toLowerCase()}`
      : null,
    data.kpis.nextEventDate
      ? `Pròxim esdeveniment: ${formatDate(data.kpis.nextEventDate)}`
      : null,
  ].filter(Boolean) as string[];
  const ownerManualItems = [
    draftProposals > 0
      ? `${draftProposals} pressupost${draftProposals > 1 ? 's' : ''} en esborrany`
      : null,
    openTasks > 0
      ? `${openTasks} tasca${openTasks > 1 ? 'ques' : ''} oberta${openTasks > 1 ? 'es' : ''}`
      : null,
    commercialPriority?.detail || null,
  ].filter(Boolean) as string[];
  const ownerNextStep = nextActionLink
    ? {
        label: nextActionLink.label,
        href: nextActionLink.href,
        external: nextActionLink.external,
        detail: data.insights.nextAction.context || commercialPriority?.detail || 'Acció assistida recomanada pel sistema',
      }
    : {
        label: 'Enviar missatge',
        href: customerComposeHref,
        external: false,
        detail: commercialPriority?.detail || 'No hi ha un bloqueig fort, però convé mantenir relació activa',
      };


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
    <header className="admin-customer-header sticky top-0 z-30 border-b border-white/10 backdrop-blur from-black/80 to-transparent" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.root)}>
      <div className="admin-customer-hero mx-auto max-w-7xl px-4 py-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className={`admin-customer-avatar hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white/90 shadow-lg ring-1 ring-white/10 ${CUSTOMER_HUB_AVATAR_TONES[status] || CUSTOMER_HUB_AVATAR_TONES.default}`}
            >
              {getInitials(data.customer.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href="/admin/clientes"
                  className="text-xs transition-colors"
                  {...helpAttrs(ADMIN_CUSTOMER_HELP.header.backToCustomers)}
                >
                  ← Clients
                </Link>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} hover:opacity-80`}
                    disabled={actionLoading !== null}
                    {...helpAttrs(ADMIN_CUSTOMER_HELP.header.statusToggle)}
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
                        {CUSTOMER_HUB_STAGE_ORDER.map((s) => {
                          const style = CUSTOMER_HUB_STATUS_TONES[s];
                          const isActive = s === status;
                          const help = ADMIN_CUSTOMER_HELP.header.statusOption(labelEstatClient(s));
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
                              {...helpAttrs(help)}
                            >
                              {labelEstatClient(s)}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <span className="text-[10px]" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.lastContact)}>
                  · Últim contacte: {lastContactText}
                </span>
              </div>

              <h1 className="mt-1 truncate text-xl font-semibold">
                {data.customer.customerNumber != null && (
                  <span className="mr-2 text-sm font-mono text-white/40">
                    CLI-{String(data.customer.customerNumber).padStart(4, '0')}
                  </span>
                )}
                {data.customer.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                {data.customer.email && (
                  <Link
                    href={customerComposeHref}
                    className="transition-colors"
                    title="Obrir redactor amb aquest client"
                  >
                    {data.customer.email}
                  </Link>
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
                    title={ADMIN_CUSTOMER_HELP.header.whatsapp.title}
                    {...helpAttrs(ADMIN_CUSTOMER_HELP.header.whatsapp)}
                  >
                    💬
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="admin-customer-actions flex flex-wrap gap-2" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.quickActions)}>
            <ActionButton
              href={customerProposalHref}
              label="Nou pressupost"
              color="cyan"
              icon="📄"
              help={ADMIN_CUSTOMER_HELP.header.action('Nou pressupost', 'Crea una proposta nova ja vinculada a aquest client.')}
            />
            <ActionButton
              href={customerBookingCreateHref}
              label="Nova reserva"
              color="indigo"
              icon="📅"
              help={ADMIN_CUSTOMER_HELP.header.action('Nova reserva', 'Crea una reserva nova vinculada a aquest client.')}
            />
            <ActionButton
              href={customerTaskCreateHref}
              label="Nova tasca"
              color="amber"
              icon="✅"
              help={ADMIN_CUSTOMER_HELP.header.action('Nova tasca', 'Afegeix una tasca operativa o comercial associada al client.')}
            />
            <ActionButton
              href={customerComposeHref}
              label="Missatge"
              color="slate"
              icon="✉️"
              help={ADMIN_CUSTOMER_HELP.header.action('Missatge', 'Obre el redactor de correu amb aquest client ja preseleccionat.')}
            />
            <button
              type="button"
              onClick={deleteCustomer}
              disabled={actionLoading === 'delete'}
              className="rounded-xl px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
              title={hasProtectedData ? ADMIN_CUSTOMER_HELP.header.deleteProtected.title : ADMIN_CUSTOMER_HELP.header.deletePlain.title}
              {...helpAttrs(hasProtectedData ? ADMIN_CUSTOMER_HELP.header.deleteProtected : ADMIN_CUSTOMER_HELP.header.deletePlain)}
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">{actionLoading === 'delete' ? 'Eliminant...' : 'Eliminar'}</span>
            </button>
          </div>
        </div>

        <div className="admin-customer-kpis grid gap-2 sm:grid-cols-2 lg:grid-cols-5" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.kpis)}>
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

        <OwnerControlStrip
          className="lg:grid-cols-[1.1fr_1.1fr_1.3fr]"
          system={{
            eyebrow: 'Automàtic',
            title: 'Què veu el sistema',
            tone: 'info',
            items: ownerWatchItems,
            emptyText: 'Sense alertes automàtiques destacades ara mateix.',
          }}
          manual={{
            eyebrow: 'Manual',
            title: 'On et cal intervenir',
            tone: ownerManualItems.length > 0 ? 'warning' : 'success',
            items: ownerManualItems,
            emptyText: 'No hi ha cap front manual calent a la capçalera.',
          }}
          nextStep={{
            title: ownerNextStep.label,
            detail: ownerNextStep.detail,
            href: ownerNextStep.href,
            external: ownerNextStep.external,
          }}
        />

        <MobileQuickActions
          phone={data.customer.phone}
          email={data.customer.email}
          emailHref={customerComposeHref}
          whatsappMessage={data.customer.name ? `Hola ${data.customer.name}! Escric des d'Òrbita Events per seguir el teu expedient.` : null}
        />

        {/* Insights banner — motor intel·ligent */}
        <InsightsBanner
          insights={data.insights}
          customerId={id}
          customerName={data.customer.name}
          customerPhone={data.customer.phone}
          commSummary={data.commSummary}
        />

        <div className="admin-customer-rail" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.stage)}>
          <div className="admin-customer-stage-card rounded-xl border p-3" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.stageProgress)}>
            <p className="text-[11px] font-semibold uppercase tracking-wider">On està aquest client</p>
            <div className="mt-2 flex items-center overflow-x-auto">
              {CUSTOMER_HUB_STAGE_ORDER.map((stage, idx) => {
                const isCurrent = stage === status;
                const isDone = status !== 'LOST' && idx < currentStageIndex;
                const isLost = stage === 'LOST' && status === 'LOST';
                return (
                  <div key={stage} className="flex items-center">
                    {idx > 0 && (
                      <div className={`h-px w-4 sm:w-8 shrink-0 ${isDone ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
                    )}
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${
                        isCurrent
                          ? 'admin-tone-soft-info border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                          : isDone
                            ? 'admin-tone-soft-success border border-emerald-500/40'
                            : isLost
                              ? 'admin-tone-soft-danger border border-rose-500/40'
                              : 'admin-tone-idle'
                      }`}
                    >
                      {isDone && '✓ '}{CUSTOMER_HUB_STAGE_LABELS[stage]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="admin-customer-tabs hidden md:flex flex-wrap gap-1" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.tabs)}>
          {TABS.map((item) => {
            const badge = item.badge?.(data);
            const help = ADMIN_CUSTOMER_HELP.header.tab(item.label);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5 ${
                  tab === item.key
                    ? 'bg-white text-black shadow-sm'
                    : 'admin-tone-idle'
                }`}
                {...helpAttrs(help)}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                {badge != null && badge > 0 && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      tab === item.key
                        ? 'admin-tone-soft-info admin-tone-text-info'
                        : 'admin-tone-soft-warning admin-tone-text-warning'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="md:hidden" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.mobileTabs)}>
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
      <ConfirmDialog {...dialogProps} />
    </header>
  );
}

function ActionButton({
  href,
  label,
  color,
  icon,
  help,
}: {
  href: string;
  label: string;
  color: 'cyan' | 'indigo' | 'amber' | 'slate';
  icon: string;
  help: { title: string; desc: string };
}) {
  const colorStyles = {
    cyan: 'admin-customer-action admin-customer-action--cyan ap-btn ap-btn--primary',
    indigo: 'admin-customer-action admin-customer-action--indigo ap-btn ap-btn--secondary',
    amber: 'admin-customer-action admin-customer-action--amber ap-badge ap-badge--warning',
    slate: 'admin-customer-action admin-customer-action--slate admin-tone-idle',
  };

  return (
    <Link
      href={href}
      className={`admin-customer-action-link rounded-xl px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${colorStyles[color]}`}
      {...helpAttrs(help)}
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
      className={`admin-customer-kpi rounded-xl border px-3 py-2 transition-colors ${
        highlight
          ? 'border-cyan-500/30 bg-cyan-500/5'
          : 'admin-tone-border-neutral admin-tone-bg-neutral'
      }`}
      {...helpAttrs(ADMIN_CUSTOMER_HELP.header.kpi(label))}
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
