export const CLIENT_PORTAL_DEFAULT_ACCENT_COLOR = '#06b6d4';

export type PortalPersonalization = {
  headline?: string;
  introMessage?: string;
  accentColor?: string;
  showTimeline?: boolean;
  showPayments?: boolean;
  showDocuments?: boolean;
  showPostEvent?: boolean;
  showQuestionnaire?: boolean;
};

export const CLIENT_PORTAL_PERSONALIZATION_LIMITS = {
  headline: 120,
  introMessage: 1200,
  accentColor: 20,
} as const;

export const CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS = {
  defaultDays: 30,
  minDays: 1,
  maxDays: 365,
} as const;
