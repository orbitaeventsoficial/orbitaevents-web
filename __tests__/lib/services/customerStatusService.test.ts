import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    booking: { updateMany: vi.fn() },
    customerActivity: { create: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { updateCustomerHubStatus } from '@/lib/services/customerStatusService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.findMany.mockResolvedValue([{ id: 'lead-1' }]);
  mockPrisma.lead.updateMany.mockResolvedValue({ count: 1 });
  mockPrisma.booking.updateMany.mockResolvedValue({ count: 0 });
  mockPrisma.customerActivity.create.mockResolvedValue({});
});

describe('updateCustomerHubStatus', () => {
  it('retorna ok amb status', async () => {
    const result = await updateCustomerHubStatus('cust-1', 'LEAD');
    expect(result.ok).toBe(true);
    expect(result.status).toBe('LEAD');
  });

  it('actualitza leads a NEW per status LEAD', async () => {
    await updateCustomerHubStatus('cust-1', 'LEAD');
    expect(mockPrisma.lead.updateMany).toHaveBeenCalledWith({
      where: { customerId: 'cust-1' },
      data: { status: 'NEW' },
    });
  });

  it('actualitza leads a NEGOTIATING per status NEGOTIATION', async () => {
    await updateCustomerHubStatus('cust-1', 'NEGOTIATION');
    expect(mockPrisma.lead.updateMany).toHaveBeenCalledWith({
      where: { customerId: 'cust-1' },
      data: { status: 'NEGOTIATING' },
    });
  });

  it('actualitza leads a WON per status CONFIRMED', async () => {
    await updateCustomerHubStatus('cust-1', 'CONFIRMED');
    expect(mockPrisma.lead.updateMany).toHaveBeenCalledWith({
      where: { customerId: 'cust-1' },
      data: { status: 'WON' },
    });
  });

  it('actualitza leads a LOST per status LOST', async () => {
    await updateCustomerHubStatus('cust-1', 'LOST');
    expect(mockPrisma.lead.updateMany).toHaveBeenCalledWith({
      where: { customerId: 'cust-1' },
      data: { status: 'LOST' },
    });
  });

  it('confirma reserves PENDING quan CONFIRMED', async () => {
    await updateCustomerHubStatus('cust-1', 'CONFIRMED');
    expect(mockPrisma.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'CONFIRMED' },
      })
    );
  });

  it('completa reserves quan POSTEVENT', async () => {
    await updateCustomerHubStatus('cust-1', 'POSTEVENT');
    expect(mockPrisma.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'COMPLETED' },
      })
    );
  });

  it('cancel·la reserves quan LOST', async () => {
    await updateCustomerHubStatus('cust-1', 'LOST');
    expect(mockPrisma.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'CANCELLED' },
      })
    );
  });

  it('no modifica reserves per status LEAD', async () => {
    await updateCustomerHubStatus('cust-1', 'LEAD');
    expect(mockPrisma.booking.updateMany).not.toHaveBeenCalled();
  });

  it('no modifica reserves per status NEGOTIATION', async () => {
    await updateCustomerHubStatus('cust-1', 'NEGOTIATION');
    expect(mockPrisma.booking.updateMany).not.toHaveBeenCalled();
  });

  it('crea activity STATUS_CHANGED', async () => {
    await updateCustomerHubStatus('cust-1', 'CONFIRMED');
    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: {
        customerId: 'cust-1',
        action: 'STATUS_CHANGED',
        details: { newStatus: 'CONFIRMED' },
      },
    });
  });

  it('inclou leadIds en filtre de reserves', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([{ id: 'lead-1' }, { id: 'lead-2' }]);

    await updateCustomerHubStatus('cust-1', 'CONFIRMED');

    expect(mockPrisma.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { customerId: 'cust-1' },
            { leadId: { in: ['lead-1', 'lead-2'] } },
          ],
        }),
      })
    );
  });

  it('filtre sense OR si no hi ha leads', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);

    await updateCustomerHubStatus('cust-1', 'CONFIRMED');

    expect(mockPrisma.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ customerId: 'cust-1' }),
      })
    );
  });
});
