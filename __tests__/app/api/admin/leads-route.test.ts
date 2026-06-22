import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockCreateAdminLead,
  mockPreviewLeadCustomerLink,
  mockLinkLeadToCustomer,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockCreateAdminLead: vi.fn(),
  mockPreviewLeadCustomerLink: vi.fn(),
  mockLinkLeadToCustomer: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/leadAdminService', () => ({
  countNewAdminLeads: vi.fn(),
  createAdminLead: mockCreateAdminLead,
  listAdminLeads: vi.fn(),
}));
vi.mock('@/lib/services/leads/leadCustomerLinkService', () => ({
  previewLeadCustomerLink: mockPreviewLeadCustomerLink,
  linkLeadToCustomer: mockLinkLeadToCustomer,
}));

import { POST } from '@/app/api/admin/leads/route';

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/leads', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockReturnValue(null);
  mockCreateAdminLead.mockResolvedValue({
    ok: true,
    lead: {
      id: 'lead-1',
      name: 'Maria',
      email: 'maria@test.com',
      eventType: 'WEDDING',
      customerId: null,
    },
  });
  mockPreviewLeadCustomerLink.mockResolvedValue({ kind: 'no-match' });
  mockLinkLeadToCustomer.mockResolvedValue({
    ok: true,
    customerId: 'customer-1',
    created: true,
    alreadyLinked: false,
  });
});

describe('POST /api/admin/leads', () => {
  it('crea/vincula client automàticament quan el lead neix manualment a l’admin', async () => {
    const res = await POST(makeRequest({
      name: 'Maria',
      email: 'maria@test.com',
      eventType: 'WEDDING',
    }));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(mockCreateAdminLead).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Maria',
      email: 'maria@test.com',
      status: 'CONTACTED',
    }));
    expect(mockPreviewLeadCustomerLink).toHaveBeenCalledWith('lead-1');
    expect(mockLinkLeadToCustomer).toHaveBeenCalledWith({
      leadId: 'lead-1',
      action: 'create',
      actor: 'Admin intake',
    });
    expect(payload.lead.customerId).toBe('customer-1');
    expect(payload.customerLink).toEqual(expect.objectContaining({
      linked: true,
      created: true,
      customerId: 'customer-1',
    }));
  });

  it('vincula un client existent si hi ha coincidència forta', async () => {
    mockPreviewLeadCustomerLink.mockResolvedValue({
      kind: 'matches-found',
      matches: [
        {
          customerId: 'customer-existing',
          customerName: 'Maria',
          customerEmail: 'maria@test.com',
          customerPhone: null,
          customerDni: null,
          matchedBy: ['email'],
          confidence: 'strong',
        },
      ],
    });
    mockLinkLeadToCustomer.mockResolvedValue({
      ok: true,
      customerId: 'customer-existing',
      created: false,
      alreadyLinked: false,
    });

    const res = await POST(makeRequest({
      name: 'Maria',
      email: 'maria@test.com',
      eventType: 'WEDDING',
    }));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(mockLinkLeadToCustomer).toHaveBeenCalledWith({
      leadId: 'lead-1',
      action: 'link',
      customerId: 'customer-existing',
      actor: 'Admin intake',
    });
    expect(payload.customerLink).toEqual(expect.objectContaining({
      linked: true,
      created: false,
      customerId: 'customer-existing',
    }));
  });
});
