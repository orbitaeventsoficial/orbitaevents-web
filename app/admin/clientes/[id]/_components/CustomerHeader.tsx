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
    <header className="ch__header" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.root)}>
      <div className="ch__hero">

        {/* ── Top row ── */}
        <div className="ch__toprow">
          <div className="ch__leftcol">
            <div className="ch__avatar" data-status={statusSlug}>
              {getInitials(data.customer.name)}
            </div>
            <div className="ch__namecol">
              <div className="ch__navrow">
                <Link href="/admin/clientes" className="ch__back" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.backToCustomers)}>
                  ← Clients
                </Link>

                <div className="ch__statuswrap">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="ch__status"
                    data-status={statusSlug}
                    disabled={actionLoading !== null}
                    {...helpAttrs(ADMIN_CUSTOMER_HELP.header.statusToggle)}
                  >
                    {actionLoading?.startsWith('status') ? '…' : statusLabel}
                    <span>▾</span>
                  </button>

                  {menuOpen && (
                    <>
                      <div className="ch__statusbackdrop" onClick={() => setMenuOpen(false)} />
                      <div className="ch__statusmenu">
                        {CUSTOMER_HUB_STAGE_ORDER.map((s) => {
                          const isActive = s === status;
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => changeStatus(s)}
                              disabled={isActive}
                              className="ch__statusopt"
                              data-status={s.toLowerCase()}
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

                <span className="ch__navmeta" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.lastContact)}>
                  · Últim contacte: {lastContactText}
                </span>
              </div>

              <h1 className="ch__h1">
                {data.customer.customerNumber != null && (
                  <span className="ch__h1-num">
                    CLI-{String(data.customer.customerNumber).padStart(4, '0')}
                  </span>
                )}
                {data.customer.name}
              </h1>

              <div className="ch__contact">
                {data.customer.email && (
                  <Link href={customerComposeHref} title="Obrir redactor amb aquest client">
                    {data.customer.email}
                  </Link>
                )}
                {data.customer.phone && (
                  <>
                    <span className="ch__contact-sep">·</span>
                    <a href={`tel:${data.customer.phone}`}>{data.customer.phone}</a>
                  </>
                )}
                {data.customer.phone && (
                  <a
                    href={`https://wa.me/${data.customer.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={ADMIN_CUSTOMER_HELP.header.whatsapp.title}
                    {...helpAttrs(ADMIN_CUSTOMER_HELP.header.whatsapp)}
                  >
                    💬
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="ch__acts" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.quickActions)}>
            <Link
              href={customerProposalHref}
              className="ch__btn ch__btn--prim"
              {...helpAttrs(ADMIN_CUSTOMER_HELP.header.action('Nou pressupost', 'Crea una proposta nova ja vinculada a aquest client.'))}
            >
              <span>📄</span>
              <span className="ch__btn-label">Nou pressupost</span>
            </Link>
            <Link
              href={customerBookingCreateHref}
              className="ch__btn ch__btn--sec"
              {...helpAttrs(ADMIN_CUSTOMER_HELP.header.action('Nova reserva', 'Crea una reserva nova vinculada a aquest client.'))}
            >
              <span>📅</span>
              <span className="ch__btn-label">Nova reserva</span>
            </Link>
            <Link
              href={customerTaskCreateHref}
              className="ch__btn ch__btn--warn"
              {...helpAttrs(ADMIN_CUSTOMER_HELP.header.action('Nova tasca', 'Afegeix una tasca operativa o comercial associada al client.'))}
            >
              <span>✅</span>
              <span className="ch__btn-label">Nova tasca</span>
            </Link>
            <Link
              href={customerComposeHref}
              className="ch__btn"
              {...helpAttrs(ADMIN_CUSTOMER_HELP.header.action('Missatge', 'Obre el redactor de correu amb aquest client ja preseleccionat.'))}
            >
              <span>✉️</span>
              <span className="ch__btn-label">Missatge</span>
            </Link>
            <button
              type="button"
              onClick={deleteCustomer}
              disabled={actionLoading === 'delete'}
              className="ch__btn ch__btn--danger"
              title={hasProtectedData ? ADMIN_CUSTOMER_HELP.header.deleteProtected.title : ADMIN_CUSTOMER_HELP.header.deletePlain.title}
              {...helpAttrs(hasProtectedData ? ADMIN_CUSTOMER_HELP.header.deleteProtected : ADMIN_CUSTOMER_HELP.header.deletePlain)}
            >
              <span>🗑️</span>
              <span className="ch__btn-label">{actionLoading === 'delete' ? 'Eliminant...' : 'Eliminar'}</span>
            </button>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="ch__kpis" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.kpis)}>
          <div className={`ch__kpi${data.kpis.nextEventDate ? ' ch__kpi--hi' : ''}`} {...helpAttrs(ADMIN_CUSTOMER_HELP.header.kpi('Pròxim esdeveniment'))}>
            <p className="ch__kpi-label">Pròxim esdeveniment</p>
            <p className="ch__kpi-val">{formatDate(data.kpis.nextEventDate)}</p>
          </div>
          <div className="ch__kpi" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.kpi('Total pressupostat'))}>
            <p className="ch__kpi-label">Total pressupostat</p>
            <p className="ch__kpi-val">{money(data.kpis.totalQuoted)}</p>
          </div>
          <div className={`ch__kpi${data.kpis.totalPaid && data.kpis.totalPaid > 0 ? ' ch__kpi--hi' : ''}`} {...helpAttrs(ADMIN_CUSTOMER_HELP.header.kpi('Total cobrat'))}>
            <p className="ch__kpi-label">Total cobrat</p>
            <p className="ch__kpi-val">{money(data.kpis.totalPaid)}</p>
          </div>
          <div className="ch__kpi" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.kpi('Marge estimat'))}>
            <p className="ch__kpi-label">Marge estimat</p>
            <p className="ch__kpi-val">{money(data.kpis.marginEstimated)}</p>
          </div>
          <div className="ch__kpi" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.kpi('Última comunicació'))}>
            <p className="ch__kpi-label">Última comunicació</p>
            <p className="ch__kpi-val">{formatDate(data.kpis.lastContactAt)}</p>
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
        <div className="ch__rail" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.stage)}>
          <div className="ch__stagebar" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.stageProgress)}>
            <p className="ch__stagebar-title">On està aquest client</p>
            <div className="ch__stagebar-row">
              {CUSTOMER_HUB_STAGE_ORDER.map((stage, idx) => {
                const isCurrent = stage === status;
                const isDone = status !== 'LOST' && idx < currentStageIndex;
                const isLost = stage === 'LOST' && status === 'LOST';
                let stageClass = 'ch__stage';
                if (isCurrent) stageClass += ' ch__stage--cur';
                else if (isDone) stageClass += ' ch__stage--done';
                else if (isLost) stageClass += ' ch__stage--lost';
                return (
                  <div key={stage} className="ch__stageitem">
                    {idx > 0 && (
                      <div className={`ch__stagepipe${isDone ? ' ch__stagepipe--done' : ''}`} />
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
        <div className="ch__tabs" {...helpAttrs(ADMIN_CUSTOMER_HELP.header.tabs)}>
          {TABS.map((item) => {
            const badge = item.badge?.(data);
            const isOn = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`ch__tab${isOn ? ' ch__tab--on' : ''}`}
                {...helpAttrs(ADMIN_CUSTOMER_HELP.header.tab(item.label))}
              >
                <span className="ch__tab-icon">{item.icon}</span>
                {item.label}
                {badge != null && badge > 0 && (
                  <span className="ch__tab-badge">{badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Mobile select ── */}
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value as TabKey)}
          className="ch__sel"
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
