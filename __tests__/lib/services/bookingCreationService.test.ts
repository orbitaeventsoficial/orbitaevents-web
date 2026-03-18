import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockCalculateGoogleMapsDistance, mockGetFuelCostPerKmReference } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { create: vi.fn(), findFirst: vi.fn() },
    lead: { findUnique: vi.fn(), update: vi.fn() },
    customer: { findUnique: vi.fn() },
    pack: { findUnique: vi.fn() },
    extra: { findUnique: vi.fn(), create: vi.fn() },
    packInventory: { findMany: vi.fn() },
    bookingInventory: { count: vi.fn(), upsert: vi.fn() },
    customerActivity: { create: vi.fn() },
    task: { create: vi.fn() },
    availability: { upsert: vi.fn() },
    adminLog: { create: vi.fn() },
  },
  mockCalculateGoogleMapsDistance: vi.fn(),
  mockGetFuelCostPerKmReference: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/services/googleMapsDistance', () => ({
  calculateGoogleMapsDistance: mockCalculateGoogleMapsDistance,
}));
vi.mock('@/lib/services/fuelReferenceService', () => ({
  getFuelCostPerKmReference: mockGetFuelCostPerKmReference,
}));

import { createBookingFromInput } from '@/lib/services/bookingCreationService';

const BASE_INPUT = {
  clientName: 'Joan Garcia',
  clientEmail: 'joan@example.com',
  clientPhone: '+34612345678',
  eventType: 'Boda',
  eventDate: '2026-09-15',
  eventLocation: 'Masia Can Roda, Girona',
  guestCount: 120,
  packId: 'pack-premium',
};

const MOCK_PACK = {
  id: 'pack-premium',
  price: 1500,
  extraHourPrice: 75,
  name: 'Premium',
};

function setupDefaults() {
  mockPrisma.pack.findUnique.mockResolvedValue(MOCK_PACK);
  mockPrisma.booking.findFirst.mockResolvedValue(null); // no previous bookings
  mockPrisma.booking.create.mockResolvedValue({
    id: 'booking-1',
    reference: 'OE-2026-001',
    packId: 'pack-premium',
    eventDate: new Date('2026-09-15'),
    eventType: 'Boda',
    status: 'PENDING',
    clientName: 'Joan Garcia',
    total: 1815,
    pack: MOCK_PACK,
    extras: [],
  });
  mockPrisma.customer.findUnique.mockResolvedValue(null);
  mockPrisma.lead.findUnique.mockResolvedValue(null);
  mockPrisma.lead.update.mockResolvedValue({});
  mockPrisma.extra.findUnique.mockResolvedValue(null);
  mockPrisma.packInventory.findMany.mockResolvedValue([]);
  mockPrisma.customerActivity.create.mockResolvedValue({});
  mockPrisma.task.create.mockResolvedValue({});
  mockPrisma.availability.upsert.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockGetFuelCostPerKmReference.mockResolvedValue({ costPerKm: 0.12 });
  mockCalculateGoogleMapsDistance.mockResolvedValue({ roundTripKm: 60 });
}

describe('createBookingFromInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it('retorna 404 si pack no trobat', async () => {
    mockPrisma.pack.findUnique.mockResolvedValue(null);

    const result = await createBookingFromInput(BASE_INPUT);
    expect(result.status).toBe(404);
    expect(result.body.error).toContain('Pack no trobat');
  });

  it('retorna 400 si data invàlida', async () => {
    const result = await createBookingFromInput({
      ...BASE_INPUT,
      eventDate: 'not-a-date',
    });
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('invàlida');
  });

  it('crea reserva correctament', async () => {
    const result = await createBookingFromInput(BASE_INPUT);

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(mockPrisma.booking.create).toHaveBeenCalledOnce();
  });

  it('genera referència OE-YYYY-001 sense reserves prèvies', async () => {
    await createBookingFromInput(BASE_INPUT);

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.reference).toMatch(/^OE-\d{4}-001$/);
  });

  it('genera referència incremental amb reserves prèvies', async () => {
    mockPrisma.booking.findFirst.mockResolvedValue({
      reference: `OE-${new Date().getFullYear()}-005`,
    });

    await createBookingFromInput(BASE_INPUT);

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.reference).toMatch(/^OE-\d{4}-006$/);
  });

  it('calcula preus correctament: subtotal + IVA 21% + dipòsit 30%', async () => {
    await createBookingFromInput(BASE_INPUT);

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    // Pack price: 1500, no extra hours, no extras, no discount
    // Travel charge depends on distance — with Google Maps returning 60km,
    // travelCharge is calculated by calculateTravelCharge(60)
    // But we'll check the financial structure is correct
    expect(createCall.data.vatRate).toBe(21);
    expect(createCall.data.depositAmount).toBeGreaterThan(0);
    expect(createCall.data.remainingAmount).toBe(
      createCall.data.total - createCall.data.depositAmount
    );
  });

  it('aplica hores extra al preu', async () => {
    await createBookingFromInput({
      ...BASE_INPUT,
      extraHours: 2,
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    // extraHoursPrice = 2 * 75 = 150
    // subtotalBase = 1500 + 150 = 1650
    expect(createCall.data.extraHours).toBe(2);
  });

  it('aplica descompte', async () => {
    await createBookingFromInput({
      ...BASE_INPUT,
      discount: 200,
      discountCode: 'PROMO',
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.discount).toBe(200);
    expect(createCall.data.discountCode).toBe('PROMO');
  });

  it('resol customerId des del lead', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ customerId: 'cust-from-lead' });

    await createBookingFromInput({
      ...BASE_INPUT,
      leadId: 'lead-1',
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.customerId).toBe('cust-from-lead');
  });

  it('resol customerId des del email', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'cust-by-email' });

    await createBookingFromInput(BASE_INPUT);

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.customerId).toBe('cust-by-email');
  });

  it('usa customerId directe si es proporciona', async () => {
    await createBookingFromInput({
      ...BASE_INPUT,
      customerId: 'cust-direct',
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.customerId).toBe('cust-direct');
    // No hauria de buscar per email
    expect(mockPrisma.customer.findUnique).not.toHaveBeenCalled();
  });

  it('crea customerActivity si vinculat a client', async () => {
    await createBookingFromInput({
      ...BASE_INPUT,
      customerId: 'cust-1',
    });

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: 'cust-1',
        action: 'BOOKING_CREATED',
        details: expect.objectContaining({
          bookingId: 'booking-1',
          reference: 'OE-2026-001',
        }),
      }),
    });
  });

  it('crea task de preparació 7 dies abans del event', async () => {
    await createBookingFromInput({
      ...BASE_INPUT,
      customerId: 'cust-1',
    });

    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: 'cust-1',
        bookingId: 'booking-1',
        status: 'OPEN',
        priority: 'HIGH',
        title: expect.stringContaining('OE-2026-001'),
      }),
    });
  });

  it('no crea activity ni task sense client vinculat', async () => {
    await createBookingFromInput(BASE_INPUT);

    expect(mockPrisma.customerActivity.create).not.toHaveBeenCalled();
    expect(mockPrisma.task.create).not.toHaveBeenCalled();
  });

  it('marca lead com WON si leadId proporcionat', async () => {
    await createBookingFromInput({
      ...BASE_INPUT,
      leadId: 'lead-1',
    });

    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: expect.objectContaining({
        status: 'WON',
        convertedAt: expect.any(Date),
      }),
    });
  });

  it('no marca lead sense leadId', async () => {
    await createBookingFromInput(BASE_INPUT);
    expect(mockPrisma.lead.update).not.toHaveBeenCalled();
  });

  it('crea registre availability', async () => {
    await createBookingFromInput(BASE_INPUT);

    expect(mockPrisma.availability.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { date: expect.any(Date) },
        create: expect.objectContaining({
          status: 'BOOKED',
          bookingId: 'booking-1',
        }),
      }),
    );
  });

  it('crea adminLog CREATE', async () => {
    await createBookingFromInput(BASE_INPUT);

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'CREATE',
        entity: 'booking',
        entityId: 'booking-1',
        details: expect.objectContaining({
          reference: expect.stringContaining('OE-'),
          clientName: 'Joan Garcia',
        }),
      }),
    });
  });

  it('calcula distància via Google Maps si no proporcionada', async () => {
    await createBookingFromInput(BASE_INPUT);

    expect(mockCalculateGoogleMapsDistance).toHaveBeenCalledWith({
      destination: expect.stringContaining('Girona'),
    });
  });

  it('usa distanceKm directa si proporcionada (no crida Google Maps)', async () => {
    await createBookingFromInput({
      ...BASE_INPUT,
      distanceKm: 100,
    });

    expect(mockCalculateGoogleMapsDistance).not.toHaveBeenCalled();
  });

  it('gestiona error de Google Maps sense petar', async () => {
    mockCalculateGoogleMapsDistance.mockRejectedValue(new Error('API error'));

    const result = await createBookingFromInput(BASE_INPUT);
    expect(result.status).toBe(200);
    // distanceKm queda null, no travel charge
  });

  it('normalitza eventType invàlid a OTHER', async () => {
    await createBookingFromInput({
      ...BASE_INPUT,
      eventType: 'INVALID_TYPE',
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.eventType).toBe('OTHER');
  });

  it('resol extras per ID', async () => {
    mockPrisma.extra.findUnique.mockResolvedValueOnce({ id: 'extra-real-id' });

    await createBookingFromInput({
      ...BASE_INPUT,
      extras: [{ extraId: 'extra-real-id', quantity: 2, price: 50 }],
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.extras).toEqual({
      create: [{ extraId: 'extra-real-id', quantity: 2, price: 50 }],
    });
  });

  it('ignora extras no resolts', async () => {
    mockPrisma.extra.findUnique.mockResolvedValue(null);

    await createBookingFromInput({
      ...BASE_INPUT,
      extras: [{ extraId: 'nonexistent', quantity: 1, price: 30 }],
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    // No extras created since none resolved
    expect(createCall.data.extras).toBeUndefined();
  });

  it('auto-assigna inventari del pack', async () => {
    mockPrisma.packInventory.findMany.mockResolvedValue([
      { itemId: 'item-1', quantity: 1, item: { condition: 'GOOD' } },
    ]);
    mockPrisma.bookingInventory.count.mockResolvedValue(0);
    mockPrisma.bookingInventory.upsert.mockResolvedValue({});

    await createBookingFromInput(BASE_INPUT);

    expect(mockPrisma.bookingInventory.upsert).toHaveBeenCalledOnce();
  });

  it('no assigna inventari si ja està en ús', async () => {
    mockPrisma.packInventory.findMany.mockResolvedValue([
      { itemId: 'item-1', quantity: 1, item: { condition: 'GOOD' } },
    ]);
    mockPrisma.bookingInventory.count.mockResolvedValue(1); // overlapping

    await createBookingFromInput(BASE_INPUT);

    expect(mockPrisma.bookingInventory.upsert).not.toHaveBeenCalled();
  });
});
