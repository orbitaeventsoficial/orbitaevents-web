import type { ClientPortalNavKey } from '@/lib/constants/clientPortalNavigation';
import { coercePortalPersonalization } from '@/lib/clientPortalUtils';

export type ClientPortalVisibility = {
  payments: boolean;
  timeline: boolean;
  documents: boolean;
  postEvent: boolean;
  questionnaire: boolean;
};

export type ClientPortalHiddenNavItems = Partial<Record<ClientPortalNavKey, boolean>>;

function asVisibleFlag(value: boolean | undefined): boolean {
  return value !== false;
}

export function getClientPortalVisibility(personalization: unknown): ClientPortalVisibility {
  const source = coercePortalPersonalization(personalization);

  return {
    payments: asVisibleFlag(source.showPayments),
    timeline: asVisibleFlag(source.showTimeline),
    documents: asVisibleFlag(source.showDocuments),
    postEvent: asVisibleFlag(source.showPostEvent),
    questionnaire: asVisibleFlag(source.showQuestionnaire),
  };
}

export function getClientPortalHiddenNavItems(
  visibility: ClientPortalVisibility,
): ClientPortalHiddenNavItems {
  return {
    payments: !visibility.payments,
    timeline: !visibility.timeline,
    contract: !visibility.documents,
  };
}
