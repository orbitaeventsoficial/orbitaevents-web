import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockCreateInvoice, mockMarkPaid } = vi.hoisted(() => ({
  mockPrisma: {
    invoice: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
  },
  mockCreateInvoice: vi.fn(),
  mockMarkPaid: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/invoiceService', () => ({
  createInvoiceFromBooking: mockCreateInvoice,
  markInvoiceAsPaid: mockMarkPaid,
}));

import {
  listAdminInvoices,
  createAdminInvoiceFromBooking,
  getAdminInvoiceById,
  updateAdminInvoiceStatus,
} from '@/lib/services/invoiceAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.invoice.findMany.mockResolvedValue([]);
  mockPrisma.invoice.findUnique.mockResolvedValue(null);
  mockPrisma.invoice.update.mockResolvedValue({});
  mockCreateInvoice.mockResolvedValue({ invoice: { id: 'inv-1' } });
  mockMarkPaid.mockResolvedValue({});
});

describe('listAdminInvoices', () => {
  it('retorna llista', async () => {
    const result = await listAdminInvoices();
    expect(result.ok).toBe(true);
    expect(result.invoices).toEqual([]);
  });
});

describe('createAdminInvoiceFromBooking', () => {
  it('delega a invoiceService', async () => {
    const result = await createAdminInvoiceFromBooking('booking-1');

    expect(result.ok).toBe(true);
    expect(mockCreateInvoice).toHaveBeenCalledWith('booking-1');
  });
});

describe('getAdminInvoiceById', () => {
  it('retorna 404 si no existeix', async () => {
    const result = await getAdminInvoiceById('inexistent');
    expect(result.status).toBe(404);
  });

  it('retorna factura', async () => {
    mockPrisma.invoice.findUnique.mockResolvedValue({ id: 'inv-1', status: 'PENDING' });

    const result = await getAdminInvoiceById('inv-1');
    expect(result.status).toBe(200);
  });
});

describe('updateAdminInvoiceStatus', () => {
  it('marca com pagada', async () => {
    const result = await updateAdminInvoiceStatus('inv-1', 'PAID');

    expect(result.status).toBe(200);
    expect(mockMarkPaid).toHaveBeenCalledWith('inv-1');
  });

  it('cancel·la factura pendent', async () => {
    mockPrisma.invoice.findUniqueOrThrow.mockResolvedValue({ status: 'PENDING' });

    const result = await updateAdminInvoiceStatus('inv-1', 'CANCELLED');

    expect(result.status).toBe(200);
    expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { status: 'CANCELLED' },
    });
  });

  it('no permet cancel·lar factura pagada', async () => {
    mockPrisma.invoice.findUniqueOrThrow.mockResolvedValue({ status: 'PAID' });

    const result = await updateAdminInvoiceStatus('inv-1', 'CANCELLED');

    expect(result.status).toBe(400);
  });
});
