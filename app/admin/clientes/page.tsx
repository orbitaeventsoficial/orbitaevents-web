'use client';

/**
 * ADMIN PANEL - GESTIÓ DE CONTACTES CRM
 * =====================================
 * Panel per gestionar contactes amb:
 * - Afegir contactes manualment
 * - Iniciar processos (post-event, review request, etc)
 * - Veure historial d'events
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS
// ═══════════════════════════════════════════════════════════════════════════

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  instagram?: string | null;
  source?: string;
  total_events: number;
  total_spent: number;
  is_vip: boolean;
  created_at: string;
}

interface CustomerStats {
  total: number;
  vip: number;
  withEvents: number;
  recentMonth: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function AdminContactesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const reduceMotion = useReducedMotion();

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    instagram: '',
    notes: '',
  });

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/customers?stats=true', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autoritzat');
        }
        throw new Error('Error carregant contactes');
      }

      const data = await response.json();
      setCustomers(data.data || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Add customer
  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) {
      setError('Nom i email són obligatoris');
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newCustomer,
          source: 'manual',
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error creant contacte');
      }

      const result = await response.json();

      // Afegir a la llista
      setCustomers((prev) => [result.data, ...prev]);
      setShowAddModal(false);

      // Reset form
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        city: '',
        instagram: '',
        notes: '',
      });

      // Preguntar si iniciar procés
      setSelectedCustomer(result.data);
      setShowActionModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(false);
    }
  };

  // Start process
  const startProcess = async (processType: string) => {
    if (!selectedCustomer) return;

    setActionLoading(true);

    try {
      const response = await fetch('/api/admin/start-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          processType,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error iniciant procés');
      }

      alert(`✅ Procés "${processType}" iniciat per ${selectedCustomer.name}`);
      setShowActionModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter customers
  const searchLower = search.trim().toLowerCase();
  const filteredCustomers = useMemo(() => {
    if (!searchLower) return customers;
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(search)
    );
  }, [customers, searchLower, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            Gestió de Contactes
          </h1>
          <p className="text-sm text-slate-400 mt-1">CRM - Afegeix contactes i inicia processos</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex gap-3 flex-wrap">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm px-4 py-3 text-center">
              <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
              <p className="text-xs text-slate-400">Total</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-sm px-4 py-3 text-center">
              <p className="text-2xl font-bold text-slate-100">{stats.vip}</p>
              <p className="text-xs text-amber-400">VIP</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm px-4 py-3 text-center">
              <p className="text-2xl font-bold text-slate-100">{stats.withEvents}</p>
              <p className="text-xs text-emerald-400">Amb events</p>
            </div>
          </div>
        )}
      </div>

      {/* Search & Add */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Cercar contacte..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Cercar contacte"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-600/50 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          type="button"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Afegir Contacte
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4" role="alert">
          <p className="text-rose-300">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty */}
      {!loading && filteredCustomers.length === 0 && (
        <div className="text-center py-20" role="status" aria-live="polite">
          <p className="text-slate-400 text-lg">No hi ha contactes</p>
        </div>
      )}

      {/* Customers List */}
      {!loading && filteredCustomers.length > 0 && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700/30 border-b border-slate-700/50">
                <th scope="col" className="text-left p-4 text-slate-300 font-medium">Nom</th>
                <th scope="col" className="text-left p-4 text-slate-300 font-medium hidden md:table-cell">Contacte</th>
                <th scope="col" className="text-left p-4 text-slate-300 font-medium hidden lg:table-cell">Font</th>
                <th scope="col" className="text-left p-4 text-slate-300 font-medium hidden sm:table-cell">Events</th>
                <th scope="col" className="text-left p-4 text-slate-300 font-medium">Accions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center text-cyan-300 font-bold">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-slate-100 font-medium flex items-center gap-2">
                          {customer.name}
                          {customer.is_vip && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full font-medium">VIP</span>
                          )}
                        </p>
                        {customer.city && <p className="text-slate-500 text-sm">{customer.city}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="space-y-1">
                      {customer.email && (
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {customer.email}
                        </p>
                      )}
                      {customer.phone && (
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {customer.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      customer.source === 'manual' ? 'bg-purple-500/20 text-purple-300' :
                      customer.source === 'web' ? 'bg-emerald-500/20 text-emerald-300' :
                      customer.source === 'testimonial_form' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {customer.source || 'desconegut'}
                    </span>
                  </td>
                  <td className="p-4 hidden sm:table-cell text-slate-400">
                    {customer.total_events || 0}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowActionModal(true);
                        }}
                        type="button"
                        className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-all"
                        title="Iniciar procés"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <Link
                        href={`/admin/clientes/${customer.id}`}
                        className="p-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-all"
                        title="Fitxa 360"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredCustomers.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Pàgina {page} de {totalPages} · {filteredCustomers.length} contactes</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-700 px-3 py-1 disabled:pointer-events-none disabled:opacity-40 hover:text-slate-200"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-700 px-3 py-1 disabled:pointer-events-none disabled:opacity-40 hover:text-slate-200"
            >
              Següent →
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Afegir Contacte */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
            role="presentation"
          >
            <motion.div
              initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-contact-title"
              className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 id="add-contact-title" className="text-2xl font-bold text-slate-100 mb-6">Afegir Contacte</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-600/50 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="Maria García"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Email *</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-600/50 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="maria@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Telèfon</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-600/50 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="699 123 456"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Ciutat</label>
                    <input
                      type="text"
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-600/50 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                      placeholder="Barcelona"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Instagram</label>
                    <input
                      type="text"
                      value={newCustomer.instagram}
                      onChange={(e) => setNewCustomer({ ...newCustomer, instagram: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-600/50 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                      placeholder="@usuari"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Notes</label>
                  <textarea
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-600/50 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
                    rows={3}
                    placeholder="Notes internes..."
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowAddModal(false)}
                  type="button"
                  className="flex-1 py-3 border border-slate-600/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-all"
                >
                  Cancel·lar
                </button>
                <button
                  onClick={handleAddCustomer}
                  disabled={actionLoading || !newCustomer.name || !newCustomer.email}
                  type="button"
                  aria-busy={actionLoading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50 hover:from-cyan-400 hover:to-blue-500 transition-all"
                >
                  {actionLoading ? 'Afegint...' : 'Afegir'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Iniciar Procés */}
      <AnimatePresence>
        {showActionModal && selectedCustomer && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowActionModal(false)}
            role="presentation"
          >
            <motion.div
              initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="start-process-title"
              className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 sm:p-8 max-w-md w-full"
            >
              <h2 id="start-process-title" className="text-2xl font-bold text-slate-100 mb-2">🚀 Iniciar Procés</h2>
              <p className="text-slate-400 mb-6">
                Per <span className="text-cyan-400">{selectedCustomer.name}</span>
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => startProcess('review_request')}
                  disabled={actionLoading}
                  type="button"
                  aria-busy={actionLoading}
                  className="w-full p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl text-left hover:border-amber-500/30 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">⭐</span>
                    <div>
                      <p className="text-slate-100 font-medium group-hover:text-amber-400">Demanar Opinió</p>
                      <p className="text-slate-500 text-sm">Envia email demanant review</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => startProcess('post_event')}
                  disabled={actionLoading}
                  type="button"
                  aria-busy={actionLoading}
                  className="w-full p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl text-left hover:border-emerald-500/30 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🎉</span>
                    <div>
                      <p className="text-slate-100 font-medium group-hover:text-emerald-400">Post-event Complet</p>
                      <p className="text-slate-500 text-sm">Canvas 10/10 + Gràcies + Demanar opinió</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => startProcess('welcome')}
                  disabled={actionLoading}
                  type="button"
                  aria-busy={actionLoading}
                  className="w-full p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl text-left hover:border-purple-500/30 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">👋</span>
                    <div>
                      <p className="text-slate-100 font-medium group-hover:text-purple-400">Benvinguda</p>
                      <p className="text-slate-500 text-sm">Email de benvinguda + Info empresa</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => startProcess('promo')}
                  disabled={actionLoading}
                  type="button"
                  aria-busy={actionLoading}
                  className="w-full p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl text-left hover:border-pink-500/30 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🎁</span>
                    <div>
                      <p className="text-slate-100 font-medium group-hover:text-pink-400">Promoció</p>
                      <p className="text-slate-500 text-sm">Enviar oferta o descompte especial</p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowActionModal(false)}
                type="button"
                className="w-full mt-6 py-3 border border-slate-600/50 text-slate-400 rounded-xl hover:bg-slate-700/50 transition-all"
              >
                Cancel·lar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

