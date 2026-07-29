import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockCalculateGoogleMapsDistance, mockGetFuelCostPerKmReference } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
    lead: { findUnique: vi.fn(), update: vi.fn() },
    customer: { findUnique: vi.fn() },
    collaborator: { findUnique: vi.fn(), findFirst: vi.fn() },
    proposal: { findUnique: vi.fn(), update: vi.fn() },
    pack: { findUnique: vi.fn(), create: vi.fn() },
    extra: { findUnique: vi.fn(), create: vi.fn() },
    packInventory: { findMany: vi.fn() },
    bookingInventory: { count: vi.fn(), upsert: vi.fn(), groupBy: vi.fn() },
    customerActivity: { create: vi.fn() },
    task: { create: vi.fn() },
    availability: { upsert: vi.fn() },
    adminLog: { create: vi.fn() },
  },
  mockCalculateGoogleMapsDistance: vi.fn(),
  mockGetFuelCostPerKmReference: vi.fn(),
}));

const { mockSendBookingConfirmationEmail } = vi.hoisted(() => ({
  mockSendBookingConfirmationEmail: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/services/bookingConfirmationEmailService', () => ({
  sendBookingConfirmationEmail: mockSendBookingConfirmationEmail,
}));
vi.mock('@/lib/services/googleMapsDistance', () => ({
  calculateGoogleMapsDistance: mockCalculateGoogleMapsDistance,
}));
vi.mock('@/lib/services/fuelReferenceService', () => ({
  getEffectiveVehicleCostPerKm: mockGetFuelCostPerKmReference,
}));

import { createBookingFromInput } from '@/lib/services/bookingCreationService';
import { SOUND_RENTAL } from '@/lib/constants/inventory';

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
  djHours: 2,
  name: 'Premium',
};

function setupDefaults() {
  mockPrisma.pack.findUnique.mockResolvedValue(MOCK_PACK);
  mockPrisma.collaborator.findFirst.mockResolvedValue(null); // so llogat (Isma): per defecte no existeix → no afegeix línia
  mockPrisma.booking.findFirst.mockResolvedValue(null); // no previous bookings
  mockPrisma.booking.findUnique.mockResolvedValue(null); // reference doesn't exist yet
  mockPrisma.bookingInventory.groupBy.mockResolvedValue([]); // no overlapping items
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
  mockPrisma.collaborator.findUnique.mockResolvedValue(null);
  mockPrisma.proposal.findUnique.mockResolvedValue(null);
  mockPrisma.proposal.update.mockResolvedValue({});
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

  it('crea reserva des de pressupost i el vincula com a bookingId', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      id: 'proposal-1',
      customerId: 'cust-proposal',
      leadId: null,
      bookingId: null,
      total: 834,
      vatRate: 21,
      acceptedAt: null,
      contractStatus: null,
    });

    const result = await createBookingFromInput({
      ...BASE_INPUT,
      proposalId: 'proposal-1',
    });

    expect(result.status).toBe(200);
    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.customerId).toBe('cust-proposal');
    expect(createCall.data.invoiceRequired).toBe(true);
    expect(createCall.data.total).toBe(834);
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith({
      where: { id: 'proposal-1' },
      data: expect.objectContaining({
        bookingId: 'booking-1',
        status: 'ACCEPTED',
        contractStatus: 'DRAFT',
        contractSentAt: null,
      }),
    });
  });

  it('no reobre contracte existent quan vincula pressupost a reserva', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      id: 'proposal-1',
      customerId: 'cust-proposal',
      leadId: null,
      bookingId: null,
      total: 834,
      vatRate: 21,
      acceptedAt: new Date('2026-07-01'),
      contractStatus: 'SENT',
    });

    const result = await createBookingFromInput({
      ...BASE_INPUT,
      proposalId: 'proposal-1',
    });

    expect(result.status).toBe(200);
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith({
      where: { id: 'proposal-1' },
      data: expect.not.objectContaining({
        contractStatus: 'DRAFT',
        contractSentAt: null,
      }),
    });
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith({
      where: { id: 'proposal-1' },
      data: expect.objectContaining({
        bookingId: 'booking-1',
        status: 'ACCEPTED',
      }),
    });
  });

  it('bloqueja crear una altra reserva si el pressupost ja esta vinculat', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      id: 'proposal-1',
      customerId: 'cust-proposal',
      leadId: null,
      bookingId: 'booking-existing',
      total: 834,
      vatRate: 21,
      acceptedAt: new Date('2026-07-01'),
      contractStatus: null,
    });

    const result = await createBookingFromInput({
      ...BASE_INPUT,
      proposalId: 'proposal-1',
    });

    expect(result.status).toBe(409);
    expect(result.body.bookingId).toBe('booking-existing');
    expect(mockPrisma.booking.create).not.toHaveBeenCalled();
  });

  it('crea reserves noves amb transferència com a canal de cobrament per defecte', async () => {
    await createBookingFromInput({ ...BASE_INPUT, invoiceRequired: false });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.paymentMethod).toBe('TRANSFER');
    expect(createCall.data.invoiceRequired).toBe(false);
    expect(createCall.data.vatRate).toBe(0);
  });

  it('autoassigna inventari del pack només contra conflictes del mateix dia', async () => {
    mockPrisma.packInventory.findMany.mockResolvedValueOnce([
      { itemId: 'item-1', quantity: 1, item: { condition: 'GOOD' } },
    ]);

    await createBookingFromInput(BASE_INPUT);

    expect(mockPrisma.bookingInventory.groupBy).toHaveBeenCalledWith({
      by: ['itemId'],
      where: expect.objectContaining({
        itemId: { in: ['item-1'] },
        booking: expect.objectContaining({
          id: { not: 'booking-1' },
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
          eventDate: {
            gte: new Date('2026-09-15T00:00:00.000Z'),
            lt: new Date('2026-09-16T00:00:00.000Z'),
          },
        }),
      }),
    });
    expect(mockPrisma.bookingInventory.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { bookingId_itemId: { bookingId: 'booking-1', itemId: 'item-1' } },
    }));
  });

  it('genera referència OE-YYYY-001 sense reserves prèvies', async () => {
    await createBookingFromInput(BASE_INPUT);

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.reference).toMatch(/^OE-\d{4}-001$/);
  });

  it('envia email de confirmació al client en crear la reserva', async () => {
    await createBookingFromInput(BASE_INPUT);

    expect(mockSendBookingConfirmationEmail).toHaveBeenCalledOnce();
    const arg = mockSendBookingConfirmationEmail.mock.calls[0][0];
    expect(arg.to).toBe('joan@example.com');
    expect(arg.bookingId).toBe('booking-1');
    expect(arg.leadId).toBeNull();
    expect(arg.customerId).toBeNull();
    expect(arg.reference).toMatch(/^OE-\d{4}-001$/);
    expect(arg.total).toBeGreaterThan(0);
    expect(arg.depositAmount).toBeGreaterThan(0);
  });

  it('afegeix la liquidació interna de so Isma quan el bolo porta pack', async () => {
    mockPrisma.collaborator.findFirst.mockResolvedValue({ id: 'isma-1' });
    await createBookingFromInput(BASE_INPUT);

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    const lines = createCall.data.serviceLines?.create ?? [];
    const sound = lines.find((l: { collaboratorId?: string }) => l.collaboratorId === 'isma-1');
    expect(sound).toBeDefined();
    expect(sound.costAmount).toBe(50);
    expect(sound.revenueAmount).toBe(0); // no es factura a part: només resta al marge
  });

  it('NO afegeix línia de so si el col·laborador intern no existeix', async () => {
    mockPrisma.collaborator.findFirst.mockResolvedValue(null);
    await createBookingFromInput(BASE_INPUT);

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    const lines = createCall.data.serviceLines?.create ?? [];
    expect(lines.length).toBe(0);
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
    await createBookingFromInput({ ...BASE_INPUT, invoiceRequired: true });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    // Pack price: 1500, no extra hours, no extras, no discount
    // Travel charge depends on distance — with Google Maps returning 60km,
    // travelCharge is calculated by calculateTravelCharge(60)
    // But we'll check the financial structure is correct
    expect(createCall.data.invoiceRequired).toBe(true);
    expect(createCall.data.vatRate).toBe(21);
    expect(createCall.data.depositAmount).toBeGreaterThan(0);
    // remainingAmount = total - deposit, arrodonit a cèntims (#699): vat i total
    // ara s'arrodoneixen per evitar soroll de coma flotant a BD/Stripe.
    expect(createCall.data.remainingAmount).toBe(
      Math.round((createCall.data.total - createCall.data.depositAmount) * 100) / 100
    );
    // Invariant de domini: dipòsit + restant = total (tot a 2 decimals).
    expect(
      Math.round((createCall.data.depositAmount + createCall.data.remainingAmount) * 100) / 100
    ).toBe(createCall.data.total);
    // Cap valor de diners pot tenir més de 2 decimals.
    for (const field of ['vatAmount', 'total', 'depositAmount', 'remainingAmount'] as const) {
      const v = createCall.data[field] as number;
      expect(Math.round(v * 100) / 100).toBe(v);
    }
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

  it('deriva hores extra quan l’horari supera les hores del pack i creua mitjanit', async () => {
    await createBookingFromInput({
      ...BASE_INPUT,
      eventStartTime: '23:00',
      eventEndTime: '02:00',
      extraHours: 0,
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.extraHours).toBe(1);
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

  it('normalitza descompte negatiu a 0 quan el servei rep dades brutes', async () => {
    await createBookingFromInput({
      ...BASE_INPUT,
      discount: -200,
      distanceKm: 0,
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.discount).toBe(0);
    expect(createCall.data.total).toBe(1500);
  });

  it('no permet que un descompte superior al subtotal generi totals negatius', async () => {
    await createBookingFromInput({
      ...BASE_INPUT,
      discount: 2000,
      distanceKm: 0,
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.discount).toBe(2000);
    expect(createCall.data.vatAmount).toBe(0);
    expect(createCall.data.total).toBe(0);
    expect(createCall.data.depositAmount).toBe(0);
    expect(createCall.data.remainingAmount).toBe(0);
  });

  it('no suma extres que no es poden resoldre a BD', async () => {
    mockPrisma.extra.findUnique.mockResolvedValue(null);

    await createBookingFromInput({
      ...BASE_INPUT,
      distanceKm: 0,
      extras: [{ extraId: 'extra-missing', price: 300, quantity: 2 }],
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.subtotal).toBe(1500);
    expect(createCall.data.total).toBe(1500);
    expect(createCall.data.extras).toBeUndefined();
  });

  it('normalitza preu i quantitat bruts dels extres abans de sumar-los', async () => {
    mockPrisma.extra.findUnique.mockImplementation(async ({ where }) =>
      where.id === 'extra-ok' ? { id: 'extra-ok' } : null,
    );

    await createBookingFromInput({
      ...BASE_INPUT,
      distanceKm: 0,
      extras: [{ extraId: 'extra-ok', price: -300, quantity: -2 }],
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.subtotal).toBe(1500);
    expect(createCall.data.total).toBe(1500);
    expect(createCall.data.extras).toEqual({
      create: [{ extraId: 'extra-ok', quantity: 1, price: 0 }],
    });
  });

  it('respecta el total final acordat com a import exacte', async () => {
    await createBookingFromInput({
      ...BASE_INPUT,
      manualTotalPrice: 340,
      customPackPrice: 300,
      extraHours: 2,
      discount: 25,
      invoiceRequired: false,
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.total).toBe(340);
    expect(createCall.data.subtotal).toBe(340);
    expect(createCall.data.discount).toBe(0);
    expect(createCall.data.vatAmount).toBe(0);
    expect(createCall.data.depositAmount).toBe(102);
    expect(createCall.data.remainingAmount).toBe(238);
  });

  it('factura la reserva a un partner sense crear vincle Customer mirall', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue({
      id: 'partner-1',
      name: 'Carlos Lucas',
      company: 'Masquerade Events',
      email: 'carlos@example.com',
      phone: '600111222',
    });

    await createBookingFromInput({
      ...BASE_INPUT,
      customerId: 'cust-ignored',
      billedCollaboratorId: 'partner-1',
      manualTotalPrice: 340,
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.customerId).toBeNull();
    expect(createCall.data.billedCollaboratorId).toBe('partner-1');
    expect(createCall.data.clientName).toBe('Masquerade Events');
    expect(createCall.data.clientEmail).toBe('carlos@example.com');
    expect(createCall.data.clientPhone).toBe('600111222');
    expect(mockPrisma.customer.findUnique).not.toHaveBeenCalled();
  });

  it('desa línies de servei estructurades dins la reserva', async () => {
    await createBookingFromInput({
      ...BASE_INPUT,
      manualTotalPrice: 340,
      serviceLines: [
        { kind: 'SOUND_TECH', label: 'Tècnic de so Òrbita', revenueAmount: 40, costAmount: 0, hours: 1 },
        { kind: 'DJ', label: 'DJ Òrbita', revenueAmount: 300, costAmount: 0, hours: 3 },
        { kind: 'PROVIDER_SERVICE', label: 'Animació partner', collaboratorId: 'partner-1', costAmount: 120 },
      ],
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.serviceLines).toEqual({
      create: [
        expect.objectContaining({ kind: 'SOUND_TECH', label: 'Tècnic de so Òrbita', revenueAmount: 40, costAmount: 0 }),
        expect.objectContaining({ kind: 'DJ', label: 'DJ Òrbita', revenueAmount: 300, costAmount: 0 }),
        expect.objectContaining({ kind: 'PROVIDER_SERVICE', collaboratorId: 'partner-1', costAmount: 120 }),
      ],
    });
  });

  it('back-calcula IVA quan el total final acordat porta factura', async () => {
    await createBookingFromInput({
      ...BASE_INPUT,
      manualTotalPrice: 121,
      invoiceRequired: true,
    });

    const createCall = mockPrisma.booking.create.mock.calls[0][0];
    expect(createCall.data.total).toBe(121);
    expect(createCall.data.subtotal).toBe(100);
    expect(createCall.data.vatRate).toBe(21);
    expect(createCall.data.vatAmount).toBe(21);
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
        source: 'BOOKING_CREATION',
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
    mockPrisma.bookingInventory.groupBy.mockResolvedValue([{ itemId: 'item-1' }]); // overlapping

    await createBookingFromInput(BASE_INPUT);

    expect(mockPrisma.bookingInventory.upsert).not.toHaveBeenCalled();
  });

  describe('herència del bolo del lead (Fase 2)', () => {
    it('si el payload no porta línies, hereta les del lead (LeadServiceLine → BookingServiceLine)', async () => {
      setupDefaults();
      mockPrisma.lead.findUnique.mockResolvedValue({
        customerId: null,
        sourceCollaboratorId: null,
        serviceLines: [
          { collaboratorId: null, kind: 'DJ', label: 'DJ · 2 hores', revenueAmount: 250, costAmount: null, quantity: 1, hours: 2, partyType: null, notes: null },
          { collaboratorId: 'col1', kind: 'PROVIDER_SERVICE', label: 'Animació', revenueAmount: 240, costAmount: 200, quantity: 1, hours: 1.5, partyType: 'infantil', notes: null },
        ],
      });

      await createBookingFromInput({ ...BASE_INPUT, leadId: 'lead1' });

      const createArg = mockPrisma.booking.create.mock.calls[0][0];
      expect(createArg.data.serviceLines?.create).toHaveLength(2);
      expect(createArg.data.serviceLines.create[0]).toMatchObject({ kind: 'DJ', label: 'DJ · 2 hores', hours: 2 });
      expect(createArg.data.serviceLines.create[1]).toMatchObject({ label: 'Animació', hours: 1.5, partyType: 'infantil' });
    });

    it('si el payload porta línies, tenen prioritat sobre les del lead', async () => {
      setupDefaults();
      mockPrisma.lead.findUnique.mockResolvedValue({
        customerId: null, sourceCollaboratorId: null,
        serviceLines: [{ collaboratorId: null, kind: 'DJ', label: 'del lead', revenueAmount: 250, costAmount: null, quantity: 1, hours: null, notes: null }],
      });

      await createBookingFromInput({
        ...BASE_INPUT, leadId: 'lead1',
        serviceLines: [{ kind: 'OTHER', label: 'del payload', revenueAmount: 100, quantity: 1 }],
      });

      const createArg = mockPrisma.booking.create.mock.calls[0][0];
      expect(createArg.data.serviceLines.create).toHaveLength(1);
      expect(createArg.data.serviceLines.create[0]).toMatchObject({ label: 'del payload' });
    });

    it('multiplica el preu de les línies heretades per la quantitat en el subtotal', async () => {
      setupDefaults();
      mockPrisma.lead.findUnique.mockResolvedValue({
        customerId: null,
        sourceCollaboratorId: null,
        serviceLines: [
          { collaboratorId: null, kind: 'DJ', label: 'DJ extra', revenueAmount: 120, costAmount: null, quantity: 3, hours: null, notes: null },
        ],
      });
      mockPrisma.pack.findUnique.mockImplementation(({ where }: { where: { slug?: string; id?: string } }) => {
        if (where.slug === 'personalitzat') return Promise.resolve({ id: 'pack-custom' });
        if (where.id === 'pack-custom') return Promise.resolve({ ...MOCK_PACK, id: 'pack-custom', price: 0, djHours: 0, extraHourPrice: 0 });
        return Promise.resolve(null);
      });

      await createBookingFromInput({
        ...BASE_INPUT,
        leadId: 'lead1',
        packId: '__custom__',
        distanceKm: 0,
      });

      const createArg = mockPrisma.booking.create.mock.calls[0][0];
      expect(createArg.data.serviceLines.create[0]).toMatchObject({ label: 'DJ extra', revenueAmount: 120, quantity: 3 });
      expect(createArg.data.subtotal).toBe(360);
      expect(createArg.data.total).toBe(360);
    });
  });

  describe('bolo personalitzat (sense pack de catàleg)', () => {
    it('amb packId marker reusa el pack tècnic existent per slug', async () => {
      setupDefaults();
      // El pack tècnic ja existeix.
      mockPrisma.pack.findUnique.mockImplementation(({ where }: { where: { slug?: string; id?: string } }) => {
        if (where.slug === 'personalitzat') return Promise.resolve({ id: 'pack-custom' });
        if (where.id === 'pack-custom') return Promise.resolve({ ...MOCK_PACK, id: 'pack-custom', price: 0, djHours: 0, extraHourPrice: 0 });
        return Promise.resolve(null);
      });

      const result = await createBookingFromInput({
        ...BASE_INPUT,
        packId: '__custom__',
        manualTotalPrice: 340,
        serviceLines: [{ kind: 'DJ', label: 'DJ Òrbita', revenueAmount: 300, quantity: 1 }],
      });

      expect(result.status).toBe(200);
      expect(mockPrisma.pack.create).not.toHaveBeenCalled(); // ja existia
      expect(mockPrisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ packId: 'pack-custom' }) })
      );
    });

    it('amb packId marker crea el pack tècnic si no existeix', async () => {
      setupDefaults();
      mockPrisma.pack.findUnique.mockImplementation(({ where }: { where: { slug?: string; id?: string } }) => {
        if (where.slug === 'personalitzat') return Promise.resolve(null); // no existeix encara
        if (where.id === 'pack-custom-new') return Promise.resolve({ ...MOCK_PACK, id: 'pack-custom-new', price: 0, djHours: 0, extraHourPrice: 0 });
        return Promise.resolve(null);
      });
      mockPrisma.pack.create.mockResolvedValue({ id: 'pack-custom-new' });

      const result = await createBookingFromInput({ ...BASE_INPUT, packId: '__custom__', manualTotalPrice: 200 });

      expect(result.status).toBe(200);
      expect(mockPrisma.pack.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: 'personalitzat', price: 0 }) })
      );
    });

    it('afegeix so Isma quan un bolo personalitzat porta línia DJ', async () => {
      setupDefaults();
      mockPrisma.collaborator.findFirst.mockResolvedValue({ id: 'isma-1' });
      mockPrisma.pack.findUnique.mockImplementation(({ where }: { where: { slug?: string; id?: string } }) => {
        if (where.slug === 'personalitzat') return Promise.resolve({ id: 'pack-custom' });
        if (where.id === 'pack-custom') return Promise.resolve({ ...MOCK_PACK, id: 'pack-custom', price: 0, djHours: 0, extraHourPrice: 0 });
        return Promise.resolve(null);
      });

      await createBookingFromInput({
        ...BASE_INPUT,
        packId: '__custom__',
        manualTotalPrice: 340,
        serviceLines: [{ kind: 'DJ', label: 'DJ Òrbita', revenueAmount: 300, quantity: 1 }],
      });

      const createArg = mockPrisma.booking.create.mock.calls[0][0];
      expect(createArg.data.serviceLines.create).toHaveLength(2);
      expect(createArg.data.serviceLines.create[0]).toMatchObject({ kind: 'DJ', label: 'DJ Òrbita' });
      expect(createArg.data.serviceLines.create).toContainEqual(
        expect.objectContaining({ collaboratorId: 'isma-1', label: SOUND_RENTAL.label, costAmount: SOUND_RENTAL.costPerEvent, revenueAmount: 0 }),
      );
    });
  });
});
