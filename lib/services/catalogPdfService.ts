/**
 * Servei de generació de PDF de catàleg de serveis (brochure).
 * Exporta: generateServiceBrochure
 */

import { getPacksByService, EXTRAS, type ServiceSlug } from '@/app/config/packs-config';
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
    const isPremium = pack.highlight || pack.badge === 'Premium';

    // Cos de la targeta: fons ivori + vora or si popular
    doc.setFillColor(...COLORS.paperBg);
    doc.setDrawColor(...(isPopular ? COLORS.gold : COLORS.grayLight));
    doc.setLineWidth(isPopular ? 0.6 : 0.25);
    doc.roundedRect(px, py, packCardW, packCardHeight, 2.5, 2.5, 'FD');

    // Header negre de la targeta — més alt perquè nom i preu respirin
    const cardHeaderH = 14;
    doc.setFillColor(...COLORS.canvas);
    doc.roundedRect(px, py, packCardW, cardHeaderH, 2.5, 2.5, 'F');
    doc.setFillColor(...COLORS.canvas);
    doc.rect(px, py + cardHeaderH / 2, packCardW, cardHeaderH / 2, 'F');

    // Nom pack al header negre
    doc.setTextColor(...COLORS.gold);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_DESIGN.type.body);
    const packNameLines = doc.splitTextToSize(pack.name, packCardW - 28).slice(0, 1);
    doc.text(packNameLines, px + 5, py + 9);

    // "des de" + preu junts al header, alineats a la dreta
    setStyleCaption(doc);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(t.from, px + packCardW - 4, py + 5, { align: 'right' });
    setStylePrice(doc);
    doc.setTextColor(...COLORS.white);
    doc.text(formatPdfMoney(pack.priceValue, locale), px + packCardW - 4, py + 11.5, { align: 'right' });

    // Badge popular — punt or a la cantonada superior dreta (sobre el header)
    if (isPopular) {
      doc.setFillColor(...COLORS.gold);
      doc.circle(px + packCardW - 3, py + 3, 2, 'F');
    }

    // Durada sota el header
    const bodyTop = py + cardHeaderH + 4;
    setStyleCaption(doc);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`${pack.durationHours} ${t.hours}`, px + 5, bodyTop);

    // Features amb check circular
    const featureStart = bodyTop + 5;
    const maxF = packGrid ? 3 : 3;
    const featTextW = packCardW - 14;
    pack.features.slice(0, maxF).forEach((feature, i) => {
      const cleanFeature = feature.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      const fy = featureStart + i * 5.5;
      // Check circular
      doc.setFillColor(...COLORS.gold);
      doc.circle(px + 6, fy - 1.2, 1.2, 'F');
      doc.setFillColor(...COLORS.canvas);
      doc.setLineWidth(0.5);
      doc.line(px + 4.8, fy - 1.2, px + 5.6, fy - 0.4);
      doc.line(px + 5.6, fy - 0.4, px + 7.2, fy - 2.2);
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

  // Omple amb value items si hi ha espai
  if (y < PDF_FILL_BOTTOM - 28) {
    y = fillToFooter(doc, y, 'value');
  }

  drawAllPageFooters(doc, y, PDF_FILL_CONTACT_LABEL);
  return doc;
}
