import Link from 'next/link';
import { AdminHelpPanel } from '../components/AdminHelpPanel';
import ExportCsvButton from '../components/ExportCsvButton';
import { AdminKpiRow, AdminKpi, AdminEmptyState } from '../components/AdminPage';
import { ADMIN_CUSTOMERS_LIST_HELP, helpAttrs } from '../components/adminHelpContent';
import { getCustomerSourceLabel } from '@/lib/constants';
import type { Customer, CustomerStats, ExecutionPriority } from './customer-utils';
import { getNextStep } from './customer-utils';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';

function sourceBadgeClass(source?: string): string {
  if (source === 'web') return 'ap-badge ap-badge--success';
  if (source === 'testimonial_form') return 'ap-badge ap-badge--warning';
  return 'ap-badge';
}

function priorityBadgeClass(level: ExecutionPriority): string {
  if (level === 'ALTA') return 'ap-badge ap-badge--danger';
  if (level === 'MITJANA') return 'ap-badge ap-badge--warning';
  return 'ap-badge ap-badge--success';
}

function CustomerAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--gold)_14%,var(--raised))] text-sm font-bold text-[var(--gold-bright)]">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CustomerName({ customer }: { customer: Customer }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 font-bold text-[var(--t)]">
      {customer.customerNumber != null && (
        <span className="block w-full font-mono text-xs text-[var(--t3)]">
          CLI-{String(customer.customerNumber).padStart(4, '0')}
        </span>
      )}
      {customer.name}
      {customer.is_vip && <span className="ap-badge text-[var(--gold-bright)]">VIP</span>}
    </span>
  );
}

export function CustomersHelpPanel() {
  return (
    <AdminHelpPanel
      title="Com treballar clients"
      description="Aquesta pantalla és el centre del CRM. Serveix per trobar persones ràpid, entendre qui necessita atenció i saber quin és el pas següent."
      items={[
        { title: 'Prioritat', body: 'La prioritat t ajuda a saber a qui convé moure abans.' },
        { title: 'Proper pas', body: 'Cada fila t orienta sobre la millor acció per fer avançar la relació.' },
        { title: 'Fitxa 360', body: 'La fitxa et dona la visió completa del client sense haver d anar buscant dades.' },
      ]}
    />
  );
}

export function CustomersStatsActions({ stats }: { stats: CustomerStats | null }) {
  if (!stats) return null;

  return (
    <AdminKpiRow>
      <AdminKpi label="Total" value={stats.total} />
      <AdminKpi label="VIP" value={stats.vip} />
      <AdminKpi label="Amb events" value={stats.withEvents} />
    </AdminKpiRow>
  );
}


export function CustomersToolbar({
  searchInput,
  setSearchInput,
  customers,
  onAddCustomer,
}: {
  searchInput: string;
  setSearchInput: (value: string) => void;
  customers: Customer[];
  onAddCustomer: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <svg
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--t3)]"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Cercar per nom, email, telèfon, Instagram o codi descompte"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Cercar client"
          className="adm-input pl-10"
          {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.search)}
        />
      </div>

      <div className="flex items-center gap-2" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.toolbar)}>
        <ExportCsvButton
          filename="clients"
          headers={['Nom', 'Email', 'Telèfon', 'Ciutat', 'Font', 'Esdeveniments', 'Despesa total', 'VIP']}
          rows={customers.map((c) => [
            c.name,
            c.email,
            c.phone || '',
            c.city || '',
            getCustomerSourceLabel(c.source, ''),
            String(c.total_events),
            String(c.total_spent),
            c.is_vip ? 'Sí' : 'No',
          ])}
        />
        <button
          onClick={onAddCustomer}
          type="button"
          className="ap-btn ap-btn--primary"
          {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.addCustomer)}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Afegir Client
        </button>
      </div>
    </div>
  );
}

export function CustomersPriorityFilters({
  priorityFilter,
  setPriorityFilter,
}: {
  priorityFilter: 'ALL' | ExecutionPriority;
  setPriorityFilter: (value: 'ALL' | ExecutionPriority) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.priorityFilters)}>
      {(['ALL', 'ALTA', 'MITJANA', 'BAIXA'] as const).map((value) => {
        const active = priorityFilter === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPriorityFilter(value)}
            aria-pressed={active}
            className={`ap-btn ap-btn--xs ${active ? 'ap-btn--primary' : ''}`}
          >
            {value === 'ALL' ? 'Totes prioritats' : `Prioritat ${value.toLowerCase()}`}
          </button>
        );
      })}
    </div>
  );
}

export function CustomersError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--o-r-md)] border admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger p-4 text-sm"
    >
      <p>{message}</p>
      <button type="button" onClick={onRetry} className="ap-btn ap-btn--xs">Reintentar</button>
    </div>
  );
}

export function CustomersLoading() {
  return (
    <div className="flex flex-col gap-2" role="status" aria-live="polite" aria-label="Carregant clients">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton h-14 rounded-[var(--o-r-md)]" />
      ))}
    </div>
  );
}

export function CustomersEmpty() {
  return (
    <AdminEmptyState
      icon="🗂️"
      title="No hi ha clients"
      description="Els clients es creen automàticament a partir de reserves confirmades. També pots afegir-ne manualment."
    />
  );
}

export function CustomersMobileList({
  filteredCustomers,
  onStartProcess,
}: {
  filteredCustomers: Array<{ customer: Customer; priority: { level: ExecutionPriority; score: number; hint: string } }>;
  onStartProcess: (customer: Customer) => void;
}) {
  return (
    <section className="flex flex-col gap-2 lg:hidden" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.mobileList)}>
      {filteredCustomers.map(({ customer, priority }) => {
        const nextStep = getNextStep(customer);
        return (
          <article
            key={customer.id}
            className="ap-card"
            {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.mobileCard(customer.name, priority.level))}
          >
            <div className="ap-card-body">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CustomerAvatar name={customer.name} />
                    <CustomerName customer={customer} />
                  </div>
                  {customer.city && <p className="mt-0.5 text-xs text-[var(--t3)]">{customer.city}</p>}
                  {customer.email && <p className="mt-0.5 text-xs text-[var(--t3)]">{customer.email}</p>}
                  {customer.phone && <p className="mt-0.5 text-xs text-[var(--t3)]">{customer.phone}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <span className={priorityBadgeClass(priority.level)} title={priority.hint}>{priority.level}</span>
                  <p className="mt-0.5 text-xs text-[var(--t3)]">{customer.total_events} events</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[var(--line)] pt-2.5">
                <div className="flex items-center gap-2">
                  <span className={sourceBadgeClass(customer.source)}>{getCustomerSourceLabel(customer.source)}</span>
                  <Link href={nextStep.href} className="ap-btn ap-btn--xs">{nextStep.label} →</Link>
                </div>
                <div className="flex items-center gap-1.5" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.toolbar)}>
                  <button
                    onClick={() => onStartProcess(customer)}
                    type="button"
                    className="ap-btn ap-btn--xs"
                    title="Iniciar procés"
                    {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.startProcess)}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <Link
                    href={buildCustomerHubHref(customer.id)}
                    className="ap-btn ap-btn--xs"
                    title="Fitxa 360"
                    {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.customerFile)}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function CustomersDesktopTable({
  filteredCustomers,
  onStartProcess,
}: {
  filteredCustomers: Array<{ customer: Customer; priority: { level: ExecutionPriority; score: number; hint: string } }>;
  onStartProcess: (customer: Customer) => void;
}) {
  return (
    <section className="ap-table-wrap hidden lg:block" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.desktopTable)}>
      <table className="ap-table min-w-[53rem]" aria-label="Llistat de clients">
        <thead className="ap-table-head">
          <tr>
            <th scope="col" className="ap-table-th">Nom</th>
            <th scope="col" className="ap-table-th">Contacte</th>
            <th scope="col" className="ap-table-th">Font</th>
            <th scope="col" className="ap-table-th">Esdeveniments</th>
            <th scope="col" className="ap-table-th">Prioritat</th>
            <th scope="col" className="ap-table-th">Proper pas</th>
            <th scope="col" className="ap-table-th">Accions</th>
          </tr>
        </thead>
        <tbody className="ap-table-body">
          {filteredCustomers.map(({ customer, priority }) => {
            const nextStep = getNextStep(customer);
            return (
              <tr key={customer.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <CustomerAvatar name={customer.name} />
                    <div>
                      <CustomerName customer={customer} />
                      {customer.city && <span className="block text-xs text-[var(--t3)]">{customer.city}</span>}
                    </div>
                  </div>
                </td>
                <td>
                  {customer.email && <div>{customer.email}</div>}
                  {customer.phone && <div>{customer.phone}</div>}
                </td>
                <td>
                  <span className={sourceBadgeClass(customer.source)}>{getCustomerSourceLabel(customer.source)}</span>
                </td>
                <td>{customer.total_events || 0}</td>
                <td>
                  <span className={priorityBadgeClass(priority.level)} title={priority.hint}>{priority.level}</span>
                </td>
                <td>
                  <div className="flex flex-col gap-1">
                    <Link href={nextStep.href} className="ap-btn ap-btn--xs">{nextStep.label}</Link>
                    <span className="text-xs text-[var(--t3)]">{nextStep.hint}</span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1.5" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.rowActions)}>
                    <button
                      onClick={() => onStartProcess(customer)}
                      type="button"
                      className="ap-btn ap-btn--xs"
                      title="Iniciar procés"
                      {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.startProcess)}
                    >
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <Link
                      href={buildCustomerHubHref(customer.id)}
                      className="ap-btn ap-btn--xs"
                      title="Fitxa 360"
                      {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.customerFile)}
                    >
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export function CustomersPagination({
  page,
  totalPages,
  filteredCount,
  totalCustomers,
  setPage,
}: {
  page: number;
  totalPages: number;
  filteredCount: number;
  totalCustomers: number;
  setPage: (updater: (prev: number) => number) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2.5 font-mono text-xs text-[var(--t3)]"
      {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.pagination)}
    >
      <span>Pàgina {page} de {totalPages} · {filteredCount} visibles · {totalCustomers} clients</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
          className="ap-btn ap-btn--xs"
          {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.previousPage)}
        >
          ← Anterior
        </button>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages}
          className="ap-btn ap-btn--xs"
          {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.nextPage)}
        >
          Següent →
        </button>
      </div>
    </div>
  );
}
