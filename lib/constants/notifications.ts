export const NOTIFICATION_CATEGORIES = ['leads', 'reports', 'urgent'] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];
