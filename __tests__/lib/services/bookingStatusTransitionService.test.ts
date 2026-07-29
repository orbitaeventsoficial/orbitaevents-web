import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockTryPortal, mockCalcDuration, mockOnBookingConfirmed } = vi.hoisted(() => ({
  mockPrisma: {
    $transaction: vi.fn(),
    booking: { findUnique: vi.fn() },
    bookingInventory: { count: vi.fn(), create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), groupBy: vi.fn(), updateMany: vi.fn() },
    inventoryItem: { update: vi.fn(), updateMany: vi.fn() },
    inventoryUsage: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
    availability: { updateMany: vi.fn() },
    liveNotification: { create: vi.fn(), findFirst: vi.fn() },
  },
  mockTryPortal: vi.fn(),
  mockCalcDuration: vi.fn(),
  mockOnBookingConfirmed: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/bookingPortalCompletionService', () => ({
  tryEnsureCompletedBookingPortalAccess: mockTryPortal,
}));
vi.mock('@/lib/inventory-utils', () => ({
  calculateEventDuration: mockCalcDuration,
}));
vi.mock('@/lib/services/automationTriggers', () => ({
  onBookingConfirmed: mockOnBookingConfirmed,
}));

import { applyBookingStatusSideEffects, type BookingStatusTransitionInput } from '@/lib/services/bookingStatusTransitionService';

function makeInput(overrides: Partial<BookingStatusTransitionInput> = {}): BookingStatusTransitionInput {
  return {
    bookingId: 'booking-1',
    oldStatus: 'PENDING',
    newStatus: 'CONFIRMED',
    existing: {
      guestCount: 120,
      eventType: 'Boda' as never,
      eventDate: new Date('2026-08-18T20:00:00.000Z'),
      eventLocation: 'Masia Can Roda',
      eventStartTime: '20:00',
      eventEndTime: '03:00',
      reference: 'OE-2026-001',
      preferredLocale: 'ca',
      clientEmail: 'joan@example.com',
      clientName: 'Joan Garcia',
    },
    portalTrigger: 'admin-manual',
    ...overrides,
  };
}

describe('applyBookingStatusSideEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.booking.findUnique.mockResolvedValue(null);
    mockPrisma.bookingInventory.count.mockResolvedValue(0);
    mockPrisma.bookingInventory.create.mockResolvedValue({});
    mockPrisma.bookingInventory.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.bookingInventory.findMany.mockResolvedValue([]);
    mockPrisma.bookingInventory.groupBy.mockResolvedValue([]);
    mockPrisma.bookingInventory.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.inventoryItem.update.mockResolvedValue({});
    mockPrisma.inventoryItem.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.inventoryUsage.create.mockResolvedValue({});
    mockPrisma.inventoryUsage.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.inventoryUsage.findMany.mockResolvedValue([]);
    mockPrisma.inventoryUsage.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.availability.updateMany.mockResolvedValue({});
    mockPrisma.liveNotification.findFirst.mockResolvedValue(null);
    mockPrisma.liveNotification.create.mockResolvedValue({});
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<void>) => {
      await fn({
        ...mockPrisma,
        $executeRaw: vi.fn(),
      } as never);
    });
    mockTryPortal.mockResolvedValue(undefined);
    mockCalcDuration.mockReturnValue(7);
    mockOnBookingConfirmed.mockResolvedValue({ triggered: true, action: 'pre-event-checklist' });
  });

  // ─── CONFIRMED ──────────────────────────────────────────

  it('assigna inventari del pack al confirmar', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'booking-1',
      pack: {
        inventory: [{ itemId: 'item-1', quantity: 1, item: { condition: 'GOOD' } }],
      },
      inventory: [],
    });

    await applyBookingStatusSideEffects(makeInput({ newStatus: 'CONFIRMED' }));

    expect(mockOnBookingConfirmed).toHaveBeenCalledWith('booking-1', { source: 'booking-status-transition' });
    expect(mockPrisma.bookingInventory.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        bookingId: 'booking-1',
        itemId: 'item-1',
        quantity: 1,
      })],
      skipDuplicates: true,
    });
    expect(mockPrisma.inventoryItem.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['item-1'] } },
      data: { status: 'IN_USE' },
    });
    expect(mockPrisma.bookingInventory.groupBy).toHaveBeenCalledWith({
      by: ['itemId'],
      where: expect.objectContaining({
        itemId: { in: ['item-1'] },
        booking: expect.objectContaining({
          id: { not: 'booking-1' },
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
          eventDate: {
            gte: new Date('2026-08-18T00:00:00.000Z'),
            lt: new Date('2026-08-19T00:00:00.000Z'),
          },
        }),
      }),
    });
  });

  it('no reassigna inventari ja assignat', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'booking-1',
      pack: {
        inventory: [{ itemId: 'item-1', quantity: 1, item: { condition: 'GOOD' } }],
      },
      inventory: [{ itemId: 'item-1' }], // ja assignat
    });

    await applyBookingStatusSideEffects(makeInput({ newStatus: 'CONFIRMED' }));

    expect(mockPrisma.bookingInventory.createMany).not.toHaveBeenCalled();
    expect(mockPrisma.inventoryItem.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['item-1'] } },
      data: { status: 'IN_USE' },
    });
  });

  it('no assigna inventari si en ús per altra reserva activa', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'booking-1',
      pack: {
        inventory: [{ itemId: 'item-1', quantity: 1, item: { condition: 'GOOD' } }],
      },
      inventory: [],
    });
    mockPrisma.bookingInventory.groupBy.mockResolvedValue([{ itemId: 'item-1' }]); // overlapping

    await applyBookingStatusSideEffects(makeInput({ newStatus: 'CONFIRMED' }));

    expect(mockPrisma.bookingInventory.createMany).not.toHaveBeenCalled();
  });

  it('no fa res d\'inventari si CONFIRMED → CONFIRMED', async () => {
    await applyBookingStatusSideEffects(makeInput({
      oldStatus: 'CONFIRMED',
      newStatus: 'CONFIRMED',
    }));

    expect(mockPrisma.booking.findUnique).not.toHaveBeenCalled();
    expect(mockOnBookingConfirmed).not.toHaveBeenCalled();
  });

  // ─── COMPLETED ──────────────────────────────────────────

  it('marca stats actualitzades i crea notificació pública al completar', async () => {
    const result = await applyBookingStatusSideEffects(makeInput({
      newStatus: 'COMPLETED',
    }));

    expect(result.statsUpdated).toBe(true);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockPrisma.liveNotification.findFirst).toHaveBeenCalledWith({
      where: { bookingId: 'booking-1', isReal: true },
      select: { id: true },
    });
    expect(mockPrisma.liveNotification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bookingId: 'booking-1',
        type: 'Boda',
        location: 'Masia Can Roda',
        isReal: true,
      }),
    });
  });

  it('no duplica notificació pública si la reserva ja en tenia una', async () => {
    mockPrisma.liveNotification.findFirst.mockResolvedValue({ id: 'live-1' });

    const result = await applyBookingStatusSideEffects(makeInput({
      newStatus: 'COMPLETED',
    }));

    expect(result.statsUpdated).toBe(false);
    expect(mockPrisma.liveNotification.create).not.toHaveBeenCalled();
  });

  it('crea inventoryUsage per cada item al completar', async () => {
    mockPrisma.bookingInventory.findMany.mockResolvedValue([
      { itemId: 'item-1', item: { id: 'item-1' } },
      { itemId: 'item-2', item: { id: 'item-2' } },
    ]);

    await applyBookingStatusSideEffects(makeInput({ newStatus: 'COMPLETED' }));

    expect(mockPrisma.inventoryUsage.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          itemId: 'item-1',
          bookingId: 'booking-1',
          hoursUsed: 7,
          notes: expect.stringContaining('OE-2026-001'),
        }),
        expect.objectContaining({
          itemId: 'item-2',
          bookingId: 'booking-1',
        }),
      ]),
    });
  });

  it('marca inventari com sortit i retornat al completar', async () => {
    mockPrisma.bookingInventory.findMany.mockResolvedValue([
      { itemId: 'item-1', item: { id: 'item-1' } },
    ]);

    await applyBookingStatusSideEffects(makeInput({ newStatus: 'COMPLETED' }));

    expect(mockPrisma.bookingInventory.updateMany).toHaveBeenCalledWith({
      where: { bookingId: 'booking-1' },
      data: { checkedOut: true, checkedIn: true },
    });
  });

  it('actualitza inventoryUsage existent i només crea els items que falten', async () => {
    mockPrisma.bookingInventory.findMany.mockResolvedValue([
      { itemId: 'item-1', item: { id: 'item-1' } },
      { itemId: 'item-2', item: { id: 'item-2' } },
    ]);
    mockPrisma.inventoryUsage.findMany.mockResolvedValue([{ itemId: 'item-1' }]);

    await applyBookingStatusSideEffects(makeInput({ newStatus: 'COMPLETED' }));

    expect(mockPrisma.inventoryUsage.updateMany).toHaveBeenCalledWith({
      where: {
        bookingId: 'booking-1',
        itemId: { in: ['item-1'] },
      },
      data: {
        hoursUsed: 7,
        notes: 'Bolo OE-2026-001',
      },
    });
    expect(mockPrisma.inventoryUsage.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        itemId: 'item-2',
        bookingId: 'booking-1',
        hoursUsed: 7,
      })],
    });
  });

  it('no crea inventoryUsage si durada és 0', async () => {
    mockCalcDuration.mockReturnValue(0);
    mockPrisma.bookingInventory.findMany.mockResolvedValue([
      { itemId: 'item-1', item: { id: 'item-1' } },
    ]);

    await applyBookingStatusSideEffects(makeInput({ newStatus: 'COMPLETED' }));

    expect(mockPrisma.inventoryUsage.createMany).not.toHaveBeenCalled();
  });

  it('allibera inventari si no té altres reserves actives', async () => {
    mockPrisma.bookingInventory.findMany.mockResolvedValue([
      { itemId: 'item-1', item: { id: 'item-1' } },
    ]);
    mockPrisma.bookingInventory.groupBy.mockResolvedValue([]); // no other active

    await applyBookingStatusSideEffects(makeInput({ newStatus: 'COMPLETED' }));

    expect(mockPrisma.inventoryItem.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['item-1'] } },
      data: { status: 'AVAILABLE' },
    });
  });

  it('no allibera inventari si altres reserves actives', async () => {
    mockPrisma.bookingInventory.findMany.mockResolvedValue([
      { itemId: 'item-1', item: { id: 'item-1' } },
    ]);
    mockPrisma.bookingInventory.groupBy.mockResolvedValue([{ itemId: 'item-1' }]); // still active elsewhere

    await applyBookingStatusSideEffects(makeInput({ newStatus: 'COMPLETED' }));

    expect(mockPrisma.inventoryItem.updateMany).not.toHaveBeenCalled();
  });

  it('crida tryEnsureCompletedBookingPortalAccess al completar', async () => {
    await applyBookingStatusSideEffects(makeInput({ newStatus: 'COMPLETED' }));

    expect(mockTryPortal).toHaveBeenCalledWith({
      bookingId: 'booking-1',
      preferredLocale: 'ca',
      clientEmail: 'joan@example.com',
      clientName: 'Joan Garcia',
      trigger: 'admin-manual',
    });
  });

  it('no crida portal si oldStatus ja era COMPLETED', async () => {
    await applyBookingStatusSideEffects(makeInput({
      oldStatus: 'COMPLETED',
      newStatus: 'COMPLETED',
    }));

    expect(mockTryPortal).not.toHaveBeenCalled();
  });

  // ─── CANCELLED ──────────────────────────────────────────

  it('allibera disponibilitat al cancel·lar', async () => {
    await applyBookingStatusSideEffects(makeInput({ newStatus: 'CANCELLED' }));

    expect(mockPrisma.availability.updateMany).toHaveBeenCalledWith({
      where: { bookingId: 'booking-1' },
      data: { status: 'AVAILABLE', bookingId: null },
    });
  });

  it('allibera inventari al cancel·lar si no té altres actives', async () => {
    mockPrisma.bookingInventory.findMany.mockResolvedValue([
      { itemId: 'item-1' },
    ]);
    mockPrisma.bookingInventory.groupBy.mockResolvedValue([]); // no other active

    await applyBookingStatusSideEffects(makeInput({ newStatus: 'CANCELLED' }));

    expect(mockPrisma.inventoryItem.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['item-1'] } },
      data: { status: 'AVAILABLE' },
    });
  });

  it('no allibera inventari cancel·lat si altres reserves actives', async () => {
    mockPrisma.bookingInventory.findMany.mockResolvedValue([
      { itemId: 'item-1' },
    ]);
    mockPrisma.bookingInventory.groupBy.mockResolvedValue([{ itemId: 'item-1' }]); // still active

    await applyBookingStatusSideEffects(makeInput({ newStatus: 'CANCELLED' }));

    expect(mockPrisma.inventoryItem.updateMany).not.toHaveBeenCalled();
  });

  // ─── General ──────────────────────────────────────────

  it('retorna statsUpdated=false si no COMPLETED', async () => {
    const result = await applyBookingStatusSideEffects(makeInput({ newStatus: 'CONFIRMED' }));
    expect(result.statsUpdated).toBe(false);
  });
});
