/**
 * PDF Generation Utilities for Òrbita Events
 * Uses jsPDF for client-side PDF generation
 *
 * MEJORAS v2.0:
 * - Logo de Orbita incluido en el header
 * - Paginación correcta con saltos de página automáticos
 * - Mejor espaciado y tipografía
 */

import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import type { DossierClientInfo } from '@/lib/utils/dossier-html-builder';
import { getPacksByService, EXTRAS, type ExtraDefinition, type ServiceSlug, type PackDefinition } from '@/app/config/packs-config';
import { SITE_CONFIG } from '@/app/config/site-config';
import { resolvePackI18nKey, resolvePackI18nFeatures } from '@/lib/pack-i18n';
import { log } from '@/lib/logger';
import { toIntlLocale } from '@/lib/constants';
import { filterCompatibleExtras } from '@/lib/extrasCompatibility';
import {
  PDF_DESIGN, PDF_BODY_SIZE, PDF_FILL_BOTTOM,
  drawCanonicalPdfFooter, drawCanonicalPdfHeader, drawCanonicalSectionTitle,
  setStyleLabel, setStyleValue, setStyleBody, setStyleMuted, setStyleCaption, setStylePrice,
  spacingDelta, fillToFooter,
} from '@/lib/pdf-header';

import { type jsPDFType, type PdfBrandingOptions, COLORS, PAGE, SERVICE_NAMES, normalizeWebsite, isDataUrl, getImageFormatFromDataUrl, fitWithin, formatClientDate, formatPdfMoney } from '@/lib/pdf-config';

let jsPDFModule: typeof import('jspdf') | null = null;

async function getJsPDF(): Promise<typeof import('jspdf')> {
  if (!jsPDFModule) {
    jsPDFModule = await import('jspdf');
  }
  return jsPDFModule;
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
  return drawCanonicalPdfHeader(doc, {
    title,
    metaLines: [brandName.toUpperCase()],
    logoDataUrl: branding?.logoDataUrl,
  });
}

function addFooter(doc: jsPDFType, pageNum: number, totalPages: number, branding?: PdfBrandingOptions) {
  const website = normalizeWebsite(branding?.website?.trim() || SITE_CONFIG.web.url);
  drawCanonicalPdfFooter(doc, pageNum, totalPages, website);
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
  const packs = getPacksByService(service).map(p => ({
    ...p,
    name: resolvePackI18nKey(p.name, locale) || p.name,
    features: resolvePackI18nFeatures(p.features, locale),
  }));
  const serviceName = SERVICE_NAMES[service][locale];

  const t = {
    ca: { brochure: 'Catàleg de Serveis', ourPacks: 'Els Nostres Packs', duration: 'Durada', hours: 'hores', idealFor: 'Ideal per', popular: 'MÉS POPULAR', premium: 'PREMIUM', extras: 'Extres Disponibles', from: 'des de', contactUs: 'Contacta\'ns', contactText: 'Tens dubtes? Escriu-nos sense compromís!' },
    es: { brochure: 'Catálogo de Servicios', ourPacks: 'Nuestros Packs', duration: 'Duración', hours: 'horas', idealFor: 'Ideal para', popular: 'MÁS POPULAR', premium: 'PREMIUM', extras: 'Extras Disponibles', from: 'desde', contactUs: 'Contáctanos', contactText: '¿Tienes dudas? ¡Escríbenos sin compromiso!' },
    en: { brochure: 'Service Catalog', ourPacks: 'Our Packages', duration: 'Duration', hours: 'hours', idealFor: 'Ideal for', popular: 'MOST POPULAR', premium: 'PREMIUM', extras: 'Available Extras', from: 'from', contactUs: 'Contact Us', contactText: 'Have questions? Contact us with no obligation!' },
  }[locale];

  doc.setFillColor(...COLORS.paperBg);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');
  let y = drawCanonicalPdfHeader(doc, {
    title: t.brochure,
    subtitle: serviceName,
    ref: `SRV-${service.toUpperCase()}`,
  });

  // ── Hero ─────────────────────────────────────────────────────────────────
  doc.setTextColor(...COLORS.paperText);
  doc.setFontSize(PDF_DESIGN.type.display);
  doc.setFont('helvetica', 'bold');
  doc.text(serviceName, PDF_DESIGN.left, y + 12);
  doc.setFillColor(...COLORS.gold);
  doc.rect(PDF_DESIGN.left, y + 15, 28, 0.8, 'F');
  setStyleMuted(doc);
  doc.setFont('helvetica', 'italic');
  doc.text(t.contactText, PDF_DESIGN.left, y + 23);
  y += 32;
  y = drawCanonicalSectionTitle(doc, y, t.ourPacks);

  // Targetes de pack — graella horitzontal quan ≤4 packs
  const packGrid = packs.length <= 4;
  const packCols = packGrid ? packs.length : 1;
  const packGap = 4;
  const packCardW = packGrid
    ? (PDF_DESIGN.width - packGap * (packCols - 1)) / packCols
    : PDF_DESIGN.width;
  const packCardHeight = packGrid ? 58 : 43;
  const gridRowH = packCardHeight + packGap;
  const gridRows = Math.ceil(packs.length / packCols);

  y = checkPageBreak(doc, y, gridRows * gridRowH + 4, `${t.brochure} · ${serviceName}`);

  packs.forEach((pack, idx) => {
    const col = packGrid ? idx % packCols : 0;
    const row = packGrid ? Math.floor(idx / packCols) : idx;
    const px = PDF_DESIGN.left + col * (packCardW + packGap);
    const py = y + row * gridRowH;

    const isPopular = pack.popular;
    const isPremium = pack.highlight || pack.badge === 'Premium';

    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(isPopular ? COLORS.gold[0] : COLORS.grayLight[0], isPopular ? COLORS.gold[1] : COLORS.grayLight[1], isPopular ? COLORS.gold[2] : COLORS.grayLight[2]);
    doc.setLineWidth(isPopular ? 0.5 : 0.25);
    doc.roundedRect(px, py, packCardW, packCardHeight, 2, 2, 'FD');

    // Banda superior accent
    doc.setFillColor(...COLORS.gold);
    doc.roundedRect(px, py, packCardW, 1.5, 0.8, 0.8, 'F');

    // Badge popular/premium — cantonada SUPERIOR ESQUERRA (no xoca amb preu)
    if (isPopular || isPremium) {
      const badgeText = isPopular ? t.popular : t.premium;
      doc.setFontSize(PDF_DESIGN.type.caption);
      doc.setFont('helvetica', 'bold');
      const badgeW = doc.getTextWidth(badgeText) + 6;
      doc.setFillColor(...(isPopular ? COLORS.gold : COLORS.paperText));
      doc.roundedRect(px + 5, py + 4, badgeW, 5.5, 1.2, 1.2, 'F');
      doc.setTextColor(...(isPopular ? COLORS.blackSoft : COLORS.white));
      doc.text(badgeText, px + 5 + badgeW / 2, py + 7.9, { align: 'center' });
    }

    // Preu destacat + "des de" a la dreta (zona lliure)
    setStyleCaption(doc);
    doc.text(t.from, px + packCardW - 4, py + 6, { align: 'right' });
    setStylePrice(doc);
    doc.text(formatPdfMoney(pack.priceValue, locale), px + packCardW - 4, py + 13, { align: 'right' });

    // Nom pack (baixat per fer lloc al badge si existeix)
    const nameTopY = (isPopular || isPremium) ? py + 14 : py + 11;
    setStyleValue(doc);
    const packNameLines = doc.splitTextToSize(pack.name, packCardW - 10).slice(0, 2);
    doc.text(packNameLines, px + 5, nameTopY);

    // Durada
    setStyleCaption(doc);
    doc.text(`${pack.durationHours} ${t.hours}`, px + 5, nameTopY + packNameLines.length * 5.5);

    // Features amb truncament per amplada real + el·lipsi
    const featureStart = nameTopY + 12 + (packNameLines.length - 1) * 5.5;
    const maxF = packGrid ? 4 : 3;
    const featTextW = packCardW - 14;
    pack.features.slice(0, maxF).forEach((feature, i) => {
      const cleanFeature = feature.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      const fy = featureStart + i * 5.5;
      doc.setFillColor(...COLORS.gold);
      doc.circle(px + 6, fy - 1.2, 0.8, 'F');
      setStyleBody(doc);
      const featLines = doc.splitTextToSize(cleanFeature, featTextW);
      let featText = featLines.length > 1
        ? featLines[0].replace(/\s+\S*$/, '') + '…'
        : featLines[0];
      while (featLines.length > 1 && doc.getTextWidth(featText) > featTextW && featText.length > 2) {
        featText = featText.slice(0, -2) + '…';
      }
      doc.text(featText, px + 10, fy);
    });

    if (!packGrid) y += packCardHeight + PDF_DESIGN.blockGap;
  });

  if (packGrid) y += gridRows * gridRowH + PDF_DESIGN.blockGap;

  y = checkPageBreak(doc, y, 54, `${t.brochure} · ${serviceName}`);
  const compatibleExtras = filterCompatibleExtras(EXTRAS, service).slice(0, 8);

  if (compatibleExtras.length > 0) {
    y = drawCanonicalSectionTitle(doc, y, t.extras);
    compatibleExtras.forEach((extra, i) => {
      if (i > 0 && i % 4 === 0) y = checkPageBreak(doc, y, 30, `${t.brochure} · ${serviceName}`);
      const col = i % 2 === 0 ? PDF_DESIGN.left : 108;
      const row = Math.floor((i % 4) / 2) * 10;
      const priceText = extra.price ? formatPdfMoney(extra.price, locale) : 'Consultar';
      const extraName = resolvePackI18nKey(extra.name, locale) || extra.name;
      doc.setFillColor(...COLORS.gold);
      doc.circle(col, y + row - 1.3, 0.8, 'F');
      setStyleBody(doc);
      doc.text(`${extraName} (${priceText})`, col + 4, y + row);
    });
    y += Math.ceil(compatibleExtras.length / 2) * 10 + PDF_DESIGN.blockGap;
  }

  // Omple fins al peu: value items + bloc de contacte canònic
  if (y < PDF_FILL_BOTTOM - 28) {
    y = fillToFooter(doc, y, 'value');
  }
  if (y < PDF_FILL_BOTTOM - 24) {
    fillToFooter(doc, y, 'contact');
  } else if (y < PDF_FILL_BOTTOM - 8) {
    const anchorY = PDF_FILL_BOTTOM - 22;
    if (anchorY > y) fillToFooter(doc, anchorY, 'contact');
  }

  addAllFooters(doc);
  return doc;
}

export interface QuoteData {
  reference?: string;
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
  /** Càrrec total de transport (en euros) — afegit com a línia separada al resumen si > 0. */
  travelCharge?: number;
  /** Km totals de la ruta (anada+tornada) — apareix com a context al PDF si transport > 0. */
  travelKm?: number;
  /** Km facturables (després de restar km inclosos). */
  billableTravelKm?: number;
  /** Nombre de trams de transport facturats. */
  travelBlocks?: number;
  /** Recàrrec aplicat per regla temporal (€) — alta temporada, festiu, cap setmana, etc. */
  seasonSurcharge?: number;
  /** Etiqueta visible del recàrrec temporal (ja localitzada). */
  seasonLabel?: string;
  /** Percentatge del recàrrec sobre el preu base. */
  seasonPct?: number;
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

type PdfDateInput = Date | string;

function formatPdfDateInput(value: PdfDateInput, locale: 'ca' | 'es' | 'en'): string {
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
      travel: 'Desplaçament',
      travelDetail: (km: number, billable: number, blocks: number) =>
        `${km.toFixed(1)} km totals · ${billable.toFixed(1)} km facturables · ${blocks} ${blocks === 1 ? 'tram' : 'trams'}`,
      discount: 'Descompte',
      total: 'Total',
      validUntilPrefix: 'Validesa:',
      validUntilSuffix: 'dies',
      validSeal: 'VÀLID',
      from: 'des de',
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
      travel: 'Desplazamiento',
      travelDetail: (km: number, billable: number, blocks: number) =>
        `${km.toFixed(1)} km totales · ${billable.toFixed(1)} km facturables · ${blocks} ${blocks === 1 ? 'tramo' : 'tramos'}`,
      discount: 'Descuento',
      total: 'Total',
      validUntilPrefix: 'Validez:',
      validUntilSuffix: 'dias',
      validSeal: 'VÁLIDO',
      from: 'desde',
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
      travel: 'Travel',
      travelDetail: (km: number, billable: number, blocks: number) =>
        `${km.toFixed(1)} km total · ${billable.toFixed(1)} km billable · ${blocks} ${blocks === 1 ? 'block' : 'blocks'}`,
      discount: 'Discount',
      total: 'Total',
      validUntilPrefix: 'Validity:',
      validUntilSuffix: 'days',
      validSeal: 'VALID',
      from: 'from',
      disclaimer: 'Prices excl. VAT.',
      contact: 'Contact',
      conditions: 'Conditions',
      whyChooseUs: 'Why choose us',
      quoteRef: 'Reference',
      issueDate: 'Date',
    },
  }[locale];

  // PDF clar: fons blanc, text fosc, accent or — visible arreu
  const neutral     = COLORS.paperText;
  const muted       = COLORS.paperMuted;
  const border      = COLORS.grayLight;
  const surface     = COLORS.surfaceWarm;
  const surfaceSoft = COLORS.white;
  const accent      = COLORS.gold;







  const left = PDF_DESIGN.left;
  const contentWidth = PDF_DESIGN.width;
  const pageBottom = PDF_DESIGN.contentBottom;
  const lineHeight = 5;
  let y = 16;

  const quoteRef = data.reference || '-';
  const issueDate = data.issueDate
    ? formatClientDate(data.issueDate, locale)
    : new Date().toLocaleDateString(toIntlLocale(locale));

  // Resolució de claus i18n dels packs
  const resolvedPack = {
    ...data.pack,
    name: resolvePackI18nKey(data.pack.name, locale) || data.pack.name,
    features: resolvePackI18nFeatures(data.pack.features, locale),
  };
  const eventTypeName = SERVICE_NAMES[data.eventType as ServiceSlug]?.[locale] || data.eventType;
  const eventDate = formatClientDate(data.date || '-', locale);
  const eventSchedule = data.eventSchedule?.trim() || '-';
  const eventLocation = data.eventLocation?.trim() || '-';
  const validityDays = Math.max(1, Math.round(data.validityDays || 15));
  const contentDensity =
    Math.min(6, resolvedPack.features.length) +
    Math.min(6, data.extras.length) +
    Math.min(6, data.conditions?.length || 0) +
    (data.whyChooseUs?.trim() ? 3 : 0);
  const adaptiveGap = PDF_DESIGN.blockGap;

  doc.setFillColor(...COLORS.paperBg);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

  const drawLabelValue = (
    label: string,
    value: string,
    x: number,
    top: number,
    width: number,
    maxLines = 3
  ): number => {
    setStyleLabel(doc);
    doc.text(label.toUpperCase(), x, top);
    setStyleValue(doc);
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
    soft = false,
    noBar = false,
  ) => {
    doc.setFillColor(...(soft ? surfaceSoft : surface));
    doc.roundedRect(x, top, width, height, rounded, rounded, 'F');
    doc.setDrawColor(...border);
    doc.roundedRect(x, top, width, height, rounded, rounded, 'S');
    if (!noBar) {
      doc.setFillColor(...accent);
      doc.roundedRect(x, top + 1.5, 1.2, Math.max(2, height - 3), 0.6, 0.6, 'F');
    }
  };

  const drawHeader = (compact: boolean) => {
    y = drawCanonicalPdfHeader(doc, {
      title: t.quote,
      subtitle: eventTypeName,
      ref: compact
        ? `${quoteRef} · ${issueDate}`
        : `${quoteRef} · ${issueDate} · ${t.validUntilPrefix} ${validityDays} ${t.validUntilSuffix}`,
      logoDataUrl: branding?.logoDataUrl,
    });
  };

  const ensureSpace = (space: number): boolean => {
    // Never truncate: if content doesn't fit, continue on a new page.
    if (y + space <= pageBottom) return true;
    doc.addPage();
    doc.setFillColor(...COLORS.paperBg);
    doc.rect(0, 0, PAGE.width, PAGE.height, 'F');
    drawHeader(true);
    return y + space <= pageBottom;
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
  y += clientBoxHeight + adaptiveGap;

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
  y += eventBoxHeight + adaptiveGap;

  const packNameLines = doc.splitTextToSize(resolvedPack.name, 126).slice(0, 2);
  const packInfoHeight = 22 + (packNameLines.length - 1) * 4.6;
  ensureSpace(packInfoHeight + adaptiveGap);
  drawCard(left, y - 3, contentWidth, packInfoHeight + 3, 2, false);
  doc.setTextColor(...muted);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_DESIGN.type.caption);
  doc.text(t.selectedPack.toUpperCase(), left + 4, y + 2);
  y += 7.5;
  doc.setTextColor(...neutral);
  doc.setFontSize(PDF_DESIGN.type.title);
  doc.text(packNameLines, left + 4, y);
  setStyleMuted(doc);
  doc.text(`${resolvedPack.durationHours} ${t.hours}`, left + 4, y + 7.5 + (packNameLines.length - 1) * 4.6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...neutral);
  doc.setFontSize(PDF_DESIGN.type.money);
  doc.text(formatPdfMoney(data.basePrice, locale), left + contentWidth - 4, y + 2, { align: 'right' });
  y += 14.5 + (packNameLines.length - 1) * 4.6;

  const features = resolvedPack.features
    .map((feature) => feature.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim())
    .filter(Boolean)
    .slice(0, 6);

  if (features.length > 0) {
    const featureRows = features.map((feature) => doc.splitTextToSize(feature, 170).slice(0, 2).length);
    const featureLinesTotal = featureRows.reduce((sum, n) => sum + n, 0);
    const featuresBoxHeight = 12 + featureLinesTotal * lineHeight + 4;
    ensureSpace(featuresBoxHeight + 2);
    drawCard(left, y - 4, contentWidth, featuresBoxHeight, 2, false, true);
    y = drawCanonicalSectionTitle(doc, y - 2, t.features);
    for (const feature of features) {
      doc.setFillColor(...accent);
      doc.circle(left + 5.5, y - 1.25, 0.95, 'F');
      setStyleBody(doc);
      const lines = doc.splitTextToSize(feature, 170).slice(0, 2);
      doc.text(lines, left + 9, y);
      y += lineHeight * lines.length;
    }
    y += PDF_DESIGN.blockGap;
  }

  if (data.extras.length > 0) {
    const extrasRows = data.extras.slice(0, 6);
    const extraLineCounts = extrasRows.map((extraName) => doc.splitTextToSize(extraName, 145).slice(0, 2).length);
    const extrasLinesTotal = extraLineCounts.reduce((sum, n) => sum + n, 0);
    const extrasBoxHeight = 12 + extrasLinesTotal * lineHeight + 4;
    ensureSpace(extrasBoxHeight + 2);
    drawCard(left, y - 4, contentWidth, extrasBoxHeight, 2, false, true);
    y = drawCanonicalSectionTitle(doc, y - 2, t.extras);
    for (const extraName of extrasRows) {
      const extra = extrasCatalog.find((item) => item.name === extraName || item.id === extraName);
      const priceText = typeof extra?.price === 'number' ? `+${extra.price}€` : '';
      setStyleBody(doc);
      const lines = doc.splitTextToSize(extraName, 145).slice(0, 2);
      doc.text(lines, left + 4, y);
      if (priceText) {
        setStyleValue(doc);
        doc.text(priceText, left + contentWidth, y, { align: 'right' });
      }
      y += lineHeight * lines.length;
    }
    y += PDF_DESIGN.blockGap;
  }

  const discountReasonLines =
    data.discount > 0 && data.discountReason?.trim()
      ? Math.min(2, doc.splitTextToSize(data.discountReason.trim(), 120).length)
      : 0;
  const hasTravel = (data.travelCharge ?? 0) > 0;
  const travelDetailVisible = hasTravel
    && typeof data.travelKm === 'number'
    && typeof data.billableTravelKm === 'number'
    && typeof data.travelBlocks === 'number';
  const hasSeason = (data.seasonSurcharge ?? 0) > 0 && typeof data.seasonLabel === 'string';
  const seasonDetailVisible = hasSeason && typeof data.seasonPct === 'number';
  const summaryRows = 2 + (hasSeason ? 1 : 0) + (hasTravel ? 1 : 0) + (data.discount > 0 ? 1 : 0);
  const travelDetailGap = travelDetailVisible ? 4.2 : 0;
  const seasonDetailGap = seasonDetailVisible ? 4.2 : 0;
  const summaryTopPadding = 8;
  const summaryRowGap = 6;
  const summaryReasonGap = discountReasonLines > 0 ? 4.2 + discountReasonLines * 3.8 : 0;
  const summaryTotalGap = 12;
  const summaryBottomPadding = 4;
  const summaryHeight =
    summaryTopPadding +
    summaryRows * summaryRowGap +
    summaryReasonGap +
    travelDetailGap +
    seasonDetailGap +
    summaryTotalGap +
    summaryBottomPadding;

  const conditions = (data.conditions || []).map((item) => item.trim()).filter(Boolean).slice(0, 6);
  const conditionLineCounts = conditions.map((condition) => doc.splitTextToSize(`• ${condition}`, 175).slice(0, 2).length);
  const conditionLinesTotal = conditionLineCounts.reduce((sum, n) => sum + n, 0);
  const conditionHeight = conditions.length > 0 ? 12 + conditionLinesTotal * lineHeight + 4 : 0;

  // El resum pot quedar al primer full encara que les condicions necessitin continuar.
  ensureSpace(summaryHeight + 4);
  drawCard(left, y, contentWidth, summaryHeight, 2, true);
  doc.setTextColor(...neutral);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_DESIGN.type.section);
  doc.text(t.priceSummary.toUpperCase(), left + 4, y + 7);

  let priceY = y + summaryTopPadding + 3;
  setStyleBody(doc);
  doc.text(t.basePack, left + 4, priceY);
  doc.text(formatPdfMoney(data.basePrice, locale), left + contentWidth - 4, priceY, { align: 'right' });
  priceY += summaryRowGap;
  doc.text(t.extrasTotal, left + 4, priceY);
  doc.text(formatPdfMoney(data.extrasPrice, locale), left + contentWidth - 4, priceY, { align: 'right' });
  if (hasSeason) {
    priceY += summaryRowGap;
    setStyleBody(doc);
    doc.text(data.seasonLabel!, left + 4, priceY);
    doc.text(`+${formatPdfMoney(data.seasonSurcharge ?? 0, locale)}`, left + contentWidth - 4, priceY, { align: 'right' });
    if (seasonDetailVisible) {
      priceY += 4.2;
      setStyleCaption(doc);
      doc.text(`+${data.seasonPct!.toFixed(0)}% sobre el preu base`, left + 4, priceY);
      setStyleBody(doc);
    }
  }
  if (hasTravel) {
    priceY += summaryRowGap;
    setStyleBody(doc);
    doc.text(t.travel, left + 4, priceY);
    doc.text(formatPdfMoney(data.travelCharge ?? 0, locale), left + contentWidth - 4, priceY, { align: 'right' });
    if (travelDetailVisible) {
      priceY += 4.2;
      doc.setTextColor(...muted);
      doc.setFontSize(PDF_DESIGN.type.small);
      doc.text(
        t.travelDetail(data.travelKm!, data.billableTravelKm!, data.travelBlocks!),
        left + 4,
        priceY,
      );
      setStyleBody(doc);
    }
  }
  if (data.discount > 0) {
    priceY += summaryRowGap;
    setStyleBody(doc);
    doc.setTextColor(...COLORS.success);
    doc.text(t.discount, left + 4, priceY);
    doc.text(`-${formatPdfMoney(data.discount, locale)}`, left + contentWidth - 4, priceY, { align: 'right' });
    doc.setTextColor(...COLORS.paperText);

    const reason = data.discountReason?.trim();
    if (reason) {
      priceY += 4.2;
      setStyleCaption(doc);
      const reasonLines = doc.splitTextToSize(reason, 120).slice(0, 2);
      doc.text(reasonLines, left + 4, priceY);
      setStyleBody(doc);
      priceY += 3.8 * reasonLines.length;
    }
  }
  priceY += 6;
  doc.setDrawColor(...border);
  doc.line(left + 4, priceY - 3, left + contentWidth - 4, priceY - 3);
  // TOTAL: targeta fosca dramàtica
  doc.setFillColor(...COLORS.blackSoft);
  doc.roundedRect(left + 3, priceY - 0.5, contentWidth - 6, 10, 1.6, 1.6, 'F');
  // Banda lateral or
  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(left + 3, priceY - 0.5, 2.5, 10, 0.5, 0.5, 'F');
  setStyleValue(doc);
  doc.setTextColor(...COLORS.gold);
  doc.text(t.total.toUpperCase(), left + 9, priceY + 5.8);
  setStylePrice(doc);
  doc.setTextColor(...COLORS.white);
  doc.text(formatPdfMoney(data.total, locale), left + contentWidth - 6, priceY + 7.2, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_DESIGN.type.small);
  doc.setTextColor(...COLORS.grayLight);
  doc.text(t.disclaimer, left + 9, priceY + 11);
  y += summaryHeight + adaptiveGap;

  // Les condicions són un resum opcional: no han d'obrir un full gairebé buit.
  if (conditions.length > 0 && y + conditionHeight + 2 <= pageBottom) {
    drawCard(left, y - 4, contentWidth, conditionHeight, 2, false, true);
    y = drawCanonicalSectionTitle(doc, y - 2, t.conditions);
    doc.setTextColor(...neutral);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_BODY_SIZE);
    for (const condition of conditions) {
      const lines = doc.splitTextToSize(`• ${condition}`, 175).slice(0, 2);
      doc.text(lines, left + 4, y);
      y += lineHeight * lines.length;
    }
    y += 3.5;
  }

  if (data.whyChooseUs?.trim()) {
    const whyLines = doc.splitTextToSize(data.whyChooseUs.trim(), 174).slice(0, 3);
    const boxHeight = 12 + whyLines.length * lineHeight;
    if (y + boxHeight + 1 <= pageBottom) {
      drawCard(left, y, contentWidth, boxHeight, 2, true);
      y = drawCanonicalSectionTitle(doc, y, t.whyChooseUs);
      setStyleBody(doc);
      doc.text(whyLines, left + 4, y);
      y += whyLines.length * lineHeight + 1.5;
    }
  }

  // CTA 3 passos: banda fixa al peu (y=230..258). Es pinta sempre que cap a la 1a pàg.
  const isFirstAndOnlyPage = doc.internal.pages.length - 1 === 1;
  const footerZoneStart = 258;
  const ctaReservedTop = 230;  // CTA ocupa 230..258 (28mm)
  const canDrawCta = isFirstAndOnlyPage && y <= ctaReservedTop;

  // Omple l'espai entre el contingut i la banda del CTA
  if (isFirstAndOnlyPage && canDrawCta && y < ctaReservedTop - 14) {
    fillToFooter(doc, y, 'value', undefined, ctaReservedTop);
  } else if (isFirstAndOnlyPage && !canDrawCta && y < PDF_FILL_BOTTOM - 24) {
    fillToFooter(doc, y, 'contact');
  } else if (isFirstAndOnlyPage && !canDrawCta && y < PDF_FILL_BOTTOM - 8) {
    const anchorY = PDF_FILL_BOTTOM - 22;
    if (anchorY > y) fillToFooter(doc, anchorY, 'contact');
  }

  // ── Segell de validesa + CTA 3 passos ─────────────────────────────────────
  if (canDrawCta) {
    // Segell circular validesa
    const sealCx = left + contentWidth - 14;
    const sealCy = footerZoneStart - 12;
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.5);
    doc.circle(sealCx, sealCy, 12, 'FD');
    doc.setTextColor(...COLORS.gold);
    setStyleLabel(doc);
    doc.text(t.validSeal, sealCx, sealCy - 3, { align: 'center' });
    setStyleValue(doc);
    doc.setTextColor(...COLORS.gold);
    doc.text(`${validityDays}`, sealCx, sealCy + 3, { align: 'center' });
    setStyleCaption(doc);
    doc.text(t.validUntilSuffix, sealCx, sealCy + 7.5, { align: 'center' });

    // CTA 3 passos
    const steps = [
      { num: '1', label: 'Accepta el pressupost' },
      { num: '2', label: 'Reserva amb dipòsit' },
      { num: '3', label: 'El teu event assegurat' },
    ];
    const stepW = (contentWidth - 36) / 3;
    let sx = left + 4;
    for (let i = 0; i < steps.length; i++) {
      const scx = sx + stepW / 2;
      const scy = footerZoneStart - 10;
      // Cercle numerat
      doc.setFillColor(...COLORS.gold);
      doc.circle(scx, scy, 5, 'F');
      doc.setTextColor(...COLORS.blackSoft);
      setStyleValue(doc);
      doc.setTextColor(...COLORS.blackSoft);
      doc.text(steps[i].num, scx, scy + 2.5, { align: 'center' });
      // Connector
      if (i < steps.length - 1) {
        doc.setDrawColor(...COLORS.grayLight);
        doc.setLineWidth(0.3);
        doc.line(scx + 5, scy, scx + stepW + 5, scy);
      }
      // Label
      setStyleCaption(doc);
      const labelLines = doc.splitTextToSize(steps[i].label, stepW - 2);
      doc.text(labelLines.slice(0, 2), scx, scy + 9, { align: 'center' });
      sx += stepW + 12;
    }
  }

  // Footers
  const totalPages = doc.internal.pages.length - 1;
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    const website = normalizeWebsite(branding?.website?.trim() || SITE_CONFIG.web.url);
    drawCanonicalPdfFooter(doc, pageNum, totalPages, website);
  }
  return doc;
}

// ============================================
// CONTRACT PDF (dark theme, mateixa estètica que QuotePDF)
// ============================================

export interface ContractPdfData {
  contractReference: string;
  contractDate: PdfDateInput;

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
  eventDate: PdfDateInput;
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
  depositDueDate: PdfDateInput;
  finalPaymentDue: PdfDateInput;

  // Clàusules
  cancellationPolicy: string;
  additionalClauses?: string;

  // Signatura digital
  signedBy?: string;
  signedAt?: Date | null;
  signatureBlob?: string;
  signatureIp?: string | null;
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
      signedInline: 'Signat digitalment',
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
      signName: 'Nom i cognoms',
      sign: 'Firma',
      signedInline: 'Firmado digitalmente',
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
      signedInline: 'Digitally signed',
    },
  }[locale];

  // Dark theme colors (same as quote PDF)
  const neutral     = COLORS.paperText;
  const muted       = COLORS.paperMuted;
  const border      = COLORS.grayLight;
  const surface     = COLORS.white;
  const surfaceSoft = COLORS.surfaceWarm;
  const accent      = COLORS.gold;

  const left = PDF_DESIGN.left;
  const contentWidth = PDF_DESIGN.width;
  const pageBottom = PDF_DESIGN.contentBottom;
  const lineHeight = 5;
  let y = 16;

  // Resol la clau i18n del nom del pack si cal
  const resolvedPackName = resolvePackI18nKey(data.packName, locale) || data.packName;

  const fmtDate = (d: PdfDateInput) => formatPdfDateInput(d, locale);

  // -- Helpers --
  const drawCard = (
    x: number, top: number, width: number, height: number, rounded = 2, soft = false
  ) => {
    doc.setFillColor(...(soft ? surfaceSoft : surface));
    doc.roundedRect(x, top, width, height, rounded, rounded, 'F');
    doc.setDrawColor(...border);
    doc.roundedRect(x, top, width, height, rounded, rounded, 'S');
    doc.setFillColor(...accent);
    doc.roundedRect(x, top + 1.5, 1.2, Math.max(2, height - 3), 0.6, 0.6, 'F');
  };

  const drawSectionTitle = (title: string) => {
    y = drawCanonicalSectionTitle(doc, y - 2, title);
  };

  /** Mesura quantes unitats y ocupa una fila (sense dibuixar res). */
  const measureRow = (value: string): number =>
    lineHeight * doc.splitTextToSize(value, 120).slice(0, 2).length;

  const drawRow = (label: string, value: string, bold = false) => {
    setStyleMuted(doc);
    doc.text(label, left + 6, y);
    if (bold) { setStyleValue(doc); } else { setStyleBody(doc); }
    const lines = doc.splitTextToSize(value, 120).slice(0, 2);
    doc.text(lines, left + 55, y);
    y += lineHeight * lines.length;
  };

  /**
   * Calcula l'alçada total d'una llista de valors (les que es posaran a drawRow).
   * Inclou el títol de secció (13mm) i padding (8mm top+bottom).
   */
  const calcSectionHeight = (values: string[], hasSectionTitle = true): number => {
    const rowsH = values.reduce((acc, v) => acc + measureRow(v), 0);
    return (hasSectionTitle ? 13 : 0) + rowsH + 8;
  };

  const ensureSpace = (space: number) => {
    if (y + space > pageBottom) {
      doc.addPage();
      doc.setFillColor(...COLORS.paperBg);
      doc.rect(0, 0, 210, 297, 'F');
      drawCompactHeader();
    }
  };

  const drawCompactHeader = () => {
    y = drawCanonicalPdfHeader(doc, {
      title: t.title,
      subtitle: 'Prestació de serveis',
      ref: data.contractReference,
      logoDataUrl: branding?.logoDataUrl,
    });
  };

  // Fons paper càlid
  doc.setFillColor(...COLORS.paperBg);
  doc.rect(0, 0, 210, 297, 'F');

  y = drawCanonicalPdfHeader(doc, {
    title: t.title,
    subtitle: 'Prestació de serveis',
    ref: `${data.contractReference} · ${fmtDate(data.contractDate)}`,
    logoDataUrl: branding?.logoDataUrl,
  });

  // -- Parts --
  ensureSpace(55);
  // Parts: 2 contenidors separats costat a costat
  const partColW = (contentWidth - PDF_DESIGN.columnGap) / 2;
  const rightColX = left + partColW + PDF_DESIGN.columnGap;
  const partTextWidth = partColW - 8;
  const partLineHeight = 4.5;
  const measurePartyLines = (lines: string[]) => lines.flatMap((line) => doc.splitTextToSize(line, partTextWidth));
  const providerLines = measurePartyLines([
    data.companyLegalName,
    `${t.nif}: ${data.companyNIF}`,
    `${t.address}: ${data.companyAddress}`,
    `${t.email}: ${data.companyEmail}`,
  ]);
  const clientLines = measurePartyLines([
    data.clientName,
    ...(data.clientNIF ? [`${t.nif}: ${data.clientNIF}`] : []),
    ...(data.clientAddress ? [data.clientAddress] : []),
    `${t.email}: ${data.clientEmail}`,
    ...(data.clientPhone ? [`${t.phone}: ${data.clientPhone}`] : []),
  ]);
  const partCardHeight = 11 + Math.max(providerLines.length, clientLines.length) * partLineHeight;
  ensureSpace(partCardHeight + PDF_DESIGN.blockGap);

  // Contenidor Prestador
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.2);
  doc.roundedRect(left, y, partColW, partCardHeight, 2, 2, 'FD');
  setStyleLabel(doc);
  doc.text(t.provider.toUpperCase(), left + 4, y + 5);
  setStyleValue(doc);
  doc.text(providerLines[0], left + 4, y + 11);
  setStyleMuted(doc);
  doc.text(providerLines.slice(1), left + 4, y + 11 + partLineHeight);

  // Contenidor Client
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.2);
  doc.roundedRect(rightColX, y, partColW, partCardHeight, 2, 2, 'FD');
  setStyleLabel(doc);
  doc.text(t.client.toUpperCase(), rightColX + 4, y + 5);
  setStyleValue(doc);
  doc.text(clientLines[0], rightColX + 4, y + 11);
  setStyleMuted(doc);
  doc.text(clientLines.slice(1), rightColX + 4, y + 11 + partLineHeight);

  y += partCardHeight + PDF_DESIGN.blockGap;
  const sectionGap = PDF_DESIGN.blockGap;

  // -- Service Details (alçada dinàmica) --
  const serviceValues = [
    data.eventType,
    fmtDate(data.eventDate),
    ...(data.eventTime ? [`${data.eventTime}${data.eventEndTime ? ` - ${data.eventEndTime}` : ''}`] : []),
    data.eventLocation,
    `${data.guestCount}`,
    `${resolvedPackName} (${data.djHours}h)`,
    ...(data.extras?.map(e => `${e.name} — ${formatPdfMoney(e.price * e.quantity, locale)}`) || []),
  ];
  const serviceH = calcSectionHeight(serviceValues);
  ensureSpace(serviceH + sectionGap);
  drawCard(left, y - 4, contentWidth, serviceH, 2, false);
  drawSectionTitle(t.serviceDetails);
  drawRow(t.eventType, data.eventType);
  drawRow(t.eventDate, fmtDate(data.eventDate));
  if (data.eventTime) drawRow(t.eventTime, `${data.eventTime}${data.eventEndTime ? ` - ${data.eventEndTime}` : ''}`);
  drawRow(t.location, data.eventLocation);
  drawRow(t.guests, `${data.guestCount}`);
  drawRow(t.pack, `${resolvedPackName} (${data.djHours}h)`, true);
  if (data.extras && data.extras.length > 0) {
    for (const extra of data.extras) {
      drawRow(t.extras, `${extra.name} — ${formatPdfMoney(extra.price * extra.quantity, locale)}`);
    }
  }
  y += sectionGap;

  // -- Economic Summary (alçada dinàmica) --
  const econValues = [
    formatPdfMoney(data.subtotal, locale),
    ...(data.discount > 0 ? [`-${formatPdfMoney(data.discount, locale)}`] : []),
    formatPdfMoney(data.vatAmount, locale),
    formatPdfMoney(data.total, locale), // fila TOTAL
  ];
  const econH = calcSectionHeight(econValues);
  ensureSpace(econH + sectionGap);
  drawCard(left, y - 4, contentWidth, econH, 2, true);
  drawSectionTitle(t.economicSummary);
  drawRow(t.subtotal, formatPdfMoney(data.subtotal, locale));
  if (data.discount > 0) drawRow(t.discount, `-${formatPdfMoney(data.discount, locale)}`);
  drawRow(`${t.vat} (${data.vatRate}%)`, formatPdfMoney(data.vatAmount, locale));
  doc.setTextColor(...neutral);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_DESIGN.type.section);
  doc.text(t.total, left + 6, y + 2);
  doc.text(formatPdfMoney(data.total, locale), left + contentWidth - 6, y + 2, { align: 'right' });
  y += 10;
  y += sectionGap;

  // -- Payment Terms (alçada dinàmica) --
  const payValues = [
    formatPdfMoney(data.depositAmount, locale),
    fmtDate(data.depositDueDate),
    formatPdfMoney(data.total - data.depositAmount, locale),
    fmtDate(data.finalPaymentDue),
    data.companyIBAN,
  ];
  const payH = calcSectionHeight(payValues);
  ensureSpace(payH + sectionGap);
  drawCard(left, y - 4, contentWidth, payH, 2, false);
  drawSectionTitle(t.paymentTerms);
  drawRow(t.deposit, formatPdfMoney(data.depositAmount, locale));
  drawRow(t.depositDue, fmtDate(data.depositDueDate));
  drawRow(t.remaining, formatPdfMoney(data.total - data.depositAmount, locale));
  drawRow(t.remainingDue, fmtDate(data.finalPaymentDue));
  drawRow(t.iban, data.companyIBAN, true);
  y += sectionGap;

  // -- Cancellation Policy (alçada dinàmica) --
  const cancelLines = doc.splitTextToSize(data.cancellationPolicy, contentWidth - 12).slice(0, 8);
  const cancelH = 13 + cancelLines.length * 4.2 + 8;
  ensureSpace(cancelH + sectionGap);
  drawCard(left, y - 4, contentWidth, cancelH, 2, false);
  drawSectionTitle(t.cancellation);
  setStyleBody(doc);
  doc.text(cancelLines, left + 6, y);
  y += cancelLines.length * 4.2 + sectionGap;

  // -- Additional Clauses (alçada dinàmica) --
  if (data.additionalClauses?.trim()) {
    const addLines = doc.splitTextToSize(data.additionalClauses.trim(), contentWidth - 12).slice(0, 8);
    const addH = 13 + addLines.length * 4.2 + 8;
    ensureSpace(addH + sectionGap);
    drawCard(left, y - 4, contentWidth, addH, 2, false);
    drawSectionTitle(t.additionalClauses);
    setStyleBody(doc);
    doc.text(addLines, left + 6, y);
    y += addLines.length * 4.2 + sectionGap;
  }

  // -- Legal Clauses (alçada dinàmica) --
  const legalTexts = [t.legalText1, t.legalText2, t.legalText3, t.legalText4, t.legalText5];
  const allLegalLines = legalTexts.flatMap(txt => doc.splitTextToSize(`• ${txt}`, contentWidth - 12).slice(0, 2));
  const legalH = 13 + allLegalLines.length * 3.8 + 8;
  ensureSpace(legalH + sectionGap);
  drawCard(left, y - 4, contentWidth, legalH, 2, false);
  drawSectionTitle(t.legalClauses);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_DESIGN.type.small);
  doc.setTextColor(...neutral);
  let legalY = y;
  for (const txt of legalTexts) {
    if (legalY + 5 > pageBottom) { ensureSpace(20); legalY = y; }
    const lines = doc.splitTextToSize(`• ${txt}`, contentWidth - 12).slice(0, 2);
    doc.text(lines, left + 6, legalY);
    legalY += lines.length * 3.8;
  }
  y = legalY + 6;

  // -- Signatures --
  const hasClientSignature = Boolean(data.signedBy || data.signedAt || data.signatureBlob);
  const sigColWidth = (contentWidth - 8) / 2;
  const signatureBoxHeight = 40;

  // Ancora signatures al peu si hi ha espai suficient
  const sigAnchorY = PDF_FILL_BOTTOM - signatureBoxHeight - PDF_DESIGN.sectionGap * 2;
  if (doc.internal.pages.length - 1 === 1 && sigAnchorY > y + PDF_DESIGN.sectionGap * 3) {
    y = sigAnchorY;
  } else {
    y += PDF_DESIGN.blockGap;
    ensureSpace(signatureBoxHeight + PDF_DESIGN.sectionGap * 2);
  }

  y = drawCanonicalSectionTitle(doc, y, t.signatures);

  // Zona prestador
  const providerBoxY = y;
  const providerX = left;
  const clientX = left + sigColWidth + 8;

  [
    { x: providerX, label: t.signProvider, name: data.companyLegalName },
    { x: clientX, label: t.signClient, name: data.signedBy || '' },
  ].forEach(({ x, label, name }) => {
    doc.setFillColor(...COLORS.surfaceWarm);
    doc.roundedRect(x, providerBoxY, sigColWidth, signatureBoxHeight, 2, 2, 'F');
    doc.setDrawColor(...COLORS.grayLight);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, providerBoxY, sigColWidth, signatureBoxHeight, 2, 2, 'S');
    // Línia de signatura
    const lineY = providerBoxY + 18;
    doc.setDrawColor(...COLORS.paperText);
    doc.setLineWidth(0.4);
    doc.line(x + 5, lineY, x + sigColWidth - 5, lineY);
    // Label
    setStyleCaption(doc);
    doc.text(label, x + 5, lineY + 5);
    // Nom
    setStyleValue(doc);
    doc.text(name || '____________________', x + 5, lineY + 11);
    // Data
    setStyleCaption(doc);
    doc.text(`${t.signDate}: ____________________`, x + 5, lineY + 17);
  });

  // Imatge de signatura del client
  if (data.signatureBlob && isDataUrl(data.signatureBlob)) {
    try {
      const fmt = getImageFormatFromDataUrl(data.signatureBlob);
      const props = doc.getImageProperties(data.signatureBlob);
      const fitted = fitWithin(props.width, props.height, sigColWidth - 14, 12);
      doc.addImage(data.signatureBlob, fmt, clientX + 5, providerBoxY + 2, fitted.width, fitted.height);
    } catch {
      setStyleMuted(doc);
      doc.setFont('helvetica', 'italic');
      doc.text(hasClientSignature ? t.signedInline : '', clientX + 5, providerBoxY + 10);
    }
  }

  y = providerBoxY + signatureBoxHeight + 6;

  // -- Footer on all pages --
  const totalPages = doc.internal.pages.length - 1;
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    const website = normalizeWebsite(branding?.website?.trim() || SITE_CONFIG.web.url);
    drawCanonicalPdfFooter(doc, pageNum, totalPages, website);
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
