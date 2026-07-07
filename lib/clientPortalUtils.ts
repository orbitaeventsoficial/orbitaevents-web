import { CLIENT_PORTAL_DEFAULT_ACCENT_COLOR } from '@/lib/constants/clientPortalPersonalization';
import type { PortalPersonalization } from '@/lib/constants/clientPortalPersonalization';

export { CLIENT_PORTAL_DEFAULT_ACCENT_COLOR };

export function toRgba(hex: string, alpha: number): string | null {
  const clean = hex.trim().replace('#', '');
  const valid = /^[0-9a-fA-F]{6}$/.test(clean)
    ? clean
    : /^[0-9a-fA-F]{3}$/.test(clean)
    ? clean.split('').map((c) => c + c).join('')
    : null;
  if (!valid) return null;
  const r = parseInt(valid.slice(0, 2), 16);
  const g = parseInt(valid.slice(2, 4), 16);
  const b = parseInt(valid.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function normalizePortalAccentHex(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const raw = value.trim();
  if (!/^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) return undefined;
  return raw.startsWith('#') ? raw : `#${raw}`;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function coercePortalPersonalization(value: unknown): PortalPersonalization {
  const source = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {};

  return {
    headline: optionalString(source.headline),
    introMessage: optionalString(source.introMessage),
    accentColor: normalizePortalAccentHex(source.accentColor),
    showTimeline: optionalBoolean(source.showTimeline),
    showPayments: optionalBoolean(source.showPayments),
    showDocuments: optionalBoolean(source.showDocuments),
    showPostEvent: optionalBoolean(source.showPostEvent),
    showQuestionnaire: optionalBoolean(source.showQuestionnaire),
  };
}

export function resolvePortalAccentHex(personalization: unknown): string {
  return coercePortalPersonalization(personalization).accentColor ?? CLIENT_PORTAL_DEFAULT_ACCENT_COLOR;
}

export function readPortalActionError(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return undefined;
  return (payload as Record<string, unknown>).error;
}
