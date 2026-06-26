import Link from 'next/link';
import { AdminHelpPanel } from '../components/AdminHelpPanel';
import ExportCsvButton from '../components/ExportCsvButton';
import { ADMIN_CUSTOMERS_LIST_HELP, helpAttrs } from '../components/adminHelpContent';
import { getCustomerSourceLabel } from '@/lib/constants';
import type { Customer, CustomerStats, ExecutionPriority } from './customer-utils';
import { getNextStep } from './customer-utils';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';

function sourceBadgeClass(source?: string): string {
  if (source === 'manual') return 'cl__badge cl__badge--src-manual';
  if (source === 'web') return 'cl__badge cl__badge--src-web';
  if (source === 'testimonial_form') return 'cl__badge cl__badge--src-form';
  return 'cl__badge cl__badge--src-other';
}

function priorityBadgeClass(level: ExecutionPriority): string {
  if (level === 'ALTA') return 'cl__badge cl__badge--alta';
  if (level === 'MITJANA') return 'cl__badge cl__badge--mitjana';
  return 'cl__badge cl__badge--baixa';
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
    <div className="cl__kpis">
      <div className="cl__kpi"><b>{stats.total}</b><span>Total</span></div>
      <div className="cl__kpi"><b>{stats.vip}</b><span>VIP</span></div>
      <div className="cl__kpi"><b>{stats.withEvents}</b><span>Amb events</span></div>
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
    <div className="cl__toolbar">
      <div className="cl__searchbox">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Cercar per nom, email, telèfon, Instagram o codi descompte"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Cercar client"
          className="cl__searchinput"
          {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.search)}
        />
      </div>

      <div className="cl__toolbtns" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.toolbar)}>
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
          className="cl__add"
          {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.addCustomer)}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
  const activeClass = (value: 'ALL' | ExecutionPriority): string => {
    if (priorityFilter !== value) return 'cl__prio';
    if (value === 'ALL') return 'cl__prio cl__prio--all-on';
    if (value === 'ALTA') return 'cl__prio cl__prio--alta-on';
    if (value === 'MITJANA') return 'cl__prio cl__prio--mitjana-on';
    return 'cl__prio cl__prio--baixa-on';
  };

  return (
    <div className="cl__prios" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.priorityFilters)}>
      {(['ALL', 'ALTA', 'MITJANA', 'BAIXA'] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setPriorityFilter(value)}
          className={activeClass(value)}
        >
          {value === 'ALL' ? 'Totes prioritats' : `Prioritat ${value.toLowerCase()}`}
        </button>
      ))}
    </div>
  );
}

export function CustomersError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="cl__error" role="alert">
      <p>{message}</p>
      <button type="button" onClick={onRetry} className="cl__error-retry">Reintentar</button>
    </div>
  );
}

export function CustomersLoading() {
  return (
    <div className="cl__loading" role="status" aria-live="polite">
      <div className="cl__spinner" aria-label="Carregant…" />
    </div>
  );
}

export function CustomersEmpty() {
  return (
    <div className="cl__empty" role="status" aria-live="polite">
      No hi ha clients. Els clients es creen automàticament a partir de reserves confirmades. També pots afegir-ne manualment.
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
    <section className="cl__cards" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.mobileList)}>
      {filteredCustomers.map(({ customer, priority }) => {
        const nextStep = getNextStep(customer);
        return (
          <article
            key={customer.id}
            className="cl__card"
            {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.mobileCard(customer.name, priority.level))}
          >
            <div className="cl__card-top">
              <div className="cl__card-info">
                <div className="cl__card-nameline">
                  <div className="cl__avatar">{customer.name.charAt(0).toUpperCase()}</div>
                  <span className="cl__name">
                    {customer.customerNumber != null && (
                      <span className="cl__code">CLI-{String(customer.customerNumber).padStart(4, '0')}</span>
                    )}
                    {customer.name}
                    {customer.is_vip && <span className="cl__badge cl__badge--vip">VIP</span>}
                  </span>
                </div>
                {customer.city && <p className="cl__card-meta">{customer.city}</p>}
                {customer.email && <p className="cl__card-meta">{customer.email}</p>}
                {customer.phone && <p className="cl__card-meta">{customer.phone}</p>}
              </div>
              <div className="cl__card-right">
                <span className={priorityBadgeClass(priority.level)} title={priority.hint}>{priority.level}</span>
                <p className="cl__card-meta">{customer.total_events} events</p>
              </div>
            </div>
            <div className="cl__card-footer">
              <div className="cl__card-footleft">
                <span className={sourceBadgeClass(customer.source)}>{getCustomerSourceLabel(customer.source)}</span>
                <Link href={nextStep.href} className="cl__nextstep-link">{nextStep.label} →</Link>
              </div>
              <div className="cl__rowacts" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.toolbar)}>
                <button
                  onClick={() => onStartProcess(customer)}
                  type="button"
                  className="cl__rowbtn"
                  title="Iniciar procés"
                  {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.startProcess)}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <Link
                  href={buildCustomerHubHref(customer.id)}
                  className="cl__rowbtn"
                  title="Fitxa 360"
                  {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.customerFile)}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
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
    <section className="cl__tablewrap" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.desktopTable)}>
      <table className="cl__table" aria-label="Llistat de clients">
        <thead>
          <tr>
            <th scope="col">Nom</th>
            <th scope="col">Contacte</th>
            <th scope="col">Font</th>
            <th scope="col">Esdeveniments</th>
            <th scope="col">Prioritat</th>
            <th scope="col">Proper pas</th>
            <th scope="col">Accions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map(({ customer, priority }) => {
            const nextStep = getNextStep(customer);
            return (
              <tr key={customer.id}>
                <td>
                  <div className="cl__namecell">
                    <div className="cl__avatar">{customer.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <span className="cl__name">
                        {customer.customerNumber != null && (
                          <span className="cl__code">CLI-{String(customer.customerNumber).padStart(4, '0')}</span>
                        )}
                        {customer.name}
                        {customer.is_vip && <span className="cl__badge cl__badge--vip">VIP</span>}
                      </span>
                      {customer.city && <span className="cl__city">{customer.city}</span>}
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
                  <div className="cl__nextstep">
                    <Link href={nextStep.href} className="cl__nextstep-link">{nextStep.label}</Link>
                    <span className="cl__nextstep-hint">{nextStep.hint}</span>
                  </div>
                </td>
                <td>
                  <div className="cl__rowacts" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.rowActions)}>
                    <button
                      onClick={() => onStartProcess(customer)}
                      type="button"
                      className="cl__rowbtn"
                      title="Iniciar procés"
                      {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.startProcess)}
                    >
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <Link
                      href={buildCustomerHubHref(customer.id)}
                      className="cl__rowbtn"
                      title="Fitxa 360"
                      {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.customerFile)}
                    >
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
    <div className="cl__pager" {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.pagination)}>
      <span>Pàgina {page} de {totalPages} · {filteredCount} visibles · {totalCustomers} clients</span>
      <div className="cl__pager-btns">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
          className="cl__pager-btn"
          {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.previousPage)}
        >
          ← Anterior
        </button>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages}
          className="cl__pager-btn"
          {...helpAttrs(ADMIN_CUSTOMERS_LIST_HELP.nextPage)}
        >
          Següent →
        </button>
      </div>
    </div>
  );
}
