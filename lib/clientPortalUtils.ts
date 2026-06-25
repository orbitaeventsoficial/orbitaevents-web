export const CLIENT_PORTAL_DEFAULT_ACCENT_COLOR = '#06b6d4';

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

export function resolvePortalAccentHex(personalization: unknown): string {
  const p = (personalization || {}) as { accentColor?: string };
  const raw = p.accentColor;
  if (raw && /^#?[0-9a-fA-F]{3,6}$/.test(raw)) {
    return raw.startsWith('#') ? raw : `#${raw}`;
  }
  return CLIENT_PORTAL_DEFAULT_ACCENT_COLOR;
}
