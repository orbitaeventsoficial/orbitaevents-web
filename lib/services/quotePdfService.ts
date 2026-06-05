/**
 * Servei de generació de PDF de pressupost.
 * Exporta: QuoteData interface + generateQuotePDF
 */

import { EXTRAS, type ExtraDefinition, type ServiceSlug, type PackDefinition } from '@/app/config/packs-config';
import { resolvePackI18nKey, resolvePackI18nFeatures } from '@/lib/pack-i18n';
import { toIntlLocale, PDF_FILL_CONTACT_LABEL } from '@/lib/constants';
import {
  PDF_DESIGN, PDF_BODY_SIZE, PDF_FILL_BOTTOM,
  drawCanonicalPdfHeader, drawCanonicalSectionTitle,
  setStyleLabel, setStyleValue, setStyleBody, setStyleMuted, setStyleCaption, setStylePrice,
  fillToFooter, drawAllPageFooters,
} from '@/lib/pdf-header';
import {
  type jsPDFType, type PdfBrandingOptions,
  COLORS, PAGE, SERVICE_NAMES,
  formatClientDate, formatPdfMoney,
} from '@/lib/pdf-config';
import { getJsPDF } from '@/lib/utils/pdfHelpers';

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
      ctaStep1: 'Accepta el pressupost',
      ctaStep2: 'Reserva amb dipòsit',
      ctaStep3: 'El teu event assegurat',
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
      ctaStep1: 'Acepta el presupuesto',
      ctaStep2: 'Reserva con señal',
      ctaStep3: 'Tu evento asegurado',
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
      ctaStep1: 'Accept the quote',
      ctaStep2: 'Reserve with deposit',
      ctaStep3: 'Your event secured',
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
      { num: '1', label: t.ctaStep1 },
      { num: '2', label: t.ctaStep2 },
      { num: '3', label: t.ctaStep3 },
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

  // Footer canònic (contacte + línia daurada)
  // Quan hi ha CTA el contingut ja arriba fins a footerZoneStart=258, drawAllPageFooters gestiona l'espai restant
  drawAllPageFooters(doc, canDrawCta ? footerZoneStart : y, canDrawCta ? undefined : PDF_FILL_CONTACT_LABEL);
  return doc;
}
