import type { EventType } from '@prisma/client';

export function mapLeadEventType(raw: unknown): EventType {
  const value = String(raw || '').toLowerCase();
  if (value === 'bodas' || value === 'wedding') return 'WEDDING';
  if (value === 'empresas' || value === 'corporate') return 'CORPORATE';
  if (value === 'fiestas' || value === 'private_party') return 'PRIVATE_PARTY';
  return 'OTHER';
}

export function parseDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeQuoteLocale(raw: unknown): string {
  const value = String(raw || 'ca').toLowerCase();
  if (value.startsWith('es')) return 'es';
  if (value.startsWith('en')) return 'en';
  return 'ca';
}
