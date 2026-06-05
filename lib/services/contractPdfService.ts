/**
 * Servei de generació de PDF de contracte.
 * Exporta: ContractPdfData interface + generateContractPDF
 */

import { resolvePackI18nKey } from '@/lib/pack-i18n';
import {
  PDF_DESIGN, PDF_FILL_BOTTOM,
  drawCanonicalPdfHeader, drawCanonicalSectionTitle,
  setStyleLabel, setStyleValue, setStyleBody, setStyleMuted, setStyleCaption,
  drawAllPageFooters,
} from '@/lib/pdf-header';
import {
  type jsPDFType, type PdfBrandingOptions,
  COLORS,
  formatPdfMoney,
  isDataUrl, getImageFormatFromDataUrl, fitWithin,
} from '@/lib/pdf-config';
import { getJsPDF, type PdfDateInput, formatPdfDateInput } from '@/lib/utils/pdfHelpers';

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
      title: 'CONTRACTE DE SERVEIS',
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
      title: 'CONTRATO DE SERVICIOS',
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
    // Cos ivori + vora gris subtil
    doc.setFillColor(...COLORS.paperBg);
    doc.setDrawColor(...COLORS.grayLight);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, providerBoxY, sigColWidth, signatureBoxHeight, 2.5, 2.5, 'FD');
    // Barra d'accent lateral esquerra
    doc.setFillColor(...COLORS.gold);
    doc.roundedRect(x, providerBoxY, 1.2, signatureBoxHeight, 0.5, 0.5, 'F');
    // Label rol (eyebrow)
    doc.setTextColor(...COLORS.textMuted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_DESIGN.type.caption);
    doc.text(label.toUpperCase(), x + 6, providerBoxY + 7);
    // Nom
    setStyleValue(doc);
    doc.setTextColor(...COLORS.paperText);
    doc.text(name || '—', x + 6, providerBoxY + 13);
    // Línia de signatura
    const lineY = providerBoxY + 22;
    doc.setDrawColor(...COLORS.grayLight);
    doc.setLineWidth(0.4);
    doc.line(x + 6, lineY, x + sigColWidth - 6, lineY);
    setStyleCaption(doc);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`${t.signDate}: ____________________`, x + 6, lineY + 5);
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

  drawAllPageFooters(doc, y);
  return doc;
}
