export type CustomerWorkspaceTab =
  | 'summary'
  | 'proposals'
  | 'bookings'
  | 'margin'
  | 'comms'
  | 'tasks'
  | 'discounts'
  | 'leads'
  | 'privacy';

const CUSTOMER_WORKSPACE_TABS: CustomerWorkspaceTab[] = [
  'summary',
  'proposals',
  'bookings',
  'margin',
  'comms',
  'tasks',
  'discounts',
  'leads',
  'privacy',
];

export function parseCustomerWorkspaceTab(value: string | null | undefined): CustomerWorkspaceTab | null {
  return value && CUSTOMER_WORKSPACE_TABS.includes(value as CustomerWorkspaceTab)
    ? (value as CustomerWorkspaceTab)
    : null;
}

export function buildCustomerWorkspaceTabHref(
  customerId: string,
  tab: CustomerWorkspaceTab
): string {
  return `/admin/clientes/${customerId}?tab=${tab}`;
}

export function buildCustomerTaskCreateHref(customerId: string): string {
  return `/admin/tasks/new?customerId=${customerId}`;
}

export function buildCustomerTaskListHref(
  customerId: string,
  options?: {
    view?: 'kanban' | 'list' | null;
    status?: string | null;
    page?: number | null;
  }
): string {
  const params = new URLSearchParams({ customerId });
  if (options?.view) {
    params.set('view', options.view);
  }
  if (options?.status) {
    params.set('status', options.status);
  }
  if (typeof options?.page === 'number' && options.page > 0) {
    params.set('page', String(options.page));
  }
  return `/admin/tasks?${params.toString()}`;
}

export function buildCustomerBookingCreateHref(customerId: string): string {
  return `/admin/bookings/new?customerId=${customerId}`;
}

export function buildCustomerBookingListHref(
  customerId: string,
  options?: {
    view?: string | null;
    status?: string | null;
    eventType?: string | null;
    payment?: string | null;
    fromDate?: string | null;
    toDate?: string | null;
    search?: string | null;
    page?: number | null;
  }
): string {
  const params = new URLSearchParams({ customerId });
  if (options?.view) {
    params.set('view', options.view);
  }
  if (options?.status) {
    params.set('status', options.status);
  }
  if (options?.eventType) {
    params.set('eventType', options.eventType);
  }
  if (options?.payment) {
    params.set('payment', options.payment);
  }
  if (options?.fromDate) {
    params.set('fromDate', options.fromDate);
  }
  if (options?.toDate) {
    params.set('toDate', options.toDate);
  }
  if (options?.search) {
    params.set('search', options.search);
  }
  if (typeof options?.page === 'number' && options.page > 0) {
    params.set('page', String(options.page));
  }
  return `/admin/bookings?${params.toString()}`;
}

export function buildCustomerProposalHref(
  customerId: string,
  proposalId?: string | null
): string {
  const params = new URLSearchParams({ customerId });
  if (proposalId) {
    params.set('proposalId', proposalId);
  }
  return `/admin/presupuestos?${params.toString()}`;
}

export function buildCustomerComposeHref(
  customerId: string,
  template?: string | null
): string {
  const params = new URLSearchParams({ customerId });
  if (template) {
    params.set('template', template);
  }
  return `/admin/inbox/compose?${params.toString()}`;
}
