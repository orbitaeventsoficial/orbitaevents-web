import { CLIENT_PORTAL_MESSAGES, type ClientPortalLocale } from '@/lib/clientPortalMessages';

export function formatClientPortalEventPlace(
  venue: string | null | undefined,
  location: string | null | undefined,
): string {
  return [venue, location]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' · ');
}

export function formatClientPortalGuestCount(
  locale: ClientPortalLocale,
  count: number,
): string {
  const label = count === 1
    ? CLIENT_PORTAL_MESSAGES[locale].eventGuestSingular
    : CLIENT_PORTAL_MESSAGES[locale].eventGuestPlural;

  return `${count} ${label}`;
}

export function getClientPortalFirstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? '';
}

export function getClientPortalPersonalizedText(
  value: string | null | undefined,
  fallback: string,
): string {
  return value?.trim() || fallback;
}
