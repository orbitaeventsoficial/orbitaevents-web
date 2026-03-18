import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  sanitizeBookingChecklistItems,
  getBookingChecklist,
  saveBookingChecklist,
  DEFAULT_BOOKING_CHECKLIST_ITEMS,
} from '@/lib/services/bookingChecklistService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.findUnique.mockResolvedValue(null);
  mockPrisma.setting.upsert.mockResolvedValue({});
});

// ─────────────────────────────────────────────────────────────────────────
// sanitizeBookingChecklistItems (pure)
// ─────────────────────────────────────────────────────────────────────────
describe('sanitizeBookingChecklistItems', () => {
  it('retorna defaults si input no és array', () => {
    expect(sanitizeBookingChecklistItems(null)).toEqual(DEFAULT_BOOKING_CHECKLIST_ITEMS);
    expect(sanitizeBookingChecklistItems('string')).toEqual(DEFAULT_BOOKING_CHECKLIST_ITEMS);
    expect(sanitizeBookingChecklistItems(42)).toEqual(DEFAULT_BOOKING_CHECKLIST_ITEMS);
    expect(sanitizeBookingChecklistItems({})).toEqual(DEFAULT_BOOKING_CHECKLIST_ITEMS);
  });

  it('retorna defaults si array buit', () => {
    expect(sanitizeBookingChecklistItems([])).toEqual(DEFAULT_BOOKING_CHECKLIST_ITEMS);
  });

  it('retorna defaults si items no tenen id/label', () => {
    expect(sanitizeBookingChecklistItems([{ id: '', label: '' }])).toEqual(DEFAULT_BOOKING_CHECKLIST_ITEMS);
  });

  it('sanitiza items vàlids', () => {
    const input = [
      { id: 'test-1', label: 'Test 1', checked: true },
      { id: 'test-2', label: 'Test 2', checked: false },
    ];

    const result = sanitizeBookingChecklistItems(input);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('test-1');
    expect(result[0].label).toBe('Test 1');
    expect(result[0].checked).toBe(true);
  });

  it('filtra items invàlids mesclats amb vàlids', () => {
    const input = [
      { id: 'ok', label: 'OK item', checked: true },
      { id: '', label: 'No ID' },
      { id: 'ok2', label: '', checked: false },
    ];

    const result = sanitizeBookingChecklistItems(input);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ok');
  });

  it('converteix checked a boolean', () => {
    const input = [{ id: 'test', label: 'Test', checked: 'yes' }];

    const result = sanitizeBookingChecklistItems(input);

    expect(result[0].checked).toBe(true);
  });

  it('fa trim de id i label', () => {
    const input = [{ id: '  spaced  ', label: '  Label  ', checked: false }];

    const result = sanitizeBookingChecklistItems(input);

    expect(result[0].id).toBe('spaced');
    expect(result[0].label).toBe('Label');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// getBookingChecklist
// ─────────────────────────────────────────────────────────────────────────
describe('getBookingChecklist', () => {
  it('retorna defaults si no hi ha setting', async () => {
    const result = await getBookingChecklist('booking-1');
    expect(result).toEqual(DEFAULT_BOOKING_CHECKLIST_ITEMS);
  });

  it('retorna items guardats si existeixen', async () => {
    const saved = [{ id: 'custom', label: 'Custom', checked: true }];
    mockPrisma.setting.findUnique.mockResolvedValue({ value: JSON.stringify(saved) });

    const result = await getBookingChecklist('booking-1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('custom');
  });

  it('retorna defaults si JSON invàlid', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: 'not-json' });

    const result = await getBookingChecklist('booking-1');

    expect(result).toEqual(DEFAULT_BOOKING_CHECKLIST_ITEMS);
  });

  it('retorna defaults si setting.value buit', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: '' });

    const result = await getBookingChecklist('booking-1');

    expect(result).toEqual(DEFAULT_BOOKING_CHECKLIST_ITEMS);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// saveBookingChecklist
// ─────────────────────────────────────────────────────────────────────────
describe('saveBookingChecklist', () => {
  it('guarda i retorna items sanitizats', async () => {
    const input = [{ id: 'test', label: 'Test', checked: true }];

    const result = await saveBookingChecklist('booking-1', input);

    expect(result).toHaveLength(1);
    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'booking.checklist.booking-1' },
        create: expect.objectContaining({
          category: 'checklist',
        }),
      })
    );
  });

  it('guarda defaults si input invàlid', async () => {
    const result = await saveBookingChecklist('booking-1', null);

    expect(result).toEqual(DEFAULT_BOOKING_CHECKLIST_ITEMS);
    expect(mockPrisma.setting.upsert).toHaveBeenCalled();
  });
});
