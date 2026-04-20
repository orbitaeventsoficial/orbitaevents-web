import Link from 'next/link';
import { AdminEmptyState } from '../components/AdminPage';
import { AdminHelpPanel } from '../components/AdminHelpPanel';
import ExportCsvButton from '../components/ExportCsvButton';
import { ADMIN_CUSTOMERS_LIST_HELP, helpAttrs } from '../components/adminHelpContent';
import { getCustomerSourceLabel } from '@/lib/constants';
import type { Customer, CustomerStats, ExecutionPriority } from './customer-utils';
import { PRIORITY_FILTER_STYLES, getNextStep } from './customer-utils';

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
    <div className="flex gap-3 flex-wrap">
      <CustomerStatCard label="Total" value={stats.total} />
      <CustomerStatCard label="VIP" value={stats.vip} />
      <CustomerStatCard label="Amb esdeveniments" value={stats.withEvents} />
    </div>
  );
}

function CustomerStatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border admin-card-glass px-4 py-3 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
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
          {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.search)}
        />
      </div>

      <div className="flex gap-2" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.toolbar)}>
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
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all"
          {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.addCustomer)}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <div className="flex flex-wrap justify-center gap-2" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.priorityFilters)}>
      {(['ALL', 'ALTA', 'MITJANA', 'BAIXA'] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setPriorityFilter(value)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
            priorityFilter === value ? PRIORITY_FILTER_STYLES[value] : 'admin-tone-idle'
          }`}
        >
          {value === 'ALL' ? 'Totes prioritats' : `Prioritat ${value.toLowerCase()}`}
        </button>
      ))}
    </div>
  );
}

export function CustomersError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="border rounded-xl p-4 flex items-center justify-between" role="alert">
      <p className="text-amber-400">{message}</p>
      <button type="button" onClick={onRetry} className="ap-btn ap-btn--primary text-sm">Reintentar</button>
    </div>
  );
}

export function CustomersLoading() {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
    </div>
  );
}

export function CustomersEmpty() {
  return (
    <div role="status" aria-live="polite">
      <AdminEmptyState
        icon="👥"
        title="No hi ha clients"
        description="Els clients es creen automàticament a partir de reserves confirmades. També pots afegir-ne manualment."
      />
    </div>
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
    <section className="lg:hidden space-y-3" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.mobileList)}>
      {filteredCustomers.map(({ customer, priority }) => {
        const nextStep = getNextStep(customer);
        return (
          <article
            key={customer.id}
            className="ap-card block rounded-2xl p-4 transition-colors hover:admin-tone-bg-neutral"
            {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.mobileCard(customer.name, priority.level))}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-medium truncate">
                    {customer.customerNumber != null && <span className="mr-1.5 text-[10px] font-mono text-white/40">CLI-{String(customer.customerNumber).padStart(4, '0')}</span>}
                    {customer.name}
                    {customer.is_vip && <span className="ml-2 px-2 py-0.5 text-[10px] rounded-full font-medium bg-amber-500/20 text-amber-300">VIP</span>}
                  </p>
                </div>
                {customer.city && <p className="text-xs mt-1 ml-10">{customer.city}</p>}
                {customer.email && <p className="text-xs mt-0.5 ml-10 truncate">{customer.email}</p>}
                {customer.phone && <p className="text-xs mt-0.5 ml-10">{customer.phone}</p>}
              </div>
              <div className="text-right shrink-0">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${priority.level === 'ALTA' ? 'admin-tone-soft-danger' : priority.level === 'MITJANA' ? 'bg-amber-500/20 text-amber-300' : 'admin-tone-soft-success'}`}>
                  {priority.level}
                </span>
                <p className="text-xs mt-1">{customer.total_events} events</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3 admin-tone-border-neutral">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${customer.source === 'manual' ? 'bg-purple-500/20 text-purple-300' : customer.source === 'web' ? 'admin-tone-soft-success' : customer.source === 'testimonial_form' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/40'}`}>
                  {getCustomerSourceLabel(customer.source)}
                </span>
                <Link href={nextStep.href} className="text-[11px] font-medium">{nextStep.label} →</Link>
              </div>
              <div className="flex gap-2" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.toolbar)}>
                <button onClick={() => onStartProcess(customer)} type="button" className="p-2.5 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center" title="Iniciar procés" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.startProcess)}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <Link href={`/admin/clientes/${customer.id}`} className="p-2.5 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center" title="Fitxa 360" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.customerFile)}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </Link>
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
    <section className="hidden lg:block rounded-2xl border p-0 admin-card-glass overflow-hidden" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.desktopTable)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1060px] text-sm" aria-label="Llistat de clients">
          <thead>
            <tr className="border-b transition-colors hover:bg-white/[0.03]">
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
                <tr key={customer.id} className="border-b transition-colors hover:bg-white/[0.03]">
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold">{customer.name.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="font-medium flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis">
                          {customer.customerNumber != null && <span className="text-[10px] font-mono text-white/40">CLI-{String(customer.customerNumber).padStart(4, '0')}</span>}
                          {customer.name}
                          {customer.is_vip && <span className="px-2 py-0.5 text-xs rounded-full font-medium">VIP</span>}
                        </p>
                        {customer.city && <p className="text-sm truncate">{customer.city}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell text-center">
                    <div className="space-y-1 min-w-0">
                      {customer.email && <p className="text-sm flex items-center justify-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg><span className="max-w-[240px] truncate">{customer.email}</span></p>}
                      {customer.phone && <p className="text-sm flex items-center justify-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>{customer.phone}</p>}
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell text-center"><span className={`px-3 py-1 rounded-full text-xs font-medium ${customer.source === 'manual' ? 'bg-purple-500/20 text-purple-300' : customer.source === 'web' ? 'admin-tone-soft-success' : customer.source === 'testimonial_form' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/40'}`}>{getCustomerSourceLabel(customer.source)}</span></td>
                  <td className="p-4 hidden sm:table-cell text-center">{customer.total_events || 0}</td>
                  <td className="p-4 hidden xl:table-cell text-center"><span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${priority.level === 'ALTA' ? 'admin-tone-soft-danger' : priority.level === 'MITJANA' ? 'bg-amber-500/20 text-amber-300' : 'admin-tone-soft-success'}`} title={priority.hint}>{priority.level}</span></td>
                  <td className="p-4 hidden xl:table-cell text-center"><div className="space-y-1"><Link href={nextStep.href} className="inline-flex rounded-xl border px-2 py-1 text-xs font-semibold">{nextStep.label}</Link><p className="text-[11px]">{nextStep.hint}</p></div></td>
                  <td className="p-4 text-center">
                    <div className="flex flex-wrap justify-center gap-2" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.rowActions)}>
                      <button onClick={() => onStartProcess(customer)} type="button" className="p-2 rounded-xl transition-all" title="Iniciar procés" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.startProcess)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                      <Link href={`/admin/clientes/${customer.id}`} className="p-2 rounded-xl transition-all" title="Fitxa 360" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.customerFile)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
    <div className="flex flex-col items-center justify-center gap-2 text-xs sm:flex-row sm:justify-between" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.pagination)}>
      <span>Pàgina {page} de {totalPages} · {filteredCount} visibles · {totalCustomers} clients</span>
      <div className="flex gap-2" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.toolbar)}>
        <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1} className="rounded-xl border px-3 py-1 disabled:pointer-events-none disabled:opacity-40" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.previousPage)}>
          ← Anterior
        </button>
        <button type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages} className="rounded-xl border px-3 py-1 disabled:pointer-events-none disabled:opacity-40" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.nextPage)}>
          Següent →
        </button>
      </div>
    </div>
  );
}
