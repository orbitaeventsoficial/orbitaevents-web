'use client';

import Image from 'next/image';

/**
 * 🎨 COMPONENTS UI ADMIN - Base Components
 */

// ═══════════════════════════════════════════════════════════════════════════
// METRIC CARD
// ═══════════════════════════════════════════════════════════════════════════

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  change?: string;
  changeType?: 'up' | 'down';
  className?: string;
}

export function MetricCard({ icon, label, value, change, changeType, className = '' }: MetricCardProps) {
  return (
    <div className={`
      relative overflow-hidden
      bg-[#141414] rounded-2xl border border-slate-200
      p-6 group hover:border-slate-200 
      transition-all duration-300 hover:shadow-xl hover:shadow-black/20
      ${className}
    `}>
      {/* Gradient de fons subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative">
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          <span className="text-lg">{icon}</span>
          <span>{label}</span>
        </div>
        <div className="mt-2 text-3xl font-bold text-black">{value}</div>
        {change && (
          <div className={`
            mt-2 flex items-center gap-1 text-sm
            ${changeType === 'up' ? 'text-green-400' : 'text-red-400'}
          `}>
            <span>{changeType === 'up' ? '↑' : '↓'}</span>
            <span>{change}</span>
            <span className="text-neutral-500">vs mes anterior</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON
// ═══════════════════════════════════════════════════════════════════════════

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  icon, 
  label, 
  onClick, 
  disabled,
  loading,
  className = ''
}: ButtonProps) {
  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-black border border-slate-200',
    ghost: 'hover:bg-slate-100 text-neutral-400 hover:text-black',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-xl
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading ? (
        <span className="animate-spin">⏳</span>
      ) : icon && (
        <span>{icon}</span>
      )}
      <span>{label}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════════════════════

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  icon?: string;
  error?: string;
  value?: string;
  onChange?: (_e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function Input({ 
  label, 
  type = 'text', 
  placeholder,
  icon, 
  error,
  value,
  onChange,
  className = ''
}: InputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-neutral-400 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
            {icon}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`
            w-full px-4 py-3 
            ${icon ? 'pl-11' : ''}
            bg-[#1a1a1a] border rounded-xl
            text-black placeholder-neutral-600
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-orange-500/50
            ${error 
              ? 'border-red-500/50 focus:border-red-500' 
              : 'border-slate-200 hover:border-slate-300 focus:border-orange-500'
            }
          `}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SELECT
// ═══════════════════════════════════════════════════════════════════════════

interface SelectProps {
  label?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (_e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}

export function Select({ label, options, value, onChange, className = '' }: SelectProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-neutral-400 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="
            w-full px-4 py-3 pr-10
            bg-[#1a1a1a] border border-slate-200 rounded-xl
            text-black appearance-none
            transition-all duration-200
            hover:border-slate-300 focus:border-orange-500
            focus:outline-none focus:ring-2 focus:ring-orange-500/50
          "
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
          ▼
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BADGE
// ═══════════════════════════════════════════════════════════════════════════

interface BadgeProps {
  label: string;
  color?: 'orange' | 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  size?: 'sm' | 'md';
  icon?: string;
}

export function Badge({ label, color = 'gray', size = 'md', icon }: BadgeProps) {
  const colors = {
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    gray: 'bg-slate-100 text-neutral-400 border-slate-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={`
      inline-flex items-center gap-1.5 font-medium rounded-full border
      ${colors[color]} ${sizes[size]}
    `}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════

type LeadStatus = 'new' | 'contacted' | 'quote_sent' | 'negotiating' | 'won' | 'lost';

interface StatusBadgeProps {
  status: LeadStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<LeadStatus, { icon: string; label: string; color: string }> = {
    new: { icon: '🔵', label: 'Nou', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    contacted: { icon: '🟡', label: 'Contactat', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    quote_sent: { icon: '🟣', label: 'Pressupost enviat', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    negotiating: { icon: '🟠', label: 'Negociant', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    won: { icon: '🟢', label: 'Guanyat', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    lost: { icon: '🔴', label: 'Perdut', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  };

  const { icon, label, color } = config[status];

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
      ${color}
    `}>
      <span>{icon}</span>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD
// ═══════════════════════════════════════════════════════════════════════════

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, title, subtitle, action, className = '', noPadding = false }: CardProps) {
  return (
    <div className={`
      bg-[#141414] rounded-2xl border border-slate-200
      ${className}
    `}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-black">{title}</h3>}
            {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AVATAR
// ═══════════════════════════════════════════════════════════════════════════

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizes = {
    sm: { className: 'w-8 h-8 text-xs', dimension: 32 },
    md: { className: 'w-10 h-10 text-sm', dimension: 40 },
    lg: { className: 'w-12 h-12 text-base', dimension: 48 },
  };

  const sizeConfig = sizes[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={sizeConfig.dimension}
        height={sizeConfig.dimension}
        className={`${sizeConfig.className} rounded-full object-cover`}
      />
    );
  }

  return (
    <div className={`
      ${sizeConfig.className} rounded-full 
      bg-gradient-to-br from-orange-500/20 to-orange-600/20 
      flex items-center justify-center 
      text-orange-400 font-medium
    `}>
      {initials}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH INPUT
// ═══════════════════════════════════════════════════════════════════════════

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (_value: string) => void;
  className?: string;
}

export function SearchInput({ placeholder = 'Buscar...', value, onChange, className = '' }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
        🔍
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="
          w-full pl-10 pr-4 py-2
          bg-slate-100 border border-slate-200 rounded-xl
          text-black placeholder-neutral-500 text-sm
          transition-all duration-200
          hover:border-slate-300 focus:border-orange-500
          focus:outline-none focus:ring-2 focus:ring-orange-500/50
        "
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>
      <p className="text-neutral-500 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════════

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
}

export function Toast({ type, message, onClose }: ToastProps) {
  const styles: Record<ToastType, string> = {
    success: 'border-green-500/50 bg-green-500/10',
    error: 'border-red-500/50 bg-red-500/10',
    warning: 'border-yellow-500/50 bg-yellow-500/10',
    info: 'border-blue-500/50 bg-blue-500/10',
  };
  
  const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={`
      fixed bottom-4 right-4 z-50
      flex items-center gap-3 px-4 py-3
      rounded-xl border backdrop-blur-xl
      animate-slide-up shadow-xl
      ${styles[type]}
    `}>
      <span className="text-lg">{icons[type]}</span>
      <p className="text-black">{message}</p>
      <button onClick={onClose} className="ml-2 text-neutral-400 hover:text-black transition-colors">
        ✕
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL / SLIDE OVER
// ═══════════════════════════════════════════════════════════════════════════

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function SlideOver({ isOpen, onClose, title, children }: SlideOverProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`
          fixed inset-0 bg-slate-200/70 backdrop-blur-sm z-40
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`
        fixed right-0 top-0 bottom-0 w-full max-w-lg
        bg-[#141414] border-l border-slate-200
        z-50 transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-black">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-neutral-400 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Contingut */}
        <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
          {children}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════════════════

interface Tab {
  id: string;
  label: string;
  icon?: string;
  badge?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (_tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
            transition-all duration-200
            ${activeTab === tab.id 
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
              : 'text-neutral-400 hover:text-black hover:bg-slate-100'
            }
          `}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
          {tab.badge && (
            <span className={`
              px-1.5 py-0.5 rounded-full text-xs
              ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-200'}
            `}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
