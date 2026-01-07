'use client';

/**
 * ADMIN PANEL - GESTIÓ DE CONTACTES CRM
 * =====================================
 * Panel per gestionar contactes amb:
 * - Afegir contactes manualment
 * - Iniciar processos (post-event, review request, etc)
 * - Veure historial d'events
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [search, setSearch] = useState('');

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
      setCustomers([result.data, ...customers]);
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
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-stone-100 text-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
              Gestió de Contactes
            </h1>
            <p className="text-gray-500 mt-1">CRM - Afegeix contactes i inicia processos</p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex gap-4 flex-wrap">
              <div className="bg-stone-50 border border-zinc-800 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-amber-400">{stats.vip}</p>
                <p className="text-xs text-amber-500/70">VIP</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-green-400">{stats.withEvents}</p>
                <p className="text-xs text-green-500/70">Amb events</p>
              </div>
            </div>
          )}
        </div>

        {/* Search & Add */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar contacte..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-slate-800 placeholder-stone-400 focus:border-amber-400 transition-all"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-amber-400 text-slate-800 font-bold rounded-xl hover:bg-amber-300 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Afegir Contacte
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Empty */}
        {!loading && filteredCustomers.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No hi ha contactes</p>
          </div>
        )}

        {/* Customers List */}
        {!loading && filteredCustomers.length > 0 && (
          <div className="bg-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left p-4 text-slate-500 font-medium">Nom</th>
                  <th className="text-left p-4 text-slate-500 font-medium hidden md:table-cell">Contacte</th>
                  <th className="text-left p-4 text-slate-500 font-medium hidden lg:table-cell">Font</th>
                  <th className="text-left p-4 text-slate-500 font-medium hidden sm:table-cell">Events</th>
                  <th className="text-left p-4 text-slate-500 font-medium">Accions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-stone-200 hover:bg-stone-100">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-800 font-medium flex items-center gap-2">
                            {customer.name}
                            {customer.is_vip && (
                              <span className="px-2 py-0.5 bg-amber-400/20 text-amber-400 text-xs rounded-full">VIP</span>
                            )}
                          </p>
                          {customer.city && <p className="text-slate-400 text-sm">{customer.city}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="space-y-1">
                        {customer.email && (
                          <p className="text-slate-500 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {customer.email}
                          </p>
                        )}
                        {customer.phone && (
                          <p className="text-slate-500 text-sm flex items-center gap-2">
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
                        customer.source === 'manual' ? 'bg-purple-500/20 text-purple-400' :
                        customer.source === 'web' ? 'bg-green-500/20 text-green-400' :
                        customer.source === 'testimonial_form' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-stone-200 text-slate-500'
                      }`}>
                        {customer.source || 'desconegut'}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-slate-500">
                      {customer.total_events || 0}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowActionModal(true);
                          }}
                          className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                          title="Iniciar procés"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button
                          className="p-2 bg-stone-200 text-slate-500 rounded-lg hover:bg-stone-50/20 transition-all"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL: Afegir Contacte */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-stone-200/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-stone-50 border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Afegir Contacte</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-500 mb-2">Nom *</label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-100 border border-stone-300 rounded-xl text-slate-800 placeholder-stone-400 focus:border-amber-400 transition-all"
                      placeholder="Maria García"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-500 mb-2">Email *</label>
                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-100 border border-stone-300 rounded-xl text-slate-800 placeholder-stone-400 focus:border-amber-400 transition-all"
                      placeholder="maria@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-500 mb-2">Telèfon</label>
                    <input
                      type="tel"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-100 border border-stone-300 rounded-xl text-slate-800 placeholder-stone-400 focus:border-amber-400 transition-all"
                      placeholder="699 123 456"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-500 mb-2">Ciutat</label>
                      <input
                        type="text"
                        value={newCustomer.city}
                        onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-100 border border-stone-300 rounded-xl text-slate-800 placeholder-stone-400 focus:border-amber-400 transition-all"
                        placeholder="Barcelona"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-500 mb-2">Instagram</label>
                      <input
                        type="text"
                        value={newCustomer.instagram}
                        onChange={(e) => setNewCustomer({ ...newCustomer, instagram: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-100 border border-stone-300 rounded-xl text-slate-800 placeholder-stone-400 focus:border-amber-400 transition-all"
                        placeholder="@usuari"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-500 mb-2">Notes</label>
                    <textarea
                      value={newCustomer.notes}
                      onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-100 border border-stone-300 rounded-xl text-slate-800 placeholder-stone-400 focus:border-amber-400 transition-all resize-none"
                      rows={3}
                      placeholder="Notes internes..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 border border-stone-300 text-slate-800 rounded-xl hover:bg-stone-100 transition-all"
                  >
                    Cancel·lar
                  </button>
                  <button
                    onClick={handleAddCustomer}
                    disabled={actionLoading || !newCustomer.name || !newCustomer.email}
                    className="flex-1 py-3 bg-amber-400 text-slate-800 font-bold rounded-xl disabled:opacity-50 hover:bg-amber-300 transition-all"
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-stone-200/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowActionModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-stone-50 border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-md w-full"
              >
                <h2 className="text-2xl font-bold text-slate-800 mb-2">🚀 Iniciar Procés</h2>
                <p className="text-slate-500 mb-6">
                  Per <span className="text-amber-400">{selectedCustomer.name}</span>
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => startProcess('review_request')}
                    disabled={actionLoading}
                    className="w-full p-4 bg-stone-100 border border-stone-200 rounded-xl text-left hover:bg-stone-200 hover:border-amber-400/50 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">⭐</span>
                      <div>
                        <p className="text-slate-800 font-medium group-hover:text-amber-400">Demanar Opinió</p>
                        <p className="text-slate-800/50 text-sm">Envia email demanant review</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => startProcess('post_event')}
                    disabled={actionLoading}
                    className="w-full p-4 bg-stone-100 border border-stone-200 rounded-xl text-left hover:bg-stone-200 hover:border-green-400/50 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">🎉</span>
                      <div>
                        <p className="text-slate-800 font-medium group-hover:text-green-400">Post-Event Complet</p>
                        <p className="text-slate-800/50 text-sm">Canvas 10/10 + Gràcies + Demanar opinió</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => startProcess('welcome')}
                    disabled={actionLoading}
                    className="w-full p-4 bg-stone-100 border border-stone-200 rounded-xl text-left hover:bg-stone-200 hover:border-purple-400/50 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">👋</span>
                      <div>
                        <p className="text-slate-800 font-medium group-hover:text-purple-400">Benvinguda</p>
                        <p className="text-slate-800/50 text-sm">Email de benvinguda + Info empresa</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => startProcess('promo')}
                    disabled={actionLoading}
                    className="w-full p-4 bg-stone-100 border border-stone-200 rounded-xl text-left hover:bg-stone-200 hover:border-pink-400/50 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">🎁</span>
                      <div>
                        <p className="text-slate-800 font-medium group-hover:text-pink-400">Promoció</p>
                        <p className="text-slate-800/50 text-sm">Enviar oferta o descompte especial</p>
                      </div>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setShowActionModal(false)}
                  className="w-full mt-6 py-3 border border-stone-300 text-slate-500 rounded-xl hover:bg-stone-100 transition-all"
                >
                  Cancel·lar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
