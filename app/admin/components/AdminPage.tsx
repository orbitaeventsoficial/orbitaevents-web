/**
 * AdminPage — Layout unificat per a totes les pàgines d'admin
 * ============================================================
 *
 * Usage:
 *
 * // Pàgina bàsica
 * <AdminPage title="Tasques" subtitle="34 tasques obertes">
 *   <AdminSection>...</AdminSection>
 * </AdminPage>
 *
 * // Amb accions i back link
 * <AdminPage
 *   title="Inventari"
 *   subtitle="Material tècnic"
 *   back={{ href: '/admin/catalog', label: 'Catàleg' }}
 *   actions={<Link href="/admin/inventory/new" className="ap-btn-primary">+ Nou element</Link>}
 * >
 *   ...
 * </AdminPage>
 *
 * // Amb KPIs
 * <AdminPage title="Economia" kpis={<AdminKpiRow>...</AdminKpiRow>}>
 *   ...
 * </AdminPage>
 *
 * // Amb tabs
 * <AdminPage title="Catàleg" tabs={<AdminTabs tabs={tabs} activeTab={tab} baseHref="/admin/catalog" />}>
 *   ...
 * </AdminPage>
 */

import type { ReactNode } from 'react';
import Link from 'next/link';

// ─── AdminPage ────────────────────────────────────────────────────────────────

interface AdminPageProps {
  /** Títol principal de la pàgina (H1) */
  title: string;
  /** Subtítol/descripció opcional */
  subtitle?: ReactNode;
  /** Link de retorn. Apareix com a "← Label" sobre el títol */
  back?: { href: string; label: string };
  /** Botons o controls a la dreta de la capçalera */
  actions?: ReactNode;
  /** Fila de KPIs sota la capçalera (usa <AdminKpiRow>) */
  kpis?: ReactNode;
  /** Navegació per tabs sota la capçalera (usa <AdminTabs>) */
  tabs?: ReactNode;
  /** Missatge alert/info sota la capçalera */
  alert?: ReactNode;
  /** Contingut principal */
  children: ReactNode;
  /** Classe extra al contenidor principal (per overrides puntuals) */
  className?: string;
}

export function AdminPage({
  title,
  subtitle,
  back,
  actions,
  kpis,
  tabs,
  alert,
  children,
  className = '',
}: AdminPageProps) {
  return (
    <div className={`ap-page ${className}`}>
      {/* CAPÇALERA */}
      <header className="ap-header">
        <div className="ap-header-left">
          {back && (
            <Link href={back.href} className="ap-back">
              ← {back.label}
            </Link>
          )}
          <h1 className="ap-title">{title}</h1>
          {subtitle && <p className="ap-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="ap-header-actions">{actions}</div>}
      </header>

      {/* KPIs (fila opcional) */}
      {kpis && <div className="ap-kpis">{kpis}</div>}

      {/* ALERT (banner informatiu o d'error) */}
      {alert && <div className="ap-alert">{alert}</div>}

      {/* TABS (nav opcional) */}
      {tabs && <nav className="ap-tabs-nav">{tabs}</nav>}

      {/* CONTINGUT */}
      <div className="ap-content">{children}</div>
    </div>
  );
}

// ─── AdminSection ─────────────────────────────────────────────────────────────

interface AdminSectionProps {
  /** Títol de la secció (H2) */
  title?: ReactNode;
  /** Subtítol/descripció de la secció */
  description?: ReactNode;
  /** Accions a la dreta del títol */
  actions?: ReactNode;
  children: ReactNode;
  /** padding reduït */
  compact?: boolean;
  /** sense padding */
  flush?: boolean;
  className?: string;
}

export function AdminSection({
  title,
  description,
  actions,
  children,
  compact = false,
  flush = false,
  className = '',
}: AdminSectionProps) {
  const padClass = flush ? 'ap-section--flush' : compact ? 'ap-section--compact' : '';
  return (
    <section className={`ap-section ${padClass} ${className}`}>
      {(title || actions) && (
        <div className="ap-section-head">
          <div>
            {title && <h2 className="ap-section-title">{title}</h2>}
            {description && <p className="ap-section-desc">{description}</p>}
          </div>
          {actions && <div className="ap-section-actions">{actions}</div>}
        </div>
      )}
      <div className="ap-section-body">{children}</div>
    </section>
  );
}

// ─── AdminKpiRow + AdminKpi ────────────────────────────────────────────────────

export function AdminKpiRow({ children }: { children: ReactNode }) {
  return <div className="ap-kpi-row">{children}</div>;
}

interface AdminKpiProps {
  label: string;
  value: ReactNode;
  /** 'neutral' | 'success' | 'warning' | 'danger' | 'info' */
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  /** Variació vs. període anterior (+ o -) */
  trend?: ReactNode;
  href?: string;
}

export function AdminKpi({ label, value, tone = 'neutral', trend, href }: AdminKpiProps) {
  const content = (
    <div className={`ap-kpi ap-kpi--${tone}`}>
      <span className="ap-kpi-label">{label}</span>
      <span className="ap-kpi-value">{value}</span>
      {trend && <span className="ap-kpi-trend">{trend}</span>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

// ─── AdminGrid ────────────────────────────────────────────────────────────────

interface AdminGridProps {
  children: ReactNode;
  /** '2' | '3' | '4' — columnes a desktop */
  cols?: '2' | '3' | '4';
  className?: string;
}

export function AdminGrid({ children, cols = '3', className = '' }: AdminGridProps) {
  return <div className={`ap-grid ap-grid--${cols} ${className}`}>{children}</div>;
}

// ─── AdminCard ────────────────────────────────────────────────────────────────

interface AdminCardProps {
  children: ReactNode;
  /** Títol de la card */
  title?: ReactNode;
  /** Accions a la dreta del títol */
  actions?: ReactNode;
  /** 'neutral' | 'success' | 'warning' | 'danger' | 'info' */
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  compact?: boolean;
  className?: string;
}

export function AdminCard({ children, title, actions, tone = 'neutral', compact = false, className = '' }: AdminCardProps) {
  return (
    <div className={`ap-card ap-card--${tone} ${compact ? 'ap-card--compact' : ''} ${className}`}>
      {(title || actions) && (
        <div className="ap-card-head">
          {title && <h3 className="ap-card-title">{title}</h3>}
          {actions && <div className="ap-card-actions">{actions}</div>}
        </div>
      )}
      <div className="ap-card-body">{children}</div>
    </div>
  );
}

// ─── AdminTabs ────────────────────────────────────────────────────────────────

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface AdminTabsProps {
  tabs: TabItem[];
  activeTab: string;
  /** URL base: activeTab s'afegeix com a query param */
  baseHref: string;
  /** Query param name (default: 'tab') */
  paramName?: string;
}

export function AdminTabs({ tabs, activeTab, baseHref, paramName = 'tab' }: AdminTabsProps) {
  return (
    <>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <Link
            key={tab.id}
            href={`${baseHref}?${paramName}=${tab.id}`}
            className={`ap-tab ${isActive ? 'ap-tab--active' : 'ap-tab--idle'}`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ap-tab-count">{tab.count}</span>
            )}
          </Link>
        );
      })}
    </>
  );
}

// ─── AdminStatusBadge (substitueix la versió amb Tailwind hardcoded) ──────────

const STATUS_MAP: Record<string, { tone: string; label: string; icon: string }> = {
  // Lead
  NEW:          { tone: 'info',    label: 'Nou',                  icon: '🆕' },
  CONTACTED:    { tone: 'warning', label: 'Contactat',            icon: '📞' },
  QUOTE_SENT:   { tone: 'info',    label: 'Pressupost enviat',    icon: '📄' },
  NEGOTIATING:  { tone: 'warning', label: 'Negociació',           icon: '🤝' },
  WON:          { tone: 'success', label: 'Guanyat',              icon: '✅' },
  LOST:         { tone: 'neutral', label: 'Perdut',               icon: '❌' },
  // Booking
  PENDING:      { tone: 'warning', label: 'Pendent',              icon: '⏳' },
  CONFIRMED:    { tone: 'success', label: 'Confirmat',            icon: '✅' },
  COMPLETED:    { tone: 'info',    label: 'Completat',            icon: '🎉' },
  CANCELLED:    { tone: 'neutral', label: 'Cancel·lat',           icon: '🚫' },
  // Task
  OPEN:         { tone: 'info',    label: 'Oberta',               icon: '📋' },
  IN_PROGRESS:  { tone: 'warning', label: 'En curs',              icon: '🔄' },
  DONE:         { tone: 'success', label: 'Feta',                 icon: '✅' },
  // Priority
  LOW:          { tone: 'neutral', label: 'Baixa',                icon: '🔽' },
  MEDIUM:       { tone: 'info',    label: 'Mitjana',              icon: '➡️' },
  HIGH:         { tone: 'warning', label: 'Alta',                 icon: '🔼' },
  URGENT:       { tone: 'danger',  label: 'Urgent',               icon: '🚨' },
  // Generic
  ACTIVE:       { tone: 'success', label: 'Actiu',                icon: '🟢' },
  INACTIVE:     { tone: 'neutral', label: 'Inactiu',              icon: '⚪' },
  DRAFT:        { tone: 'neutral', label: 'Esborrany',            icon: '📝' },
  AVAILABLE:    { tone: 'success', label: 'Disponible',           icon: '✓'  },
  IN_USE:       { tone: 'info',    label: 'En ús',                icon: '▶'  },
  MAINTENANCE:  { tone: 'warning', label: 'Manteniment',          icon: '🔧' },
  BROKEN:       { tone: 'danger',  label: 'Avariat',              icon: '⚠'  },
  RETIRED:      { tone: 'neutral', label: 'Retirat',              icon: '📦' },
};

interface AdminStatusBadgeProps {
  status: string;
  customLabel?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export function AdminStatusBadge({ status, customLabel, showIcon = true, size = 'sm' }: AdminStatusBadgeProps) {
  const def = STATUS_MAP[status] ?? { tone: 'neutral', label: status, icon: '•' };
  return (
    <span className={`ap-badge ap-badge--${def.tone} ${size === 'md' ? 'ap-badge--md' : ''}`}>
      {showIcon && <span aria-hidden="true">{def.icon}</span>}
      {customLabel ?? def.label}
    </span>
  );
}

// ─── AdminAlert ───────────────────────────────────────────────────────────────

interface AdminAlertProps {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  children: ReactNode;
}

export function AdminAlert({ tone = 'info', children }: AdminAlertProps) {
  return <div className={`ap-inline-alert ap-inline-alert--${tone}`}>{children}</div>;
}

// ─── AdminTable ───────────────────────────────────────────────────────────────

interface AdminTableProps {
  headers: string[];
  children: ReactNode;
  empty?: string;
  'aria-label'?: string;
}

export function AdminTable({ headers, children, empty = 'Cap resultat', 'aria-label': ariaLabel }: AdminTableProps) {
  return (
    <div className="ap-table-wrap">
      <table className="ap-table" aria-label={ariaLabel}>
        <thead className="ap-table-head">
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col" className="ap-table-th">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="ap-table-body">
          {children}
        </tbody>
      </table>
    </div>
  );
}

// ─── AdminEmptyState ──────────────────────────────────────────────────────────

interface AdminEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function AdminEmptyState({ icon = '📭', title, description, action }: AdminEmptyStateProps) {
  return (
    <div className="ap-empty">
      <span className="ap-empty-icon">{icon}</span>
      <p className="ap-empty-title">{title}</p>
      {description && <p className="ap-empty-desc">{description}</p>}
      {action && <div className="ap-empty-action">{action}</div>}
    </div>
  );
}

// ─── Btn components (per no dependre de Tailwind hardcoded) ───────────────────

export function BtnPrimary({ children, href, onClick, disabled, type = 'button' }: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  if (href) return <Link href={href} className="ap-btn ap-btn--primary">{children}</Link>;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="ap-btn ap-btn--primary">
      {children}
    </button>
  );
}

export function BtnSecondary({ children, href, onClick, disabled }: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  if (href) return <Link href={href} className="ap-btn ap-btn--secondary">{children}</Link>;
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="ap-btn ap-btn--secondary">
      {children}
    </button>
  );
}

export function BtnDanger({ children, onClick, disabled }: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="ap-btn ap-btn--danger">
      {children}
    </button>
  );
}
