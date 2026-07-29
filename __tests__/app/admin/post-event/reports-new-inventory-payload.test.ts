import { describe, expect, it } from 'vitest';

import { normalizePostEventInventoryItems } from '@/app/admin/post-event/reports/new/inventory-payload';

const item = {
  id: 'item-1',
  code: 'AUR-001',
  name: 'AURORA 1000',
  category: 'LIGHTING',
  condition: 'GOOD',
};

describe('normalizePostEventInventoryItems', () => {
  it('normalitza el payload real de booking inventory', () => {
    const result = normalizePostEventInventoryItems({
      assigned: [
        {
          id: 'booking-inventory-1',
          item,
          checkedOut: true,
          checkedIn: true,
          conditionAfter: 'DAMAGED',
        },
      ],
    });

    expect(result).toEqual([
      {
        id: 'booking-inventory-1',
        inventoryItem: item,
        checkedOut: true,
        checkedIn: true,
        conditionAfter: 'DAMAGED',
      },
    ]);
  });

  it('manté compatibilitat amb el payload antic assignedItems', () => {
    const result = normalizePostEventInventoryItems({
      assignedItems: [
        {
          id: 'booking-inventory-2',
          inventoryItem: item,
          checkedOut: false,
          checkedIn: false,
        },
      ],
    });

    expect(result).toEqual([
      {
        id: 'booking-inventory-2',
        inventoryItem: item,
        checkedOut: false,
        checkedIn: false,
        conditionAfter: null,
      },
    ]);
  });

  it('filtra files incompletes o malformades', () => {
    const result = normalizePostEventInventoryItems({
      assigned: [
        null,
        { id: 'booking-inventory-3' },
        { id: 'booking-inventory-4', item: { id: 'item-4', code: 'CAS-004' } },
        { id: 123, item },
        { id: 'booking-inventory-5', item },
      ],
    });

    expect(result).toEqual([
      {
        id: 'booking-inventory-5',
        inventoryItem: item,
        checkedOut: false,
        checkedIn: false,
        conditionAfter: null,
      },
    ]);
  });
});
