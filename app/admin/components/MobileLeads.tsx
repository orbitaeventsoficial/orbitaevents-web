'use client';

/**
 * MobileLeads.tsx
 *
 * Lista de leads optimizada para móvil
 * - Cards en lugar de tabla
 * - Swipe actions (llamar, WhatsApp, cambiar estado)
 * - Filtros en bottom sheet
 * - Búsqueda destacada
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import Link from 'next/link';
import { FilterSheet, ActionsSheet } from './BottomSheet';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATOS DE EJEMPLO
// ═══════════════════════════════════════════════════════════════════════════

const sampleLeads: Lead[] = [
  { id: '1', name: 'Maria Garcia', email: 'maria@email.com', phone: '+34 600 111 222', service: 'bodas', date: '2025-03-15', status: 'new', createdAt: '2025-01-10' },
  { id: '2', name: 'Joan Martí', email: 'joan@email.com', phone: '+34 600 333 444', service: 'fiestas', date: '2025-02-20', status: 'contacted', createdAt: '2025-01-09' },
  { id: '3', name: 'Anna López', email: 'anna@email.com', phone: '+34 600 555 666', service: 'empresas', date: '2025-04-10', status: 'qualified', createdAt: '2025-01-08' },
  { id: '4', name: 'Pere Soler', email: 'pere@email.com', phone: '+34 600 777 888', service: 'tematicas', date: '2025-05-25', status: 'proposal', createdAt: '2025-01-07' },
  { id: '5', name: 'Laura Puig', email: 'laura@email.com', phone: '+34 600 999 000', service: 'bodas', date: '2025-06-12', status: 'new', createdAt: '2025-01-06' },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Nou', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  contacted: { label: 'Contactat', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  qualified: { label: 'Qualificat', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  proposal: { label: 'Proposta', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  won: { label: 'Guanyat', color: 'text-green-400', bg: 'bg-green-500/20' },
  lost: { label: 'Perdut', color: 'text-red-400', bg: 'bg-red-500/20' },
};

const serviceIcons: Record<string, string> = {
  bodas: '💒',
  fiestas: '🎉',
  tematicas: '🎭',
  empresas: '🏢',
  discomovil: '🚐',
};

// ═══════════════════════════════════════════════════════════════════════════
// LEAD CARD CON SWIPE
// ═══════════════════════════════════════════════════════════════════════════

interface LeadCardProps {
  lead: Lead;
  onCall: () => void;
  onWhatsApp: () => void;
  onStatusChange: () => void;
}

function LeadCard({ lead, onCall, onWhatsApp, onStatusChange }: LeadCardProps) {
  const x = useMotionValue(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Transform para los action indicators
  const leftOpacity = useTransform(x, [0, 100], [0, 1]);
  const rightOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      const threshold = 80;

      if (info.offset.x > threshold) {
        // Swipe derecha - Llamar o WhatsApp
        if ('vibrate' in navigator) navigator.vibrate(20);
        onCall();
      } else if (info.offset.x < -threshold) {
        // Swipe izquierda - Cambiar estado
        if ('vibrate' in navigator) navigator.vibrate(20);
        onStatusChange();
      }

      // Reset
      setSwipeDirection(null);
    },
    [onCall, onStatusChange]
  );

  const handleDrag = useCallback(
    (_: any, info: PanInfo) => {
      if (info.offset.x > 30) {
        setSwipeDirection('right');
      } else if (info.offset.x < -30) {
        setSwipeDirection('left');
      } else {
        setSwipeDirection(null);
      }
    },
    []
  );

  const status = statusConfig[lead.status];
  const serviceIcon = serviceIcons[lead.service] || '📋';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ca-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Avui';
    if (diff === 1) return 'Ahir';
    return `Fa ${diff} dies`;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe action backgrounds */}
      <div className="absolute inset-0 flex">
        {/* Left (call) - Green */}
        <motion.div
          className="flex-1 bg-green-500 flex items-center justify-start pl-6"
          style={{ opacity: leftOpacity }}
        >
          <span className="text-3xl">📞</span>
        </motion.div>
        {/* Right (status) - Orange */}
        <motion.div
          className="flex-1 bg-orange-500 flex items-center justify-end pr-6"
          style={{ opacity: rightOpacity }}
        >
          <span className="text-3xl">🔄</span>
        </motion.div>
      </div>

      {/* Card content */}
      <motion.div
        className="relative bg-stone-50 p-4"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        <Link href={`/admin/leads/${lead.id}`} className="block">
          <div className="flex items-start gap-3">
            {/* Avatar / Service Icon */}
            <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-2xl flex-shrink-0">
              {serviceIcon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-slate-700 font-semibold truncate">{lead.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-slate-500 text-sm truncate">{lead.email}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>📅 {formatDate(lead.date)}</span>
                <span>·</span>
                <span>{timeAgo(lead.createdAt)}</span>
              </div>
            </div>

            {/* Arrow */}
            <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Quick action buttons (visible on card) */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-stone-200">
          <button
            onClick={(e) => {
              e.preventDefault();
              onCall();
            }}
            className="flex-1 py-2 bg-green-500/10 text-green-400 rounded-xl text-sm font-medium active:bg-green-500/20 transition-colors"
          >
            📞 Trucar
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onWhatsApp();
            }}
            className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-medium active:bg-emerald-500/20 transition-colors"
          >
            💬 WhatsApp
          </button>
        </div>
      </motion.div>

      {/* Swipe hint overlay */}
      <AnimatePresence>
        {swipeDirection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 pointer-events-none flex items-center ${
              swipeDirection === 'right' ? 'justify-start pl-4' : 'justify-end pr-4'
            }`}
          >
            <span className="text-slate-700 font-medium text-sm">
              {swipeDirection === 'right' ? 'Trucar' : 'Canviar estat'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileLeads() {
  const [leads, setLeads] = useState(sampleLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleCall = useCallback((lead: Lead) => {
    window.location.href = `tel:${lead.phone.replace(/\s/g, '')}`;
  }, []);

  const handleWhatsApp = useCallback((lead: Lead) => {
    const phone = lead.phone.replace(/\s/g, '').replace('+', '');
    window.open(`https://wa.me/${phone}`, '_blank');
  }, []);

  const handleStatusChange = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setActionsOpen(true);
  }, []);

  const updateLeadStatus = useCallback((leadId: string, newStatus: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus as Lead['status'] } : l))
    );
  }, []);

  return (
    <div className="space-y-4 lg:hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-700">Leads</h1>
          <p className="text-slate-500 text-sm">{filteredLeads.length} contactes</p>
        </div>
        <Link
          href="/admin/leads?new=true"
          className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold active:scale-95 transition-transform"
        >
          +
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          🔍
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar leads..."
          className="w-full pl-12 pr-12 py-3 bg-stone-100 border border-stone-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none transition-colors"
        />
        <button
          onClick={() => setFilterOpen(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-slate-500 active:bg-stone-100"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
            statusFilter === 'all'
              ? 'bg-orange-500 text-white font-medium'
              : 'bg-stone-100 text-slate-700'
          }`}
        >
          Tots
        </button>
        {Object.entries(statusConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              statusFilter === key
                ? `${config.bg} ${config.color} font-medium`
                : 'bg-stone-100 text-slate-700'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Swipe hint */}
      <div className="text-center text-slate-400 text-xs">
        ← Swipe per accions ràpides →
      </div>

      {/* Leads list */}
      <div className="space-y-3">
        {filteredLeads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onCall={() => handleCall(lead)}
            onWhatsApp={() => handleWhatsApp(lead)}
            onStatusChange={() => handleStatusChange(lead)}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">🔍</span>
          <p className="text-slate-600">No s'han trobat leads</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="mt-4 text-orange-400 text-sm"
          >
            Netejar filtres
          </button>
        </div>
      )}

      {/* Filter Sheet */}
      <FilterSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)}>
        <div className="space-y-4">
          <div>
            <h4 className="text-slate-700 font-medium mb-3">Estat</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statusConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => {
                    setStatusFilter(key);
                    setFilterOpen(false);
                  }}
                  className={`p-3 rounded-xl text-left ${
                    statusFilter === key ? config.bg : 'bg-stone-100'
                  }`}
                >
                  <span className={statusFilter === key ? config.color : 'text-slate-700'}>
                    {config.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setStatusFilter('all');
              setFilterOpen(false);
            }}
            className="w-full py-3 bg-stone-100 text-slate-700 rounded-xl font-medium"
          >
            Netejar filtres
          </button>
        </div>
      </FilterSheet>

      {/* Status Change Sheet */}
      {selectedLead && (
        <ActionsSheet
          isOpen={actionsOpen}
          onClose={() => {
            setActionsOpen(false);
            setSelectedLead(null);
          }}
          title={`Canviar estat: ${selectedLead.name}`}
          actions={Object.entries(statusConfig).map(([key, config]) => ({
            label: config.label,
            icon: key === 'won' ? '✅' : key === 'lost' ? '❌' : '🔄',
            onClick: () => updateLeadStatus(selectedLead.id, key),
          }))}
        />
      )}
    </div>
  );
}
