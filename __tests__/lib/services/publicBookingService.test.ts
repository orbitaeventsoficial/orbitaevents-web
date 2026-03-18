import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockSendConfirmation, mockSendAdminNotification } = vi.hoisted(() => ({
  mockPrisma: {
    pack: { findUnique: vi.fn() },
    extra: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
  mockSendConfirmation: vi.fn(),
  mockSendAdminNotification: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/email', () => ({
  sendBookingConfirmation: mockSendConfirmation,
  sendBookingNotificationToAdmin: mockSendAdminNotification,
}));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), error: vi.fn() } }));

import { createPublicBooking, isDateUnavailableBookingError } from '@/lib/services/publicBookingService';

// ── Helpers ─────────────────────────────────────────────────────────────
const BASE_REQUEST = {
  clientName: 'Maria López',
  clientEmail: 'maria@example.com',
  clientPhone: '+34699111222',
  eventType: 'BIRTHDAY',
  eventDate: '2026-09-15',
  eventLocation: 'Barcelona',
  guestCount: 80,
  packId: 'pack-1',
};

const MOCK_PACK = {
  id: 'pack-1',
  price: 400,
  extraHourPrice: 75,
  translations: [{ locale: 'ca', name: 'Bàsic' }],
};

const MOCK_EXTRAS = [
  { id: 'extra-1', price: 50, translations: [{ locale: 'ca', name: 'Karaoke' }] },
  { id: 'extra-2', price: 100, translations: [{ locale: 'ca', name: 'Fotomató' }] },
];

const MOCK_BOOKING_RECORD = {
  id: 'booking-1',
  reference: 'OE-2026-ABCD',
  eventDate: new Date('2026-09-15'),
  total: 508.2, // 400 + IVA 21%
  pack: MOCK_PACK,
  extras: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.pack.findUnique.mockResolvedValue(MOCK_PACK);
  mockPrisma.extra.findMany.mockResolvedValue([]);
  mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      availability: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      booking: {
        create: vi.fn().mockResolvedValue(MOCK_BOOKING_RECORD),
      },
    };
    return fn(tx);
  });
  mockSendConfirmation.mockResolvedValue(undefined);
  mockSendAdminNotification.mockResolvedValue(undefined);
});

// ─────────────────────────────────────────────────────────────────────────
// createPublicBooking
// ─────────────────────────────────────────────────────────────────────────
describe('createPublicBooking', () => {
  it('crea reserva amb status 201', async () => {
    const result = await createPublicBooking(BASE_REQUEST);

    expect(result.status).toBe(201);
    expect(result.body.success).toBe(true);
    expect(result.body.data!.bookingId).toBe('booking-1');
    expect(result.body.data!.reference).toBe('OE-2026-ABCD');
  });

  it('retorna 400 si pack no existeix', async () => {
    mockPrisma.pack.findUnique.mockResolvedValue(null);

    const result = await createPublicBooking(BASE_REQUEST);

    expect(result.status).toBe(400);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toContain('pack');
  });

  it('retorna 400 si extras invàlids', async () => {
    mockPrisma.extra.findMany.mockResolvedValue([MOCK_EXTRAS[0]]); // Only 1 of 2

    const result = await createPublicBooking({
      ...BASE_REQUEST,
      extraIds: ['extra-1', 'extra-2'],
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toContain('extras');
  });

  it('calcula subtotal correcte amb extras', async () => {
    mockPrisma.extra.findMany.mockResolvedValue(MOCK_EXTRAS);

    const txMock = {
      availability: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      booking: {
        create: vi.fn().mockResolvedValue({
          ...MOCK_BOOKING_RECORD,
          total: 665.5, // (400 + 50 + 100) * 1.21
        }),
      },
    };
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(txMock));

    await createPublicBooking({
      ...BASE_REQUEST,
      extraIds: ['extra-1', 'extra-2'],
    });

    const createCall = txMock.booking.create.mock.calls[0][0];
    expect(createCall.data.subtotal).toBe(550); // 400 + 50 + 100
    expect(createCall.data.vatRate).toBe(21);
    expect(createCall.data.total).toBeCloseTo(665.5, 1); // 550 * 1.21
  });

  it('calcula subtotal amb hores extra', async () => {
    const txMock = {
      availability: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      booking: {
        create: vi.fn().mockResolvedValue(MOCK_BOOKING_RECORD),
      },
    };
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(txMock));

    await createPublicBooking({
      ...BASE_REQUEST,
      extraHours: 2,
    });

    const createCall = txMock.booking.create.mock.calls[0][0];
    expect(createCall.data.subtotal).toBe(550); // 400 + (75 * 2)
  });

  it('envia emails de confirmació', async () => {
    await createPublicBooking(BASE_REQUEST);

    expect(mockSendConfirmation).toHaveBeenCalledOnce();
    expect(mockSendAdminNotification).toHaveBeenCalledOnce();
  });

  it('no falla si emails fallen', async () => {
    mockSendConfirmation.mockRejectedValue(new Error('SMTP down'));

    const result = await createPublicBooking(BASE_REQUEST);

    expect(result.status).toBe(201); // Reserva creada igualment
  });

  it('usa preferredLocale per defecte ca', async () => {
    const txMock = {
      availability: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      booking: {
        create: vi.fn().mockResolvedValue(MOCK_BOOKING_RECORD),
      },
    };
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(txMock));

    await createPublicBooking(BASE_REQUEST);

    const createCall = txMock.booking.create.mock.calls[0][0];
    expect(createCall.data.preferredLocale).toBe('ca');
  });

  it('llança error si data no disponible (availability BOOKED)', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        availability: {
          findUnique: vi.fn().mockResolvedValue({ status: 'BOOKED' }),
        },
      };
      return fn(tx);
    });

    await expect(createPublicBooking(BASE_REQUEST)).rejects.toThrow('not available');
  });

  it('status PENDING per defecte', async () => {
    const txMock = {
      availability: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      booking: {
        create: vi.fn().mockResolvedValue(MOCK_BOOKING_RECORD),
      },
    };
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(txMock));

    await createPublicBooking(BASE_REQUEST);

    const createCall = txMock.booking.create.mock.calls[0][0];
    expect(createCall.data.status).toBe('PENDING');
    expect(createCall.data.depositAmount).toBe(0);
    expect(createCall.data.remainingAmount).toBe(createCall.data.total);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// isDateUnavailableBookingError
// ─────────────────────────────────────────────────────────────────────────
describe('isDateUnavailableBookingError', () => {
  it('retorna false per errors normals', () => {
    expect(isDateUnavailableBookingError(new Error('something'))).toBe(false);
  });

  it('retorna false per null/undefined', () => {
    expect(isDateUnavailableBookingError(null)).toBe(false);
    expect(isDateUnavailableBookingError(undefined)).toBe(false);
  });
});
