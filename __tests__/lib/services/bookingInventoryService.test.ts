import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockGetBundles } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { findUnique: vi.fn() },
    bookingInventory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    inventoryItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    packInventory: { findMany: vi.fn() },
    adminLog: { create: vi.fn() },
  },
  mockGetBundles: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/inventoryBundles', () => ({
  getInventoryBundles: mockGetBundles,
}));

import {
  assignBookingInventory,
  getBookingInventoryView,
  updateBookingInventoryAssignment,
  removeBookingInventoryAssignment,
} from '@/lib/services/bookingInventoryService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findUnique.mockResolvedValue(null);
  mockPrisma.bookingInventory.findMany.mockResolvedValue([]);
  mockPrisma.bookingInventory.findUnique.mockResolvedValue(null);
  mockPrisma.bookingInventory.create.mockResolvedValue({ id: 'bi-1', itemId: 'item-1' });
  mockPrisma.bookingInventory.update.mockResolvedValue({ id: 'bi-1', itemId: 'item-1' });
  mockPrisma.bookingInventory.delete.mockResolvedValue({});
  mockPrisma.bookingInventory.count.mockResolvedValue(0);
  mockPrisma.inventoryItem.findUnique.mockResolvedValue(null);
  mockPrisma.inventoryItem.findMany.mockResolvedValue([]);
  mockPrisma.inventoryItem.update.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockGetBundles.mockResolvedValue([]);
});

describe('assignBookingInventory', () => {
  it('retorna 400 amb input invàlid', async () => {
    const result = await assignBookingInventory('b1', { mode: 'invalid' });
    expect(result.status).toBe(400);
  });

  it('retorna 404 si reserva no existeix', async () => {
    const result = await assignBookingInventory('b1', { itemId: 'item-1', mode: 'single' });
    expect(result.status).toBe(404);
  });

  it('retorna 404 si item no existeix (single)', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', packId: 'p1', status: 'CONFIRMED' });

    const result = await assignBookingInventory('b1', { itemId: 'item-1', mode: 'single' });
    expect(result.status).toBe(404);
  });

  it('retorna 409 si item ja assignat', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', packId: 'p1', status: 'CONFIRMED' });
    mockPrisma.inventoryItem.findUnique.mockResolvedValue({ id: 'item-1', code: 'AUD01', name: 'Altaveu', condition: 'GOOD' });
    mockPrisma.bookingInventory.findUnique.mockResolvedValue({ id: 'existing' });

    const result = await assignBookingInventory('b1', { itemId: 'item-1', mode: 'single' });
    expect(result.status).toBe(409);
  });

  it('assigna correctament (single)', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', packId: 'p1', status: 'CONFIRMED', reference: 'REF001', eventDate: new Date('2026-08-18T20:00:00.000Z') });
    mockPrisma.inventoryItem.findUnique.mockResolvedValue({ id: 'item-1', code: 'AUD01', name: 'Altaveu', condition: 'GOOD' });
    mockPrisma.bookingInventory.count.mockResolvedValue(0);

    const result = await assignBookingInventory('b1', { itemId: 'item-1', mode: 'single' });

    expect(result.status).toBe(200);
    expect(mockPrisma.bookingInventory.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        itemId: 'item-1',
        booking: expect.objectContaining({
          id: { not: 'b1' },
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
          eventDate: {
            gte: new Date('2026-08-18T00:00:00.000Z'),
            lt: new Date('2026-08-19T00:00:00.000Z'),
          },
        }),
      }),
    });
    expect(mockPrisma.bookingInventory.create).toHaveBeenCalled();
    expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { status: 'IN_USE' },
    });
  });

  it('retorna 400 sense itemId en mode single', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', packId: 'p1', status: 'PENDING' });

    const result = await assignBookingInventory('b1', { mode: 'single' });
    expect(result.status).toBe(400);
  });
});

describe('getBookingInventoryView', () => {
  it('mostra disponibles filtrant conflictes pel dia del bolo', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      packId: 'p1',
      eventDate: new Date('2026-08-18T20:00:00.000Z'),
      pack: { slug: 'pack-1', inventory: [] },
    });

    const result = await getBookingInventoryView('b1', 'http://localhost/admin/bookings/b1/inventory');

    expect(result.status).toBe(200);
    expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        bookingItems: {
          none: {
            booking: expect.objectContaining({
              id: { not: 'b1' },
              status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
              eventDate: {
                gte: new Date('2026-08-18T00:00:00.000Z'),
                lt: new Date('2026-08-19T00:00:00.000Z'),
              },
            }),
          },
        },
      }),
    }));
  });
});

describe('updateBookingInventoryAssignment', () => {
  it('retorna 400 amb input invàlid', async () => {
    const result = await updateBookingInventoryAssignment({});
    expect(result.status).toBe(400);
  });

  it('actualitza assignació', async () => {
    mockPrisma.bookingInventory.update.mockResolvedValue({ id: 'bi-1', itemId: 'item-1' });

    const result = await updateBookingInventoryAssignment({
      assignmentId: 'bi-1',
      checkedOut: true,
    });

    expect(result.status).toBe(200);
  });

  it('actualitza condició item si checkedIn amb conditionAfter', async () => {
    mockPrisma.bookingInventory.update.mockResolvedValue({ id: 'bi-1', itemId: 'item-1' });

    await updateBookingInventoryAssignment({
      assignmentId: 'bi-1',
      checkedIn: true,
      conditionAfter: 'FAIR',
    });

    expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { condition: 'FAIR' },
    });
  });
});

describe('removeBookingInventoryAssignment', () => {
  it('retorna 400 sense assignmentId', async () => {
    const result = await removeBookingInventoryAssignment(null);
    expect(result.status).toBe(400);
  });

  it('retorna 404 si no existeix', async () => {
    const result = await removeBookingInventoryAssignment('inexistent');
    expect(result.status).toBe(404);
  });

  it('elimina i torna status AVAILABLE si no hi ha altres assignacions', async () => {
    mockPrisma.bookingInventory.findUnique.mockResolvedValue({
      id: 'bi-1',
      itemId: 'item-1',
      item: { id: 'item-1', code: 'AUD01', status: 'IN_USE' },
      booking: { reference: 'REF001' },
    });

    const result = await removeBookingInventoryAssignment('bi-1');

    expect(result.status).toBe(200);
    expect(mockPrisma.bookingInventory.delete).toHaveBeenCalledWith({ where: { id: 'bi-1' } });
    expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { status: 'AVAILABLE' },
    });
  });
});
