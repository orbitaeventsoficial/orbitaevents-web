type InventoryItemPayload = {
  id: string;
  code: string;
  name: string;
  category: string;
  condition: string;
};

export type PostEventInventoryItem = {
  id: string;
  inventoryItem: InventoryItemPayload;
  checkedOut: boolean;
  checkedIn: boolean;
  conditionAfter: string | null;
};

type RawInventoryAssignment = {
  id?: unknown;
  item?: InventoryItemPayload | null;
  inventoryItem?: InventoryItemPayload | null;
  checkedOut?: unknown;
  checkedIn?: unknown;
  conditionAfter?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function normalizeInventoryItemPayload(value: unknown): InventoryItemPayload | null {
  if (!isRecord(value)) return null;
  const { id, code, name, category, condition } = value;
  if (
    typeof id !== 'string' ||
    typeof code !== 'string' ||
    typeof name !== 'string' ||
    typeof category !== 'string' ||
    typeof condition !== 'string'
  ) {
    return null;
  }

  return { id, code, name, category, condition };
}

function normalizeAssignment(row: unknown): PostEventInventoryItem | null {
  if (!isRecord(row)) return null;
  const assignment = row as RawInventoryAssignment;
  const inventoryItem = normalizeInventoryItemPayload(assignment.inventoryItem ?? assignment.item ?? null);
  if (!assignment.id || typeof assignment.id !== 'string' || !inventoryItem) return null;

  return {
    id: assignment.id,
    inventoryItem,
    checkedOut: Boolean(assignment.checkedOut),
    checkedIn: Boolean(assignment.checkedIn),
    conditionAfter: typeof assignment.conditionAfter === 'string' ? assignment.conditionAfter : null,
  };
}

export function normalizePostEventInventoryItems(data: unknown): PostEventInventoryItem[] {
  if (!isRecord(data)) return [];
  const source = Array.isArray(data.assignedItems)
    ? data.assignedItems
    : Array.isArray(data.assigned)
      ? data.assigned
      : [];

  return source
    .map(normalizeAssignment)
    .filter((item): item is PostEventInventoryItem => item !== null);
}
