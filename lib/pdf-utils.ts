/**
 * PDF Generation Utilities for Òrbita Events
 * Uses jsPDF for client-side PDF generation
 *
 * MEJORAS v2.0:
 * - Logo de Orbita incluido en el header
 * - Paginación correcta con saltos de página automáticos
 * - Mejor espaciado y tipografía
 */

import { getPacksByService, EXTRAS, type ExtraDefinition, type ServiceSlug, type PackDefinition } from '@/app/config/packs-config';
import { SITE_CONFIG } from '@/app/config/site-config';
import { log } from '@/lib/logger';
import { toIntlLocale } from '@/lib/constants';
import { ORBITA_LOGO_BASE64 } from './logo-base64';
import { ORBITA_LOGO_TEXT_DRETA_BASE64 } from './logo-wordmark-base64';

type jsPDFType = import('jspdf').jsPDF;
let jsPDFModule: typeof import('jspdf') | null = null;

async function getJsPDF(): Promise<typeof import('jspdf')> {
  if (!jsPDFModule) {
    jsPDFModule = await import('jspdf');
  }
  return jsPDFModule;
}

const COLORS = {
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

const PAGE = {
  width: 210,
  height: 297,
  marginTop: 60,
  marginBottom: 40,
  marginLeft: 20,
  marginRight: 20,
  contentWidth: 170,
  safeBottom: 257,
};

const SERVICE_NAMES: Record<ServiceSlug, { ca: string; es: string; en: string }> = {
  bodas: { ca: 'Casaments', es: 'Bodas', en: 'Weddings' },
  fiestas: { ca: 'Festes', es: 'Fiestas', en: 'Parties' },
  discomovil: { ca: 'Discomòbil', es: 'Discomóvil', en: 'Mobile DJ' },
  empresas: { ca: 'Empreses', es: 'Empresas', en: 'Corporate' },
};

export interface PdfBrandingOptions {
  logoDataUrl?: string;
  brandName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  tagline?: string;
}

function normalizeWebsite(value: string): string {
  return value.replace(/^https?:\/\//, '');
}

function isDataUrl(value: string): boolean {
  return /^data:image\//.test(value);
}

function getImageFormatFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' {
  if (!isDataUrl(dataUrl)) return 'PNG';
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  return 'PNG';
}

function fitWithin(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: maxWidth, height: maxHeight };
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return { width: width * ratio, height: height * ratio };
}

function formatClientDate(input: string, locale: 'ca' | 'es' | 'en'): string {
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

function checkPageBreak(
  doc: jsPDFType,
  currentY: number,
  neededSpace: number,
  title: string,
  branding?: PdfBrandingOptions
): number {
  if (currentY + neededSpace > PAGE.safeBottom) {
    doc.addPage();
    return addHeader(doc, title, branding);
  }
  return currentY;
}

function addHeader(doc: jsPDFType, title: string, branding?: PdfBrandingOptions): number {
  const brandName = branding?.brandName?.trim() || 'ÒRBITA EVENTS';
  const logoSource = branding?.logoDataUrl || ORBITA_LOGO_BASE64;

  doc.setFillColor(...COLORS.blackSoft);
  doc.rect(0, 0, PAGE.width, 50, 'F');
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 0, 6, 50, 'F');
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 48, PAGE.width, 2, 'F');

  let textStartX = 22;
  if (logoSource && logoSource.length > 100) {
    try {
      doc.addImage(logoSource, 'PNG', 12, 6, 38, 38);
      textStartX = 55;
    } catch { /* fallback to text */ }
  }

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(brandName.toUpperCase(), textStartX, 24);
  doc.setTextColor(...COLORS.grayLight);
  doc.setFontSize(10);
  doc.text(title.toUpperCase(), textStartX, 38);

  doc.setFillColor(...COLORS.gold);
  doc.rect(175, 15, 22, 3, 'F');
  doc.setFillColor(...COLORS.goldLight);
  doc.rect(175, 20, 22, 3, 'F');
  doc.setFillColor(...COLORS.goldDark);
  doc.rect(175, 25, 22, 3, 'F');

  return PAGE.marginTop;
}

function addFooter(doc: jsPDFType, pageNum: number, totalPages: number, branding?: PdfBrandingOptions) {
  const website = normalizeWebsite(branding?.website?.trim() || SITE_CONFIG.web.url);
  const contactEmail = branding?.contactEmail?.trim() || SITE_CONFIG.business.email;
  const contactPhone = branding?.contactPhone?.trim() || SITE_CONFIG.business.phoneDisplay || SITE_CONFIG.business.phone;
  const tagline = branding?.tagline?.trim() || "L'Esdeveniment Que La Teva Gent NO Oblidarà";

  const footerY = PAGE.height - 35;
  doc.setFillColor(...COLORS.bgLight);
  doc.rect(0, footerY - 5, PAGE.width, 40, 'F');
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.8);
  doc.line(PAGE.marginLeft, footerY, PAGE.width - PAGE.marginRight, footerY);

  doc.setTextColor(...COLORS.grayDark);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(website, PAGE.marginLeft, footerY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(contactEmail, PAGE.marginLeft, footerY + 16);
  doc.text(contactPhone, PAGE.marginLeft, footerY + 22);

  doc.setTextColor(...COLORS.gray);
  doc.text('Barcelona · Girona · Catalunya', PAGE.width / 2, footerY + 16, { align: 'center' });

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${pageNum}`, PAGE.width - PAGE.marginRight - 10, footerY + 13, { align: 'right' });
  doc.setTextColor(...COLORS.gray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`/ ${totalPages}`, PAGE.width - PAGE.marginRight, footerY + 13, { align: 'right' });

  doc.setTextColor(...COLORS.grayDark);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(tagline, PAGE.width / 2, footerY + 28, { align: 'center' });
}

function addAllFooters(doc: jsPDFType, branding?: PdfBrandingOptions) {
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages, branding);
  }
}

export async function generateServiceBrochure(
  service: ServiceSlug,
  locale: 'ca' | 'es' | 'en' = 'ca'
): Promise<jsPDFType> {
  const { default: jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  const packs = getPacksByService(service);
  const serviceName = SERVICE_NAMES[service][locale];

  const t = {
    ca: { brochure: 'Catàleg de Serveis', ourPacks: 'Els Nostres Packs', duration: 'Durada', hours: 'hores', idealFor: 'Ideal per', popular: 'MÉS POPULAR', premium: 'PREMIUM', extras: 'Extres Disponibles', contactUs: 'Contacta\'ns', contactText: 'Tens dubtes? Escriu-nos sense compromís!' },
    es: { brochure: 'Catálogo de Servicios', ourPacks: 'Nuestros Packs', duration: 'Duración', hours: 'horas', idealFor: 'Ideal para', popular: 'MÁS POPULAR', premium: 'PREMIUM', extras: 'Extras Disponibles', contactUs: 'Contáctanos', contactText: '¿Tienes dudas? ¡Escríbenos sin compromiso!' },
    en: { brochure: 'Service Catalog', ourPacks: 'Our Packages', duration: 'Duration', hours: 'hours', idealFor: 'Ideal for', popular: 'MOST POPULAR', premium: 'PREMIUM', extras: 'Available Extras', contactUs: 'Contact Us', contactText: 'Have questions? Contact us with no obligation!' },
  }[locale];

  const headerTitle = `${t.brochure} - ${serviceName}`;
  let y = addHeader(doc, headerTitle);

  doc.setTextColor(...COLORS.black);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text(serviceName.toUpperCase(), PAGE.width / 2, y + 30, { align: 'center' });
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(2);
  doc.line(60, y + 40, 150, y + 40);

  y = y + 60;
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(t.ourPacks, PAGE.marginLeft, y);
  y += 15;

  const packCardHeight = 60;
  packs.forEach((pack) => {
    y = checkPageBreak(doc, y, packCardHeight + 10, headerTitle);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(15, y - 5, PAGE.contentWidth + 10, packCardHeight, 3, 3, 'F');
    doc.setFillColor(...COLORS.gold);
    doc.rect(15, y - 5, 2, packCardHeight, 'F');

    if (pack.popular) {
      doc.setFillColor(...COLORS.gold);
      doc.roundedRect(150, y - 3, 40, 8, 2, 2, 'F');
      doc.setTextColor(...COLORS.black);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(t.popular, 170, y + 3, { align: 'center' });
    } else if (pack.highlight || pack.badge === 'Premium') {
      doc.setFillColor(100, 100, 100);
      doc.roundedRect(155, y - 3, 35, 8, 2, 2, 'F');
      doc.setTextColor(...COLORS.white);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(t.premium, 172, y + 3, { align: 'center' });
    }

    doc.setFillColor(...COLORS.gold);
    doc.circle(20, y + 8, 1.2, 'F');
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(pack.name, 24, y + 8);
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(16);
    doc.text(pack.price, 24, y + 20);
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t.duration}: ${pack.durationHours} ${t.hours}`, 60, y + 20);

    doc.setTextColor(...COLORS.black);
    doc.setFontSize(9);
    pack.features.slice(0, 3).forEach((feature, i) => {
      const cleanFeature = feature.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      const featureY = y + 30 + i * 6;
      doc.setFillColor(...COLORS.gold);
      doc.circle(20, featureY - 1.3, 1, 'F');
      doc.setTextColor(...COLORS.black);
      doc.text(cleanFeature.substring(0, 60), 24, featureY);
    });

    if (pack.ideal) {
      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(8);
      doc.text(`${t.idealFor}: ${pack.ideal}`, 24, y + 52);
    }
    y += packCardHeight + 10;
  });

  y = checkPageBreak(doc, y, 80, headerTitle);
  const compatibleExtras = EXTRAS.filter((e) => !e.compatibleWith || e.compatibleWith.includes(service)).slice(0, 8);

  if (compatibleExtras.length > 0) {
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(t.extras, PAGE.marginLeft, y + 10);
    y += 25;
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    compatibleExtras.forEach((extra, i) => {
      if (i > 0 && i % 4 === 0) y = checkPageBreak(doc, y, 30, headerTitle);
      const col = i % 2 === 0 ? PAGE.marginLeft : 110;
      const row = Math.floor((i % 4) / 2) * 14;
      const priceText = extra.price ? `${extra.price}€` : 'Consultar';
      doc.setFillColor(...COLORS.gold);
      doc.circle(col, y + row - 1.3, 1, 'F');
      doc.setTextColor(...COLORS.black);
      doc.text(`${extra.name} (${priceText})`, col + 4, y + row);
    });
    y += Math.ceil(compatibleExtras.length / 2) * 14 + 10;
  }

  y = checkPageBreak(doc, y, 40, headerTitle);
  const contactY = Math.min(y + 10, PAGE.safeBottom - 35);
  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(15, contactY, PAGE.contentWidth + 10, 28, 3, 3, 'F');
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t.contactUs, PAGE.width / 2, contactY + 11, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(t.contactText, PAGE.width / 2, contactY + 20, { align: 'center' });

  addAllFooters(doc);
  return doc;
}

export interface QuoteData {
  eventType: string;
  pack: PackDefinition;
  date: string;
  eventSchedule?: string;
  eventLocation?: string;
  guests: number;
  extras: string[];
  extrasCatalog?: ExtraDefinition[];
  basePrice: number;
  extrasPrice: number;
  discount: number;
  discountReason: string;
  total: number;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientContact?: string;
  validityDays?: number;
  conditions?: string[];
  whyChooseUs?: string;
  /** Data d'emissió opcional. Si no es proporciona, usa la data actual. */
  issueDate?: string;
}

export async function generateQuotePDF(
  data: QuoteData,
  locale: 'ca' | 'es' | 'en' = 'ca',
  branding?: PdfBrandingOptions
): Promise<jsPDFType> {
  const { default: jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  const extrasCatalog = data.extrasCatalog ?? EXTRAS;

  const t = {
    ca: {
      quote: 'Pressupost',
      eventDetails: 'Detalls de l\'esdeveniment',
      eventDate: 'Data',
      schedule: 'Horari',
      location: 'Lloc',
      guests: 'Convidats',
      selectedPack: 'Pack seleccionat',
      hours: 'hores',
      features: 'Que inclou',
      extras: 'Extres',
      priceSummary: 'Resum economic',
      basePack: 'Pack base',
      extrasTotal: 'Extres',
      discount: 'Descompte',
      total: 'Total',
      validUntilPrefix: 'Validesa:',
      validUntilSuffix: 'dies',
      disclaimer: 'Preus sense IVA.',
      contact: 'Contacte',
      conditions: 'Condicions',
      whyChooseUs: 'Per que escollir-nos',
      quoteRef: 'Referencia',
      issueDate: 'Data',
    },
    es: {
      quote: 'Presupuesto',
      eventDetails: 'Detalles del evento',
      eventDate: 'Fecha',
      schedule: 'Horario',
      location: 'Lugar',
      guests: 'Invitados',
      selectedPack: 'Pack seleccionado',
      hours: 'horas',
      features: 'Que incluye',
      extras: 'Extras',
      priceSummary: 'Resumen economico',
      basePack: 'Pack base',
      extrasTotal: 'Extras',
      discount: 'Descuento',
      total: 'Total',
      validUntilPrefix: 'Validez:',
      validUntilSuffix: 'dias',
      disclaimer: 'Precios sin IVA.',
      contact: 'Contacto',
      conditions: 'Condiciones',
      whyChooseUs: 'Por que elegirnos',
      quoteRef: 'Referencia',
      issueDate: 'Fecha',
    },
    en: {
      quote: 'Quote',
      eventDetails: 'Event details',
      eventDate: 'Date',
      schedule: 'Schedule',
      location: 'Location',
      guests: 'Guests',
      selectedPack: 'Selected package',
      hours: 'hours',
      features: 'What is included',
      extras: 'Extras',
      priceSummary: 'Price summary',
      basePack: 'Base package',
      extrasTotal: 'Extras',
      discount: 'Discount',
      total: 'Total',
      validUntilPrefix: 'Validity:',
      validUntilSuffix: 'days',
      disclaimer: 'Prices excl. VAT.',
      contact: 'Contact',
      conditions: 'Conditions',
      whyChooseUs: 'Why choose us',
      quoteRef: 'Reference',
      issueDate: 'Date',
    },
  }[locale];

  const neutral = [241, 245, 249] as [number, number, number];
  const muted = [148, 163, 184] as [number, number, number];
  const border = [51, 65, 85] as [number, number, number];
  const surface = [24, 28, 33] as [number, number, number];
  const surfaceSoft = [29, 34, 40] as [number, number, number];
  const accent = [212, 175, 55] as [number, number, number];

  const left = 14;
  const contentWidth = 182;
  const pageBottom = 255;
  const lineHeight = 5;
  let y = 16;

  const quoteRef = `OE-${Date.now().toString(36).toUpperCase()}`;
  const issueDate = data.issueDate
    ? new Date(data.issueDate).toLocaleDateString(toIntlLocale(locale))
    : new Date().toLocaleDateString(toIntlLocale(locale));
  const eventTypeName = SERVICE_NAMES[data.eventType as ServiceSlug]?.[locale] || data.eventType;
  const eventDate = formatClientDate(data.date || '-', locale);
  const eventSchedule = data.eventSchedule?.trim() || '-';
  const eventLocation = data.eventLocation?.trim() || '-';
  const brandName = branding?.brandName?.trim() || 'Orbita Events';
  const validityDays = Math.max(1, Math.round(data.validityDays || 15));

  doc.setFillColor(18, 20, 24);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

  const drawLabelValue = (
    label: string,
    value: string,
    x: number,
    top: number,
    width: number,
    maxLines = 3
  ): number => {
    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(label.toUpperCase(), x, top);
    doc.setTextColor(...neutral);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    const lines = doc.splitTextToSize(value || '-', width).slice(0, maxLines);
    doc.text(lines, x, top + 6);
    return lines.length;
  };

  const drawCard = (
    x: number,
    top: number,
    width: number,
    height: number,
    rounded = 2,
    soft = false
  ) => {
    doc.setFillColor(...(soft ? surfaceSoft : surface));
    doc.roundedRect(x, top, width, height, rounded, rounded, 'F');
    doc.setDrawColor(...border);
    doc.roundedRect(x, top, width, height, rounded, rounded, 'S');
    doc.setFillColor(...accent);
    doc.roundedRect(x, top + 1.5, 1.4, Math.max(2, height - 3), 0.8, 0.8, 'F');
  };

  const drawHeader = (compact: boolean) => {
    const headerHeight = compact ? 16 : 26;
    drawCard(left, y, contentWidth, headerHeight, 3, true);

    const logoSource = branding?.logoDataUrl || ORBITA_LOGO_TEXT_DRETA_BASE64 || ORBITA_LOGO_BASE64;
    const hasLogo = typeof logoSource === 'string' && logoSource.length > 100;
    let logoBlockWidth = 0;

    if (!compact && hasLogo) {
      try {
        const fmt = getImageFormatFromDataUrl(logoSource);
        const props = doc.getImageProperties(logoSource);
        const fitted = fitWithin(props.width, props.height, 52, 14);
        const logoX = left + 5;
        const logoY = y + 5 + (14 - fitted.height) / 2;
        doc.addImage(logoSource, fmt, logoX, logoY, fitted.width, fitted.height);
        logoBlockWidth = fitted.width + 8;
      } catch {
        // Ignore logo errors and keep text branding.
      }
    }

    const titleXRaw = hasLogo ? left + Math.max(21, logoBlockWidth + 5) : left + 6;
    const titleX = Math.min(titleXRaw, left + 96);
    doc.setTextColor(...neutral);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(compact ? 10.5 : 15);
    const brandLine = doc.splitTextToSize(brandName, 78)[0] || brandName;
    doc.text(brandLine, titleX, y + (compact ? 9 : 11));
    if (!compact) {
      doc.setTextColor(...accent);
      doc.setFontSize(10);
      doc.text(t.quote.toUpperCase(), titleX, y + 18.5);
    }

    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${t.quoteRef}: ${quoteRef}`, left + contentWidth - 6, y + (compact ? 7 : 8.5), { align: 'right' });
    doc.text(`${t.issueDate}: ${issueDate}`, left + contentWidth - 6, y + (compact ? 11 : 13), { align: 'right' });
    if (!compact) {
      doc.text(`${t.validUntilPrefix} ${validityDays} ${t.validUntilSuffix}`, left + contentWidth - 6, y + 18.5, { align: 'right' });
    }

    y += headerHeight + 8;
  };

  const ensureSpace = (space: number): boolean => {
    // Never truncate: if content doesn't fit, continue on a new page.
    if (y + space <= pageBottom) return true;
    doc.addPage();
    // Dark background for the new page
    doc.setFillColor(18, 20, 24);
    doc.rect(0, 0, PAGE.width, PAGE.height, 'F');
    drawHeader(true);
    return y + space <= pageBottom;
  };

  const drawFooter = () => {
    const website = normalizeWebsite(branding?.website?.trim() || SITE_CONFIG.web.url);
    const email = branding?.contactEmail?.trim() || SITE_CONFIG.business.email;
    const phone = branding?.contactPhone?.trim() || SITE_CONFIG.business.phoneDisplay || SITE_CONFIG.business.phone;
    doc.setDrawColor(...border);
    doc.line(left, 282, left + contentWidth, 282);
    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`${website} · ${email} · ${phone}`, left, 287);
  };

  drawHeader(false);

  ensureSpace(22);
  const clientValue = data.clientName || data.clientContact || '-';
  const contactValue = [data.clientContact, data.clientEmail, data.clientPhone].filter(Boolean).join(' · ') || '-';
  const clientLinesCount = Math.min(3, doc.splitTextToSize(clientValue, 70).length);
  const contactLinesCount = Math.min(3, doc.splitTextToSize(contactValue, 85).length);
  const clientBoxHeight = 12 + Math.max(clientLinesCount, contactLinesCount) * 4.8;
  drawCard(left, y, contentWidth, clientBoxHeight, 2, true);
  drawLabelValue('Client', clientValue, left + 4, y + 6, 70, 3);
  drawLabelValue(t.contact, contactValue, left + 88, y + 6, 85, 3);
  y += clientBoxHeight + 8;

  ensureSpace(30);
  const eventDetailsText = [eventTypeName, `${t.location}: ${eventLocation}`, `${t.schedule}: ${eventSchedule}`].join('\n');
  const eventTypeLines = Math.min(5, doc.splitTextToSize(eventDetailsText, 80).length);
  const dateLines = Math.min(3, doc.splitTextToSize(eventDate, 85).length);
  const guestsLines = Math.min(2, doc.splitTextToSize(`${Math.max(0, data.guests)}`, 85).length);
  const labelToValueGap = 5.5;
  const eventRowHeight = 4.9;
  const fieldHeight = (lineCount: number) => labelToValueGap + lineCount * eventRowHeight;
  const rightFieldHeight = fieldHeight(dateLines) + 2.5 + fieldHeight(guestsLines);
  const leftFieldHeight = fieldHeight(eventTypeLines);
  const eventBoxHeight = 11 + Math.max(leftFieldHeight, rightFieldHeight);
  drawCard(left, y, contentWidth, eventBoxHeight, 3, true);
  drawLabelValue(t.eventDetails, eventDetailsText, left + 4, y + 6, 80, 5);
  const dateUsed = drawLabelValue(t.eventDate, eventDate, left + 88, y + 6, 85, 3);
  drawLabelValue(t.guests, `${Math.max(0, data.guests)}`, left + 88, y + 6 + fieldHeight(dateUsed) + 2.5, 85, 2);
  y += eventBoxHeight + 7;

  const packNameLines = doc.splitTextToSize(data.pack.name, 126).slice(0, 2);
  const packInfoHeight = 22 + (packNameLines.length - 1) * 4.6;
  ensureSpace(packInfoHeight + 7);
  drawCard(left, y - 3, contentWidth, packInfoHeight + 3, 2, false);
  doc.setTextColor(...accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(t.selectedPack.toUpperCase(), left + 4, y + 2);
  y += 7.5;
  doc.setTextColor(...neutral);
  doc.setFontSize(13);
  doc.text(packNameLines, left + 4, y);
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text(`${data.pack.durationHours} ${t.hours}`, left + 4, y + 7.5 + (packNameLines.length - 1) * 4.6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accent);
  doc.setFontSize(16);
  doc.text(`${data.basePrice.toFixed(2)}€`, left + contentWidth - 4, y + 2, { align: 'right' });
  y += 14.5 + (packNameLines.length - 1) * 4.6;

  const features = data.pack.features
    .map((feature) => feature.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim())
    .filter(Boolean)
    .slice(0, 6);

  if (features.length > 0) {
    const featureRows = features.map((feature) => doc.splitTextToSize(feature, 170).slice(0, 2).length);
    const featureLinesTotal = featureRows.reduce((sum, n) => sum + n, 0);
    const featuresBoxHeight = 12 + featureLinesTotal * lineHeight + 4;
    ensureSpace(featuresBoxHeight + 2);
    drawCard(left, y - 4, contentWidth, featuresBoxHeight, 2, false);
    doc.setTextColor(...accent);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(t.features, left + 4, y);
    y += 6;
    doc.setTextColor(...neutral);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const feature of features) {
      ensureSpace(lineHeight + 1);
      doc.setFillColor(...accent);
      doc.circle(left + 5.5, y - 1.25, 0.95, 'F');
      const lines = doc.splitTextToSize(feature, 170).slice(0, 2);
      doc.text(lines, left + 9, y);
      y += lineHeight * lines.length;
    }
    y += 3;
  }

  if (data.extras.length > 0) {
    const extrasRows = data.extras.slice(0, 6);
    const extraLineCounts = extrasRows.map((extraName) => doc.splitTextToSize(extraName, 145).slice(0, 2).length);
    const extrasLinesTotal = extraLineCounts.reduce((sum, n) => sum + n, 0);
    const extrasBoxHeight = 12 + extrasLinesTotal * lineHeight + 4;
    ensureSpace(extrasBoxHeight + 2);
    drawCard(left, y - 4, contentWidth, extrasBoxHeight, 2, false);
    doc.setTextColor(...accent);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(t.extras, left + 4, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...neutral);
    doc.setFontSize(9);
    for (const extraName of extrasRows) {
      const extra = extrasCatalog.find((item) => item.name === extraName || item.id === extraName);
      const priceText = typeof extra?.price === 'number' ? `+${extra.price}€` : '';
      ensureSpace(lineHeight + 1);
      const lines = doc.splitTextToSize(extraName, 145).slice(0, 2);
      doc.text(lines, left + 4, y);
      if (priceText) {
        doc.setTextColor(...accent);
        doc.setFont('helvetica', 'bold');
        doc.text(priceText, left + contentWidth, y, { align: 'right' });
        doc.setTextColor(...neutral);
        doc.setFont('helvetica', 'normal');
      }
      y += lineHeight * lines.length;
    }
    y += 3;
  }

  const discountReasonLines =
    data.discount > 0 && data.discountReason?.trim()
      ? Math.min(2, doc.splitTextToSize(data.discountReason.trim(), 120).length)
      : 0;
  const summaryRows = 2 + (data.discount > 0 ? 1 : 0);
  const summaryTopPadding = 8;
  const summaryRowGap = 6;
  const summaryReasonGap = discountReasonLines > 0 ? 4.2 + discountReasonLines * 3.8 : 0;
  const summaryTotalGap = 12;
  const summaryBottomPadding = 4;
  const summaryHeight =
    summaryTopPadding +
    summaryRows * summaryRowGap +
    summaryReasonGap +
    summaryTotalGap +
    summaryBottomPadding;

  const conditions = (data.conditions || []).map((item) => item.trim()).filter(Boolean).slice(0, 6);
  const conditionLineCounts = conditions.map((condition) => doc.splitTextToSize(`• ${condition}`, 175).slice(0, 2).length);
  const conditionLinesTotal = conditionLineCounts.reduce((sum, n) => sum + n, 0);
  const conditionHeight = conditions.length > 0 ? 12 + conditionLinesTotal * lineHeight + 4 : 0;

  // Keep summary and conditions together when possible to avoid awkward page splits.
  ensureSpace(summaryHeight + 7 + (conditionHeight > 0 ? conditionHeight + 2 : 0));

  ensureSpace(summaryHeight + 4);
  drawCard(left, y, contentWidth, summaryHeight, 2, true);
  doc.setTextColor(...accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(t.priceSummary, left + 4, y + 7);

  let priceY = y + summaryTopPadding + 3;
  doc.setTextColor(...neutral);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(t.basePack, left + 4, priceY);
  doc.text(`${data.basePrice.toFixed(2)}€`, left + contentWidth - 4, priceY, { align: 'right' });
  priceY += summaryRowGap;
  doc.text(t.extrasTotal, left + 4, priceY);
  doc.text(`${data.extrasPrice.toFixed(2)}€`, left + contentWidth - 4, priceY, { align: 'right' });
  if (data.discount > 0) {
    priceY += summaryRowGap;
    doc.text(t.discount, left + 4, priceY);
    doc.text(`-${data.discount.toFixed(2)}€`, left + contentWidth - 4, priceY, { align: 'right' });

    const reason = data.discountReason?.trim();
    if (reason) {
      priceY += 4.2;
      doc.setTextColor(...muted);
      doc.setFontSize(7.5);
      const reasonLines = doc.splitTextToSize(reason, 120).slice(0, 2);
      doc.text(reasonLines, left + 4, priceY);
      doc.setTextColor(...neutral);
      doc.setFontSize(9);
      priceY += 3.8 * reasonLines.length;
    }
  }
  priceY += 6;
  doc.setDrawColor(...border);
  doc.line(left + 4, priceY - 3, left + contentWidth - 4, priceY - 3);
  doc.setFillColor(34, 31, 10);
  doc.roundedRect(left + 3, priceY - 0.5, contentWidth - 6, 8.5, 1.6, 1.6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...accent);
  doc.text(t.total.toUpperCase(), left + 6, priceY + 5.4);
  doc.setFontSize(18);
  doc.text(`${data.total.toFixed(2)}€`, left + contentWidth - 6, priceY + 5.7, { align: 'right' });
  y += summaryHeight + 7;

  if (conditions.length > 0) {
    ensureSpace(conditionHeight + 2);
    drawCard(left, y - 4, contentWidth, conditionHeight, 2, false);
    doc.setTextColor(...accent);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(t.conditions, left + 4, y);
    y += 6.5;
    doc.setTextColor(...neutral);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    for (const condition of conditions) {
      ensureSpace(lineHeight + 1);
      const lines = doc.splitTextToSize(`• ${condition}`, 175).slice(0, 2);
      doc.text(lines, left + 4, y);
      y += lineHeight * lines.length;
    }
    y += 3.5;
  }

  if (data.whyChooseUs?.trim()) {
    const whyLines = doc.splitTextToSize(data.whyChooseUs.trim(), 174).slice(0, 3);
    const boxHeight = 12 + whyLines.length * lineHeight;
    ensureSpace(boxHeight + 1);
    drawCard(left, y, contentWidth, boxHeight, 2, true);
    doc.setTextColor(...accent);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(t.whyChooseUs, left + 4, y + 6);
    doc.setTextColor(...neutral);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.text(whyLines, left + 4, y + 11);
    y += boxHeight + 1.5;
  }

  ensureSpace(8);
  doc.setTextColor(...muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`${t.validUntilPrefix} ${validityDays} ${t.validUntilSuffix} · ${t.disclaimer}`, left, y);

  // Add footer to ALL pages (not just the last one)
  const totalPages = doc.internal.pages.length - 1;
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    drawFooter();
  }
  return doc;
}

// ============================================
// CONTRACT PDF (dark theme, mateixa estètica que QuotePDF)
// ============================================

export interface ContractPdfData {
  contractReference: string;
  contractDate: Date;

  // Parts
  companyName: string;
  companyLegalName: string;
  companyNIF: string;
  companyAddress: string;
  companyIBAN: string;
  companyPhone: string;
  companyEmail: string;

  clientName: string;
  clientNIF?: string;
  clientAddress?: string;
  clientEmail: string;
  clientPhone?: string;

  // Servei
  eventType: string;
  eventDate: Date;
  eventTime?: string;
  eventEndTime?: string;
  eventLocation: string;
  guestCount: number;
  packName: string;
  packPrice: number;
  djHours: number;
  extras?: { name: string; price: number; quantity: number }[];

  // Econòmic
  subtotal: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  total: number;

  // Pagament
  depositAmount: number;
  depositDueDate: Date;
  finalPaymentDue: Date;

  // Clàusules
  cancellationPolicy: string;
  additionalClauses?: string;
}

export async function generateContractPDF(
  data: ContractPdfData,
  locale: 'ca' | 'es' | 'en' = 'ca',
  branding?: PdfBrandingOptions
): Promise<jsPDFType> {
  const { default: jsPDF } = await getJsPDF();
  const doc = new jsPDF();

  const t = {
    ca: {
      title: 'CONTRACTE DE PRESTACIÓ DE SERVEIS',
      ref: 'Referència',
      date: 'Data',
      parties: 'LES PARTS',
      provider: 'PRESTADOR DEL SERVEI',
      client: 'CLIENT',
      nif: 'NIF',
      address: 'Adreça',
      email: 'Email',
      phone: 'Telèfon',
      serviceDetails: 'DETALLS DEL SERVEI',
      eventType: 'Tipus',
      eventDate: 'Data',
      eventTime: 'Horari',
      location: 'Lloc',
      guests: 'Convidats',
      pack: 'Pack contractat',
      extras: 'Extres',
      economicSummary: 'RESUM ECONÒMIC',
      subtotal: 'Subtotal',
      discount: 'Descompte',
      vat: 'IVA',
      total: 'TOTAL',
      paymentTerms: 'CONDICIONS DE PAGAMENT',
      deposit: 'Aval (dipòsit)',
      depositDue: 'Venciment aval',
      remaining: 'Resta',
      remainingDue: 'Venciment resta',
      iban: 'IBAN per transferència',
      cancellation: 'POLÍTICA DE CANCEL·LACIÓ',
      additionalClauses: 'CLÀUSULES ADDICIONALS',
      legalClauses: 'CLÀUSULES LEGALS',
      legalText1: 'Ambdues parts declaren tenir capacitat legal suficient per a la signatura del present contracte.',
      legalText2: 'El prestador es compromet a realitzar el servei amb la màxima professionalitat i qualitat.',
      legalText3: 'En cas de força major (desastres naturals, pandèmies, restriccions governamentals), ambdues parts queden alliberades de les seves obligacions sense penalització.',
      legalText4: 'Per a qualsevol controvèrsia derivada del present contracte, ambdues parts se sotmeten als jutjats i tribunals de Granollers (Barcelona).',
      legalText5: 'Les dades personals seran tractades d\'acord amb el RGPD (UE) 2016/679 i la LOPDGDD 3/2018.',
      signatures: 'SIGNATURES',
      signProvider: 'El Prestador',
      signClient: 'El Client',
      signDate: 'Data de signatura',
      signName: 'Nom i cognoms',
      sign: 'Signatura',
    },
    es: {
      title: 'CONTRATO DE PRESTACIÓN DE SERVICIOS',
      ref: 'Referencia',
      date: 'Fecha',
      parties: 'LAS PARTES',
      provider: 'PRESTADOR DEL SERVICIO',
      client: 'CLIENTE',
      nif: 'NIF',
      address: 'Dirección',
      email: 'Email',
      phone: 'Teléfono',
      serviceDetails: 'DETALLES DEL SERVICIO',
      eventType: 'Tipo',
      eventDate: 'Fecha',
      eventTime: 'Horario',
      location: 'Lugar',
      guests: 'Invitados',
      pack: 'Pack contratado',
      extras: 'Extras',
      economicSummary: 'RESUMEN ECONÓMICO',
      subtotal: 'Subtotal',
      discount: 'Descuento',
      vat: 'IVA',
      total: 'TOTAL',
      paymentTerms: 'CONDICIONES DE PAGO',
      deposit: 'Señal (depósito)',
      depositDue: 'Vencimiento señal',
      remaining: 'Resto',
      remainingDue: 'Vencimiento resto',
      iban: 'IBAN para transferencia',
      cancellation: 'POLÍTICA DE CANCELACIÓN',
      additionalClauses: 'CLÁUSULAS ADICIONALES',
      legalClauses: 'CLÁUSULAS LEGALES',
      legalText1: 'Ambas partes declaran tener capacidad legal suficiente para la firma del presente contrato.',
      legalText2: 'El prestador se compromete a realizar el servicio con la máxima profesionalidad y calidad.',
      legalText3: 'En caso de fuerza mayor (desastres naturales, pandemias, restricciones gubernamentales), ambas partes quedan liberadas de sus obligaciones sin penalización.',
      legalText4: 'Para cualquier controversia derivada del presente contrato, ambas partes se someten a los juzgados y tribunales de Granollers (Barcelona).',
      legalText5: 'Los datos personales serán tratados conforme al RGPD (UE) 2016/679 y la LOPDGDD 3/2018.',
      signatures: 'FIRMAS',
      signProvider: 'El Prestador',
      signClient: 'El Cliente',
      signDate: 'Fecha de firma',
      signName: 'Nombre y apellidos',
      sign: 'Firma',
    },
    en: {
      title: 'SERVICE AGREEMENT',
      ref: 'Reference',
      date: 'Date',
      parties: 'THE PARTIES',
      provider: 'SERVICE PROVIDER',
      client: 'CLIENT',
      nif: 'Tax ID',
      address: 'Address',
      email: 'Email',
      phone: 'Phone',
      serviceDetails: 'SERVICE DETAILS',
      eventType: 'Type',
      eventDate: 'Date',
      eventTime: 'Schedule',
      location: 'Location',
      guests: 'Guests',
      pack: 'Selected package',
      extras: 'Extras',
      economicSummary: 'ECONOMIC SUMMARY',
      subtotal: 'Subtotal',
      discount: 'Discount',
      vat: 'VAT',
      total: 'TOTAL',
      paymentTerms: 'PAYMENT TERMS',
      deposit: 'Deposit',
      depositDue: 'Deposit due',
      remaining: 'Remaining',
      remainingDue: 'Remaining due',
      iban: 'IBAN for bank transfer',
      cancellation: 'CANCELLATION POLICY',
      additionalClauses: 'ADDITIONAL CLAUSES',
      legalClauses: 'LEGAL CLAUSES',
      legalText1: 'Both parties declare having sufficient legal capacity to sign this contract.',
      legalText2: 'The provider commits to delivering the service with the highest professionalism and quality.',
      legalText3: 'In cases of force majeure (natural disasters, pandemics, government restrictions), both parties are released from their obligations without penalty.',
      legalText4: 'For any dispute arising from this contract, both parties submit to the courts of Granollers (Barcelona).',
      legalText5: 'Personal data will be processed in accordance with GDPR (EU) 2016/679.',
      signatures: 'SIGNATURES',
      signProvider: 'The Provider',
      signClient: 'The Client',
      signDate: 'Signature date',
      signName: 'Full name',
      sign: 'Signature',
    },
  }[locale];

  // Dark theme colors (same as quote PDF)
  const neutral = [241, 245, 249] as [number, number, number];
  const muted = [148, 163, 184] as [number, number, number];
  const border = [51, 65, 85] as [number, number, number];
  const surface = [24, 28, 33] as [number, number, number];
  const surfaceSoft = [29, 34, 40] as [number, number, number];
  const accent = [212, 175, 55] as [number, number, number];

  const left = 14;
  const contentWidth = 182;
  const pageBottom = 255;
  const lineHeight = 5;
  let y = 16;

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString(toIntlLocale(locale), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const brandName = branding?.brandName?.trim() || 'Orbita Events';

  // -- Helpers --
  const drawCard = (
    x: number, top: number, width: number, height: number, rounded = 2, soft = false
  ) => {
    doc.setFillColor(...(soft ? surfaceSoft : surface));
    doc.roundedRect(x, top, width, height, rounded, rounded, 'F');
    doc.setDrawColor(...border);
    doc.roundedRect(x, top, width, height, rounded, rounded, 'S');
    doc.setFillColor(...accent);
    doc.roundedRect(x, top + 1.5, 1.4, Math.max(2, height - 3), 0.8, 0.8, 'F');
  };

  const drawSectionTitle = (title: string) => {
    doc.setTextColor(...accent);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(title, left + 4, y);
    y += 7;
  };

  const drawRow = (label: string, value: string, bold = false) => {
    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(label, left + 6, y);
    doc.setTextColor(...neutral);
    if (bold) doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(value, 120).slice(0, 2);
    doc.text(lines, left + 55, y);
    y += lineHeight * lines.length;
  };

  const ensureSpace = (space: number) => {
    if (y + space > pageBottom) {
      doc.addPage();
      doc.setFillColor(18, 20, 24);
      doc.rect(0, 0, 210, 297, 'F');
      drawCompactHeader();
    }
  };

  const drawCompactHeader = () => {
    drawCard(left, 10, contentWidth, 16, 3, true);
    doc.setTextColor(...neutral);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(brandName, left + 6, 19);
    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${t.ref}: ${data.contractReference}`, left + contentWidth - 6, 19, { align: 'right' });
    y = 34;
  };

  const drawFooter = () => {
    const website = normalizeWebsite(branding?.website?.trim() || SITE_CONFIG.web.url);
    const email = branding?.contactEmail?.trim() || SITE_CONFIG.business.email;
    const phone = branding?.contactPhone?.trim() || SITE_CONFIG.business.phoneDisplay || SITE_CONFIG.business.phone;
    doc.setDrawColor(...border);
    doc.line(left, 282, left + contentWidth, 282);
    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`${website} · ${email} · ${phone}`, left, 287);
  };

  // -- Page 1: Background --
  doc.setFillColor(18, 20, 24);
  doc.rect(0, 0, 210, 297, 'F');

  // -- Header --
  const logoSource = branding?.logoDataUrl || ORBITA_LOGO_TEXT_DRETA_BASE64 || ORBITA_LOGO_BASE64;
  const hasLogo = typeof logoSource === 'string' && logoSource.length > 100;
  drawCard(left, y, contentWidth, 26, 3, true);
  if (hasLogo) {
    try {
      const fmt = getImageFormatFromDataUrl(logoSource);
      const props = doc.getImageProperties(logoSource);
      const fitted = fitWithin(props.width, props.height, 52, 14);
      doc.addImage(logoSource, fmt, left + 5, y + 5 + (14 - fitted.height) / 2, fitted.width, fitted.height);
    } catch { /* fallback */ }
  }
  doc.setTextColor(...neutral);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(brandName, hasLogo ? left + 62 : left + 6, y + 11);
  doc.setTextColor(...accent);
  doc.setFontSize(10);
  doc.text(t.title, hasLogo ? left + 62 : left + 6, y + 18.5);
  doc.setTextColor(...muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${t.ref}: ${data.contractReference}`, left + contentWidth - 6, y + 8.5, { align: 'right' });
  doc.text(`${t.date}: ${fmtDate(data.contractDate)}`, left + contentWidth - 6, y + 13, { align: 'right' });
  y += 34;

  // -- Parts --
  ensureSpace(55);
  drawCard(left, y - 4, contentWidth, 50, 2, true);
  drawSectionTitle(t.parties);

  // Provider (left column)
  doc.setTextColor(...accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(t.provider, left + 6, y);
  y += 5;
  doc.setTextColor(...neutral);
  doc.setFontSize(9);
  doc.text(data.companyLegalName, left + 6, y);
  y += 4.5;
  doc.setTextColor(...muted);
  doc.setFontSize(8);
  doc.text(`${t.nif}: ${data.companyNIF}`, left + 6, y);
  y += 4;
  doc.text(`${t.address}: ${data.companyAddress}`, left + 6, y);
  y += 4;
  doc.text(`${t.email}: ${data.companyEmail}`, left + 6, y);
  y += 7;

  // Client (same column, below)
  doc.setTextColor(...accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(t.client, left + 6, y);
  y += 5;
  doc.setTextColor(...neutral);
  doc.setFontSize(9);
  doc.text(data.clientName, left + 6, y);
  y += 4.5;
  doc.setTextColor(...muted);
  doc.setFontSize(8);
  if (data.clientNIF) { doc.text(`${t.nif}: ${data.clientNIF}`, left + 6, y); y += 4; }
  if (data.clientAddress) { doc.text(`${t.address}: ${data.clientAddress}`, left + 6, y); y += 4; }
  doc.text(`${t.email}: ${data.clientEmail}`, left + 6, y);
  if (data.clientPhone) { doc.text(`${t.phone}: ${data.clientPhone}`, left + 100, y); }
  y += 8;

  // -- Service Details --
  const extrasCount = data.extras?.length || 0;
  const serviceBoxHeight = 40 + extrasCount * 5;
  ensureSpace(serviceBoxHeight + 10);
  drawCard(left, y - 4, contentWidth, serviceBoxHeight, 2, false);
  drawSectionTitle(t.serviceDetails);
  drawRow(t.eventType, data.eventType);
  drawRow(t.eventDate, fmtDate(data.eventDate));
  if (data.eventTime) drawRow(t.eventTime, `${data.eventTime}${data.eventEndTime ? ` - ${data.eventEndTime}` : ''}`);
  drawRow(t.location, data.eventLocation);
  drawRow(t.guests, `${data.guestCount}`);
  drawRow(t.pack, `${data.packName} (${data.djHours}h)`, true);
  if (data.extras && data.extras.length > 0) {
    for (const extra of data.extras) {
      drawRow(t.extras, `${extra.name} — ${(extra.price * extra.quantity).toFixed(2)}€`);
    }
  }
  y += 4;

  // -- Economic Summary --
  ensureSpace(45);
  drawCard(left, y - 4, contentWidth, 38 + (data.discount > 0 ? 5 : 0), 2, true);
  drawSectionTitle(t.economicSummary);
  drawRow(t.subtotal, `${data.subtotal.toFixed(2)}€`);
  if (data.discount > 0) drawRow(t.discount, `-${data.discount.toFixed(2)}€`);
  drawRow(`${t.vat} (${data.vatRate}%)`, `${data.vatAmount.toFixed(2)}€`);
  doc.setTextColor(...accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t.total, left + 6, y + 2);
  doc.text(`${data.total.toFixed(2)}€`, left + contentWidth - 6, y + 2, { align: 'right' });
  y += 10;

  // -- Payment Terms --
  ensureSpace(42);
  drawCard(left, y - 4, contentWidth, 38, 2, false);
  drawSectionTitle(t.paymentTerms);
  drawRow(t.deposit, `${data.depositAmount.toFixed(2)}€`);
  drawRow(t.depositDue, fmtDate(data.depositDueDate));
  drawRow(t.remaining, `${(data.total - data.depositAmount).toFixed(2)}€`);
  drawRow(t.remainingDue, fmtDate(data.finalPaymentDue));
  drawRow(t.iban, data.companyIBAN, true);
  y += 4;

  // -- Cancellation Policy --
  const cancelLines = doc.splitTextToSize(data.cancellationPolicy, contentWidth - 12).slice(0, 8);
  const cancelBoxHeight = 14 + cancelLines.length * 4.2;
  ensureSpace(cancelBoxHeight + 6);
  drawCard(left, y - 4, contentWidth, cancelBoxHeight, 2, false);
  drawSectionTitle(t.cancellation);
  doc.setTextColor(...neutral);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.text(cancelLines, left + 6, y);
  y += cancelLines.length * 4.2 + 6;

  // -- Additional Clauses --
  if (data.additionalClauses?.trim()) {
    const addLines = doc.splitTextToSize(data.additionalClauses.trim(), contentWidth - 12).slice(0, 8);
    const addBoxHeight = 14 + addLines.length * 4.2;
    ensureSpace(addBoxHeight + 6);
    drawCard(left, y - 4, contentWidth, addBoxHeight, 2, false);
    drawSectionTitle(t.additionalClauses);
    doc.setTextColor(...neutral);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.text(addLines, left + 6, y);
    y += addLines.length * 4.2 + 6;
  }

  // -- Legal Clauses --
  const legalTexts = [t.legalText1, t.legalText2, t.legalText3, t.legalText4, t.legalText5];
  const allLegalLines = legalTexts.flatMap(txt => doc.splitTextToSize(`• ${txt}`, contentWidth - 12).slice(0, 3));
  const legalBoxHeight = 14 + allLegalLines.length * 3.8;
  ensureSpace(legalBoxHeight + 6);
  drawCard(left, y - 4, contentWidth, legalBoxHeight, 2, false);
  drawSectionTitle(t.legalClauses);
  doc.setTextColor(...neutral);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  let legalY = y;
  for (const txt of legalTexts) {
    const lines = doc.splitTextToSize(`• ${txt}`, contentWidth - 12).slice(0, 3);
    doc.text(lines, left + 6, legalY);
    legalY += lines.length * 3.8;
  }
  y = legalY + 6;

  // -- Signatures --
  ensureSpace(55);
  drawCard(left, y - 4, contentWidth, 48, 2, true);
  drawSectionTitle(t.signatures);

  const sigColWidth = (contentWidth - 20) / 2;

  // Provider signature
  doc.setTextColor(...accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(t.signProvider, left + 6, y);
  y += 5;
  doc.setTextColor(...muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${t.signName}: ${data.companyLegalName}`, left + 6, y);
  doc.text(`${t.signName}: ____________________`, left + 6 + sigColWidth + 8, y);

  // Client signature labels
  doc.setTextColor(...accent);
  doc.setFont('helvetica', 'bold');
  doc.text(t.signClient, left + 6 + sigColWidth + 8, y - 5);

  y += 8;
  doc.setTextColor(...muted);
  doc.setFont('helvetica', 'normal');
  doc.text(`${t.signDate}: ____________________`, left + 6, y);
  doc.text(`${t.signDate}: ____________________`, left + 6 + sigColWidth + 8, y);
  y += 10;
  doc.setDrawColor(...border);
  doc.line(left + 6, y, left + 6 + sigColWidth - 4, y);
  doc.line(left + 6 + sigColWidth + 8, y, left + 6 + sigColWidth * 2 + 4, y);
  doc.setTextColor(...muted);
  doc.setFontSize(7);
  doc.text(t.sign, left + 6 + (sigColWidth - 4) / 2, y + 4, { align: 'center' });
  doc.text(t.sign, left + 6 + sigColWidth + 8 + (sigColWidth - 4) / 2, y + 4, { align: 'center' });

  // -- Footer on all pages --
  const totalPages = doc.internal.pages.length - 1;
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    drawFooter();
  }

  return doc;
}

export async function downloadImage(imageUrl: string, filename: string): Promise<void> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    log.error('Error downloading image:', error);
    throw error;
  }
}

export async function downloadImages(
  images: { src: string; alt: string }[],
  prefix: string = 'orbita'
): Promise<void> {
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const ext = img.src.split('.').pop() || 'jpg';
    const filename = `${prefix}-${String(i + 1).padStart(2, '0')}.${ext}`;
    await downloadImage(img.src, filename);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}
