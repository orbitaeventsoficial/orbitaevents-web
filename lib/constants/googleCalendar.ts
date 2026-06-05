export const GOOGLE_CALENDAR_BOOKING_REMINDERS = [
  { method: 'popup', minutes: 7 * 24 * 60 },
  { method: 'popup', minutes: 24 * 60 },
  { method: 'email', minutes: 24 * 60 },
  { method: 'popup', minutes: 2 * 60 },
] as const;

export const GOOGLE_CALENDAR_BOOKING_REMINDER_SUMMARY = 'Recordatoris: 7 dies abans, 24 h abans, email 24 h abans i 2 h abans.';
export const GOOGLE_CALENDAR_SOCIAL_POST_REMINDERS = [
  { method: 'popup', minutes: 24 * 60 },
  { method: 'popup', minutes: 3 * 60 },
  { method: 'email', minutes: 3 * 60 },
  { method: 'popup', minutes: 30 },
] as const;

export const GOOGLE_CALENDAR_SOCIAL_POST_REMINDER_SUMMARY = 'Recordatoris: 24 h abans, 3 h abans, email 3 h abans i 30 min abans.';

export const GOOGLE_CALENDAR_SETTING_KEYS = {
  refreshToken: 'integrations.googleCalendar.refreshToken',
  calendarId: 'integrations.googleCalendar.calendarId',
} as const;

export const GOOGLE_CALENDAR_EVENT_KEY_PREFIXES = {
  booking: 'integrations.googleCalendar.bookingEvent.',
  socialPost: 'integrations.googleCalendar.socialPostEvent.',
  lead: 'integrations.googleCalendar.leadEvent.',
  task: 'integrations.googleCalendar.taskEvent.',
  availability: 'integrations.googleCalendar.availabilityEvent.',
} as const;
