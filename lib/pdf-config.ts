/**
 * Constants, tipus i helpers purs per la generació de PDFs.
 * Extret de pdf-utils.ts per reduir la mida del fitxer principal.
 */

import { toIntlLocale } from '@/lib/constants';
import type { ServiceSlug } from '@/app/config/packs-config';

// ─── Types ──────────────────────────────────────────────────────────────────

export type jsPDFType = import('jspdf').jsPDF;

export interface PdfBrandingOptions {
  logoDataUrl?: string;
  brandName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  tagline?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const COLORS = {
  gold: [218, 165, 32] as [number, number, number],
  goldLight: [255, 215, 0] as [number, number, number],
  goldDark: [184, 134, 11] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  blackSoft: [26, 26, 26] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gray: [128, 128, 128] as [number, number, number],
  grayLight: [229, 229, 229] as [number, number, number],
  grayDark: [74, 74, 74] as [number, number, number],
  bgLight: [250, 250, 250] as [number, number, number],
  bgDark: [245, 245, 245] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
};

export const PAGE = {
  width: 210,
  height: 297,
  marginTop: 60,
  marginBottom: 40,
  marginLeft: 20,
  marginRight: 20,
  contentWidth: 170,
  safeBottom: 257,
};

export const SERVICE_NAMES: Record<ServiceSlug, { ca: string; es: string; en: string }> = {
  bodas: { ca: 'Casaments', es: 'Bodas', en: 'Weddings' },
  fiestas: { ca: 'Festes', es: 'Fiestas', en: 'Parties' },
  discomovil: { ca: 'Discomòbil', es: 'Discomóvil', en: 'Mobile DJ' },
  empresas: { ca: 'Empreses', es: 'Empresas', en: 'Corporate' },
  animacion: { ca: 'Animació', es: 'Animación', en: 'Animation' },
};

// ─── Helpers purs ───────────────────────────────────────────────────────────

export function normalizeWebsite(value: string): string {
  return value.replace(/^https?:\/\//, '');
}

export function isDataUrl(value: string): boolean {
  return /^data:image\//.test(value);
}

export function getImageFormatFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' {
  if (!isDataUrl(dataUrl)) return 'PNG';
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  return 'PNG';
}

export function fitWithin(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: maxWidth, height: maxHeight };
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return { width: width * ratio, height: height * ratio };
}

export function formatClientDate(input: string, locale: 'ca' | 'es' | 'en'): string {
  const raw = (input || '').trim();
  if (!raw) return '-';
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toLocaleDateString(toIntlLocale(locale));
  }
  const parts = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!parts) return raw;
  const day = Number(parts[1]);
  const month = Number(parts[2]) - 1;
  let year = Number(parts[3]);
  if (year < 100) year += 2000;
  const parsed = new Date(year, month, day);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString(toIntlLocale(locale));
}
