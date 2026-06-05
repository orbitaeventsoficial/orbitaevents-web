/**
 * Helpers compartits per a la generació de PDFs.
 * Importat per catalogPdfService, quotePdfService i contractPdfService.
 */

import { toIntlLocale } from '@/lib/constants';
import { formatClientDate } from '@/lib/pdf-config';
import {
  drawCanonicalPdfHeader,
} from '@/lib/pdf-header';
import { type jsPDFType, type PdfBrandingOptions, PAGE } from '@/lib/pdf-config';

let jsPDFModule: typeof import('jspdf') | null = null;

export async function getJsPDF(): Promise<typeof import('jspdf')> {
  if (!jsPDFModule) {
    jsPDFModule = await import('jspdf');
  }
  return jsPDFModule;
}

export function checkPageBreak(
  doc: jsPDFType,
  currentY: number,
  neededSpace: number,
  title: string,
  branding?: PdfBrandingOptions
): number {
  if (currentY + neededSpace > PAGE.safeBottom) {
    doc.addPage();
    return addPdfHeader(doc, title, branding);
  }
  return currentY;
}

export function addPdfHeader(doc: jsPDFType, title: string, branding?: PdfBrandingOptions): number {
  const brandName = branding?.brandName?.trim() || 'ÒRBITA EVENTS';
  return drawCanonicalPdfHeader(doc, {
    title,
    metaLines: [brandName.toUpperCase()],
    logoDataUrl: branding?.logoDataUrl,
  });
}

export type PdfDateInput = Date | string;

export function formatPdfDateInput(value: PdfDateInput, locale: 'ca' | 'es' | 'en'): string {
  if (typeof value === 'string') {
    const formatted = formatClientDate(value, locale);
    return formatted === 'Invalid Date' ? value : formatted;
  }
  return new Date(value).toLocaleDateString(toIntlLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
