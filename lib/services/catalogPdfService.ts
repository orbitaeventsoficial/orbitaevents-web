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
    // setStyleValue equivalent inline (no exported from pdf-header)
    doc.setTextColor(...COLORS.paperText);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_DESIGN.type.body);
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

  // Omple amb value items si hi ha espai
  if (y < PDF_FILL_BOTTOM - 28) {
    y = fillToFooter(doc, y, 'value');
  }

  drawAllPageFooters(doc, y, PDF_FILL_CONTACT_LABEL);
  return doc;
}
