'use client';

/**
 * MobileDashboard.tsx
 *
 * Dashboard optimizado para móvil
 * - Cards de métricas animadas
 * - Gráfico simplificado
 * - Lista de próximos eventos
 * - Quick actions
 * - Pull to refresh
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface Metric {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
  href?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: string;
  status: 'confirmed' | 'pending' | 'tentative';
}

// ═══════════════════════════════════════════════════════════════════════════
// DATOS DE EJEMPLO
// ═══════════════════════════════════════════════════════════════════════════

const metrics: Metric[] = [
  {
    id: 'leads',
    label: 'Leads nous',
    value: 12,
    change: 25,
    icon: '👥',
    color: 'from-blue-500/20 to-cyan-500/20',
    href: '/admin/leads',
  },
  {
    id: 'bookings',
    label: 'Reserves',
    value: 8,
    change: 12,
    icon: '📅',
    color: 'from-green-500/20 to-emerald-500/20',
    href: '/admin/bookings',
  },
  {
    id: 'revenue',
    label: 'Facturació',
    value: '4.5K€',
    change: 18,
    icon: '💰',
    color: 'from-amber-500/20 to-orange-500/20',
    href: '/admin/analytics',
  },
  {
    id: 'messages',
    label: 'Missatges',
    value: 5,
    change: -10,
    icon: '💬',
    color: 'from-purple-500/20 to-pink-500/20',
    href: '/admin/mensajes',
  },
];

const upcomingEvents: Event[] = [
  { id: '1', title: 'Casament Maria & Joan', date: '2025-01-15', type: 'bodas', status: 'confirmed' },
  { id: '2', title: 'Festa Halloween Corp.', date: '2025-01-18', type: 'tematicas', status: 'confirmed' },
  { id: '3', title: 'Aniversari 50 Pere', date: '2025-01-20', type: 'fiestas', status: 'pending' },
  { id: '4', title: 'Event Tech Barcelona', date: '2025-01-22', type: 'empresas', status: 'tentative' },
];

const quickActions = [
  { id: 'new-lead', label: 'Nou Lead', icon: '➕', href: '/admin/leads?new=true' },
  { id: 'calendar', label: 'Calendari', icon: '📆', href: '/admin/calendario' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬', href: 'https://wa.me/34699121023' },
  { id: 'call', label: 'Trucades', icon: '📞', href: 'tel:+34699121023' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════════════════

// Metric Card
function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  const isPositive = (metric.change || 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        href={metric.href || '#'}
        className={`block p-4 rounded-2xl bg-gradient-to-br ${metric.color} border border-slate-200 active:scale-98 transition-transform`}
      >
        <div className="flex items-start justify-between mb-3">
          <span className="text-2xl">{metric.icon}</span>
          {metric.change !== undefined && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isPositive ? '+' : ''}{metric.change}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-black mb-1">{metric.value}</p>
        <p className="text-slate-500 text-sm">{metric.label}</p>
      </Link>
    </motion.div>
  );
}

// Event Item
function EventItem({ event, index }: { event: Event; index: number }) {
  const statusColors = {
    confirmed: 'bg-green-500',
    pending: 'bg-amber-500',
    tentative: 'bg-blue-500',
  };

  const typeIcons: Record<string, string> = {
    bodas: '💒',
    fiestas: '🎉',
    tematicas: '🎭',
    empresas: '🏢',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Avui';
    if (diff === 1) return 'Demà';
    if (diff < 7) return `En ${diff} dies`;

    return date.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        href={`/admin/bookings/${event.id}`}
        className="flex items-center gap-4 p-4 bg-slate-100 rounded-xl active:bg-slate-200 transition-colors"
      >
        <span className="text-2xl">{typeIcons[event.type] || '📅'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-black font-medium truncate">{event.title}</p>
          <p className="text-slate-500 text-sm">{formatDate(event.date)}</p>
        </div>
        <div className={`w-2 h-2 rounded-full ${statusColors[event.status]}`} />
      </Link>
    </motion.div>
  );
}

// Mini Chart (simplified bar chart)
function MiniChart() {
  const data = [65, 45, 80, 55, 90, 70, 85];
  const days = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
  const maxValue = Math.max(...data);

  return (
    <div className="p-4 bg-slate-100 rounded-2xl">
      <h3 className="text-black font-semibold mb-4">Activitat setmanal</h3>
      <div className="flex items-end justify-between gap-2 h-24">
        {data.map((value, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <motion.div
              className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t-lg"
              initial={{ height: 0 }}
              animate={{ height: `${(value / maxValue) * 100}%` }}
              transition={{ delay: i * 0.1, type: 'spring' }}
            />
            <span className="text-[10px] text-slate-400">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bon dia');
    else if (hour < 18) setGreeting('Bona tarda');
    else setGreeting('Bona nit');
  }, []);

  // Simulated refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if ('vibrate' in navigator) navigator.vibrate(10);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  return (
    <div className="space-y-6 lg:hidden">
      {/* Header */}
      <div>
        <p className="text-slate-500 text-sm">{greeting}, Carles</p>
        <h1 className="text-2xl font-bold text-black">Dashboard</h1>
      </div>

      {/* Refresh indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-center"
          >
            <motion.div
              className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, i) => (
          <MetricCard key={metric.id} metric={metric} index={i} />
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-black font-semibold mb-3">Accions ràpides</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {quickActions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="flex flex-col items-center gap-2 px-6 py-4 bg-slate-100 rounded-2xl flex-shrink-0 active:bg-slate-200 transition-colors"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-slate-700 text-xs whitespace-nowrap">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mini Chart */}
      <MiniChart />

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-black font-semibold">Propers events</h2>
          <Link href="/admin/calendario" className="text-orange-400 text-sm">
            Veure tots
          </Link>
        </div>
        <div className="space-y-2">
          {upcomingEvents.slice(0, 4).map((event, i) => (
            <EventItem key={event.id} event={event} index={i} />
          ))}
        </div>
      </div>

      {/* Pull to refresh hint */}
      <button
        onClick={handleRefresh}
        className="w-full py-3 text-center text-slate-400 text-sm"
      >
        Toca per actualitzar
      </button>
    </div>
  );
}
