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
  /** Fila de KPIs sota la capçalera */
  kpis?: ReactNode;
  /** Navegació per tabs sota la capçalera */
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




