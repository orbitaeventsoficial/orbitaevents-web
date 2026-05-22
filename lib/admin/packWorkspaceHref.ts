export type PackWorkspaceTab = 'content';

export function buildPackHref(packId: string, tab?: PackWorkspaceTab | null): string {
  const base = `/admin/packs/${packId}`;
  return tab ? `${base}?tab=${tab}` : base;
}
