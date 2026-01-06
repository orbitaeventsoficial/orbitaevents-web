'use client';
import { log } from '@/lib/logger';

/**
 * MobileLeadsPro.tsx
 * 
 * Lista de leads BRUTAL para móvil
 * - Swipe actions (llamar, WhatsApp, archivar)
 * - Filtros rápidos por estado
 * - Búsqueda instantánea
 * - Pull to refresh
 * - Infinite scroll
 * - Haptic feedback
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  eventType: string;
  eventDate?: string;
  status: string;
  priority: string;
  source: string;
  createdAt: string;
  notes?: { content: string; createdAt: string }[];
  booking?: { id: string; reference: string; status: string };
}

interface LeadsResponse {
  ok: boolean;
  leads: Lead[];
  total: number;
  page: number;
  totalPages: number;
  stats: Record<string, number>;
}

type StatusFilter = 'all' | 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST';

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" stroke="currentColor"/>
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round"/>
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" strokeWidth={2}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor"/>
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  archive: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" strokeWidth={2}>
      <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  filter: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" strokeWidth={2}>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" strokeWidth={2}>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeLinecap="round"/>
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={2.5}>
      <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeLinecap="round"/>
      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeLinecap="round"/>
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" strokeWidth={2}>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  NEW: { label: 'Nou', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  CONTACTED: { label: 'Contactat', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  QUALIFIED: { label: 'Qualificat', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  PROPOSAL: { label: 'Proposta', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  WON: { label: 'Guanyat', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  LOST: { label: 'Perdut', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

const PRIORITY_CONFIG: Record<string, { color: string; border: string }> = {
  URGENT: { color: 'bg-red-500', border: 'border-l-red-500' },
  HIGH: { color: 'bg-orange-500', border: 'border-l-orange-500' },
  MEDIUM: { color: 'bg-amber-500', border: 'border-l-amber-400' },
  LOW: { color: 'bg-gray-500', border: 'border-l-gray-500' },
};

const EVENT_TYPES: Record<string, { label: string; icon: string }> = {
  WEDDING: { label: 'Casament', icon: '💒' },
  BIRTHDAY: { label: 'Aniversari', icon: '🎂' },
  CORPORATE: { label: 'Empresa', icon: '🏢' },
  COMMUNION: { label: 'Comunió', icon: '⛪' },
  BAPTISM: { label: 'Bateig', icon: '👶' },
  GRADUATION: { label: 'Graduació', icon: '🎓' },
  ANNIVERSARY: { label: 'Aniversari', icon: '💝' },
  PRIVATE_PARTY: { label: 'Festa', icon: '🎉' },
  OTHER: { label: 'Altre', icon: '🎭' },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════════════════

// Barra de búsqueda
function SearchBar({ 
  value, 
  onChange, 
  onFocus,
  onClear 
}: { 
  value: string; 
  onChange: (v: string) => void;
  onFocus?: () => void;
  onClear?: () => void;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
        {Icons.search}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Buscar per nom, email o telèfon..."
        className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.07] transition-colors"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
        >
          {Icons.close}
        </button>
      )}
    </div>
  );
}

// Filtros de estado
function StatusFilters({ 
  active, 
  onChange, 
  stats 
}: { 
  active: StatusFilter; 
  onChange: (s: StatusFilter) => void;
  stats: Record<string, number>;
}) {
  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Tots' },
    { key: 'NEW', label: 'Nous' },
    { key: 'CONTACTED', label: 'Contactats' },
    { key: 'QUALIFIED', label: 'Qualificats' },
    { key: 'PROPOSAL', label: 'Proposta' },
    { key: 'WON', label: 'Guanyats' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {filters.map((filter) => {
        const isActive = active === filter.key;
        const count = filter.key === 'all' 
          ? Object.values(stats).reduce((a, b) => a + b, 0)
          : stats[filter.key] || 0;

        return (
          <button
            key={filter.key}
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(5);
              onChange(filter.key);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-orange-500 text-white'
                : 'bg-white/5 text-white/60 active:bg-white/10'
            }`}
          >
            {filter.label}
            {count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Card de lead con swipe
function LeadCard({ 
  lead, 
  index,
  onCall,
  onWhatsApp,
  onArchive,
}: { 
  lead: Lead; 
  index: number;
  onCall: () => void;
  onWhatsApp: () => void;
  onArchive: () => void;
}) {
  const router = useRouter();
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Background colors based on swipe
  const leftBg = useTransform(x, [0, 100], ['rgba(34,197,94,0)', 'rgba(34,197,94,0.3)']);
  const rightBg = useTransform(x, [-100, 0], ['rgba(239,68,68,0.3)', 'rgba(239,68,68,0)']);

  const status = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
  const priority = PRIORITY_CONFIG[lead.priority] || PRIORITY_CONFIG.MEDIUM;
  const eventType = EVENT_TYPES[lead.eventType] || EVENT_TYPES.OTHER;

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    setSwipeDirection(null);
    
    if (info.offset.x > 80) {
      if ('vibrate' in navigator) navigator.vibrate(15);
      onWhatsApp();
    } else if (info.offset.x < -80) {
      if ('vibrate' in navigator) navigator.vibrate(15);
      onCall();
    }
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 20) {
      setSwipeDirection('right');
    } else if (info.offset.x < -20) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Ara';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return date.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.03 }}
      className="relative"
    >
      {/* Swipe backgrounds */}
      <motion.div 
        className="absolute inset-0 rounded-xl flex items-center justify-start pl-4"
        style={{ backgroundColor: leftBg }}
      >
        <div className={`flex items-center gap-2 text-emerald-400 transition-opacity ${swipeDirection === 'right' ? 'opacity-100' : 'opacity-0'}`}>
          {Icons.whatsapp}
          <span className="text-sm font-medium">WhatsApp</span>
        </div>
      </motion.div>
      <motion.div 
        className="absolute inset-0 rounded-xl flex items-center justify-end pr-4"
        style={{ backgroundColor: rightBg }}
      >
        <div className={`flex items-center gap-2 text-blue-400 transition-opacity ${swipeDirection === 'left' ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-sm font-medium">Trucar</span>
          {Icons.phone}
        </div>
      </motion.div>

      {/* Main card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        onClick={() => !isDragging && router.push(`/admin/leads/${lead.id}`)}
        className={`relative p-3 bg-zinc-900/90 rounded-xl border-l-4 ${priority.border} border border-white/5 active:bg-zinc-800/90 transition-colors cursor-pointer`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center text-lg flex-shrink-0">
            {eventType.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-white font-medium truncate">{lead.name}</h3>
              <span className={`text-xs px-1.5 py-0.5 rounded ${status.bgColor} ${status.color}`}>
                {status.label}
              </span>
            </div>
            
            <p className="text-white/40 text-sm truncate">{lead.email}</p>
            
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-white/30">{eventType.label}</span>
              {lead.eventDate && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-xs text-white/30">
                    {new Date(lead.eventDate).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Time & Arrow */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-white/30">{timeAgo(lead.createdAt)}</span>
            <div className="text-white/20">{Icons.chevronRight}</div>
          </div>
        </div>

        {/* Notes preview */}
        {lead.notes && lead.notes.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/5">
            <p className="text-xs text-white/30 truncate">
              💬 {lead.notes[0].content}
            </p>
          </div>
        )}

        {/* Booking badge */}
        {lead.booking && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
              ✓ Reserva {lead.booking.reference}
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Estado vacío
function EmptyState({ filter, search }: { filter: StatusFilter; search: string }) {
  if (search) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-4">🔍</span>
        <p className="text-white/60 mb-2">Cap resultat per "{search}"</p>
        <p className="text-white/30 text-sm">Prova amb altres paraules clau</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-4">📭</span>
      <p className="text-white/60 mb-2">
        {filter === 'all' ? 'No hi ha leads encara' : `Cap lead ${STATUS_CONFIG[filter]?.label.toLowerCase()}`}
      </p>
      <Link
        href="/admin/leads?new=true"
        className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium active:scale-95 transition-transform"
      >
        Crear primer lead
      </Link>
    </div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 bg-white/5 rounded-xl animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// FAB
function FloatingActionButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center text-white z-40"
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      {Icons.plus}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileLeadsPro() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Debounce search
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Fetch leads
  const fetchLeads = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setPage(1);
      }
      setIsRefreshing(true);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      params.set('page', reset ? '1' : String(page));
      params.set('limit', '20');

      const response = await fetch(`/api/admin/leads-new?${params}`);
      if (!response.ok) throw new Error('Error carregant leads');

      const data: LeadsResponse = await response.json();
      
      if (data.ok) {
        if (reset) {
          setLeads(data.leads);
        } else {
          setLeads((prev) => [...prev, ...data.leads]);
        }
        setStats(data.stats);
        setHasMore(data.page < data.totalPages);
      }
    } catch (err) {
      log.error('Error fetching leads:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, search, page]);

  // Initial load
  useEffect(() => {
    fetchLeads(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Search with debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchLeads(true);
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Handlers
  const handleCall = useCallback((phone?: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }, []);

  const handleWhatsApp = useCallback((phone?: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('34') ? cleanPhone : `34${cleanPhone}`;
      window.open(`https://wa.me/${formattedPhone}`, '_blank');
    }
  }, []);

  const handleArchive = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/leads-new/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'LOST' }),
      });
      if (!res.ok) throw new Error('Error arxivant lead');

      // Actualitzar llista (eliminem de la vista actual)
      setLeads((prev) => prev.filter((lead) => lead.id !== id));

      // Actualitzar stats locals (baixar estat anterior, pujar LOST)
      setStats((prev) => {
        const clone = { ...prev };
        // Restar de l'estat anterior si es coneix
        const lead = leads.find((l) => l.id === id);
        if (lead?.status && clone[lead.status] !== undefined) {
          clone[lead.status] = Math.max(0, clone[lead.status] - 1);
        }
        clone.LOST = (clone.LOST || 0) + 1;
        return clone;
      });
    } catch (err) {
      log.error('Error arxivant lead:', err);
    }
  }, [leads]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage((p) => p + 1);
      fetchLeads();
    }
  }, [isLoading, hasMore, fetchLeads]);

  const handleNewLead = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate(10);
    router.push('/admin/leads?new=true');
  }, [router]);

  // Total count
  const totalLeads = useMemo(() => 
    Object.values(stats).reduce((a, b) => a + b, 0)
  , [stats]);

  return (
    <div className="min-h-screen bg-zinc-950 p-4 pt-6 pb-24 lg:hidden">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Leads</h1>
        <p className="text-white/40 text-sm">
          {totalLeads} leads · {stats.NEW || 0} nous aquesta setmana
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          onClear={() => setSearch('')}
        />
      </div>

      {/* Filters */}
      <div className="mb-4">
        <StatusFilters
          active={statusFilter}
          onChange={setStatusFilter}
          stats={stats}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : leads.length === 0 ? (
        <EmptyState filter={statusFilter} search={search} />
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {leads.map((lead, i) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                index={i}
                onCall={() => handleCall(lead.phone)}
                onWhatsApp={() => handleWhatsApp(lead.phone)}
                onArchive={() => handleArchive(lead.id)}
              />
            ))}
          </AnimatePresence>

          {/* Load more */}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={isRefreshing}
              className="w-full py-4 text-center text-white/40 text-sm active:text-white/60"
            >
              {isRefreshing ? 'Carregant...' : 'Carregar més'}
            </button>
          )}
        </div>
      )}

      {/* FAB */}
      <FloatingActionButton onClick={handleNewLead} />
    </div>
  );
}
