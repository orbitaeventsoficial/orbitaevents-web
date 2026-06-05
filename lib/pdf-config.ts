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

// Paleta canònica Brass & Obsidian — un sol or de marca derivat a variants
export const COLORS = {
  // Or de marca (#d7b86e) i variants
  gold:      [215, 184, 110] as [number, number, number],  // #d7b86e canònic
  goldLight: [240, 217, 154] as [number, number, number],  // #f0d99a bright
  goldDark:  [169, 134,  63] as [number, number, number],  // #a9863f edge

  // Obsidiana càlida (fosc, per a tema fosc del PDF)
  canvas:    [ 17,  17,  22] as [number, number, number],  // #111116 canvas
  surface:   [ 22,  23,  30] as [number, number, number],  // #16161e panel
  raised:    [ 30,  31,  40] as [number, number, number],  // #1e1f28 raised
  sunk:      [ 11,  11,  14] as [number, number, number],  // #0b0b0e sunk

  // Textos càlids (no blanc pur, no slate fred)
  textPrimary:   [228, 222, 212] as [number, number, number],  // #e4ded4 T1
  textSecondary: [182, 174, 162] as [number, number, number],  // #b6aea2 T2
  textMuted:     [154, 146, 134] as [number, number, number],  // #9a9286 T3

  // Línies càlides
  line:      [ 40,  38,  33] as [number, number, number],   // línia subtil fosc
  lineWarm:  [ 58,  52,  40] as [number, number, number],   // línia càlida visible

  // Per al footer (fons clar càlid)
  paperBg:   [247, 245, 240] as [number, number, number],   // #f7f5f0 paper
  surfaceWarm: [250, 249, 246] as [number, number, number],
  paperText: [ 42,  38,  30] as [number, number, number],   // #2a261e tinta paper
  paperMuted:[ 106,  98,  86] as [number, number, number],  // #6a6256 muted paper

  // Total highlight
  totalBg:   [ 34,  31,  10] as [number, number, number],   // #221f0a total bg
  danger:    [186, 122, 122] as [number, number, number],

  chartSage:   [124, 179, 158] as [number, number, number],
  chartSky:    [124, 169, 197] as [number, number, number],
  chartMauve:  [162, 130, 186] as [number, number, number],
  chartSand:   [186, 162, 130] as [number, number, number],

  // Compatibilitat legacy (usats a generateServiceBrochure, NO eliminar)
  black:     [  0,   0,   0] as [number, number, number],
  blackSoft: [ 26,  26,  26] as [number, number, number],
  white:     [255, 255, 255] as [number, number, number],
  gray:      [130, 124, 114] as [number, number, number],   // càlid ara
  grayLight: [220, 215, 206] as [number, number, number],   // càlid ara
  grayDark:  [ 80,  75,  65] as [number, number, number],   // càlid ara
  bgLight:   [247, 245, 240] as [number, number, number],   // = paperBg
  bgDark:    [232, 228, 218] as [number, number, number],
  success:   [ 62, 197, 123] as [number, number, number],   // #3ec57b
};

export const PDF_CHART_COLORS: Array<[number, number, number]> = [
  COLORS.gold,
  COLORS.chartSage,
  COLORS.chartSky,
  COLORS.danger,
  COLORS.chartMauve,
  COLORS.chartSand,
] as const;

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

export function formatPdfMoney(value: number, locale: 'ca' | 'es' | 'en' = 'ca'): string {
  return `${value.toLocaleString(toIntlLocale(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}€`;
}
