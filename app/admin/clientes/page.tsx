'use client';

/**
 * ADMIN PANEL - GESTIÓ DE CLIENTS CRM
 * =====================================
 * Panell per gestionar clients amb:
 * - Afegir clients manualment
 * - Iniciar processos (post-esdeveniment, sol·licitud d'opinió, etc.)
 * - Veure historial d'esdeveniments
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AdminPage } from '../components/AdminPage';
import { useToast } from '../components/ToastProvider';
import ExportCsvButton from '../components/ExportCsvButton';
import { fetchWithCsrf } from '@/lib/csrf';

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

const SOURCE_LABELS: Record<string, string> = {
  website: 'Web',
  configurator: 'Configurador',
  phone: 'Telèfon',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  wallapop: 'Wallapop',
  referral: 'Boca-orella',
  google: 'Google',
  other: 'Altre',
  manual: 'Manual',
  testimonial_form: 'Ressenya',
};

function getNextStep(customer: Customer): { label: string; href: string; hint: string } {
  if ((customer.total_events || 0) > 0) {
    return {
      label: 'Post-esdeveniment',
      href: '/admin/post-event',
      hint: 'Tancar cicle i demanar feedback',
    };
  }

  return {
    label: 'Crear pressupost',
    href: `/admin/presupuestos?customerId=${encodeURIComponent(customer.id)}`,
    hint: 'Primer pas per avançar venda',
  };
}

type ExecutionPriority = 'ALTA' | 'MITJANA' | 'BAIXA';

const PRIORITY_FILTER_STYLES: Record<'ALL' | ExecutionPriority, string> = {
  ALL: 'border-amber-400/50 bg-amber-500/15 text-amber-200',
  ALTA: 'border-rose-400/50 bg-rose-500/15 text-rose-200',
  MITJANA: 'border-amber-400/50 bg-amber-500/15 text-amber-200',
  BAIXA: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200',
};

function getExecutionPriority(customer: Customer): { level: ExecutionPriority; score: number; hint: string } {
  const createdAt = customer.created_at ? new Date(customer.created_at) : new Date();
  const daysSinceCreated = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
  const hasContactChannel = Boolean(customer.email || customer.phone);

  if (customer.is_vip) {
    return { level: 'ALTA', score: 100, hint: 'Client VIP: seguiment prioritari' };
  }
  if ((customer.total_events || 0) === 0 && hasContactChannel && daysSinceCreated <= 3) {
    return { level: 'ALTA', score: 90, hint: 'Lead recent sense esdeveniment' };
  }
  if ((customer.total_events || 0) === 0 && daysSinceCreated <= 14) {
    return { level: 'MITJANA', score: 60, hint: 'Oportunitat activa' };
  }
  if ((customer.total_events || 0) > 0) {
    return { level: 'MITJANA', score: 50, hint: 'Client amb potencial recurrència' };
  }
  return { level: 'BAIXA', score: 20, hint: 'Seguiment no urgent' };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function AdminContactesPage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | ExecutionPriority>('ALL');
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
    dni: '',
    instagram: '',
    source: 'OTHER' as string,
    notes: '',
  });

  // Close modals on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddModal) setShowAddModal(false);
        if (showActionModal) setShowActionModal(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAddModal, showActionModal]);

  // Duplicate detection
  const [duplicateWarnings, setDuplicateWarnings] = useState<Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    matchScore: number;
    matchReasons: Array<{ field: string; type: string; score: number }>;
  }>>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateOverride, setDuplicateOverride] = useState(false);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        stats: 'true',
        page: String(page),
        limit: String(pageSize),
      });
      if (search) params.set('q', search);

      const response = await fetchWithCsrf(`/api/admin/customers?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autoritzat');
        }
        throw new Error('Error carregant clients');
      }

      const data = await response.json();
      const payload = data?.data || {};
      const rawCustomers = Array.isArray(payload.customers)
        ? payload.customers
        : Array.isArray(payload)
          ? payload
          : [];

      const mappedCustomers: Customer[] = rawCustomers.map((item: Record<string, unknown>) => ({
        id: String(item.id || ''),
        name: String(item.name || ''),
        email: String(item.email || ''),
        phone: item.phone ? String(item.phone) : null,
        city: item.city ? String(item.city) : null,
        instagram: item.instagram ? String(item.instagram) : null,
        source: item.source ? String(item.source).toLowerCase() : undefined,
        total_events: typeof item.totalEvents === 'number' ? item.totalEvents : 0,
        total_spent: typeof item.totalSpent === 'number' ? item.totalSpent : 0,
        is_vip: typeof item.totalSpent === 'number' ? item.totalSpent >= 2000 : false,
        created_at: String(item.createdAt || ''),
      }));

      setCustomers(mappedCustomers);
      setTotalCustomers(Number(payload.total || 0));
      setTotalPages(Number(payload.totalPages || 1));
      setStats((payload.stats as CustomerStats) || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredCustomers = useMemo(() => {
    const withPriority = customers.map((customer) => ({
      customer,
      priority: getExecutionPriority(customer),
    }));

    const filtered = priorityFilter === 'ALL'
      ? withPriority
      : withPriority.filter((item) => item.priority.level === priorityFilter);

    return filtered.sort((a, b) => b.priority.score - a.priority.score);
  }, [customers, priorityFilter]);

  useEffect(() => {
    const shouldOpen = searchParams?.get('add') === '1';
    if (!shouldOpen) return;

    const date = searchParams?.get('date');
    setShowAddModal(true);
    if (date) {
      setNewCustomer((prev) => ({
        ...prev,
        notes: prev.notes || `Origen calendari (${date})`,
      }));
    }
  }, [searchParams]);

  // Check duplicates in real-time
  useEffect(() => {
    const { name, email, phone, instagram } = newCustomer;
    if (!name && !email && !phone) {
      setDuplicateWarnings([]);
      return;
    }
    const timeout = window.setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const res = await fetchWithCsrf('/api/admin/customers/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name, email, phone, instagram }),
        });
        const data = await res.json();
        setDuplicateWarnings(data?.duplicates || []);
      } catch {
        setDuplicateWarnings([]);
      } finally {
        setCheckingDuplicates(false);
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [newCustomer]);

  // Add customer
  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) {
      setError('Nom i correu són obligatoris');
      return;
    }

    // Warn about high-score duplicates
    const highScoreDup = duplicateWarnings.find((d) => d.matchScore >= 80);
    if (highScoreDup && !duplicateOverride) {
      toast.warning(`Possible duplicat: "${highScoreDup.name}" (${highScoreDup.matchScore}%). Fes clic a "Crear igualment" per continuar.`);
      setDuplicateOverride(true);
      return;
    }
    setDuplicateOverride(false);

    setActionLoading(true);

    try {
      const response = await fetchWithCsrf('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone || undefined,
          instagram: newCustomer.instagram || undefined,
          dni: newCustomer.dni || undefined,
          source: newCustomer.source,
          notes: newCustomer.notes || undefined,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error creant client');
      }

      const result = await response.json();
      const createdDuplicateWarnings = Array.isArray(result?.data?.duplicateWarnings)
        ? result.data.duplicateWarnings
        : [];

      // Refresh llista
      if (page === 1) {
        await fetchCustomers();
      } else {
        setPage(1);
      }
      setShowAddModal(false);
      setDuplicateWarnings([]);

      // Reset form
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        dni: '',
        instagram: '',
        source: 'OTHER',
        notes: '',
      });

      // Preguntar si iniciar procés
      setSelectedCustomer(result.data);
      setShowActionModal(true);
      if (createdDuplicateWarnings.length > 0) {
        setError(
          `Possible duplicat detectat automàticament (${createdDuplicateWarnings.length}). Revisa'l abans de continuar.`
        );
      }
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
      const response = await fetchWithCsrf('/api/admin/start-process', {
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

      toast.success(`Procés "${processType}" iniciat per ${selectedCustomer.name}`);
      setShowActionModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <AdminPage
      title="Clients"
      subtitle="CRM - Afegeix clients i inicia processos"
      actions={
        stats ? (
          <div className="flex gap-3 flex-wrap">
            <div className="rounded-2xl border admin-card-glass px-4 py-3 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs">Total</p>
            </div>
            <div className="rounded-2xl border admin-card-glass px-4 py-3 text-center">
              <p className="text-2xl font-bold">{stats.vip}</p>
              <p className="text-xs">VIP</p>
            </div>
            <div className="rounded-2xl border admin-card-glass px-4 py-3 text-center">
              <p className="text-2xl font-bold">{stats.withEvents}</p>
              <p className="text-xs">Amb esdeveniments</p>
            </div>
          </div>
        ) : undefined
      }
    >
      {/* Search & Add */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Cercar per nom, email, telèfon, Instagram o codi descompte"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Cercar client"
            className="w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-1 transition-all"
          />
        </div>

        <div className="flex gap-2">
          <ExportCsvButton
            filename="clients"
            headers={['Nom', 'Email', 'Telèfon', 'Ciutat', 'Font', 'Esdeveniments', 'Despesa total', 'VIP']}
            rows={customers.map((c) => [
              c.name,
              c.email,
              c.phone || '',
              c.city || '',
              SOURCE_LABELS[c.source || ''] || c.source || '',
              String(c.total_events),
              String(c.total_spent),
              c.is_vip ? 'Sí' : 'No',
            ])}
          />
          <button
            onClick={() => setShowAddModal(true)}
            type="button"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Afegir Client
          </button>
        </div>
      </div>

      {/* Filtres d'execució */}
      {!loading && customers.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {(['ALL', 'ALTA', 'MITJANA', 'BAIXA'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPriorityFilter(value)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                priorityFilter === value
                  ? PRIORITY_FILTER_STYLES[value]
                  : 'border-white/10 text-white/40 hover:text-white/70'
              }`}
            >
              {value === 'ALL' ? 'Totes prioritats' : `Prioritat ${value.toLowerCase()}`}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border rounded-xl p-4" role="alert">
          <p className="">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty */}
      {!loading && customers.length === 0 && (
        <div className="text-center py-20" role="status" aria-live="polite">
          <p className="text-lg">No hi ha clients</p>
        </div>
      )}

      {/* Customers List */}
      {!loading && customers.length > 0 && (
        <div className="rounded-2xl border admin-card-glass overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-sm" aria-label="Llistat de clients">
            <thead>
              <tr className="border-b hover:bg-white/[0.03] transition-colors">
                <th scope="col" className="text-center p-4 font-medium">Nom</th>
                <th scope="col" className="text-center p-4 font-medium hidden md:table-cell">Contacte</th>
                <th scope="col" className="text-center p-4 font-medium hidden lg:table-cell">Font</th>
                <th scope="col" className="text-center p-4 font-medium hidden sm:table-cell">Esdeveniments</th>
                <th scope="col" className="text-center p-4 font-medium hidden xl:table-cell">Prioritat</th>
                <th scope="col" className="text-center p-4 font-medium hidden xl:table-cell">Proper pas</th>
                <th scope="col" className="text-center p-4 font-medium">Accions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(({ customer, priority }) => {
                const nextStep = getNextStep(customer);
                return (
                <tr key={customer.id} className="border-b hover:bg-white/[0.03] transition-colors">
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium flex items-center justify-center gap-2 whitespace-nowrap">
                          {customer.name}
                          {customer.is_vip && (
                            <span className="px-2 py-0.5 text-xs rounded-full font-medium">VIP</span>
                          )}
                        </p>
                        {customer.city && <p className="text-sm truncate">{customer.city}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell text-center">
                    <div className="space-y-1 min-w-0">
                      {customer.email && (
                        <p className="text-sm flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="max-w-[240px] truncate">{customer.email}</span>
                        </p>
                      )}
                      {customer.phone && (
                        <p className="text-sm flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {customer.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      customer.source === 'manual' ? 'bg-purple-500/20 text-purple-300' :
                      customer.source === 'web' ? 'bg-emerald-500/20 text-emerald-300' :
                      customer.source === 'testimonial_form' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-white/5 text-white/40'
                    }`}>
                      {SOURCE_LABELS[customer.source || ''] || customer.source || 'Desconeguda'}
                    </span>
                  </td>
                  <td className="p-4 hidden sm:table-cell text-center">
                    {customer.total_events || 0}
                  </td>
                  <td className="p-4 hidden xl:table-cell text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                        priority.level === 'ALTA'
                          ? 'bg-rose-500/20 text-rose-300'
                          : priority.level === 'MITJANA'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                      title={priority.hint}
                    >
                      {priority.level}
                    </span>
                  </td>
                  <td className="p-4 hidden xl:table-cell text-center">
                    <div className="space-y-1">
                      <Link
                        href={nextStep.href}
                        className="inline-flex rounded-xl border px-2 py-1 text-xs font-semibold"
                      >
                        {nextStep.label}
                      </Link>
                      <p className="text-[11px]">{nextStep.hint}</p>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowActionModal(true);
                        }}
                        type="button"
                        className="p-2 rounded-xl transition-all"
                        title="Iniciar procés"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      <Link
                        href={`/admin/clientes/${customer.id}`}
                        className="p-2 rounded-xl transition-all"
                        title="Fitxa 360"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {!loading && customers.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-2 text-xs sm:flex-row sm:justify-between">
          <span>Pàgina {page} de {totalPages} · {filteredCustomers.length} visibles · {totalCustomers} clients</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="rounded-xl border px-3 py-1 disabled:pointer-events-none disabled:opacity-40"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="rounded-xl border px-3 py-1 disabled:pointer-events-none disabled:opacity-40"
            >
              Següent →
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Afegir Client */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 admin-card-glass flex items-center justify-center z-50 p-4"
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
              className="border rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 id="add-contact-title" className="text-2xl font-bold mb-6">Afegir Client</h2>

              {/* Duplicate warnings */}
              {duplicateWarnings.length > 0 && (
                <div className="mb-5 rounded-xl border p-4">
                  <p className="text-sm font-semibold mb-2">
                    Possibles duplicats detectats
                  </p>
                  {duplicateWarnings.map((dup) => (
                    <Link
                      key={dup.id}
                      href={`/admin/clientes/${dup.id}`}
                      className="flex items-center justify-between rounded-xl border px-3 py-2 mb-1.5 last:mb-0 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">{dup.name}</p>
                        <p className="text-xs">{dup.email}{dup.phone ? ` · ${dup.phone}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          dup.matchScore >= 80 ? 'bg-rose-500/20 text-rose-300' :
                          dup.matchScore >= 50 ? 'bg-amber-500/20 text-amber-300' :
                          'bg-white/5 text-white/40'
                        }`}>
                          {dup.matchScore}%
                        </span>
                        <span className="text-xs">
                          {dup.matchReasons.map((r) => r.field).join(', ')}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {checkingDuplicates && <p className="text-xs mt-2">Comprovant...</p>}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="nc-name" className="block text-sm mb-2">Nom <span className="text-rose-400">*</span></label>
                    <input
                      id="nc-name"
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-1 transition-all ${
                        !newCustomer.name && newCustomer.email ? 'border-rose-500/40' : ''
                      }`}
                      placeholder="Maria García"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="nc-email" className="block text-sm mb-2">Email <span className="text-rose-400">*</span></label>
                    <input
                      id="nc-email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-1 transition-all ${
                        !newCustomer.email && newCustomer.name ? 'border-rose-500/40' : ''
                      }`}
                      placeholder="maria@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="nc-phone" className="block text-sm mb-2">Telèfon</label>
                    <input
                      id="nc-phone"
                      type="tel"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border focus:ring-1 transition-all"
                      placeholder="699 123 456"
                    />
                  </div>

                  <div>
                    <label htmlFor="nc-dni" className="block text-sm mb-2">DNI / NIF / NIE</label>
                    <input
                      id="nc-dni"
                      type="text"
                      value={newCustomer.dni}
                      onChange={(e) => setNewCustomer({ ...newCustomer, dni: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border focus:ring-1 transition-all"
                      placeholder="12345678A"
                    />
                  </div>

                  <div>
                    <label htmlFor="nc-instagram" className="block text-sm mb-2">Instagram</label>
                    <input
                      id="nc-instagram"
                      type="text"
                      value={newCustomer.instagram}
                      onChange={(e) => setNewCustomer({ ...newCustomer, instagram: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border focus:ring-1 transition-all"
                      placeholder="@usuari"
                    />
                  </div>

                  <div>
                    <label htmlFor="nc-source" className="block text-sm mb-2">Font</label>
                    <select
                      id="nc-source"
                      value={newCustomer.source}
                      onChange={(e) => setNewCustomer({ ...newCustomer, source: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border focus:ring-1 transition-all"
                    >
                      <option value="PHONE">Telèfon</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="WALLAPOP">Wallapop</option>
                      <option value="WEBSITE">Web</option>
                      <option value="CONFIGURATOR">Configurador</option>
                      <option value="REFERRAL">Boca-orella</option>
                      <option value="GOOGLE">Google</option>
                      <option value="OTHER">Altre</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="nc-notes" className="block text-sm mb-2">Notes</label>
                  <textarea
                    id="nc-notes"
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border focus:ring-1 transition-all resize-none"
                    rows={2}
                    placeholder="Notes internes..."
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => { setShowAddModal(false); setDuplicateWarnings([]); }}
                  type="button"
                  className="flex-1 py-3 border rounded-xl transition-all"
                >
                  Cancel·lar
                </button>
                <button
                  onClick={handleAddCustomer}
                  disabled={actionLoading || !newCustomer.name || !newCustomer.email}
                  type="button"
                  aria-busy={actionLoading}
                  className="flex-1 py-3 rounded-xl text-white font-bold shadow-lg disabled:opacity-50 transition-all"
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
            className="fixed inset-0 bg-black/60 admin-card-glass flex items-center justify-center z-50 p-4"
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
              className="border rounded-2xl p-6 sm:p-8 max-w-md w-full"
            >
              <h2 id="start-process-title" className="text-2xl font-bold mb-2">🚀 Iniciar Procés</h2>
              <p className="mb-6">
                Per <span className="">{selectedCustomer.name}</span>
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => startProcess('review_request')}
                  disabled={actionLoading}
                  type="button"
                  aria-busy={actionLoading}
                  className="w-full p-4 border rounded-xl text-left transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">⭐</span>
                    <div>
                      <p className="font-medium">Demanar Opinió</p>
                      <p className="text-sm">Envia un correu demanant una opinió</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => startProcess('post_event')}
                  disabled={actionLoading}
                  type="button"
                  aria-busy={actionLoading}
                  className="w-full p-4 border rounded-xl text-left transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🎉</span>
                    <div>
                      <p className="font-medium">Post-esdeveniment complet</p>
                      <p className="text-sm">Canvas 10/10 + Gràcies + Demanar opinió</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => startProcess('welcome')}
                  disabled={actionLoading}
                  type="button"
                  aria-busy={actionLoading}
                  className="w-full p-4 border rounded-xl text-left transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">👋</span>
                    <div>
                      <p className="font-medium">Benvinguda</p>
                      <p className="text-sm">Email de benvinguda + Info empresa</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => startProcess('promo')}
                  disabled={actionLoading}
                  type="button"
                  aria-busy={actionLoading}
                  className="w-full p-4 border rounded-xl text-left transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🎁</span>
                    <div>
                      <p className="font-medium">Promoció</p>
                      <p className="text-sm">Envia oferta o descompte especial</p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowActionModal(false)}
                type="button"
                className="w-full mt-6 py-3 border rounded-xl transition-all"
              >
                Cancel·lar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPage>
  );
}
