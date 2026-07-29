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
  eventType: 'BIRTHDAY',
  status: 'PENDING',
  customerId: 'cust-1',
  clientEmail: 'maria@example.com',
  total: 484, // 400 + IVA 21%
  pack: MOCK_PACK,
  extras: [],
};

function makeTxMock(overrides: Record<string, unknown> = {}) {
  const tx = {
    availability: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    customer: {
      upsert: vi.fn().mockResolvedValue({ id: 'cust-1' }),
    },
    customerActivity: {
      create: vi.fn().mockResolvedValue({}),
    },
    adminLog: {
      create: vi.fn().mockResolvedValue({}),
    },
    booking: {
      create: vi.fn().mockResolvedValue(MOCK_BOOKING_RECORD),
    },
  };
  return { ...tx, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.pack.findUnique.mockResolvedValue(MOCK_PACK);
  mockPrisma.extra.findMany.mockResolvedValue([]);
  mockPrisma.$transaction.mockImplementation(async (fn: (tx: ReturnType<typeof makeTxMock>) => Promise<unknown>) =>
    fn(makeTxMock())
  );
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
    expect(result.body.errorCode).toBe('INVALID_PACK');
  });

  it('retorna 400 si un camp requerit queda buit després de trim', async () => {
    const result = await createPublicBooking({
      ...BASE_REQUEST,
      clientName: '   ',
    });

    expect(result.status).toBe(400);
    expect(result.body.success).toBe(false);
    expect(result.body.errorCode).toBe('MISSING_REQUIRED_FIELDS');
    expect(mockPrisma.pack.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('retorna 400 si email no és vàlid quan el servei es crida directament', async () => {
    const result = await createPublicBooking({
      ...BASE_REQUEST,
      clientEmail: 'not-an-email',
    });

    expect(result.status).toBe(400);
    expect(result.body.success).toBe(false);
    expect(result.body.errorCode).toBe('INVALID_EMAIL');
    expect(mockPrisma.pack.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('retorna 400 si eventType no existeix a Prisma', async () => {
    const result = await createPublicBooking({
      ...BASE_REQUEST,
      eventType: 'THEMED_PARTY',
    });

    expect(result.status).toBe(400);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toContain('event type');
    expect(result.body.errorCode).toBe('INVALID_EVENT_TYPE');
    expect(mockPrisma.pack.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('retorna 400 si eventDate no és una data vàlida', async () => {
    const result = await createPublicBooking({
      ...BASE_REQUEST,
      eventDate: 'not-a-date',
    });

    expect(result.status).toBe(400);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toContain('event date');
    expect(result.body.errorCode).toBe('INVALID_EVENT_DATE');
    expect(mockPrisma.pack.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('retorna 400 si eventDate és passada', async () => {
    const result = await createPublicBooking({
      ...BASE_REQUEST,
      eventDate: '2020-01-01',
    });

    expect(result.status).toBe(400);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toContain('past');
    expect(result.body.errorCode).toBe('EVENT_DATE_PAST');
    expect(mockPrisma.pack.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('retorna 400 si guestCount no és un enter positiu', async () => {
    const result = await createPublicBooking({
      ...BASE_REQUEST,
      guestCount: -5,
    });

    expect(result.status).toBe(400);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toContain('guest count');
    expect(result.body.errorCode).toBe('INVALID_GUEST_COUNT');
    expect(mockPrisma.pack.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('retorna 400 si extraHours és negativa o no numèrica', async () => {
    const result = await createPublicBooking({
      ...BASE_REQUEST,
      extraHours: -1,
    });

    expect(result.status).toBe(400);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toContain('extra hours');
    expect(result.body.errorCode).toBe('INVALID_EXTRA_HOURS');
    expect(mockPrisma.pack.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('retorna 400 si extras invàlids', async () => {
    mockPrisma.extra.findMany.mockResolvedValue([MOCK_EXTRAS[0]]); // Only 1 of 2

    const result = await createPublicBooking({
      ...BASE_REQUEST,
      extraIds: ['extra-1', 'extra-2'],
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toContain('extras');
    expect(result.body.errorCode).toBe('INVALID_EXTRAS');
  });

  it('calcula subtotal correcte amb extras', async () => {
    mockPrisma.extra.findMany.mockResolvedValue(MOCK_EXTRAS);

    const txMock = makeTxMock({
      booking: {
        create: vi.fn().mockResolvedValue({
          ...MOCK_BOOKING_RECORD,
          total: 665.5, // (400 + 50 + 100) * 1.21
        }),
      },
    });
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: ReturnType<typeof makeTxMock>) => Promise<unknown>) =>
      fn(txMock)
    );

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
    const txMock = makeTxMock();
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: ReturnType<typeof makeTxMock>) => Promise<unknown>) =>
      fn(txMock)
    );

    await createPublicBooking({
      ...BASE_REQUEST,
      extraHours: 2,
    });

    const createCall = txMock.booking.create.mock.calls[0][0];
    expect(createCall.data.subtotal).toBe(550); // 400 + (75 * 2)
  });

  it('coerceix quantitats numèriques netes abans de crear la reserva', async () => {
    const txMock = makeTxMock();
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: ReturnType<typeof makeTxMock>) => Promise<unknown>) =>
      fn(txMock)
    );

    await createPublicBooking({
      ...BASE_REQUEST,
      guestCount: '120',
      extraHours: '2',
    });

    const createCall = txMock.booking.create.mock.calls[0][0];
    expect(createCall.data.guestCount).toBe(120);
    expect(createCall.data.extraHours).toBe(2);
    expect(createCall.data.subtotal).toBe(550);
  });

  it('crea o actualitza Customer i desa customerId a la reserva pública', async () => {
    const txMock = makeTxMock();
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: ReturnType<typeof makeTxMock>) => Promise<unknown>) =>
      fn(txMock)
    );

    await createPublicBooking({
      ...BASE_REQUEST,
      clientName: '  Maria López  ',
      clientEmail: 'Maria.Lopez+bolo@gmail.com',
      clientPhone: '699 111 222',
      eventLocation: '  Barcelona  ',
      eventVenue: '  Masia Test  ',
      notes: '  Notes internes  ',
      preferredLocale: 'es',
    });

    expect(txMock.customer.upsert).toHaveBeenCalledWith({
      where: { emailNormalized: 'marialopez@gmail.com' },
      update: expect.objectContaining({
        email: 'maria.lopez+bolo@gmail.com',
        name: 'Maria López',
        nameNormalized: 'maria lopez',
        phone: '699 111 222',
        phoneNormalized: '+34699111222',
        preferredLocale: 'es',
      }),
      create: expect.objectContaining({
        email: 'maria.lopez+bolo@gmail.com',
        emailNormalized: 'marialopez@gmail.com',
        name: 'Maria López',
        nameNormalized: 'maria lopez',
        phone: '699 111 222',
        phoneNormalized: '+34699111222',
        source: 'WEBSITE',
        preferredLocale: 'es',
      }),
      select: { id: true },
    });

    const createCall = txMock.booking.create.mock.calls[0][0];
    expect(createCall.data.customerId).toBe('cust-1');
    expect(createCall.data.clientName).toBe('Maria López');
    expect(createCall.data.clientEmail).toBe('maria.lopez+bolo@gmail.com');
    expect(createCall.data.eventLocation).toBe('Barcelona');
    expect(createCall.data.eventVenue).toBe('Masia Test');
    expect(createCall.data.notes).toBe('Notes internes');
  });

  it('registra activitat BOOKING_CREATED al Customer 360', async () => {
    const txMock = makeTxMock();
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: ReturnType<typeof makeTxMock>) => Promise<unknown>) =>
      fn(txMock)
    );

    await createPublicBooking(BASE_REQUEST);

    expect(txMock.customerActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: 'cust-1',
        action: 'BOOKING_CREATED',
        details: expect.objectContaining({
          bookingId: 'booking-1',
          reference: 'OE-2026-ABCD',
          eventType: 'BIRTHDAY',
          status: 'PENDING',
        }),
      }),
    });
  });

  it('crea rastre adminLog i availability amb referència auditable', async () => {
    const txMock = makeTxMock();
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: ReturnType<typeof makeTxMock>) => Promise<unknown>) =>
      fn(txMock)
    );

    await createPublicBooking(BASE_REQUEST);

    expect(txMock.availability.create).toHaveBeenCalledWith({
      data: {
        date: new Date('2026-09-15'),
        status: 'BOOKED',
        note: 'Reserva pública pendent · Maria López',
      },
    });
    expect(txMock.availability.updateMany).toHaveBeenLastCalledWith({
      where: { date: new Date('2026-09-15') },
      data: {
        bookingId: 'booking-1',
        note: 'Reserva pública pendent OE-2026-ABCD · Maria López',
      },
    });
    expect(txMock.adminLog.create).toHaveBeenCalledWith({
      data: {
        action: 'CREATE',
        entity: 'booking',
        entityId: 'booking-1',
        details: expect.objectContaining({
          source: 'public_booking',
          reference: 'OE-2026-ABCD',
          customerId: 'cust-1',
          clientName: 'Maria López',
          clientEmail: 'maria@example.com',
          preferredLocale: 'ca',
          eventDate: '2026-09-15T00:00:00.000Z',
          eventType: 'BIRTHDAY',
          eventLocation: 'Barcelona',
          packId: 'pack-1',
          extraIds: [],
          extraHours: 0,
          subtotal: 400,
          discount: 0,
          vatRate: 21,
          vatAmount: 84,
          total: 484,
          status: 'PENDING',
          availabilityStatus: 'BOOKED',
        }),
      },
    });
  });

  it('envia emails de confirmació', async () => {
    await createPublicBooking(BASE_REQUEST);

    expect(mockSendConfirmation).toHaveBeenCalledWith(expect.objectContaining({
      id: 'booking-1',
      customerId: 'cust-1',
      clientEmail: 'maria@example.com',
      reference: 'OE-2026-ABCD',
    }));
    expect(mockSendAdminNotification).toHaveBeenCalledOnce();
  });

  it('no falla si emails fallen', async () => {
    mockSendConfirmation.mockRejectedValue(new Error('SMTP down'));

    const result = await createPublicBooking(BASE_REQUEST);

    expect(result.status).toBe(201); // Reserva creada igualment
  });

  it('usa preferredLocale per defecte ca', async () => {
    const txMock = makeTxMock();
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: ReturnType<typeof makeTxMock>) => Promise<unknown>) =>
      fn(txMock)
    );

    await createPublicBooking(BASE_REQUEST);

    const createCall = txMock.booking.create.mock.calls[0][0];
    expect(createCall.data.preferredLocale).toBe('ca');
    expect(txMock.customer.upsert.mock.calls[0][0].create.preferredLocale).toBe('ca');
  });

  it('normalitza preferredLocale abans de desar Customer i Booking', async () => {
    const txMock = makeTxMock();
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: ReturnType<typeof makeTxMock>) => Promise<unknown>) =>
      fn(txMock)
    );

    await createPublicBooking({
      ...BASE_REQUEST,
      preferredLocale: 'en-US',
    });

    const upsertCall = txMock.customer.upsert.mock.calls[0][0];
    const createCall = txMock.booking.create.mock.calls[0][0];
    expect(upsertCall.update.preferredLocale).toBe('en');
    expect(upsertCall.create.preferredLocale).toBe('en');
    expect(createCall.data.preferredLocale).toBe('en');
  });

  it('no desa preferredLocale invàlid a la reserva pública', async () => {
    const txMock = makeTxMock();
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: ReturnType<typeof makeTxMock>) => Promise<unknown>) =>
      fn(txMock)
    );

    await createPublicBooking({
      ...BASE_REQUEST,
      preferredLocale: 'xx<script>',
    });

    const upsertCall = txMock.customer.upsert.mock.calls[0][0];
    const createCall = txMock.booking.create.mock.calls[0][0];
    expect(upsertCall.update.preferredLocale).toBe('ca');
    expect(upsertCall.create.preferredLocale).toBe('ca');
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
    const txMock = makeTxMock();
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: ReturnType<typeof makeTxMock>) => Promise<unknown>) =>
      fn(txMock)
    );

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
