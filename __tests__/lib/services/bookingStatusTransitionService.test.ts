import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockTryPortal, mockCalcDuration } = vi.hoisted(() => ({
  mockPrisma: {
    $transaction: vi.fn(),
    booking: { findUnique: vi.fn() },
    bookingInventory: { count: vi.fn(), create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
    inventoryItem: { update: vi.fn(), updateMany: vi.fn() },
    inventoryUsage: { create: vi.fn(), createMany: vi.fn() },
    availability: { updateMany: vi.fn() },
    liveNotification: { create: vi.fn() },
  },
  mockTryPortal: vi.fn(),
  mockCalcDuration: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/bookingPortalCompletionService', () => ({
  tryEnsureCompletedBookingPortalAccess: mockTryPortal,
}));
vi.mock('@/lib/inventory-utils', () => ({
  calculateEventDuration: mockCalcDuration,
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
    mockPrisma.inventoryItem.update.mockResolvedValue({});
    mockPrisma.inventoryItem.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.inventoryUsage.create.mockResolvedValue({});
    mockPrisma.inventoryUsage.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.availability.updateMany.mockResolvedValue({});
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<void>) => {
      await fn({
        ...mockPrisma,
        $executeRaw: vi.fn(),
      } as never);
    });
    mockTryPortal.mockResolvedValue(undefined);
    mockCalcDuration.mockReturnValue(7);
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
  });

  // ─── COMPLETED ──────────────────────────────────────────

  it('actualitza stats (total_events, total_people) al completar', async () => {
    const txMock = { $executeRaw: vi.fn(), liveNotification: { create: vi.fn().mockResolvedValue({}) } };
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => Promise<void>) => {
      await fn(txMock);
    });

    const result = await applyBookingStatusSideEffects(makeInput({
      newStatus: 'COMPLETED',
    }));

    expect(result.statsUpdated).toBe(true);
    expect(txMock.$executeRaw).toHaveBeenCalledTimes(2); // total_events + total_people
    expect(txMock.liveNotification.create).toHaveBeenCalledOnce();
  });

  it('no compta guests si guestCount és 0', async () => {
    const txMock = { $executeRaw: vi.fn(), liveNotification: { create: vi.fn().mockResolvedValue({}) } };
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => Promise<void>) => {
      await fn(txMock);
    });

    await applyBookingStatusSideEffects(makeInput({
      newStatus: 'COMPLETED',
      existing: { ...makeInput().existing, guestCount: 0 },
    }));

    // Only total_events, not total_people
    expect(txMock.$executeRaw).toHaveBeenCalledTimes(1);
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
