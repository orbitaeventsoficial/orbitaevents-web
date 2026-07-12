import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockReadCustomerActivityLog } = vi.hoisted(() => ({
  mockReadCustomerActivityLog: vi.fn(),
  mockPrisma: {
    customer: { findUnique: vi.fn() },
    lead: { findUnique: vi.fn() },
    booking: { findUnique: vi.fn(), findMany: vi.fn() },
    proposal: { findUnique: vi.fn(), findMany: vi.fn() },
    dossier: { findUnique: vi.fn() },
    invoice: { findUnique: vi.fn() },
    task: { findMany: vi.fn() },
    customerDiscountCode: { findMany: vi.fn() },
    leadActivity: { findUnique: vi.fn() },
    leadDocument: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/tasks/leadScopedTaskService', () => ({
  findTaskLinkByTaskId: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/services/customerActivityService', () => ({
  readCustomerActivityLog: mockReadCustomerActivityLog,
}));

import { fetchCustomerHubCollections, resolveCustomerHubCustomerId } from '@/lib/customer-hub/data';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customer.findUnique.mockResolvedValue(null);
  mockPrisma.lead.findUnique.mockResolvedValue(null);
  mockPrisma.booking.findUnique.mockResolvedValue(null);
  mockPrisma.booking.findMany.mockResolvedValue([]);
  mockPrisma.proposal.findUnique.mockResolvedValue(null);
  mockPrisma.proposal.findMany.mockResolvedValue([]);
  mockPrisma.dossier.findUnique.mockResolvedValue(null);
  mockPrisma.invoice.findUnique.mockResolvedValue(null);
  mockPrisma.task.findMany.mockResolvedValue([]);
  mockPrisma.customerDiscountCode.findMany.mockResolvedValue([]);
  mockPrisma.leadActivity.findUnique.mockResolvedValue(null);
  mockPrisma.leadDocument.findUnique.mockResolvedValue(null);
  mockReadCustomerActivityLog.mockResolvedValue([]);
});

describe('resolveCustomerHubCustomerId', () => {
  it('resol un client fusionat cap al customer canònic', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust-old',
      mergedIntoId: 'cust-main',
    });

    await expect(resolveCustomerHubCustomerId('cust-old')).resolves.toBe('cust-main');
  });

  it('manté el client directe si no està fusionat', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust-main',
      mergedIntoId: null,
    });

    await expect(resolveCustomerHubCustomerId('cust-main')).resolves.toBe('cust-main');
  });

  it('resol una reserva directa pel customerId de la booking', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      customerId: 'cust-booking',
      leadId: null,
    });

    await expect(resolveCustomerHubCustomerId('booking-1')).resolves.toBe('cust-booking');
  });

  it('manté el fallback antic de reserva cap al lead quan la booking no té customerId directe', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      customerId: null,
      leadId: 'lead-1',
    });
    mockPrisma.lead.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ customerId: 'cust-from-lead' });

    await expect(resolveCustomerHubCustomerId('booking-1')).resolves.toBe('cust-from-lead');
  });

  it('resol una proposta antiga pel lead si la proposal no té customerId escrit', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      customerId: null,
      leadId: 'lead-1',
      bookingId: null,
    });
    mockPrisma.lead.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ customerId: 'cust-from-proposal-lead' });

    await expect(resolveCustomerHubCustomerId('proposal-1')).resolves.toBe('cust-from-proposal-lead');
  });

  it('resol una proposta vinculada a reserva encara que no porti customerId ni leadId propis', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      customerId: null,
      leadId: null,
      bookingId: 'booking-1',
    });
    mockPrisma.booking.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ customerId: 'cust-from-proposal-booking', leadId: null });

    await expect(resolveCustomerHubCustomerId('proposal-1')).resolves.toBe('cust-from-proposal-booking');
  });

  it('resol un dossier pel lead associat', async () => {
    mockPrisma.dossier.findUnique.mockResolvedValue({ leadId: 'lead-1' });
    mockPrisma.lead.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ customerId: 'cust-from-dossier' });

    await expect(resolveCustomerHubCustomerId('dossier-1')).resolves.toBe('cust-from-dossier');
  });

  it('resol una factura pel customerId directe', async () => {
    mockPrisma.invoice.findUnique.mockResolvedValue({
      customerId: 'cust-from-invoice',
      bookingId: 'booking-1',
    });

    await expect(resolveCustomerHubCustomerId('invoice-1')).resolves.toBe('cust-from-invoice');
  });
});

describe('fetchCustomerHubCollections', () => {
  it('recull propostes i reserves tant pel customerId com pels leads del client', async () => {
    await fetchCustomerHubCollections('cust-1', ['lead-1', 'lead-2']);

    const expectedWhere = {
      OR: [
        { customerId: 'cust-1' },
        { leadId: { in: ['lead-1', 'lead-2'] } },
      ],
    };

    expect(mockPrisma.proposal.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expectedWhere,
    }));
    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expectedWhere,
      include: expect.objectContaining({
        invoices: expect.objectContaining({
          select: expect.objectContaining({
            reference: true,
            pdfUrl: true,
            holdedInvoiceUrl: true,
          }),
        }),
        deliveryNotes: expect.objectContaining({
          select: expect.objectContaining({
            reference: true,
            pdfUrl: true,
            signedAt: true,
          }),
        }),
        postEventReport: expect.any(Object),
        clientSurvey: expect.any(Object),
      }),
    }));
  });

  it('manté el filtre simple per customerId quan el client encara no té leads', async () => {
    await fetchCustomerHubCollections('cust-1', []);

    expect(mockPrisma.proposal.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { customerId: 'cust-1' },
    }));
    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { customerId: 'cust-1' },
    }));
  });
});
