type QuickActionItem = {
  href: string;
  label: string;
  color: 'cyan' | 'amber' | 'emerald' | 'indigo' | 'slate';
  external?: boolean;
} | null;

export function dedupeCustomerHubQuickActions(items: QuickActionItem[]): Exclude<QuickActionItem, null>[] {
  const deduped: Exclude<QuickActionItem, null>[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (!item) continue;
    const key = item.label;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}
