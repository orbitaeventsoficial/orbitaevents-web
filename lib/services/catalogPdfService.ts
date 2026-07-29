/**
 * Servei de generació de PDF de catàleg de serveis (brochure).
 * Exporta: generateServiceBrochure, generateFullCatalogPDF
 */

import { getPacksByService, EXTRAS, ALL_SERVICES, type ServiceSlug } from '@/app/config/packs-config';
import { resolvePackI18nKey, resolvePackI18nFeatures } from '@/lib/pack-i18n';
import { filterCompatibleExtras } from '@/lib/extrasCompatibility';
import { PDF_FILL_CONTACT_LABEL } from '@/lib/constants';
import {
  PDF_DESIGN, PDF_FILL_BOTTOM,
  drawCanonicalPdfHeader, drawCanonicalSectionTitle,
  setStyleBody, setStyleMuted, setStyleCaption, setStylePrice,
  fillToFooter, drawAllPageFooters,
} from '@/lib/pdf-header';
import {
  type jsPDFType,
  COLORS, PAGE, SERVICE_NAMES,
  formatPdfMoney,
} from '@/lib/pdf-config';
import { getJsPDF, checkPageBreak } from '@/lib/utils/pdfHelpers';

import type { Locale as SupportedLocale } from '@/i18n';
export type { SupportedLocale };

interface CatalogTranslations {
  brochure: string;
  ourPacks: string;
  hours: string;
  popular: string;
  extras: string;
  from: string;
  contactText: string;
}

function getCatalogTranslations(locale: SupportedLocale): CatalogTranslations {
  return {
    ca: { brochure: 'Catàleg de Serveis', ourPacks: 'Els Nostres Packs', hours: 'hores', popular: 'MÉS POPULAR', extras: 'Extres Disponibles', from: 'des de', contactText: 'Quan tingueu clara la direcció, ajustem proposta, data i detalls.' },
    es: { brochure: 'Catálogo de Servicios', ourPacks: 'Nuestros Packs', hours: 'horas', popular: 'MÁS POPULAR', extras: 'Extras Disponibles', from: 'desde', contactText: 'Cuando tengáis clara la dirección, ajustamos propuesta, fecha y detalles.' },
    en: { brochure: 'Service Catalog', ourPacks: 'Our Packages', hours: 'hours', popular: 'MOST POPULAR', extras: 'Available Extras', from: 'from', contactText: 'When the direction is clear, we tailor the proposal, date, and details.' },
  }[locale];
}

// Dibuixa el contingut d'un servei (packs + extres) sobre el doc actual.
// Retorna la posició y final.
function drawServiceBrochureContent(
  doc: jsPDFType,
  service: ServiceSlug,
  locale: SupportedLocale,
  startY: number,
  t: CatalogTranslations,
): number {
  const packs = getPacksByService(service).map(p => ({
    ...p,
    name: resolvePackI18nKey(p.name, locale) || p.name,
    features: resolvePackI18nFeatures(p.features, locale),
  }));
  const serviceName = SERVICE_NAMES[service][locale];

  // ── Hero ──────────────────────────────────────────────────────────────────
  doc.setTextColor(...COLORS.paperText);
  doc.setFontSize(PDF_DESIGN.type.display);
  doc.setFont('helvetica', 'bold');
  doc.text(serviceName, PDF_DESIGN.left, startY + 12);
  doc.setFillColor(...COLORS.gold);
  doc.rect(PDF_DESIGN.left, startY + 15, 28, 0.8, 'F');
  setStyleMuted(doc);
  doc.setFont('helvetica', 'italic');
  doc.text(t.contactText, PDF_DESIGN.left, startY + 23);
  let y = startY + 32;
  y = drawCanonicalSectionTitle(doc, y, t.ourPacks);

  // ── Targetes de pack ───────────────────────────────────────────────────────
  const packGrid = packs.length <= 4;
  const packCols = packGrid ? packs.length : 1;
  const packGap = 4;
  const packCardW = packGrid
    ? (PDF_DESIGN.width - packGap * (packCols - 1)) / packCols
    : PDF_DESIGN.width;
  const packCardHeight = packGrid ? 52 : 43;
  const gridRowH = packCardHeight + packGap;
  const gridRows = Math.ceil(packs.length / packCols);

  y = checkPageBreak(doc, y, gridRows * gridRowH + 4, `${t.brochure} · ${serviceName}`);

  packs.forEach((pack, idx) => {
    const col = packGrid ? idx % packCols : 0;
    const row = packGrid ? Math.floor(idx / packCols) : idx;
    const px = PDF_DESIGN.left + col * (packCardW + packGap);
    const py = y + row * gridRowH;

    const isPopular = pack.popular;

    doc.setFillColor(...COLORS.paperBg);
    doc.setDrawColor(...(isPopular ? COLORS.gold : COLORS.grayLight));
    doc.setLineWidth(isPopular ? 0.6 : 0.25);
    doc.roundedRect(px, py, packCardW, packCardHeight, 2.5, 2.5, 'FD');

    const cardHeaderH = 14;
    doc.setFillColor(...COLORS.canvas);
    doc.roundedRect(px, py, packCardW, cardHeaderH, 2.5, 2.5, 'F');
    doc.setFillColor(...COLORS.canvas);
    doc.rect(px, py + cardHeaderH / 2, packCardW, cardHeaderH / 2, 'F');

    doc.setTextColor(...COLORS.gold);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_DESIGN.type.body);
    const packNameLines = doc.splitTextToSize(pack.name, packCardW - 32).slice(0, 1);
    doc.text(packNameLines, px + 5, py + 7.5);

    setStyleCaption(doc);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(t.from, px + packCardW - 4, py + 5, { align: 'right' });
    setStylePrice(doc);
    doc.setTextColor(...COLORS.white);
    doc.text(formatPdfMoney(pack.priceValue, locale), px + packCardW - 4, py + 11.5, { align: 'right' });

    // Badge popular — a sota el nom, a l'esquerra (no competeix amb el preu)
    if (isPopular) {
      const badgeW = 21;
      doc.setFillColor(...COLORS.gold);
      doc.roundedRect(px + 5, py + 9.5, badgeW, 3.6, 1, 1, 'F');
      doc.setTextColor(...COLORS.blackSoft);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(PDF_DESIGN.type.caption - 0.5);
      doc.text(t.popular, px + 5 + badgeW / 2, py + 12, { align: 'center' });
    }

    const bodyTop = py + cardHeaderH + 4;
    setStyleCaption(doc);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`${pack.durationHours} ${t.hours}`, px + 5, bodyTop);

    const featureStart = bodyTop + 5;
    const featTextW = packCardW - 14;
    pack.features.slice(0, 3).forEach((feature, i) => {
      const cleanFeature = feature.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      const fy = featureStart + i * 5.5;
      doc.setFillColor(...COLORS.gold);
      doc.circle(px + 5.5, fy - 1.2, 1.0, 'F');
      setStyleBody(doc);
      doc.setTextColor(...COLORS.paperText);
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

  // ── Extres ────────────────────────────────────────────────────────────────
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

  return y;
}

// Catàleg d'un sol servei (ús en pressupostos i envios reals al client).
export async function generateServiceBrochure(
  service: ServiceSlug,
  locale: SupportedLocale = 'ca'
): Promise<jsPDFType> {
  const { default: jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  const t = getCatalogTranslations(locale);
  const serviceName = SERVICE_NAMES[service][locale];

  doc.setFillColor(...COLORS.paperBg);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');
  let y = drawCanonicalPdfHeader(doc, {
    title: t.brochure,
    subtitle: serviceName,
    ref: `SRV-${service.toUpperCase()}`,
  });

  y = drawServiceBrochureContent(doc, service, locale, y, t);
  if (y < PDF_FILL_BOTTOM - 28) y = fillToFooter(doc, y, 'value');
  drawAllPageFooters(doc, y, PDF_FILL_CONTACT_LABEL);
  return doc;
}

export function appendCatalogServicesToPdf(
  doc: jsPDFType,
  services: ServiceSlug[] = ALL_SERVICES,
  locale: SupportedLocale = 'ca',
  options: { startOnNewPage?: boolean; drawFooters?: boolean } = {},
): number {
  const t = getCatalogTranslations(locale);
  let lastY = 0;

  services.forEach((service, index) => {
    if (options.startOnNewPage || index > 0) doc.addPage();
    const serviceName = SERVICE_NAMES[service][locale];

    doc.setFillColor(...COLORS.paperBg);
    doc.rect(0, 0, PAGE.width, PAGE.height, 'F');
    let y = drawCanonicalPdfHeader(doc, {
      title: t.brochure,
      subtitle: serviceName,
      ref: `SRV-${service.toUpperCase()}`,
    });

    y = drawServiceBrochureContent(doc, service, locale, y, t);
    if (y < PDF_FILL_BOTTOM - 28) y = fillToFooter(doc, y, 'value');
    lastY = y;
  });

  if (options.drawFooters ?? true) {
    drawAllPageFooters(doc, lastY, PDF_FILL_CONTACT_LABEL);
  }

  return lastY;
}

// Catàleg complet amb tots els serveis (ús al visor Studio i preview).
// Cada servei ocupa la seva pàgina. El bloc de contacte tanca l'últim servei.
export async function generateFullCatalogPDF(
  services: ServiceSlug[] = ALL_SERVICES,
  locale: SupportedLocale = 'ca'
): Promise<jsPDFType> {
  const { default: jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  appendCatalogServicesToPdf(doc, services, locale, { drawFooters: true });
  return doc;
}
