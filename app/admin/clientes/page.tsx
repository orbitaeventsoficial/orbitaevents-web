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
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { VIP_SPEND_THRESHOLD } from '@/lib/constants';
import { AdminPage } from '../components/AdminPage';
import ExportCsvButton from '../components/ExportCsvButton';
import { fetchWithCsrf } from '@/lib/csrf';
import type { Customer, CustomerStats, ExecutionPriority } from './customer-utils';
import { SOURCE_LABELS, PRIORITY_FILTER_STYLES, getNextStep, getExecutionPriority } from './customer-utils';
import { AddCustomerModal, StartProcessModal } from './ClientesModals';

export default function AdminContactesPage() {
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
  const [addModalNotes, setAddModalNotes] = useState('');


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
        customerNumber: typeof item.customerNumber === 'number' ? item.customerNumber : null,
        name: String(item.name || ''),
        email: String(item.email || ''),
        phone: item.phone ? String(item.phone) : null,
        city: item.city ? String(item.city) : null,
        instagram: item.instagram ? String(item.instagram) : null,
        source: item.source ? String(item.source).toLowerCase() : undefined,
        total_events: typeof item.totalEvents === 'number' ? item.totalEvents : 0,
        total_spent: typeof item.totalSpent === 'number' ? item.totalSpent : 0,
        is_vip: typeof item.totalSpent === 'number' ? item.totalSpent >= VIP_SPEND_THRESHOLD : false,
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
      setAddModalNotes(`Origen calendari (${date})`);
    }
  }, [searchParams]);


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

      {/* Customers List — Mobile cards */}
      {!loading && customers.length > 0 && (
        <section className="lg:hidden space-y-3">
          {filteredCustomers.map(({ customer, priority }) => {
            const nextStep = getNextStep(customer);
            return (
              <article
                key={customer.id}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium truncate">
                        {customer.customerNumber != null && (
                          <span className="mr-1.5 text-[10px] font-mono text-white/40">CLI-{String(customer.customerNumber).padStart(4, '0')}</span>
                        )}
                        {customer.name}
                        {customer.is_vip && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] rounded-full font-medium bg-amber-500/20 text-amber-300">VIP</span>
                        )}
                      </p>
                    </div>
                    {customer.city && <p className="text-xs mt-1 ml-10">{customer.city}</p>}
                    {customer.email && <p className="text-xs mt-0.5 ml-10 truncate">{customer.email}</p>}
                    {customer.phone && <p className="text-xs mt-0.5 ml-10">{customer.phone}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      priority.level === 'ALTA' ? 'admin-tone-soft-danger'
                        : priority.level === 'MITJANA' ? 'bg-amber-500/20 text-amber-300'
                        : 'admin-tone-soft-success'
                    }`}>
                      {priority.level}
                    </span>
                    <p className="text-xs mt-1">{customer.total_events} events</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                      customer.source === 'manual' ? 'bg-purple-500/20 text-purple-300'
                        : customer.source === 'web' ? 'admin-tone-soft-success'
                        : customer.source === 'testimonial_form' ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-white/5 text-white/40'
                    }`}>
                      {SOURCE_LABELS[customer.source || ''] || customer.source || 'Desconeguda'}
                    </span>
                    <Link href={nextStep.href} className="text-[11px] font-medium">
                      {nextStep.label} →
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedCustomer(customer); setShowActionModal(true); }}
                      type="button"
                      className="p-2.5 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Iniciar procés"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <Link
                      href={`/admin/clientes/${customer.id}`}
                      className="p-2.5 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Fitxa 360"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Customers List — Desktop table */}
      {!loading && customers.length > 0 && (
        <section className="hidden lg:block rounded-2xl border p-0 admin-card-glass overflow-hidden">
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
                        <p className="font-medium flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis">
                          {customer.customerNumber != null && (
                            <span className="text-[10px] font-mono text-white/40">CLI-{String(customer.customerNumber).padStart(4, '0')}</span>
                          )}
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
                      customer.source === 'web' ? 'admin-tone-soft-success' :
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
                          ? 'admin-tone-soft-danger'
                          : priority.level === 'MITJANA'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'admin-tone-soft-success'
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
        </section>
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
          <AddCustomerModal
            reduceMotion={reduceMotion}
            initialNotes={addModalNotes}
            onClose={() => setShowAddModal(false)}
            onCreated={(customer, duplicateWarnings) => {
              if (page === 1) {
                fetchCustomers();
              } else {
                setPage(1);
              }
              setShowAddModal(false);
              setSelectedCustomer(customer);
              setShowActionModal(true);
              if (duplicateWarnings.length > 0) {
                setError(
                  `Possible duplicat detectat automàticament (${duplicateWarnings.length}). Revisa'l abans de continuar.`
                );
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* MODAL: Iniciar Procés */}
      <AnimatePresence>
        {showActionModal && selectedCustomer && (
          <StartProcessModal
            customer={selectedCustomer}
            reduceMotion={reduceMotion}
            onClose={() => setShowActionModal(false)}
          />
        )}
      </AnimatePresence>
    </AdminPage>
  );
}


