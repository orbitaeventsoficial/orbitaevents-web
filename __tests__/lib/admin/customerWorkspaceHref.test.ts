import { describe, expect, it } from 'vitest';
import {
  parseCustomerWorkspaceTab,
  buildCustomerHubHref,
  buildCustomerWorkspaceTabHref,
  buildCustomerTaskCreateHref,
  buildCustomerTaskListHref,
  buildCustomerBookingCreateHref,
  buildCustomerBookingListHref,
  buildCustomerProposalHref,
  buildCustomerComposeHref,
} from '@/lib/admin/customerWorkspaceHref';

describe('parseCustomerWorkspaceTab', () => {
  it('retorna la tab vàlida', () => {
    expect(parseCustomerWorkspaceTab('summary')).toBe('summary');
    expect(parseCustomerWorkspaceTab('bookings')).toBe('bookings');
    expect(parseCustomerWorkspaceTab('comms')).toBe('comms');
  });

  it('retorna null per valors invàlids o buits', () => {
    expect(parseCustomerWorkspaceTab(null)).toBeNull();
    expect(parseCustomerWorkspaceTab(undefined)).toBeNull();
    expect(parseCustomerWorkspaceTab('')).toBeNull();
    expect(parseCustomerWorkspaceTab('invalid-tab')).toBeNull();
  });
});

describe('buildCustomerHubHref', () => {
  it("construeix la URL de l'entrada genèrica al Customer Hub", () => {
    expect(buildCustomerHubHref('cust-1')).toBe('/admin/clientes/cust-1');
    expect(buildCustomerHubHref('abc123')).toBe('/admin/clientes/abc123');
  });
});

describe('buildCustomerWorkspaceTabHref', () => {
  it('construeix la URL de la pestanya del hub de client', () => {
    expect(buildCustomerWorkspaceTabHref('cust-1', 'summary')).toBe(
      '/admin/clientes/cust-1?tab=summary',
    );
    expect(buildCustomerWorkspaceTabHref('cust-2', 'leads')).toBe(
      '/admin/clientes/cust-2?tab=leads',
    );
  });
});

describe('buildCustomerTaskCreateHref', () => {
  it('construeix la URL de creació de tasca per a un client', () => {
    expect(buildCustomerTaskCreateHref('cust-1')).toBe('/admin/tasks/new?customerId=cust-1');
  });
});

describe('buildCustomerTaskListHref', () => {
  it('construeix la URL del llistat de tasques amb customerId', () => {
    expect(buildCustomerTaskListHref('cust-1')).toBe('/admin/tasks?customerId=cust-1');
  });

  it('afegeix opcionals view, status i page quan es passen', () => {
    const href = buildCustomerTaskListHref('cust-1', { view: 'kanban', status: 'OPEN', page: 2 });
    expect(href).toContain('customerId=cust-1');
    expect(href).toContain('view=kanban');
    expect(href).toContain('status=OPEN');
    expect(href).toContain('page=2');
  });

  it('ignora page=0 i valors null', () => {
    const href = buildCustomerTaskListHref('cust-1', { view: null, page: 0 });
    expect(href).not.toContain('view=');
    expect(href).not.toContain('page=');
  });
});

describe('buildCustomerBookingCreateHref', () => {
  it('construeix la URL de creació de reserva per a un client', () => {
    expect(buildCustomerBookingCreateHref('cust-1')).toBe(
      '/admin/bookings/new?customerId=cust-1',
    );
  });
});

describe('buildCustomerBookingListHref', () => {
  it('construeix la URL del llistat de reserves amb customerId', () => {
    expect(buildCustomerBookingListHref('cust-1')).toBe('/admin/bookings?customerId=cust-1');
  });

  it('afegeix filtres opcionals quan es passen', () => {
    const href = buildCustomerBookingListHref('cust-1', {
      status: 'CONFIRMED',
      eventType: 'boda',
    });
    expect(href).toContain('status=CONFIRMED');
    expect(href).toContain('eventType=boda');
  });
});

describe('buildCustomerProposalHref', () => {
  it('construeix la URL de pressupostos sense proposalId', () => {
    expect(buildCustomerProposalHref('cust-1')).toBe('/admin/presupuestos?customerId=cust-1');
  });

  it('afegeix proposalId quan es passa', () => {
    const href = buildCustomerProposalHref('cust-1', 'prop-99');
    expect(href).toContain('customerId=cust-1');
    expect(href).toContain('proposalId=prop-99');
  });
});

describe('buildCustomerComposeHref', () => {
  it('construeix la URL de composició sense plantilla', () => {
    expect(buildCustomerComposeHref('cust-1')).toBe(
      '/admin/inbox/compose?customerId=cust-1',
    );
  });

  it('afegeix template quan es passa', () => {
    expect(buildCustomerComposeHref('cust-1', 'recordatori')).toBe(
      '/admin/inbox/compose?customerId=cust-1&template=recordatori',
    );
  });
});
