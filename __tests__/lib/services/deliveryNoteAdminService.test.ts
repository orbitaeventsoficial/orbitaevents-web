import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockPrisma,
  mockGenerateDeliveryNotePdfBuffer,
  mockUploadFile,
  mockRecordDocumentAdminLog,
} = vi.hoisted(() => ({
  mockPrisma: {
    deliveryNote: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    booking: {
      findUniqueOrThrow: vi.fn(),
    },
  },
  mockGenerateDeliveryNotePdfBuffer: vi.fn(),
  mockUploadFile: vi.fn(),
  mockRecordDocumentAdminLog: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/storage', () => ({ uploadFile: mockUploadFile }));
vi.mock('@/lib/services/deliveryNotePdfService', () => ({ generateDeliveryNotePdfBuffer: mockGenerateDeliveryNotePdfBuffer }));
vi.mock('@/lib/services/documentAuditTrailService', () => ({
  DOCUMENT_ADMIN_LOG_ACTIONS: {
    DELIVERY_NOTE_CREATED: 'DOCUMENT_DELIVERY_NOTE_CREATED',
    DELIVERY_NOTE_DELIVERED: 'DOCUMENT_DELIVERY_NOTE_DELIVERED',
    DELIVERY_NOTE_SIGNED: 'DOCUMENT_DELIVERY_NOTE_SIGNED',
    DELIVERY_NOTE_CANCELLED: 'DOCUMENT_DELIVERY_NOTE_CANCELLED',
    DELIVERY_NOTE_PDF_GENERATED: 'DOCUMENT_DELIVERY_NOTE_PDF_GENERATED',
  },
  recordDocumentAdminLog: mockRecordDocumentAdminLog,
}));

import {
  buildDeliveryNoteSnapshot,
  createAdminDeliveryNoteFromBooking,
  generateAdminDeliveryNotePdf,
  listAdminDeliveryNotes,
  updateAdminDeliveryNoteStatus,
} from '@/lib/services/deliveryNoteAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.deliveryNote.findMany.mockResolvedValue([]);
  mockPrisma.deliveryNote.count.mockResolvedValue(0);
  mockPrisma.deliveryNote.findFirst.mockResolvedValue(null);
  mockPrisma.deliveryNote.create.mockResolvedValue({ id: 'dn-1', reference: 'ALB-2026-0001' });
  mockPrisma.deliveryNote.findUnique.mockResolvedValue(null);
  mockPrisma.deliveryNote.update.mockResolvedValue({ id: 'dn-1', status: 'SIGNED' });
  mockGenerateDeliveryNotePdfBuffer.mockResolvedValue(Buffer.from('%PDF test'));
  mockUploadFile.mockResolvedValue({ path: 'delivery-notes/dn-1/ALB-2026-0001.pdf', publicUrl: '/api/uploads/delivery-notes/dn-1/ALB-2026-0001.pdf' });
  mockRecordDocumentAdminLog.mockResolvedValue(undefined);
  mockPrisma.booking.findUniqueOrThrow.mockResolvedValue({
    id: 'booking-1',
    reference: 'OE-2026-0001',
    customerId: 'customer-1',
    clientName: 'Cristina',
    eventDate: new Date('2026-07-20T00:00:00.000Z'),
    eventLocation: 'Cornellà',
    eventVenue: 'Sala',
    eventStartTime: '20:00',
    eventEndTime: '22:00',
    guestCount: 96,
    customer: { id: 'customer-1' },
    pack: { slug: 'pack-1', service: 'DJ', translations: [{ locale: 'ca', name: 'Pack DJ' }] },
    extras: [],
    serviceLines: [
      { label: 'Bingo Musical', quantity: 1, notes: null },
      { label: 'Cost intern transport', quantity: 1, notes: '[travel-cost] vehicle' },
    ],
  });
});

describe('buildDeliveryNoteSnapshot', () => {
  it('congela pack, extres i serveis visibles sense línies internes de transport', () => {
    const snapshot = buildDeliveryNoteSnapshot({
      reference: 'OE-1',
      clientName: 'Client',
      eventDate: new Date('2026-07-20T00:00:00.000Z'),
      eventLocation: 'Granollers',
      pack: { service: 'DJ', translations: [{ locale: 'ca', name: 'Pack base' }] },
      extras: [{ quantity: 2, extra: { slug: 'fum', translations: [{ locale: 'ca', name: 'Fum' }] } }],
      serviceLines: [
        { label: 'Bingo Musical', quantity: 1 },
        { label: 'Cost intern transport', quantity: 1, notes: '[travel-cost] hidden' },
      ],
    });

    expect(snapshot).toMatchObject({
      source: 'booking',
      bookingReference: 'OE-1',
      client: { name: 'Client' },
    });
    expect(snapshot.items).toEqual([
      { type: 'PACK', label: 'Pack base', quantity: 1 },
      { type: 'EXTRA', label: 'Fum', quantity: 2 },
      { type: 'SERVICE_LINE', label: 'Bingo Musical', quantity: 1 },
    ]);
  });
});

describe('listAdminDeliveryNotes', () => {
  it('llista amb paginació normalitzada', async () => {
    const result = await listAdminDeliveryNotes({ page: 2.8, limit: 999 });

    expect(result.ok).toBe(true);
    expect(result.pagination).toEqual({ page: 2, limit: 200, total: 0, pages: 1 });
    expect(mockPrisma.deliveryNote.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 200,
      take: 200,
    }));
  });
});

describe('createAdminDeliveryNoteFromBooking', () => {
  it('reutilitza un albarà actiu existent', async () => {
    mockPrisma.deliveryNote.findFirst.mockResolvedValueOnce({ id: 'dn-existing', reference: 'ALB-2026-0009' });

    const result = await createAdminDeliveryNoteFromBooking('booking-1');

    expect(result).toEqual({ ok: true, deliveryNoteId: 'dn-existing', reference: 'ALB-2026-0009', reused: true });
    expect(mockPrisma.deliveryNote.create).not.toHaveBeenCalled();
  });

  it('crea albarà des de reserva amb snapshot operatiu', async () => {
    mockPrisma.deliveryNote.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ reference: 'ALB-2026-0003' });

    const result = await createAdminDeliveryNoteFromBooking('booking-1');

    expect(result).toEqual({ ok: true, deliveryNoteId: 'dn-1', reference: 'ALB-2026-0004', reused: false });
    expect(mockPrisma.deliveryNote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reference: 'ALB-2026-0004',
        bookingId: 'booking-1',
        customerId: 'customer-1',
        clientName: 'Cristina',
        eventLocation: 'Cornellà',
        status: 'DRAFT',
        snapshot: expect.objectContaining({
          bookingReference: 'OE-2026-0001',
        }),
      }),
    });
    expect(mockRecordDocumentAdminLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'DOCUMENT_DELIVERY_NOTE_CREATED',
      entity: 'deliveryNote',
      entityId: 'dn-1',
      details: expect.objectContaining({
        bookingId: 'booking-1',
        bookingReference: 'OE-2026-0001',
        customerId: 'customer-1',
        reference: 'ALB-2026-0004',
      }),
    }));
  });
});

describe('updateAdminDeliveryNoteStatus', () => {
  it('marca com signat i omple lliurament si faltava', async () => {
    mockPrisma.deliveryNote.findUnique
      .mockResolvedValueOnce({
        status: 'DRAFT',
        reference: 'ALB-2026-0001',
        bookingId: 'booking-1',
        customerId: 'customer-1',
        clientName: 'Cristina',
        deliveredAt: null,
        signedAt: null,
      })
      .mockResolvedValueOnce({
        id: 'dn-1',
        reference: 'ALB-2026-0001',
        status: 'SIGNED',
        createdAt: new Date('2026-07-20T10:00:00.000Z'),
        deliveredAt: new Date('2026-07-20T20:00:00.000Z'),
        signedAt: new Date('2026-07-20T22:00:00.000Z'),
        signedBy: 'Cristina',
        snapshot: { bookingReference: 'OE-2026-0001', client: { name: 'Cristina' }, event: { location: 'Cornellà' }, items: [] },
        pdfUrl: null,
        pdfKey: null,
        bookingId: 'booking-1',
        customerId: 'customer-1',
        booking: { id: 'booking-1', reference: 'OE-2026-0001' },
        customer: { id: 'customer-1', name: 'Cristina', email: 'c@test.local' },
      });
    mockPrisma.deliveryNote.update
      .mockResolvedValueOnce({ id: 'dn-1', status: 'SIGNED' })
      .mockResolvedValueOnce({
        reference: 'ALB-2026-0001',
        pdfUrl: '/api/uploads/delivery-notes/dn-1/ALB-2026-0001.pdf',
        pdfKey: 'delivery-notes/dn-1/ALB-2026-0001.pdf',
      });

    const result = await updateAdminDeliveryNoteStatus('dn-1', 'SIGNED', {
      signatureIp: '127.0.0.1',
      signatureUa: 'vitest',
    });

    expect(result.status).toBe(200);
    expect(mockPrisma.deliveryNote.update).toHaveBeenCalledWith({
      where: { id: 'dn-1' },
      data: expect.objectContaining({
        status: 'SIGNED',
        deliveredAt: expect.any(Date),
        signedAt: expect.any(Date),
        signedBy: 'Cristina',
        signatureIp: '127.0.0.1',
        signatureUa: 'vitest',
      }),
    });
    expect(mockRecordDocumentAdminLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'DOCUMENT_DELIVERY_NOTE_SIGNED',
      entity: 'deliveryNote',
      entityId: 'dn-1',
      details: expect.objectContaining({
        bookingId: 'booking-1',
        customerId: 'customer-1',
        previousStatus: 'DRAFT',
        status: 'SIGNED',
        signedBy: 'Cristina',
        signatureIp: '127.0.0.1',
      }),
    }));
    expect(mockGenerateDeliveryNotePdfBuffer).toHaveBeenCalledWith(expect.objectContaining({
      reference: 'ALB-2026-0001',
      status: 'SIGNED',
    }));
    expect(result).toMatchObject({
      status: 200,
      body: {
        pdf: {
          ok: true,
          pdfUrl: '/api/uploads/delivery-notes/dn-1/ALB-2026-0001.pdf',
        },
      },
    });
  });

  it('no permet cancel·lar un albarà signat', async () => {
    mockPrisma.deliveryNote.findUnique.mockResolvedValueOnce({
      status: 'SIGNED',
      reference: 'ALB-2026-0001',
      bookingId: 'booking-1',
      customerId: 'customer-1',
      clientName: 'Cristina',
      deliveredAt: new Date(),
      signedAt: new Date(),
    });

    const result = await updateAdminDeliveryNoteStatus('dn-1', 'CANCELLED');

    expect(result.status).toBe(400);
    expect(mockPrisma.deliveryNote.update).not.toHaveBeenCalled();
  });
});

describe('generateAdminDeliveryNotePdf', () => {
  it('reutilitza el PDF existent si ja està persistit', async () => {
    mockPrisma.deliveryNote.findUnique.mockResolvedValueOnce({
      id: 'dn-1',
      reference: 'ALB-2026-0001',
      status: 'SIGNED',
      pdfUrl: '/api/uploads/delivery-notes/dn-1/ALB-2026-0001.pdf',
      pdfKey: 'delivery-notes/dn-1/ALB-2026-0001.pdf',
      booking: { id: 'booking-1', reference: 'OE-2026-0001' },
      customer: null,
    });

    const result = await generateAdminDeliveryNotePdf('dn-1');

    expect(result).toEqual({
      status: 200,
      body: {
        ok: true,
        reference: 'ALB-2026-0001',
        pdfUrl: '/api/uploads/delivery-notes/dn-1/ALB-2026-0001.pdf',
        pdfKey: 'delivery-notes/dn-1/ALB-2026-0001.pdf',
        reused: true,
      },
    });
    expect(mockGenerateDeliveryNotePdfBuffer).not.toHaveBeenCalled();
    expect(mockUploadFile).not.toHaveBeenCalled();
  });

  it('genera, puja i persisteix el PDF d’albarà', async () => {
    mockPrisma.deliveryNote.findUnique.mockResolvedValueOnce({
      id: 'dn-1',
      reference: 'ALB-2026-0001',
      status: 'SIGNED',
      createdAt: new Date('2026-07-20T10:00:00.000Z'),
      deliveredAt: new Date('2026-07-20T20:00:00.000Z'),
      signedAt: new Date('2026-07-20T22:00:00.000Z'),
      signedBy: 'Cristina',
      snapshot: { bookingReference: 'OE-2026-0001', client: { name: 'Cristina' }, event: { location: 'Cornellà' }, items: [] },
      pdfUrl: null,
      pdfKey: null,
      bookingId: 'booking-1',
      customerId: 'customer-1',
      booking: { id: 'booking-1', reference: 'OE-2026-0001' },
      customer: { id: 'customer-1', name: 'Cristina', email: 'c@test.local' },
    });
    mockPrisma.deliveryNote.update.mockResolvedValueOnce({
      reference: 'ALB-2026-0001',
      pdfUrl: '/api/uploads/delivery-notes/dn-1/ALB-2026-0001.pdf',
      pdfKey: 'delivery-notes/dn-1/ALB-2026-0001.pdf',
    });

    const result = await generateAdminDeliveryNotePdf('dn-1');

    expect(result.status).toBe(200);
    expect(mockGenerateDeliveryNotePdfBuffer).toHaveBeenCalledWith(expect.objectContaining({
      reference: 'ALB-2026-0001',
      status: 'SIGNED',
    }));
    expect(mockUploadFile).toHaveBeenCalledWith('delivery-notes/dn-1/ALB-2026-0001.pdf', Buffer.from('%PDF test'));
    expect(mockPrisma.deliveryNote.update).toHaveBeenCalledWith({
      where: { id: 'dn-1' },
      data: {
        pdfUrl: '/api/uploads/delivery-notes/dn-1/ALB-2026-0001.pdf',
        pdfKey: 'delivery-notes/dn-1/ALB-2026-0001.pdf',
      },
    });
    expect(mockRecordDocumentAdminLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'DOCUMENT_DELIVERY_NOTE_PDF_GENERATED',
      entity: 'deliveryNote',
      entityId: 'dn-1',
    }));
  });

  it('força regeneració si el PDF existent podia haver quedat antic', async () => {
    mockPrisma.deliveryNote.findUnique.mockResolvedValueOnce({
      id: 'dn-1',
      reference: 'ALB-2026-0001',
      status: 'SIGNED',
      createdAt: new Date('2026-07-20T10:00:00.000Z'),
      deliveredAt: new Date('2026-07-20T20:00:00.000Z'),
      signedAt: new Date('2026-07-20T22:00:00.000Z'),
      signedBy: 'Cristina',
      snapshot: { bookingReference: 'OE-2026-0001', client: { name: 'Cristina' }, event: { location: 'Cornellà' }, items: [] },
      pdfUrl: '/api/uploads/delivery-notes/dn-1/old.pdf',
      pdfKey: 'delivery-notes/dn-1/old.pdf',
      bookingId: 'booking-1',
      customerId: 'customer-1',
      booking: { id: 'booking-1', reference: 'OE-2026-0001' },
      customer: { id: 'customer-1', name: 'Cristina', email: 'c@test.local' },
    });
    mockPrisma.deliveryNote.update.mockResolvedValueOnce({
      reference: 'ALB-2026-0001',
      pdfUrl: '/api/uploads/delivery-notes/dn-1/ALB-2026-0001.pdf',
      pdfKey: 'delivery-notes/dn-1/ALB-2026-0001.pdf',
    });

    const result = await generateAdminDeliveryNotePdf('dn-1', { force: true, source: 'test_force' });

    expect(result.status).toBe(200);
    expect(mockGenerateDeliveryNotePdfBuffer).toHaveBeenCalledOnce();
    expect(mockUploadFile).toHaveBeenCalledWith('delivery-notes/dn-1/ALB-2026-0001.pdf', Buffer.from('%PDF test'));
    expect(mockRecordDocumentAdminLog).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.objectContaining({ source: 'test_force' }),
    }));
  });
});
