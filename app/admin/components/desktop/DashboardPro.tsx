'use client';
import { log } from '@/lib/logger';

/**
 * DashboardPro.tsx - Desktop Version
 *
 * Dashboard profesional para escritorio con:
 * - Métricas animadas conectadas a API
 * - Gráfico de actividad semanal interactivo
 * - Lista de leads recientes
 * - Próximos eventos
 * - Quick actions
 * - Auto-refresh
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface DashboardStats {
  leads: { total: number; new: number; change: number };
  bookings: { total: number; confirmed: number; change: number };
  revenue: { total: number; month: number; change: number };
  events: { upcoming: number; thisWeek: number };
}

interface Lead {
  id: string;
  name: string;
  email: string;
  service: string;
  status: string;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: string;
  status: string;
  client: string;
}

interface ActivityData {
  day: string;
  leads: number;
  bookings: number;
  revenue: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════════════════

// Metric Card
function MetricCard({
  title,
  value,
  subValue,
  change,
  icon,
  color,
  href,
  delay = 0,
}: {
  title: string;
  value: string | number;
  subValue?: string;
  change?: number;
  icon: string;
  color: 'orange' | 'green' | 'blue' | 'purple';
  href?: string;
  delay?: number;
}) {
  const colorClasses = {
    orange: 'from-orange-500/10 to-amber-500/10 border-orange-500/20',
    green: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
    blue: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
    purple: 'from-purple-500/10 to-pink-500/10 border-purple-500/20',
  };

  const iconBg = {
    orange: 'bg-orange-500/20 text-orange-400',
    green: 'bg-green-500/20 text-green-400',
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative p-6 rounded-2xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm cursor-pointer transition-shadow hover:shadow-lg hover:shadow-${color}-500/10`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${iconBg[color]} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
            change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <span>{change >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-sm text-white/50">{title}</p>
        {subValue && (
          <p className="text-xs text-white/30 mt-1">{subValue}</p>
        )}
      </div>

      {/* Decorative gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-50 blur-3xl -z-10`} />
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// Activity Chart
function ActivityChart({ data }: { data: ActivityData[] }) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const maxLeads = Math.max(...data.map(d => d.leads), 1);
  const maxBookings = Math.max(...data.map(d => d.bookings), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="p-6 rounded-2xl bg-white/5 border border-white/10"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Activitat setmanal</h3>
          <p className="text-sm text-white/50">Leads i reserves dels últims 7 dies</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-white/60">Leads</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-white/60">Reserves</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 h-48">
        {data.map((day, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-2"
            onMouseEnter={() => setHoveredDay(i)}
            onMouseLeave={() => setHoveredDay(null)}
          >
            {/* Tooltip */}
            <AnimatePresence>
              {hoveredDay === i && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute -mt-20 px-3 py-2 bg-zinc-800 rounded-lg text-xs shadow-xl z-10"
                >
                  <p className="text-white font-medium">{day.day}</p>
                  <p className="text-orange-400">{day.leads} leads</p>
                  <p className="text-green-400">{day.bookings} reserves</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bars */}
            <div className="w-full flex gap-1 items-end h-36">
              <motion.div
                className="flex-1 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg"
                initial={{ height: 0 }}
                animate={{ height: `${(day.leads / maxLeads) * 100}%` }}
                transition={{ delay: i * 0.05, duration: 0.5, type: 'spring' }}
              />
              <motion.div
                className="flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg"
                initial={{ height: 0 }}
                animate={{ height: `${(day.bookings / maxBookings) * 100}%` }}
                transition={{ delay: i * 0.05 + 0.1, duration: 0.5, type: 'spring' }}
              />
            </div>

            {/* Day label */}
            <span className="text-xs text-white/40">{day.day.slice(0, 2)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Recent Leads
function RecentLeads({ leads }: { leads: Lead[] }) {
  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    contacted: 'bg-amber-500/20 text-amber-400',
    qualified: 'bg-purple-500/20 text-purple-400',
    proposal: 'bg-cyan-500/20 text-cyan-400',
    won: 'bg-green-500/20 text-green-400',
    lost: 'bg-red-500/20 text-red-400',
  };

  const priorityIcons: Record<string, string> = {
    high: '🔥',
    medium: '⚡',
    low: '💤',
  };

  const serviceIcons: Record<string, string> = {
    bodas: '💒',
    fiestas: '🎉',
    tematicas: '🎭',
    empresas: '🏢',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="p-6 rounded-2xl bg-white/5 border border-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Leads recents</h3>
        <Link href="/admin/leads" className="text-sm text-orange-400 hover:text-orange-300">
          Veure tots →
        </Link>
      </div>

      <div className="space-y-3">
        {leads.map((lead, i) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          >
            <Link
              href={`/admin/leads/${lead.id}`}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                {serviceIcons[lead.service] || '📋'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium truncate">{lead.name}</p>
                  <span>{priorityIcons[lead.priority]}</span>
                </div>
                <p className="text-sm text-white/50 truncate">{lead.email}</p>
              </div>
              <div className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColors[lead.status]}`}>
                {lead.status}
              </div>
              <svg className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Upcoming Events
function UpcomingEvents({ events }: { events: Event[] }) {
  const typeColors: Record<string, string> = {
    bodas: 'border-l-pink-500',
    fiestas: 'border-l-purple-500',
    tematicas: 'border-l-orange-500',
    empresas: 'border-l-blue-500',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return { label: 'Avui', urgent: true };
    if (diff === 1) return { label: 'Demà', urgent: true };
    if (diff < 7) return { label: `En ${diff} dies`, urgent: false };
    return { label: date.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' }), urgent: false };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="p-6 rounded-2xl bg-white/5 border border-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Propers events</h3>
        <Link href="/admin/calendario" className="text-sm text-orange-400 hover:text-orange-300">
          Calendari →
        </Link>
      </div>

      <div className="space-y-3">
        {events.map((event, i) => {
          const dateInfo = formatDate(event.date);
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
            >
              <Link
                href={`/admin/bookings/${event.id}`}
                className={`block p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border-l-4 ${typeColors[event.type] || 'border-l-white/20'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-medium">{event.title}</p>
                    <p className="text-sm text-white/50">{event.client}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    dateInfo.urgent ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'
                  }`}>
                    {dateInfo.label}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Quick Actions
function QuickActions() {
  const actions = [
    { label: 'Nou Lead', icon: '➕', href: '/admin/leads?new=true', color: 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400' },
    { label: 'WhatsApp', icon: '💬', href: 'https://wa.me/34699121023', color: 'bg-green-500/20 hover:bg-green-500/30 text-green-400' },
    { label: 'Calendari', icon: '📅', href: '/admin/calendario', color: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' },
    { label: 'Analítiques', icon: '📊', href: '/admin/analytics', color: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex gap-3"
    >
      {actions.map((action, i) => (
        <Link
          key={i}
          href={action.href}
          className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl ${action.color} transition-colors`}
        >
          <span className="text-xl">{action.icon}</span>
          <span className="font-medium">{action.label}</span>
        </Link>
      ))}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function DashboardPro() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [dashboardRes, leadsRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/leads-new?limit=5'),
      ]);

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setStats(data.stats || {
          leads: { total: 45, new: 12, change: 25 },
          bookings: { total: 28, confirmed: 22, change: 12 },
          revenue: { total: 45000, month: 8500, change: 18 },
          events: { upcoming: 8, thisWeek: 3 },
        });
        setEvents(data.upcomingEvents || [
          { id: '1', title: 'Casament Maria & Joan', date: '2025-01-15', type: 'bodas', status: 'confirmed', client: 'Maria Garcia' },
          { id: '2', title: 'Festa Halloween Corp.', date: '2025-01-18', type: 'tematicas', status: 'confirmed', client: 'Tech Barcelona' },
          { id: '3', title: 'Aniversari 50', date: '2025-01-20', type: 'fiestas', status: 'pending', client: 'Pere Soler' },
        ]);
        setActivityData(data.weeklyActivity || [
          { day: 'Dilluns', leads: 5, bookings: 2, revenue: 1200 },
          { day: 'Dimarts', leads: 3, bookings: 1, revenue: 800 },
          { day: 'Dimecres', leads: 8, bookings: 3, revenue: 2100 },
          { day: 'Dijous', leads: 4, bookings: 2, revenue: 1500 },
          { day: 'Divendres', leads: 6, bookings: 4, revenue: 2800 },
          { day: 'Dissabte', leads: 2, bookings: 1, revenue: 600 },
          { day: 'Diumenge', leads: 1, bookings: 0, revenue: 0 },
        ]);
      }

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads || [
          { id: '1', name: 'Maria Garcia', email: 'maria@email.com', service: 'bodas', status: 'new', createdAt: '2025-01-10', priority: 'high' },
          { id: '2', name: 'Joan Martí', email: 'joan@email.com', service: 'fiestas', status: 'contacted', createdAt: '2025-01-09', priority: 'medium' },
          { id: '3', name: 'Anna López', email: 'anna@email.com', service: 'empresas', status: 'qualified', createdAt: '2025-01-08', priority: 'high' },
          { id: '4', name: 'Pere Soler', email: 'pere@email.com', service: 'tematicas', status: 'proposal', createdAt: '2025-01-07', priority: 'low' },
        ]);
      }

      setLastUpdated(new Date());
    } catch (error) {
      log.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          className="w-12 h-12 border-3 border-orange-500/30 border-t-orange-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/50 text-sm">
            Última actualització: {lastUpdated.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 transition-colors"
        >
          🔄 Actualitzar
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Leads nous"
          value={stats?.leads.new || 0}
          subValue={`${stats?.leads.total || 0} totals`}
          change={stats?.leads.change}
          icon="👥"
          color="orange"
          href="/admin/leads"
          delay={0}
        />
        <MetricCard
          title="Reserves"
          value={stats?.bookings.confirmed || 0}
          subValue={`${stats?.bookings.total || 0} totals`}
          change={stats?.bookings.change}
          icon="📅"
          color="green"
          href="/admin/bookings"
          delay={0.05}
        />
        <MetricCard
          title="Facturació"
          value={`${((stats?.revenue.month || 0) / 1000).toFixed(1)}K€`}
          subValue="Aquest mes"
          change={stats?.revenue.change}
          icon="💰"
          color="blue"
          href="/admin/analytics"
          delay={0.1}
        />
        <MetricCard
          title="Events"
          value={stats?.events.upcoming || 0}
          subValue={`${stats?.events.thisWeek || 0} aquesta setmana`}
          icon="🎉"
          color="purple"
          href="/admin/calendario"
          delay={0.15}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Charts and Lists */}
      <div className="grid grid-cols-2 gap-6">
        <ActivityChart data={activityData} />
        <RecentLeads leads={leads} />
      </div>

      {/* Upcoming Events */}
      <UpcomingEvents events={events} />
    </div>
  );
}
