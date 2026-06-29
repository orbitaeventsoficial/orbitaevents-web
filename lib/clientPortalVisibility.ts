import type { ClientPortalNavKey } from '@/lib/constants/clientPortalNavigation';

export type ClientPortalVisibility = {
  payments: boolean;
  timeline: boolean;
  documents: boolean;
  postEvent: boolean;
  questionnaire: boolean;
};

export type ClientPortalHiddenNavItems = Partial<Record<ClientPortalNavKey, boolean>>;

function asFlag(source: Record<string, unknown>, key: string): boolean {
  return source[key] !== false;
}

export function getClientPortalVisibility(personalization: unknown): ClientPortalVisibility {
  const source =
    personalization && typeof personalization === 'object'
      ? personalization as Record<string, unknown>
      : {};

  return {
    payments: asFlag(source, 'showPayments'),
    timeline: asFlag(source, 'showTimeline'),
    documents: asFlag(source, 'showDocuments'),
    postEvent: asFlag(source, 'showPostEvent'),
    questionnaire: asFlag(source, 'showQuestionnaire'),
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
