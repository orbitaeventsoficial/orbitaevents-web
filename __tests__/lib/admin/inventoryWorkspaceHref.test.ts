import { describe, expect, it } from 'vitest';
import { buildInventoryHref } from '@/lib/admin/inventoryWorkspaceHref';

describe('buildInventoryHref', () => {
  it('construeix la ruta de fitxa inventari', () => {
    expect(buildInventoryHref('item-123')).toBe('/admin/inventory/item-123');
  });
});
