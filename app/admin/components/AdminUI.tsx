'use client';

/**
 * ADMIN UI COMPONENTS
 * ===================
 * Components de UI consistents per a tot l'admin.
 * Disseny professional, accessible i fàcil d'usar.
 */

import { useState, type ReactNode, type MouseEventHandler } from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// STATUS BADGE - Estat visual consistent
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_STYLES = {
  // Lead status
  NEW: { bg: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/30', icon: '🆕' },
  CONTACTED: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30', icon: '📞' },
  QUOTE_SENT: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30', icon: '📄' },
  NEGOTIATING: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30', icon: '🤝' },
  WON: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', icon: '✅' },
  LOST: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', icon: '❌' },
  
  // Booking status
  PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30', icon: '⏳' },
  CONFIRMED: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', icon: '✅' },
  COMPLETED: { bg: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/30', icon: '🎉' },
  CANCELLED: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', icon: '🚫' },
  
  // Priority
  LOW: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30', icon: '🔽' },
  MEDIUM: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30', icon: '➡️' },
  HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30', icon: '🔼' },
  URGENT: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30', icon: '🚨' },

  // Task status
  OPEN: { bg: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/30', icon: '📋' },
  IN_PROGRESS: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', icon: '🔄' },
  DONE: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', icon: '✅' },

  // Generic
  ACTIVE: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', icon: '🟢' },
  INACTIVE: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', icon: '⚪' },
  DRAFT: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', icon: '📝' },
} as const;

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nou',
  CONTACTED: 'Contactat',
  QUOTE_SENT: 'Pressupost enviat',
  NEGOTIATING: 'Negociació',
  WON: 'Guanyat',
  LOST: 'Perdut',
  PENDING: 'Pendent',
  CONFIRMED: 'Confirmat',
  COMPLETED: 'Completat',
  CANCELLED: 'Cancel·lat',
  LOW: 'Baixa',
  MEDIUM: 'Mitjana',
  HIGH: 'Alta',
  URGENT: 'Urgent',
  OPEN: 'Oberta',
  IN_PROGRESS: 'En progrés',
  DONE: 'Feta',
  ACTIVE: 'Actiu',
  INACTIVE: 'Inactiu',
  DRAFT: 'Esborrany',
};

type StatusBadgeProps = {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  customLabel?: string;
};

export function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true, 
  showLabel = true,
  customLabel 
}: StatusBadgeProps) {
  const style = STATUS_STYLES[status as keyof typeof STATUS_STYLES] || STATUS_STYLES.INACTIVE;
  const label = customLabel || STATUS_LABELS[status] || status;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]}`}>
      {showIcon && <span className="text-[0.9em]">{style.icon}</span>}
      {showLabel && <span>{label}</span>}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS - Accions ràpides
// ═══════════════════════════════════════════════════════════════════════════

type QuickAction = {
  icon: string;
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
};

const VARIANT_STYLES = {
  default: 'border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-700',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20',
  danger: 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
};

export function QuickActions({ actions, layout = 'row' }: { actions: QuickAction[]; layout?: 'row' | 'grid' }) {
  const layoutClass = layout === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2';

  return (
    <div className={layoutClass}>
      {actions.map((action, i) => {
        const variant = VARIANT_STYLES[action.variant || 'default'];
        const className = `
          flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all
          ${variant}
          ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `;

        if (action.href && !action.disabled) {
          return (
            <Link key={i} href={action.href} className={className}>
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </Link>
          );
        }

        return (
          <button
            key={i}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={className}
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA CARD - Card per mostrar dades
// ═══════════════════════════════════════════════════════════════════════════

type DataCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  icon?: string;
  color?: 'default' | 'blue' | 'green' | 'amber' | 'red';
  href?: string;
  onClick?: () => void;
};

const CARD_COLORS = {
  default: 'border-slate-700/50 bg-slate-800/60',
  blue: 'border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-sky-600/5',
  green: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5',
  amber: 'border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5',
  red: 'border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-rose-600/5',
};

const CARD_TEXT_COLORS = {
  default: 'text-slate-400',
  blue: 'text-sky-400',
  green: 'text-emerald-400',
  amber: 'text-amber-400',
  red: 'text-rose-400',
};

export function DataCard({ title, value, subtitle, trend, icon, color = 'default', href, onClick }: DataCardProps) {
  const cardColor = CARD_COLORS[color];
  const textColor = CARD_TEXT_COLORS[color];

  const content = (
    <div className={`rounded-2xl border backdrop-blur-sm p-4 transition-all ${cardColor} ${(href || onClick) ? 'cursor-pointer hover:scale-[1.02]' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-[10px] sm:text-xs font-medium uppercase ${textColor}`}>{title}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-slate-100">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>

      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span className={trend.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-slate-500">{trend.label}</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick) {
    return <button type="button" onClick={onClick} className="w-full text-left">{content}</button>;
  }

  return content;
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY STATE - Estat buit
// ═══════════════════════════════════════════════════════════════════════════

type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void } | { label: string; href: string };
};

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/30 p-8 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-400 max-w-sm">{description}</p>}
      
      {action && (
        'href' in action ? (
          <Link
            href={action.href}
            className="mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-white"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-white"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRMATION MODAL - Modal de confirmació
// ═══════════════════════════════════════════════════════════════════════════

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancel·lar',
  variant = 'default',
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const confirmButtonClass = variant === 'danger'
    ? 'bg-rose-500 hover:bg-rose-600 text-white'
    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-400">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${confirmButtonClass} disabled:opacity-50`}
          >
            {loading ? 'Carregant...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATION - Notificació temporal
// ═══════════════════════════════════════════════════════════════════════════

type ToastType = 'success' | 'error' | 'warning' | 'info';

const TOAST_STYLES: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: 'bg-emerald-500/20 border-emerald-500/30', icon: '✅' },
  error: { bg: 'bg-rose-500/20 border-rose-500/30', icon: '❌' },
  warning: { bg: 'bg-amber-500/20 border-amber-500/30', icon: '⚠️' },
  info: { bg: 'bg-sky-500/20 border-sky-500/30', icon: 'ℹ️' },
};

type ToastProps = {
  type: ToastType;
  message: string;
  onClose?: () => void;
};

export function Toast({ type, message, onClose }: ToastProps) {
  const style = TOAST_STYLES[type];

  return (
    <div className={`fixed bottom-4 right-4 z-[101] flex items-center gap-3 rounded-xl border ${style.bg} px-4 py-3 shadow-2xl backdrop-blur-sm`}>
      <span className="text-lg">{style.icon}</span>
      <p className="text-sm text-slate-200">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-slate-200"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUT HINT
// ═══════════════════════════════════════════════════════════════════════════

export function KeyboardHint({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd key={i} className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            {key}
          </kbd>
        ))}
      </div>
      <span>{description}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════════════

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-slate-700/50 ${className}`} />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 border-b border-slate-700/50 bg-slate-800/60 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 border-b border-slate-700/30 px-4 py-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
