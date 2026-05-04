import type { AdminManualRoadmapItem } from '@/lib/constants/adminManual';

export interface AdminManualRoadmapProtocolTarget {
  href: string;
  label: string;
}

const DEFAULT_PENDING_PROTOCOL_SECTION = '6.15';

function buildProtocolSectionAnchor(sectionId: string): string {
  return `seccio-${sectionId.replace(/\./g, '-')}`;
}

export function buildAdminManualRoadmapProtocolTarget(
  item: AdminManualRoadmapItem,
): AdminManualRoadmapProtocolTarget | null {
  if (item.status === 'DONE') {
    if (!item.doneCanvi) return null;
    return {
      href: `/admin/docs/protocol?canvi=${item.doneCanvi}#canvi-${item.doneCanvi}`,
      label: `Obrir Canvi #${item.doneCanvi}`,
    };
  }

  const sectionId = item.protocolSection ?? DEFAULT_PENDING_PROTOCOL_SECTION;
  return {
    href: `/admin/docs/protocol?seccio=${sectionId}#${buildProtocolSectionAnchor(sectionId)}`,
    label: `Obrir §${sectionId} al protocol`,
  };
}
