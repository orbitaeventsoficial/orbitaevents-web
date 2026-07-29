import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockPrisma,
  mockIsHoldedEnabled,
  mockGenerateInvoicePDF,
  mockUploadFile,
  mockGetCompanyConfig,
  mockRecordDocumentAdminLog,
} = vi.hoisted(() => ({
  mockPrisma: {
    invoice: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    booking: {
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
    },
    adminLog: { create: vi.fn() },
  },
  mockIsHoldedEnabled: vi.fn(),
  mockGenerateInvoicePDF: vi.fn(),
  mockUploadFile: vi.fn(),
  mockGetCompanyConfig: vi.fn(),
  mockRecordDocumentAdminLog: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/services/invoicePdfService', () => ({ generateInvoicePDF: mockGenerateInvoicePDF }));
vi.mock('@/lib/storage', () => ({ uploadFile: mockUploadFile }));
vi.mock('@/lib/services/contractService', () => ({ getCompanyConfig: mockGetCompanyConfig }));
vi.mock('@/lib/services/documentAuditTrailService', () => ({
  DOCUMENT_ADMIN_LOG_ACTIONS: { INVOICE_PDF_GENERATED: 'DOCUMENT_INVOICE_PDF_GENERATED' },
  recordDocumentAdminLog: mockRecordDocumentAdminLog,
}));
vi.mock('./holdedService', () => ({
  isHoldedEnabled: mockIsHoldedEnabled,
  findOrCreateHoldedContact: vi.fn(),
  createHoldedInvoice: vi.fn(),
  getHoldedInvoiceStatus: vi.fn(),
}));

import { createInvoiceFromBooking, markInvoiceAsPaid, retryHoldedSync, runInvoiceSyncCron } from '@/lib/services/invoiceService';

const BOOKING = {
  id: 'bk-1',
  reference: 'OE-2026-001',
  customerId: 'cust-1',
  clientName: 'Joan Garcia',
  clientEmail: 'joan@example.com',
  clientPhone: '+34600000000',
  preferredLocale: 'ca',
  eventType: 'WEDDING',
  eventDate: new Date('2026-08-18T20:00:00.000Z'),
  eventLocation: 'Masia Can Roda',
  eventVenue: 'Sala Gran',
  customer: { dni: '12345678A', email: 'fiscal@example.com', phone: '+34611111111' },
  pack: { price: 1200, translations: [{ locale: 'ca', name: 'Premium' }] },
  extras: [],
  serviceLines: [
    { label: 'Bingo musical', revenueAmount: 500, quantity: 2, notes: null },
    { label: 'Cost intern ruta', revenueAmount: 120, quantity: 1, notes: '[travel-cost] vehicle' },
  ],
  subtotal: 1200,
  discount: 0,
  vatRate: 21,
  vatAmount: 252,
  total: 1452,
};

describe('createInvoiceFromBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsHoldedEnabled.mockReturnValue(false);
    mockPrisma.booking.findUniqueOrThrow.mockResolvedValue(BOOKING);
    mockPrisma.invoice.findFirst.mockResolvedValue(null); // no existing invoice
    mockPrisma.invoice.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'inv-1', reference: data.reference, ...data }),
    );
    mockGenerateInvoicePDF.mockResolvedValue({ output: vi.fn(() => new ArrayBuffer(8)) });
    mockUploadFile.mockResolvedValue({
      publicUrl: '/api/uploads/invoices/bk-1/FAC-2026-0001.pdf',
      path: 'invoices/bk-1/FAC-2026-0001.pdf',
    });
    mockGetCompanyConfig.mockResolvedValue({
      name: 'Òrbita Events',
      nif: '12345678A',
      address: 'Granollers, Barcelona',
      email: 'info@orbitaevents.com',
      phone: '+34 699 12 10 23',
      iban: 'ES00 0000 0000 0000 0000 0000',
    });
    mockRecordDocumentAdminLog.mockResolvedValue(undefined);
  });

  it('crea factura amb referència FAC-YYYY-XXXX', async () => {
    // mock per a generateInvoiceReference
    mockPrisma.invoice.findFirst
      .mockResolvedValueOnce(null) // no existing invoice for booking
      .mockResolvedValueOnce(null); // no previous FAC reference

    const result = await createInvoiceFromBooking('bk-1');

    expect(result.invoiceId).toBe('inv-1');
    expect(result.reference).toMatch(/^FAC-\d{4}-\d{4}$/);
    expect(mockPrisma.invoice.create).toHaveBeenCalledOnce();
    expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pdfUrl: '/api/uploads/invoices/bk-1/FAC-2026-0001.pdf',
          pdfKey: 'invoices/bk-1/FAC-2026-0001.pdf',
        }),
      }),
    );
  });

  it('retorna factura existent si ja n\'hi ha una', async () => {
    mockPrisma.invoice.findFirst.mockResolvedValueOnce({
      id: 'inv-existing',
      reference: 'FAC-2026-0001',
      status: 'DRAFT',
      pdfUrl: '/api/uploads/invoices/bk-1/FAC-2026-0001.pdf',
      pdfKey: 'invoices/bk-1/FAC-2026-0001.pdf',
    });

    const result = await createInvoiceFromBooking('bk-1');
    expect(result.invoiceId).toBe('inv-existing');
    expect(result.reference).toBe('FAC-2026-0001');
    expect(mockPrisma.invoice.create).not.toHaveBeenCalled();
  });

  it('genera el PDF amb línies de servei canòniques i no exposa transport intern', async () => {
    mockPrisma.invoice.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await createInvoiceFromBooking('bk-1');

    expect(mockGenerateInvoicePDF).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceNumber: expect.stringMatching(/^FAC-\d{4}-\d{4}$/),
        clientEmail: 'fiscal@example.com',
        clientPhone: '+34611111111',
        eventType: 'Boda',
        eventLocation: 'Sala Gran · Masia Can Roda',
        lines: [
          {
            description: 'Bingo musical',
            quantity: 2,
            unitPrice: 250,
            total: 500,
          },
        ],
      }),
      'ca',
    );
  });

  it('llança error si booking no té customerId', async () => {
    mockPrisma.booking.findUniqueOrThrow.mockResolvedValue({ ...BOOKING, customerId: null });

    await expect(createInvoiceFromBooking('bk-1')).rejects.toThrow('no té client');
  });

  it('crea factura DRAFT si Holded desactivat', async () => {
    mockIsHoldedEnabled.mockReturnValue(false);
    mockPrisma.invoice.findFirst.mockResolvedValue(null);

    await createInvoiceFromBooking('bk-1');

    expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DRAFT' }),
      }),
    );
  });

  it('incrementa referència si ja existeix anterior', async () => {
    mockPrisma.invoice.findFirst
      .mockResolvedValueOnce(null) // no existing for booking
      .mockResolvedValueOnce({ reference: `FAC-${new Date().getFullYear()}-0042` }); // last ref

    const result = await createInvoiceFromBooking('bk-1');
    expect(result.reference).toContain('0043');
  });
});

describe('markInvoiceAsPaid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marca factura com a PAID', async () => {
    mockPrisma.invoice.findUniqueOrThrow.mockResolvedValue({ status: 'SYNCED', reference: 'FAC-2026-0001' });
    mockPrisma.invoice.update.mockResolvedValue({});

    await markInvoiceAsPaid('inv-1');

    expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { status: 'PAID' },
    });
  });

  it('llança error si factura cancel·lada', async () => {
    mockPrisma.invoice.findUniqueOrThrow.mockResolvedValue({ status: 'CANCELLED', reference: 'FAC-2026-0001' });
    await expect(markInvoiceAsPaid('inv-1')).rejects.toThrow('cancel·lada');
  });

  it('llança error si ja pagada', async () => {
    mockPrisma.invoice.findUniqueOrThrow.mockResolvedValue({ status: 'PAID', reference: 'FAC-2026-0001' });
    await expect(markInvoiceAsPaid('inv-1')).rejects.toThrow('ja està marcada');
  });
});

describe('retryHoldedSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('llança error si estat no és SYNC_ERROR ni PENDING_SYNC', async () => {
    mockPrisma.invoice.findUniqueOrThrow.mockResolvedValue({ status: 'DRAFT' });
    await expect(retryHoldedSync('inv-1')).rejects.toThrow('reintentar');
  });
});

describe('runInvoiceSyncCron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsHoldedEnabled.mockReturnValue(false);
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.invoice.findMany.mockResolvedValue([]);
  });

  it('retorna summary buit sense reserves completades', async () => {
    const result = await runInvoiceSyncCron();
    expect(result).toEqual({ autoCreated: 0, retried: 0, refreshed: 0, errors: 0 });
  });

  it('auto-crea factures per reserves completades', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      { id: 'bk-1', reference: 'OE-2026-001' },
      { id: 'bk-2', reference: 'OE-2026-002' },
    ]);
    mockPrisma.booking.findUniqueOrThrow.mockResolvedValue(BOOKING);
    mockPrisma.invoice.findFirst.mockResolvedValue(null);
    mockPrisma.invoice.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'inv-new', reference: data.reference, ...data }),
    );

    const result = await runInvoiceSyncCron();
    expect(result.autoCreated).toBe(2);
    expect(result.errors).toBe(0);
  });

  it('compta errors sense parar', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([{ id: 'bk-bad', reference: 'BAD' }]);
    mockPrisma.booking.findUniqueOrThrow.mockRejectedValue(new Error('DB down'));

    const result = await runInvoiceSyncCron();
    expect(result.errors).toBe(1);
    expect(result.autoCreated).toBe(0);
  });
});
