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
    ca: { quote: 'Pressupost', eventDetails: 'Detalls de l\'Event', guests: 'Convidats', selectedPack: 'Pack Seleccionat', hours: 'hores', features: 'Característiques Incloses', extras: 'Extres Seleccionats', priceSummary: 'Resum de Preus', basePack: 'Pack base', extrasTotal: 'Total extres', discount: 'Descompte', total: 'TOTAL', validUntilPrefix: 'Pressupost vàlid durant', validUntilSuffix: 'dies', disclaimer: 'Els preus no inclouen IVA. Consulta condicions.', nextSteps: 'PRÒXIMS PASSOS', step1: 'Confirma disponibilitat contactant-nos', step2: 'Reserva amb un senyal del 30%', step3: 'Gaudeix del teu event perfecte', contact: 'Contacte', conditions: 'Condicions', whyChooseUs: 'Per què escollir-nos' },
    es: { quote: 'Presupuesto', eventDetails: 'Detalles del Evento', guests: 'Invitados', selectedPack: 'Pack Seleccionado', hours: 'horas', features: 'Características Incluidas', extras: 'Extras Seleccionados', priceSummary: 'Resumen de Precios', basePack: 'Pack base', extrasTotal: 'Total extras', discount: 'Descuento', total: 'TOTAL', validUntilPrefix: 'Presupuesto válido durante', validUntilSuffix: 'días', disclaimer: 'Los precios no incluyen IVA. Consulta condiciones.', nextSteps: 'PRÓXIMOS PASOS', step1: 'Confirma disponibilidad contactándonos', step2: 'Reserva con una señal del 30%', step3: 'Disfruta de tu evento perfecto', contact: 'Contacto', conditions: 'Condiciones', whyChooseUs: 'Por qué elegirnos' },
    en: { quote: 'Quote', eventDetails: 'Event Details', guests: 'Guests', selectedPack: 'Selected Package', hours: 'hours', features: 'Included Features', extras: 'Selected Extras', priceSummary: 'Price Summary', basePack: 'Base package', extrasTotal: 'Extras total', discount: 'Discount', total: 'TOTAL', validUntilPrefix: 'Quote valid for', validUntilSuffix: 'days', disclaimer: 'Prices do not include VAT. See conditions.', nextSteps: 'NEXT STEPS', step1: 'Confirm availability by contacting us', step2: 'Book with a 30% deposit', step3: 'Enjoy your perfect event', contact: 'Contact', conditions: 'Conditions', whyChooseUs: 'Why choose us' },
  }[locale];

  const headerTitle = t.quote;
  let y = addHeader(doc, headerTitle, branding);

  const quoteNum = `OE-${Date.now().toString(36).toUpperCase()}`;
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`REF: ${quoteNum}`, PAGE.width - PAGE.marginRight, y, { align: 'right' });
  doc.setTextColor(...COLORS.grayDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${new Date().toLocaleDateString(locale === 'ca' ? 'ca-ES' : locale === 'es' ? 'es-ES' : 'en-GB')}`, PAGE.width - PAGE.marginRight, y + 5, { align: 'right' });

  if (data.clientName) {
    doc.setTextColor(...COLORS.blackSoft);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(data.clientName, PAGE.marginLeft, y);
    y += 8;
  }
  const contactLines = [data.clientContact, data.clientEmail, data.clientPhone]
    .map((line) => (line || '').trim())
    .filter(Boolean);
  if (contactLines.length > 0) {
    doc.setTextColor(...COLORS.grayDark);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(contactLines.join(' · '), PAGE.marginLeft, y);
    y += 6;
  }
  y += 12;

  const eventCardHeight = 32;
  y = checkPageBreak(doc, y, eventCardHeight + 10, headerTitle, branding);
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, y, PAGE.contentWidth + 10, eventCardHeight, 4, 4, 'FD');
  doc.setFillColor(...COLORS.gold);
  doc.rect(15, y, 3, eventCardHeight, 'F');
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(t.eventDetails.toUpperCase(), 23, y + 9);
  doc.setTextColor(...COLORS.blackSoft);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const eventTypeName = SERVICE_NAMES[data.eventType as ServiceSlug]?.[locale] || data.eventType;
  doc.text(`${eventTypeName}`, 23, y + 18);
  doc.setTextColor(...COLORS.grayDark);
  doc.setFontSize(8);
  if (data.date && data.date !== '-') {
    doc.text(`${data.date}`, 23, y + 26);
    doc.text(`${data.guests} ${t.guests.toLowerCase()}`, 95, y + 26);
  } else {
    doc.text(`${data.guests} ${t.guests.toLowerCase()}`, 23, y + 26);
  }
  y += eventCardHeight + 12;

  const packCardHeight = 55;
  y = checkPageBreak(doc, y, packCardHeight + 10, headerTitle, branding);
  doc.setFillColor(218, 165, 32);
  doc.roundedRect(15, y, PAGE.contentWidth + 10, packCardHeight, 4, 4, 'F');
  doc.setFillColor(235, 185, 52);
  doc.roundedRect(15, y, PAGE.contentWidth + 10, 28, 4, 4, 'F');
  doc.setFillColor(255, 215, 0);
  doc.rect(15, y, 4, packCardHeight, 'F');
  doc.setTextColor(...COLORS.blackSoft);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(t.selectedPack.toUpperCase(), 24, y + 9);
  doc.setFontSize(15);
  doc.text(data.pack.name.toUpperCase(), 24, y + 22);
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.pack.durationHours} ${t.hours}`, 24, y + 32);
  doc.setTextColor(...COLORS.blackSoft);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(data.pack.price, PAGE.width - PAGE.marginRight - 5, y + 32, { align: 'right' });
  if (data.pack.price.toLowerCase().includes('desde')) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('*precio aproximado', PAGE.width - PAGE.marginRight - 5, y + 40, { align: 'right' });
  }
  y += packCardHeight + 12;

  const maxFeatures = Math.min(data.pack.features.length, 8);
  const featuresPerColumn = Math.ceil(maxFeatures / 2);
  const featuresHeight = (featuresPerColumn * 8) + 20;
  y = checkPageBreak(doc, y, featuresHeight, headerTitle, branding);
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(t.features.toUpperCase(), PAGE.marginLeft, y);
  y += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.blackSoft);
  data.pack.features.slice(0, maxFeatures).forEach((feature, index) => {
    const cleanFeature = feature.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    const column = index < featuresPerColumn ? 0 : 1;
    const rowInColumn = index % featuresPerColumn;
    const x = column === 0 ? PAGE.marginLeft : 110;
    const featureY = y + (rowInColumn * 8);
    doc.setFillColor(...COLORS.gold);
    doc.circle(x + 1, featureY - 1.5, 1, 'F');
    doc.setTextColor(...COLORS.blackSoft);
    doc.text(cleanFeature.substring(0, 45), x + 4, featureY);
  });
  y += (featuresPerColumn * 8) + 12;

  if (data.extras.length > 0) {
    const extrasHeight = (data.extras.length * 7) + 20;
    y = checkPageBreak(doc, y, extrasHeight, headerTitle, branding);
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(t.extras.toUpperCase(), PAGE.marginLeft, y);
    y += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.blackSoft);
    data.extras.forEach((extraName) => {
      const extra = extrasCatalog.find((e) => e.name === extraName || e.id === extraName);
      const price = extra?.price ? `+${extra.price}€` : '';
      doc.setFillColor(...COLORS.goldLight);
      doc.circle(21, y - 1.5, 1, 'F');
      doc.text(`${extraName}`, 24, y);
      if (price) {
        doc.setTextColor(...COLORS.gold);
        doc.setFont('helvetica', 'bold');
        doc.text(price, 105, y, { align: 'right' });
        doc.setTextColor(...COLORS.blackSoft);
        doc.setFont('helvetica', 'normal');
      }
      y += 7;
    });
    y += 10;
  }

  const summaryHeight = 60;
  y = checkPageBreak(doc, y, summaryHeight + 25, headerTitle, branding);
  y = Math.max(y, PAGE.safeBottom - summaryHeight - 20);

  const stepsY = y;
  doc.setFillColor(...COLORS.bgDark);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, stepsY, 90, 55, 4, 4, 'FD');
  doc.setFillColor(...COLORS.gold);
  doc.rect(15, stepsY, 90, 2, 'F');
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(t.nextSteps, 20, stepsY + 12);
  doc.setTextColor(...COLORS.grayDark);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  doc.setFillColor(...COLORS.gold);
  doc.circle(21, stepsY + 21, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(6);
  doc.text('1', 21, stepsY + 22.5, { align: 'center' });
  doc.setTextColor(...COLORS.grayDark);
  doc.setFontSize(7);
  doc.text(t.step1.substring(0, 35), 26, stepsY + 22);

  doc.setFillColor(...COLORS.gold);
  doc.circle(21, stepsY + 33, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(6);
  doc.text('2', 21, stepsY + 34.5, { align: 'center' });
  doc.setTextColor(...COLORS.grayDark);
  doc.setFontSize(7);
  doc.text(t.step2.substring(0, 35), 26, stepsY + 34);

  doc.setFillColor(...COLORS.gold);
  doc.circle(21, stepsY + 45, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(6);
  doc.text('3', 21, stepsY + 46.5, { align: 'center' });
  doc.setTextColor(...COLORS.grayDark);
  doc.setFontSize(7);
  doc.text(t.step3.substring(0, 35), 26, stepsY + 46);

  doc.setFillColor(248, 248, 248);
  doc.roundedRect(112, stepsY + 2, 82, 53, 4, 4, 'F');
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.5);
  doc.roundedRect(110, stepsY, 82, 53, 4, 4, 'FD');
  doc.setFillColor(...COLORS.gold);
  doc.rect(110, stepsY, 2, 53, 'F');
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(t.priceSummary.toUpperCase(), 117, stepsY + 9);
  doc.setTextColor(...COLORS.blackSoft);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  let priceY = stepsY + 18;
  doc.text(t.basePack, 117, priceY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.basePrice}€`, 185, priceY, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  if (data.extrasPrice > 0) {
    priceY += 7;
    doc.text(t.extrasTotal, 117, priceY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.extrasPrice}€`, 185, priceY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  }

  if (data.discount > 0) {
    priceY += 7;
    doc.setTextColor(...COLORS.success);
    doc.text(`${t.discount}`, 117, priceY);
    doc.setFont('helvetica', 'bold');
    doc.text(`-${data.discount}€`, 185, priceY, { align: 'right' });
    doc.setTextColor(...COLORS.blackSoft);
    doc.setFont('helvetica', 'normal');
  }

  priceY += 10;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.line(117, priceY - 3, 185, priceY - 3);
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(t.total, 117, priceY + 5);
  doc.setFontSize(16);
  doc.text(`${data.total}€`, 185, priceY + 5, { align: 'right' });

  const disclaimerY = stepsY + 60;
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(15, disclaimerY, PAGE.contentWidth + 10, 14, 2, 2, 'F');
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  const validityDays = Math.max(1, Math.round(data.validityDays || 15));
  doc.text(`${t.validUntilPrefix} ${validityDays} ${t.validUntilSuffix}`, 25, disclaimerY + 6);
  doc.setTextColor(...COLORS.grayDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(t.disclaimer, 25, disclaimerY + 11);

  let narrativeY = disclaimerY + 20;
  const conditions = (data.conditions || []).map((item) => item.trim()).filter(Boolean).slice(0, 6);

  if (conditions.length > 0) {
    narrativeY = checkPageBreak(doc, narrativeY, 32 + conditions.length * 5, headerTitle, branding);
    doc.setFillColor(...COLORS.bgLight);
    doc.roundedRect(15, narrativeY, PAGE.contentWidth + 10, 24 + conditions.length * 5, 3, 3, 'F');
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(t.conditions.toUpperCase(), 20, narrativeY + 8);
    doc.setTextColor(...COLORS.grayDark);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    conditions.forEach((condition, index) => {
      const shortLine = condition.length > 105 ? `${condition.slice(0, 102)}...` : condition;
      doc.text(`- ${shortLine}`, 20, narrativeY + 14 + index * 5);
    });
    narrativeY += 32 + conditions.length * 5;
  }

  const whyChooseUs = (data.whyChooseUs || '').trim();
  if (whyChooseUs) {
    narrativeY = checkPageBreak(doc, narrativeY, 34, headerTitle, branding);
    doc.setFillColor(255, 252, 240);
    doc.roundedRect(15, narrativeY, PAGE.contentWidth + 10, 30, 3, 3, 'F');
    doc.setFillColor(...COLORS.gold);
    doc.rect(15, narrativeY, 2, 30, 'F');
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(t.whyChooseUs.toUpperCase(), 20, narrativeY + 8);
    doc.setTextColor(...COLORS.grayDark);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const whyLines = doc.splitTextToSize(whyChooseUs, 170).slice(0, 3);
    doc.text(whyLines, 20, narrativeY + 14);
  }

  addAllFooters(doc, branding);
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
