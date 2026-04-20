import { describe, expect, it } from 'vitest';

import {
  buildCustomerHubTaskHref,
  getCustomerHubTaskNotice,
} from '@/lib/customer-hub/taskResultNotice';
import {
  buildCustomerBookingListHref,
  buildCustomerBookingCreateHref,
  buildCustomerComposeHref,
  buildCustomerProposalHref,
  buildCustomerTaskCreateHref,
  buildCustomerTaskListHref,
  buildCustomerWorkspaceTabHref,
  parseCustomerWorkspaceTab,
} from '@/lib/admin/customerWorkspaceHref';

describe('parseCustomerWorkspaceTab', () => {
  it('accepta tabs vàlids del Customer Hub', () => {
    expect(parseCustomerWorkspaceTab('tasks')).toBe('tasks');
    expect(parseCustomerWorkspaceTab('summary')).toBe('summary');
  });

  it('ignora tabs invàlids', () => {
    expect(parseCustomerWorkspaceTab('unknown')).toBeNull();
    expect(parseCustomerWorkspaceTab(null)).toBeNull();
  });
});

describe('getCustomerHubTaskNotice', () => {
  it('retorna notice per reactivació creada', () => {
    expect(getCustomerHubTaskNotice('reactivation', 'created')).toBe('Tasca de reactivació creada.');
  });

  it('retorna notice per reactivació deduplicada o reoberta', () => {
    expect(getCustomerHubTaskNotice('reactivation', 'deduped')).toContain('reutilitzat');
    expect(getCustomerHubTaskNotice('reactivation', 'reopened')).toContain('reobert');
  });

  it('no retorna notice fora del flux de reactivació', () => {
    expect(getCustomerHubTaskNotice('manual', 'created')).toBeNull();
    expect(getCustomerHubTaskNotice('reactivation', 'other')).toBeNull();
  });
});

describe('buildCustomerHubTaskHref', () => {
  it('construeix links canònics cap als workspaces externs del Customer Hub', () => {
    expect(buildCustomerTaskCreateHref('cust-1')).toBe('/admin/tasks/new?customerId=cust-1');
    expect(buildCustomerTaskListHref('cust-1')).toBe('/admin/tasks?customerId=cust-1');
    expect(buildCustomerTaskListHref('cust-1', { view: 'list', status: 'OPEN', page: 2 })).toBe(
      '/admin/tasks?customerId=cust-1&view=list&status=OPEN&page=2'
    );
    expect(buildCustomerBookingCreateHref('cust-1')).toBe('/admin/bookings/new?customerId=cust-1');
    expect(buildCustomerBookingListHref('cust-1')).toBe('/admin/bookings?customerId=cust-1');
    expect(
      buildCustomerBookingListHref('cust-1', {
        status: 'CONFIRMED',
        payment: 'overdue',
        view: 'kanban',
        page: 3,
      })
    ).toBe('/admin/bookings?customerId=cust-1&view=kanban&status=CONFIRMED&payment=overdue&page=3');
    expect(buildCustomerProposalHref('cust-1')).toBe('/admin/presupuestos?customerId=cust-1');
    expect(buildCustomerProposalHref('cust-1', 'prop-1')).toBe('/admin/presupuestos?customerId=cust-1&proposalId=prop-1');
    expect(buildCustomerComposeHref('cust-1')).toBe('/admin/inbox/compose?customerId=cust-1');
    expect(buildCustomerComposeHref('cust-1', 'recordatori')).toBe(
      '/admin/inbox/compose?customerId=cust-1&template=recordatori'
    );
  });

  it('construeix href net per una pestanya del Customer Hub', () => {
    expect(buildCustomerWorkspaceTabHref('cust-1', 'tasks')).toBe('/admin/clientes/cust-1?tab=tasks');
  });

  it('construeix retorn a tasks amb resultat explícit', () => {
    expect(buildCustomerHubTaskHref('cust-1', 'reactivation', 'reopened')).toBe(
      '/admin/clientes/cust-1?tab=tasks&taskSource=reactivation&taskResult=reopened'
    );
  });

  it('manté només el tab si no hi ha taskSource contextual', () => {
    expect(buildCustomerHubTaskHref('cust-1', null, 'created')).toBe('/admin/clientes/cust-1?tab=tasks');
  });
});
