'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import {
  VIP_SPEND_THRESHOLD,
  CUSTOMER_SEGMENTS,
  CUSTOMER_LIFECYCLE_LABELS,
  CUSTOMER_LIFECYCLE_VALUES,
  type CustomerLifecycleValue,
} from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import type { Customer, CustomerStats, ExecutionPriority } from './customer-utils';
import { getExecutionPriority } from './customer-utils';
import { AddCustomerModal, StartProcessModal } from './ClientesModals';
import {
  CustomersDesktopTable,
  CustomersEmpty,
  CustomersError,
  CustomersHelpPanel,
  CustomersLoading,
  CustomersMobileList,
  CustomersPagination,
  CustomersPriorityFilters,
  CustomersStatsActions,
  CustomersToolbar,
} from './CustomersPageSections';
import './clientes.css';

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
  const [lifecycleFilter, setLifecycleFilter] = useState<CustomerLifecycleValue | ''>('');
  const [tagFilter, setTagFilter] = useState('');
  const [healthScoreMax, setHealthScoreMax] = useState<number | null>(null);
  const [minSpent, setMinSpent] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [addModalNotes, setAddModalNotes] = useState('');

  const openActionModal = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setShowActionModal(true);
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15000);

    try {
      const params = new URLSearchParams({
        stats: 'true',
        page: String(page),
        limit: String(pageSize),
      });
      if (search) params.set('q', search);
      if (lifecycleFilter) params.set('lifecycleStage', lifecycleFilter);
      if (tagFilter) params.set('tag', tagFilter);
      if (healthScoreMax != null) params.set('healthScoreMax', String(healthScoreMax));
      if (minSpent != null) params.set('minSpent', String(minSpent));

      const response = await fetchWithCsrf(`/api/admin/customers?${params.toString()}`, {
        credentials: 'include',
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('No autoritzat');
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
        tags: Array.isArray(item.tags) ? item.tags as string[] : [],
        lifecycleStage: item.lifecycleStage ? String(item.lifecycleStage) : undefined,
        healthScore: typeof item.healthScore === 'number' ? item.healthScore : null,
      }));

      setCustomers(mappedCustomers);
      setTotalCustomers(Number(payload.total || 0));
      setTotalPages(Number(payload.totalPages || 1));
      setStats((payload.stats as CustomerStats) || null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('La connexió ha trigat massa. Reintenta.');
      } else {
        console.error('Error carregant clients', err);
        setError(err instanceof Error ? err.message : 'Error desconegut');
      }
    } finally {
      clearTimeout(tid);
      setLoading(false);
    }
  }, [page, pageSize, search, lifecycleFilter, tagFilter, healthScoreMax, minSpent]);

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
  }, [search, lifecycleFilter, tagFilter, healthScoreMax, minSpent]);

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
    if (date) setAddModalNotes(`Origen calendari (${date})`);
  }, [searchParams]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="fx-root">
      <div className="cl">
        <div className="cl__pagehead">
          <div className="cl__titles">
            <h1 className="cl__h1">Clients</h1>
            <span className="cl__sub">CRM · Afegeix clients i inicia processos</span>
          </div>
          <CustomersStatsActions stats={stats} />
        </div>

        <div className="cl__content">
          <CustomersHelpPanel />
          <CustomersToolbar
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            customers={customers}
            onAddCustomer={() => setShowAddModal(true)}
          />

          <CrmSegmentFilters
            lifecycleFilter={lifecycleFilter}
            setLifecycleFilter={setLifecycleFilter}
            tagFilter={tagFilter}
            setTagFilter={setTagFilter}
            healthScoreMax={healthScoreMax}
            setHealthScoreMax={setHealthScoreMax}
            minSpent={minSpent}
            setMinSpent={setMinSpent}
            stats={stats}
          />

          {!loading && customers.length > 0 && (
            <CustomersPriorityFilters priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter} />
          )}

          {error && <CustomersError message={error} onRetry={fetchCustomers} />}
          {loading && <CustomersLoading />}
          {!loading && customers.length === 0 && <CustomersEmpty />}

          {!loading && customers.length > 0 && (
            <>
              <CustomersMobileList filteredCustomers={filteredCustomers} onStartProcess={openActionModal} />
              <CustomersDesktopTable filteredCustomers={filteredCustomers} onStartProcess={openActionModal} />
              <CustomersPagination
                page={page}
                totalPages={totalPages}
                filteredCount={filteredCustomers.length}
                totalCustomers={totalCustomers}
                setPage={setPage}
              />
            </>
          )}
        </div>
      </div>

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
                setError(`Possible duplicat detectat automàticament (${duplicateWarnings.length}). Revisa'l abans de continuar.`);
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showActionModal && selectedCustomer && (
          <StartProcessModal
            customer={selectedCustomer}
            reduceMotion={reduceMotion}
            onClose={() => setShowActionModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CRM SEGMENT FILTERS
// ═══════════════════════════════════════════════════════════════════════════

function CrmSegmentFilters({
  lifecycleFilter,
  setLifecycleFilter,
  tagFilter,
  setTagFilter,
  healthScoreMax,
  setHealthScoreMax,
  minSpent,
  setMinSpent,
  stats,
}: {
  lifecycleFilter: CustomerLifecycleValue | '';
  setLifecycleFilter: (v: CustomerLifecycleValue | '') => void;
  tagFilter: string;
  setTagFilter: (v: string) => void;
  healthScoreMax: number | null;
  setHealthScoreMax: (v: number | null) => void;
  minSpent: number | null;
  setMinSpent: (v: number | null) => void;
  stats: CustomerStats | null;
}) {
  const clearAll = () => {
    setLifecycleFilter('');
    setTagFilter('');
    setHealthScoreMax(null);
    setMinSpent(null);
  };

  const hasActiveFilter = lifecycleFilter !== '' || tagFilter !== '' || healthScoreMax != null || minSpent != null;

  return (
    <div>
      <div className="cl__segs">
        {CUSTOMER_SEGMENTS.map((seg) => {
          const isActive =
            ('lifecycleStage' in seg.filter && lifecycleFilter === seg.filter.lifecycleStage) ||
            ('tag' in seg.filter && tagFilter === seg.filter.tag) ||
            ('healthScoreMax' in seg.filter && healthScoreMax === seg.filter.healthScoreMax) ||
            ('minSpent' in seg.filter && minSpent === seg.filter.minSpent);

          const handleClick = () => {
            if (isActive) { clearAll(); return; }
            clearAll();
            if ('lifecycleStage' in seg.filter) {
              setLifecycleFilter(seg.filter.lifecycleStage as CustomerLifecycleValue);
            } else if ('tag' in seg.filter) {
              setTagFilter(seg.filter.tag as string);
            } else if ('healthScoreMax' in seg.filter) {
              setHealthScoreMax(seg.filter.healthScoreMax as number);
            } else if ('minSpent' in seg.filter) {
              setMinSpent(seg.filter.minSpent as number);
            }
          };

          let badge: string | undefined;
          if (seg.id === 'vip' && stats?.vip) badge = String(stats.vip);
          if (seg.id === 'dormant' && stats?.dormant) badge = String(stats.dormant);
          if (seg.id === 'at-risk' && stats?.atRisk) badge = String(stats.atRisk);
          if (seg.id === 'high-value' && stats?.highValue) badge = String(stats.highValue);

          return (
            <button
              key={seg.id}
              type="button"
              onClick={handleClick}
              className={isActive ? 'cl__seg cl__seg--on' : 'cl__seg'}
            >
              <span aria-hidden="true">{seg.icon}</span>
              <span>{seg.label}</span>
              {badge && <span className="cl__seg-badge">{badge}</span>}
            </button>
          );
        })}

        {hasActiveFilter && (
          <button type="button" onClick={clearAll} className="cl__clearfilters">
            Netejar filtres
          </button>
        )}
      </div>

      <div className="cl__lifecycle">
        <label htmlFor="lifecycle-filter">Fase:</label>
        <select
          id="lifecycle-filter"
          value={lifecycleFilter}
          onChange={(e) => {
            clearAll();
            setLifecycleFilter(e.target.value as CustomerLifecycleValue | '');
          }}
          className="cl__lifecycle-sel"
        >
          <option value="">Totes les fases</option>
          {CUSTOMER_LIFECYCLE_VALUES.map((val) => (
            <option key={val} value={val}>{CUSTOMER_LIFECYCLE_LABELS[val]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
