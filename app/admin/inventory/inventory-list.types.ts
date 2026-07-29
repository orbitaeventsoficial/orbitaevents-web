import type { InventoryBundle } from '@/lib/inventory-bundles-contract';

export interface BundleApiItem {
  id: string | number;
  name: string;
  itemIds: (string | number)[];
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  watts: number | null;
  value: number;
  status: string;
  condition: string;
  isConsumable: boolean;
  stockQuantity: number | null;
  minStock: number | null;
  imageUrl: string | null;
  purchasePrice: number | null;
  purchasePriceSource: string | null;
  purchasePriceSourceCheckedAt: string | Date | null;
  expectedLifeHours: number | null;
  totalHoursUsed: number;
  packItems: Array<{ id: string; pack: { id: string; slug: string } }>;
  _count: { bookingItems: number; usageHistory: number };
}

export interface Stats {
  [category: string]: { count: number; totalValue: number };
}

export type ViewMode = 'list' | 'grid';

export interface InventoryBundlesSectionProps {
  bundles: InventoryBundle[];
  selectedBundleId: string;
  bundleNameDraft: string;
  bundleItemSearch: string;
  selectedBundle: InventoryBundle | null;
  selectedBundleItems: InventoryItem[];
  candidateItems: InventoryItem[];
  bundleMessage: string | null;
  savingBundles: boolean;
  setSelectedBundleId: (value: string) => void;
  setBundleNameDraft: (value: string) => void;
  setBundleItemSearch: (value: string) => void;
  createBundle: () => void;
  renameSelectedBundle: (name: string) => void;
  persistRenameSelectedBundle: () => void;
  deleteSelectedBundle: () => void;
  addItemToBundle: (itemId: string) => void;
  removeItemFromBundle: (itemId: string) => void;
}
