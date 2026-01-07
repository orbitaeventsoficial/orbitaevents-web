'use client';
import { log } from '@/lib/logger';

/**
 * LeadsTablePro.tsx - Desktop Version
 *
 * Tabla de leads profesional con:
 * - Búsqueda instantánea
 * - Filtros por estado y servicio
 * - Ordenación por columnas
 * - Cambio de estado inline
 * - Quick actions (llamar, WhatsApp, email)
 * - Paginación
 * - Selección múltiple
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  eventDate: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  notes?: string;
}

type SortField = 'name' | 'createdAt' | 'eventDate' | 'status' | 'priority';
type SortDirection = 'asc' | 'desc';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Nou', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  contacted: { label: 'Contactat', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  qualified: { label: 'Qualificat', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  proposal: { label: 'Proposta', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  negotiation: { label: 'Negociació', color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  won: { label: 'Guanyat', color: 'text-green-400', bg: 'bg-green-500/20' },
  lost: { label: 'Perdut', color: 'text-red-400', bg: 'bg-red-500/20' },
};

const serviceConfig: Record<string, { label: string; icon: string }> = {
  bodas: { label: 'Casaments', icon: '💒' },
  fiestas: { label: 'Festes', icon: '🎉' },
  tematicas: { label: 'Temàtiques', icon: '🎭' },
  empresas: { label: 'Empreses', icon: '🏢' },
  discomovil: { label: 'Discomòbil', icon: '🚐' },
};

const priorityConfig: Record<string, { label: string; icon: string; color: string }> = {
  high: { label: 'Alta', icon: '🔥', color: 'text-red-400' },
  medium: { label: 'Mitjana', icon: '⚡', color: 'text-amber-400' },
  low: { label: 'Baixa', icon: '💤', color: 'text-slate-400' },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════════════════

// Status Badge with dropdown
function StatusBadge({
  status,
  leadId,
  onStatusChange,
}: {
  status: string;
  leadId: string;
  onStatusChange: (leadId: string, newStatus: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const config = statusConfig[status] || statusConfig.new;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.color} hover:opacity-80 transition-opacity flex items-center gap-1`}
      >
        {config.label}
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full left-0 mt-1 w-40 bg-slate-100 rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden"
            >
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => {
                    onStatusChange(leadId, key);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2 ${
                    status === key ? 'bg-slate-200' : ''
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${cfg.bg}`} />
                  <span className={cfg.color}>{cfg.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick Actions
function QuickActions({ lead }: { lead: Lead }) {
  const handleCall = () => {
    window.location.href = `tel:${lead.phone.replace(/\s/g, '')}`;
  };

  const handleWhatsApp = () => {
    const phone = lead.phone.replace(/\s/g, '').replace('+', '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = `mailto:${lead.email}`;
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleCall}
        className="w-8 h-8 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 flex items-center justify-center transition-colors"
        title="Trucar"
      >
        📞
      </button>
      <button
        onClick={handleWhatsApp}
        className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-colors"
        title="WhatsApp"
      >
        💬
      </button>
      <button
        onClick={handleEmail}
        className="w-8 h-8 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 flex items-center justify-center transition-colors"
        title="Email"
      >
        ✉️
      </button>
    </div>
  );
}

// Column Header
function ColumnHeader({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = sortField === field;

  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-left hover:text-black transition-colors ${
        isActive ? 'text-black' : 'text-slate-500'
      }`}
    >
      {label}
      <span className="text-xs">
        {isActive ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function LeadsTablePro() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/leads-new');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      } else {
        // Sample data
        setLeads([
          { id: '1', name: 'Maria Garcia', email: 'maria@email.com', phone: '+34 600 111 222', service: 'bodas', eventDate: '2025-03-15', status: 'new', priority: 'high', createdAt: '2025-01-10' },
          { id: '2', name: 'Joan Martí', email: 'joan@email.com', phone: '+34 600 333 444', service: 'fiestas', eventDate: '2025-02-20', status: 'contacted', priority: 'medium', createdAt: '2025-01-09' },
          { id: '3', name: 'Anna López', email: 'anna@email.com', phone: '+34 600 555 666', service: 'empresas', eventDate: '2025-04-10', status: 'qualified', priority: 'high', createdAt: '2025-01-08' },
          { id: '4', name: 'Pere Soler', email: 'pere@email.com', phone: '+34 600 777 888', service: 'tematicas', eventDate: '2025-05-25', status: 'proposal', priority: 'low', createdAt: '2025-01-07' },
          { id: '5', name: 'Laura Puig', email: 'laura@email.com', phone: '+34 600 999 000', service: 'bodas', eventDate: '2025-06-12', status: 'new', priority: 'high', createdAt: '2025-01-06' },
          { id: '6', name: 'Marc Ferrer', email: 'marc@email.com', phone: '+34 600 123 456', service: 'discomovil', eventDate: '2025-02-28', status: 'won', priority: 'medium', createdAt: '2025-01-05' },
          { id: '7', name: 'Elena Vidal', email: 'elena@email.com', phone: '+34 600 654 321', service: 'fiestas', eventDate: '2025-03-08', status: 'negotiation', priority: 'high', createdAt: '2025-01-04' },
        ]);
      }
    } catch (error) {
      log.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Status change handler
  const handleStatusChange = useCallback(async (leadId: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      setLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
    } catch (error) {
      log.error('Error updating status:', error);
    }
  }, []);

  // Sort handler
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Select all - uses filteredLeads from closure, defined below
  const handleSelectAll = useCallback(() => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeads.size]);

  // Toggle selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lead =>
        lead.name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.phone.includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(lead => lead.status === statusFilter);
    }

    // Service filter
    if (serviceFilter !== 'all') {
      result = result.filter(lead => lead.service === serviceFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
        case 'eventDate':
          comparison = new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [leads, searchQuery, statusFilter, serviceFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    leads.forEach(lead => {
      counts[lead.status] = (counts[lead.status] || 0) + 1;
    });
    return counts;
  }, [leads]);

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
          <h1 className="text-2xl font-bold text-black">Leads</h1>
          <p className="text-slate-500 text-sm">{filteredLeads.length} contactes</p>
        </div>
        <Link
          href="/admin/leads?new=true"
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl transition-colors"
        >
          <span>➕</span> Nou Lead
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[300px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar per nom, email o telèfon..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-black placeholder:text-slate-400 focus:border-orange-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-black focus:border-orange-500 focus:outline-none cursor-pointer"
        >
          <option value="all">Tots els estats ({statusCounts.all || 0})</option>
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.label} ({statusCounts[key] || 0})
            </option>
          ))}
        </select>

        {/* Service filter */}
        <select
          value={serviceFilter}
          onChange={(e) => {
            setServiceFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-black focus:border-orange-500 focus:outline-none cursor-pointer"
        >
          <option value="all">Tots els serveis</option>
          {Object.entries(serviceConfig).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.icon} {cfg.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
            statusFilter === 'all'
              ? 'bg-orange-500 text-white font-medium'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Tots ({statusCounts.all || 0})
        </button>
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
              statusFilter === key
                ? `${cfg.bg} ${cfg.color} font-medium`
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {cfg.label}
            <span className="text-xs opacity-60">({statusCounts[key] || 0})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="w-12 p-4">
                <input
                  type="checkbox"
                  checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 bg-slate-100 text-orange-500 focus:ring-orange-500"
                />
              </th>
              <th className="p-4 text-left">
                <ColumnHeader label="Nom" field="name" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              </th>
              <th className="p-4 text-left text-slate-500">Contacte</th>
              <th className="p-4 text-left text-slate-500">Servei</th>
              <th className="p-4 text-left">
                <ColumnHeader label="Data Event" field="eventDate" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              </th>
              <th className="p-4 text-left">
                <ColumnHeader label="Prioritat" field="priority" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              </th>
              <th className="p-4 text-left">
                <ColumnHeader label="Estat" field="status" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              </th>
              <th className="p-4 text-left text-slate-500">Accions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.map((lead, i) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`border-b border-slate-200 hover:bg-slate-100 transition-colors ${
                  selectedLeads.has(lead.id) ? 'bg-orange-500/5' : ''
                }`}
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedLeads.has(lead.id)}
                    onChange={() => toggleSelect(lead.id)}
                    className="w-4 h-4 rounded border-slate-300 bg-slate-100 text-orange-500 focus:ring-orange-500"
                  />
                </td>
                <td className="p-4">
                  <Link href={`/admin/leads/${lead.id}`} className="hover:text-orange-400 transition-colors">
                    <p className="text-black font-medium">{lead.name}</p>
                    <p className="text-slate-400 text-xs">
                      {new Date(lead.createdAt).toLocaleDateString('ca-ES')}
                    </p>
                  </Link>
                </td>
                <td className="p-4">
                  <p className="text-slate-700 text-sm">{lead.email}</p>
                  <p className="text-slate-400 text-xs">{lead.phone}</p>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{serviceConfig[lead.service]?.icon || '📋'}</span>
                    <span className="text-slate-700 text-sm">{serviceConfig[lead.service]?.label || lead.service}</span>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-slate-700">
                    {new Date(lead.eventDate).toLocaleDateString('ca-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </td>
                <td className="p-4">
                  <span className={`flex items-center gap-1 ${priorityConfig[lead.priority]?.color}`}>
                    <span>{priorityConfig[lead.priority]?.icon}</span>
                    <span className="text-sm">{priorityConfig[lead.priority]?.label}</span>
                  </span>
                </td>
                <td className="p-4">
                  <StatusBadge
                    status={lead.status}
                    leadId={lead.id}
                    onStatusChange={handleStatusChange}
                  />
                </td>
                <td className="p-4">
                  <QuickActions lead={lead} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {paginatedLeads.length === 0 && (
          <div className="p-12 text-center">
            <span className="text-4xl mb-4 block">🔍</span>
            <p className="text-slate-600">No s'han trobat leads</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setServiceFilter('all');
              }}
              className="mt-4 text-orange-400 hover:text-orange-300"
            >
              Netejar filtres
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-sm">
            Mostrant {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredLeads.length)} de {filteredLeads.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-black transition-colors"
            >
              ← Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl transition-colors ${
                    currentPage === page
                      ? 'bg-orange-500 text-white font-medium'
                      : 'bg-slate-100 hover:bg-slate-200 text-black'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-black transition-colors"
            >
              Següent →
            </button>
          </div>
        </div>
      )}

      {/* Selected actions */}
      <AnimatePresence>
        {selectedLeads.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-100 rounded-2xl shadow-2xl border border-slate-200 px-6 py-4 flex items-center gap-4"
          >
            <span className="text-black font-medium">{selectedLeads.size} seleccionats</span>
            <div className="w-px h-6 bg-slate-200" />
            <button className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-xl hover:bg-orange-500/30 transition-colors">
              Canviar estat
            </button>
            <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors">
              Eliminar
            </button>
            <button
              onClick={() => setSelectedLeads(new Set())}
              className="text-slate-500 hover:text-black transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
