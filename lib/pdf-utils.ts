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
  produccion: { ca: 'Producció Tècnica', es: 'Producción Técnica', en: 'Technical Production' },
  alquiler: { ca: 'Lloguer d\'Equip', es: 'Alquiler de Equipo', en: 'Equipment Rental' },
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
      eventDetails: 'Detalls de l\'event',
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
  const accent = [212, 175, 55] as [number, number, number];

  const left = 14;
  const contentWidth = 182;
  const pageBottom = 255;
  const lineHeight = 5;
  let y = 16;

  const quoteRef = `OE-${Date.now().toString(36).toUpperCase()}`;
  const issueDate = new Date().toLocaleDateString(locale === 'ca' ? 'ca-ES' : locale === 'es' ? 'es-ES' : 'en-GB');
  const eventTypeName = SERVICE_NAMES[data.eventType as ServiceSlug]?.[locale] || data.eventType;
  const brandName = branding?.brandName?.trim() || 'Orbita Events';
  const validityDays = Math.max(1, Math.round(data.validityDays || 15));

  doc.setFillColor(18, 20, 24);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

  const ensureSpace = (space: number): boolean => y + space <= pageBottom;

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

  const drawHeader = (compact: boolean) => {
    const headerHeight = compact ? 16 : 26;
    doc.setFillColor(...surface);
    doc.roundedRect(left, y, contentWidth, headerHeight, 3, 3, 'F');
    doc.setDrawColor(...border);
    doc.roundedRect(left, y, contentWidth, headerHeight, 3, 3, 'S');

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

  if (!ensureSpace(22)) {
    drawFooter();
    return doc;
  }
  const clientValue = data.clientName || data.clientContact || '-';
  const contactValue = [data.clientContact, data.clientEmail, data.clientPhone].filter(Boolean).join(' · ') || '-';
  const clientLinesCount = Math.min(3, doc.splitTextToSize(clientValue, 70).length);
  const contactLinesCount = Math.min(3, doc.splitTextToSize(contactValue, 85).length);
  const clientBoxHeight = 12 + Math.max(clientLinesCount, contactLinesCount) * 4.8;
  doc.setFillColor(...surface);
  doc.roundedRect(left, y, contentWidth, clientBoxHeight, 2, 2, 'F');
  doc.setDrawColor(...border);
  doc.roundedRect(left, y, contentWidth, clientBoxHeight, 2, 2, 'S');
  drawLabelValue('Client', clientValue, left + 4, y + 6, 70, 3);
  drawLabelValue(t.contact, contactValue, left + 88, y + 6, 85, 3);
  y += clientBoxHeight + 6;

  if (!ensureSpace(30)) {
    drawFooter();
    return doc;
  }
  const eventTypeLines = Math.min(2, doc.splitTextToSize(`${eventTypeName}`, 80).length);
  const dateLines = Math.min(2, doc.splitTextToSize(data.date || '-', 85).length);
  const guestsLines = 1;
  const eventBoxHeight = 14 + Math.max(eventTypeLines, dateLines + guestsLines) * 4.8;
  doc.setFillColor(...surface);
  doc.roundedRect(left, y, contentWidth, eventBoxHeight, 3, 3, 'F');
  doc.setDrawColor(...border);
  doc.roundedRect(left, y, contentWidth, eventBoxHeight, 3, 3, 'S');
  drawLabelValue(t.eventDetails, `${eventTypeName}`, left + 4, y + 6, 80, 2);
  const dateUsed = drawLabelValue('Data', data.date || '-', left + 88, y + 6, 85, 2);
  drawLabelValue(t.guests, `${Math.max(0, data.guests)}`, left + 88, y + 6 + dateUsed * 4.8 + 2, 85, 1);
  y += eventBoxHeight + 5;

  if (!ensureSpace(18)) {
    drawFooter();
    return doc;
  }
  doc.setTextColor(...accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(t.selectedPack.toUpperCase(), left, y);
  y += 5;
  doc.setDrawColor(...border);
  doc.line(left, y, left + contentWidth, y);
  y += 5;
  doc.setTextColor(...neutral);
  doc.setFontSize(12.5);
  const packNameLines = doc.splitTextToSize(data.pack.name, 126).slice(0, 2);
  doc.text(packNameLines, left, y);
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text(`${data.pack.durationHours} ${t.hours}`, left, y + 7 + (packNameLines.length - 1) * 4.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accent);
  doc.setFontSize(16);
  doc.text(`${data.basePrice.toFixed(2)}€`, left + contentWidth, y + 2, { align: 'right' });
  y += 12 + (packNameLines.length - 1) * 4;

  const features = data.pack.features
    .map((feature) => feature.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim())
    .filter(Boolean)
    .slice(0, 4);

  if (features.length > 0) {
    const featureRows = features.map((feature) => doc.splitTextToSize(feature, 170).slice(0, 2).length);
    const featureLinesTotal = featureRows.reduce((sum, n) => sum + n, 0);
    const featuresBoxHeight = 10 + featureLinesTotal * lineHeight + 2;
    if (!ensureSpace(featuresBoxHeight + 2)) {
      drawFooter();
      return doc;
    }
    doc.setFillColor(...surface);
    doc.roundedRect(left, y - 4, contentWidth, featuresBoxHeight, 2, 2, 'F');
    doc.setDrawColor(...border);
    doc.roundedRect(left, y - 4, contentWidth, featuresBoxHeight, 2, 2, 'S');
    doc.setTextColor(...accent);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(t.features, left, y);
    y += 5;
    doc.setTextColor(...neutral);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const feature of features) {
      if (!ensureSpace(lineHeight + 1)) break;
      doc.setFillColor(...accent);
      doc.circle(left + 1.5, y - 1.3, 0.9, 'F');
      const lines = doc.splitTextToSize(feature, 170).slice(0, 2);
      doc.text(lines, left + 5, y);
      y += lineHeight * lines.length;
    }
    y += 2;
  }

  if (data.extras.length > 0) {
    const extrasRows = data.extras.slice(0, 4);
    const extraLineCounts = extrasRows.map((extraName) => doc.splitTextToSize(extraName, 145).slice(0, 2).length);
    const extrasLinesTotal = extraLineCounts.reduce((sum, n) => sum + n, 0);
    const extrasBoxHeight = 10 + extrasLinesTotal * lineHeight + 2;
    if (!ensureSpace(extrasBoxHeight + 2)) {
      drawFooter();
      return doc;
    }
    doc.setFillColor(...surface);
    doc.roundedRect(left, y - 4, contentWidth, extrasBoxHeight, 2, 2, 'F');
    doc.setDrawColor(...border);
    doc.roundedRect(left, y - 4, contentWidth, extrasBoxHeight, 2, 2, 'S');
    doc.setTextColor(...accent);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(t.extras, left, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...neutral);
    doc.setFontSize(9);
    for (const extraName of extrasRows) {
      const extra = extrasCatalog.find((item) => item.name === extraName || item.id === extraName);
      const priceText = typeof extra?.price === 'number' ? `+${extra.price}€` : '';
      if (!ensureSpace(lineHeight + 1)) break;
      const lines = doc.splitTextToSize(extraName, 145).slice(0, 2);
      doc.text(lines, left, y);
      if (priceText) {
        doc.setTextColor(...accent);
        doc.setFont('helvetica', 'bold');
        doc.text(priceText, left + contentWidth, y, { align: 'right' });
        doc.setTextColor(...neutral);
        doc.setFont('helvetica', 'normal');
      }
      y += lineHeight * lines.length;
    }
    y += 2;
  }

  const discountReasonLines =
    data.discount > 0 && data.discountReason?.trim()
      ? Math.min(2, doc.splitTextToSize(data.discountReason.trim(), 120).length)
      : 0;
  const summaryHeight = 22 + (data.discount > 0 ? 4.5 : 0) + discountReasonLines * 3.8;

  if (!ensureSpace(summaryHeight + 4)) {
    drawFooter();
    return doc;
  }
  doc.setFillColor(...surface);
  doc.roundedRect(left, y, contentWidth, summaryHeight, 2, 2, 'F');
  doc.setDrawColor(...border);
  doc.roundedRect(left, y, contentWidth, summaryHeight, 2, 2, 'S');
  doc.setTextColor(...accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(t.priceSummary, left + 4, y + 7);

  let priceY = y + 11;
  doc.setTextColor(...neutral);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(t.basePack, left + 4, priceY);
  doc.text(`${data.basePrice.toFixed(2)}€`, left + contentWidth - 4, priceY, { align: 'right' });
  priceY += 4.5;
  doc.text(t.extrasTotal, left + 4, priceY);
  doc.text(`${data.extrasPrice.toFixed(2)}€`, left + contentWidth - 4, priceY, { align: 'right' });
  if (data.discount > 0) {
    priceY += 4.5;
    doc.text(t.discount, left + 4, priceY);
    doc.text(`-${data.discount.toFixed(2)}€`, left + contentWidth - 4, priceY, { align: 'right' });

    const reason = data.discountReason?.trim();
    if (reason) {
      priceY += 3.8;
      doc.setTextColor(...muted);
      doc.setFontSize(7.5);
      const reasonLines = doc.splitTextToSize(reason, 120).slice(0, 2);
      doc.text(reasonLines, left + 4, priceY);
      doc.setTextColor(...neutral);
      doc.setFontSize(9);
      priceY += 3.5 * reasonLines.length;
    }
  }
  priceY += 5;
  doc.setDrawColor(...border);
  doc.line(left + 4, priceY - 3, left + contentWidth - 4, priceY - 3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...accent);
  doc.text(t.total.toUpperCase(), left + 4, priceY + 2);
  doc.text(`${data.total.toFixed(2)}€`, left + contentWidth - 4, priceY + 2, { align: 'right' });
  y += summaryHeight + 4;

  const conditions = (data.conditions || []).map((item) => item.trim()).filter(Boolean).slice(0, 4);
  if (conditions.length > 0) {
    const conditionLineCounts = conditions.map((condition) => doc.splitTextToSize(`• ${condition}`, 175).slice(0, 2).length);
    const conditionLinesTotal = conditionLineCounts.reduce((sum, n) => sum + n, 0);
    const conditionHeight = 10 + conditionLinesTotal * 4.4;
    if (!ensureSpace(conditionHeight + 2)) {
      drawFooter();
      return doc;
    }
    doc.setFillColor(...surface);
    doc.roundedRect(left, y - 4, contentWidth, conditionHeight, 2, 2, 'F');
    doc.setDrawColor(...border);
    doc.roundedRect(left, y - 4, contentWidth, conditionHeight, 2, 2, 'S');
    doc.setTextColor(...accent);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(t.conditions, left, y);
    y += 5.5;
    doc.setTextColor(...neutral);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    for (const condition of conditions) {
      if (!ensureSpace(4.5)) break;
      const lines = doc.splitTextToSize(`• ${condition}`, 175).slice(0, 2);
      doc.text(lines, left, y);
      y += 4 * lines.length;
    }
    y += 2;
  }

  if (data.whyChooseUs?.trim()) {
    const whyLines = doc.splitTextToSize(data.whyChooseUs.trim(), 174).slice(0, 2);
    const boxHeight = 8 + whyLines.length * 4;
    if (!ensureSpace(boxHeight + 1)) {
      drawFooter();
      return doc;
    }
    doc.setFillColor(...surface);
    doc.roundedRect(left, y, contentWidth, boxHeight, 2, 2, 'F');
    doc.setDrawColor(...border);
    doc.roundedRect(left, y, contentWidth, boxHeight, 2, 2, 'S');
    doc.setTextColor(...accent);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(t.whyChooseUs, left + 4, y + 5);
    doc.setTextColor(...neutral);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(whyLines, left + 4, y + 9);
    y += boxHeight + 1;
  }

  if (!ensureSpace(8)) {
    drawFooter();
    return doc;
  }
  doc.setTextColor(...muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`${t.validUntilPrefix} ${validityDays} ${t.validUntilSuffix} · ${t.disclaimer}`, left, y);

  drawFooter();
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
    console.error('Error downloading image:', error);
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
