import { PDF_HEADER_LAYOUT } from '@/lib/constants/pdfDocuments';
import { PDF_VALUE_ITEMS, PDF_FILL_CONTACT_LABEL } from '@/lib/constants';
import { ORBITA_LOGO_LOCKUP_LIGHT_BASE64 } from '@/lib/logo-lockup-light-base64';
import { SITE_CONFIG } from '@/app/config/site-config';
import {
  COLORS,
  PAGE,
  PDF_CHART_COLORS,
  fitWithin,
  getImageFormatFromDataUrl,
  normalizeWebsite,
  type jsPDFType,
} from '@/lib/pdf-config';

type CanonicalPdfHeaderOptions = {
  title: string;
  subtitle?: string;
  ref?: string;
  metaLines?: string[];
  logoDataUrl?: string;
};

export const PDF_DESIGN = {
  pageWidth: 210,
  pageHeight: 297,
  left: 18,
  right: 192,
  width: 174,
  contentTop: 46,
  contentBottom: 274,
  cardRadius: 1.5,
  sectionGap: 7,
  /** Separació estàndard entre contenidors/seccions */
  blockGap: 6,
  columnGap: 8,
  type: {
    display: 23,
    title: 13,
    section: 9,
    body: 8.5,
    small: 7.25,
    caption: 6.25,
    money: 16,
  },
} as const;

// Paleta de gràfiques — càlida, harmònica amb la marca
export const CHART_COLORS: Array<[number, number, number]> = [
  ...PDF_CHART_COLORS,
];

export function drawCanonicalPdfHeader(
  doc: jsPDFType,
  { title, subtitle, ref, metaLines = [], logoDataUrl }: CanonicalPdfHeaderOptions,
): number {
  const layout = PDF_HEADER_LAYOUT.canonical;
  const logoSource = logoDataUrl || ORBITA_LOGO_LOCKUP_LIGHT_BASE64;

  // Franja obsidiana canònica
  doc.setFillColor(...COLORS.canvas);
  doc.rect(0, 0, PAGE.width, layout.height, 'F');

  // Hairline de marca al peu de la capçalera
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, layout.height - 0.55, PAGE.width, 0.55, 'F');

  // Logo lockup (versió light dissenyada per a fons fosc)
  try {
    const format = getImageFormatFromDataUrl(logoSource);
    const properties = doc.getImageProperties(logoSource);
    const fitted = fitWithin(properties.width, properties.height, layout.logoWidth, layout.logoHeight);
    doc.addImage(logoSource, format, PDF_DESIGN.left, layout.logoTop, fitted.width, fitted.height);
  } catch {
    // Fallback tipogràfic
    doc.setTextColor(...COLORS.gold);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ÒRBITA', PDF_DESIGN.left, layout.logoTop + 7);
    doc.setTextColor(...COLORS.textPrimary);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('EVENTS', PDF_DESIGN.left, layout.logoTop + 13);
  }

  // Web discret sota el lockup; la resta de contacte viu al footer.
  const contactWeb = normalizeWebsite(SITE_CONFIG.web.url);
  doc.setTextColor(...COLORS.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.text(contactWeb, PDF_DESIGN.left, layout.brandMetaY);

  const titleWidth = layout.contentRight - layout.contentX;
  const displaySubtitle = subtitle || metaLines[0] || '';
  const displayRef = ref || metaLines[1] || '';

  // Eyebrow: identifica el context sense competir amb el títol
  if (displaySubtitle) {
    doc.setTextColor(...COLORS.gold);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(displaySubtitle.toUpperCase(), layout.contentX, layout.eyebrowY, { charSpace: 0.45 });
  }

  // Títol principal alineat a l'esquerra, amb auto-shrink per a noms llargs
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(layout.titleMaxSize);
  const titleText = title.trim();
  const titleW = doc.getTextWidth(titleText);
  if (titleW > titleWidth) {
    doc.setFontSize(Math.max(layout.titleMinSize, Math.floor(layout.titleMaxSize * titleWidth / titleW)));
  }
  doc.text(titleText, layout.contentX, layout.titleY);

  // Referència / data en una sola línia calmada
  if (displayRef) {
    doc.setTextColor(...COLORS.textSecondary);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(displayRef, layout.contentX, layout.refY);
  }

  return layout.contentStartY;
}

export function drawCanonicalPdfFooter(
  doc: jsPDFType,
  page: number,
  total: number,
  leftText = normalizeWebsite(SITE_CONFIG.web.url),
  centerText = '',
): void {
  const y = 282;
  // Franja paper càlida
  doc.setFillColor(...COLORS.paperBg);
  doc.rect(0, y - 1, PAGE.width, 16, 'F');
  // Hairline or
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.35);
  doc.line(PDF_DESIGN.left, y, PDF_DESIGN.right, y);
  // Textos
  doc.setTextColor(...COLORS.paperMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_DESIGN.type.caption);
  doc.text(leftText, PDF_DESIGN.left, y + 7);
  if (centerText) {
    doc.text(centerText, PAGE.width / 2, y + 7, { align: 'center' });
  }
  doc.text(`${page} / ${total}`, PDF_DESIGN.right, y + 7, { align: 'right' });
}

export function drawCanonicalSectionTitle(doc: jsPDFType, y: number, title: string): number {
  // Eyebrow or: text daurat uppercase amb tracking, sense quadret lateral
  doc.setTextColor(...COLORS.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_DESIGN.type.section);
  doc.text(title.toUpperCase(), PDF_DESIGN.left + 4, y + 5.8, { charSpace: 0.4 });
  // Hairline or breu sota el text
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.4);
  doc.line(PDF_DESIGN.left + 4, y + 8.5, PDF_DESIGN.left + 22, y + 8.5);
  return y + 13;
}

export function paintCanonicalPdfPage(doc: jsPDFType): void {
  doc.setFillColor(...COLORS.paperBg);
  doc.rect(0, 0, PDF_DESIGN.pageWidth, PDF_DESIGN.pageHeight, 'F');
}

export function drawCanonicalCard(
  doc: jsPDFType,
  x: number,
  y: number,
  width: number,
  height: number,
  emphasized = false,
): void {
  doc.setFillColor(...(emphasized ? COLORS.white : COLORS.paperBg));
  doc.setDrawColor(...(emphasized ? COLORS.gold : COLORS.grayLight));
  doc.setLineWidth(emphasized ? 0.45 : 0.25);
  doc.roundedRect(x, y, width, height, PDF_DESIGN.cardRadius, PDF_DESIGN.cardRadius, 'FD');
}

export function drawCanonicalLabel(doc: jsPDFType, text: string, x: number, y: number): void {
  doc.setTextColor(...COLORS.paperMuted);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_DESIGN.type.caption);
  doc.text(text.toUpperCase(), x, y);
}

// ── Mida de text unificada per a tots els PDFs ─────────────────────────────
// Cos de text: 8.5pt per a TOT el contingut, sense variació entre documents.
export const PDF_BODY_SIZE = 8.5;
export const PDF_FILL_BOTTOM = 262;

export function setStyleLabel(doc: jsPDFType): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_DESIGN.type.caption);
  doc.setTextColor(...COLORS.paperMuted);
}
export function setStyleValue(doc: jsPDFType): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_BODY_SIZE);
  doc.setTextColor(...COLORS.paperText);
}
export function setStyleBody(doc: jsPDFType): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_BODY_SIZE);
  doc.setTextColor(...COLORS.paperText);
}
export function setStyleMuted(doc: jsPDFType): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_BODY_SIZE);
  doc.setTextColor(...COLORS.paperMuted);
}
export function setStylePrice(doc: jsPDFType): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_DESIGN.type.money);
  doc.setTextColor(...COLORS.paperText);
}
export function setStyleCaption(doc: jsPDFType): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.paperMuted);
}

// ── Contenidor responsiu ───────────────────────────────────────────────────

// ── Farciment de pàgina ────────────────────────────────────────────────────

/** Delta de gap addicional per repartir l'espai sobrant entre N gaps. */
export function spacingDelta(currentY: number, gapCount: number): number {
  if (gapCount <= 0) return 0;
  const remaining = PDF_FILL_BOTTOM - currentY;
  return remaining > 8 ? Math.min(remaining / gapCount, 12) : 0;
}

/**
 * Afegeix un bloc de proposta de valor o contacte per omplir la pàgina fins a PDF_FILL_BOTTOM.
 * Només actua si hi ha ≥ 14mm d'espai sobrant.
 */
export function fillToFooter(
  doc: jsPDFType,
  currentY: number,
  mode: 'value' | 'contact',
  items?: Array<{ title: string; body: string }>,
  ceiling: number = PDF_FILL_BOTTOM,
): number {
  const remaining = ceiling - currentY;
  if (remaining < 14) return currentY;

  const left = PDF_DESIGN.left;
  const width = PDF_DESIGN.width;
  const blockH = Math.min(remaining - 4, 46);
  const top = currentY + 2;

  if (mode === 'value') {
    const cols = (items || [...PDF_VALUE_ITEMS]).slice(0, 3);

    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.grayLight);
    doc.setLineWidth(0.2);
    doc.roundedRect(left, top, width, blockH, 2, 2, 'FD');
    doc.setFillColor(...COLORS.gold);
    doc.roundedRect(left, top + 1, 1.5, blockH - 2, 0.5, 0.5, 'F');

    const colW = (width - 8) / cols.length;
    cols.forEach((item, i) => {
      const cx = left + 6 + i * colW;
      const cy = top + blockH * 0.28;
      doc.setFillColor(...COLORS.gold);
      doc.circle(cx + 2, cy, 1.5, 'F');
      setStyleValue(doc);
      doc.text(item.title, cx + 6, cy + 1);
      setStyleBody(doc);
      const lines = doc.splitTextToSize(item.body, colW - 10).slice(0, 3);
      doc.text(lines, cx + 2, cy + 7);
    });
    return top + blockH;
  }

  // mode === 'contact'
  const h = Math.min(remaining - 4, 22);
  const contactLine = [
    normalizeWebsite(SITE_CONFIG.web.url),
    SITE_CONFIG.business.email,
    SITE_CONFIG.business.phoneDisplay || SITE_CONFIG.business.phone,
  ].filter(Boolean).join('  ·  ');
  doc.setFillColor(...COLORS.blackSoft);
  doc.roundedRect(left, top, width, h, 2, 2, 'F');
  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(left, top, 2.5, h, 0.5, 0.5, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_DESIGN.type.section);
  doc.text(PDF_FILL_CONTACT_LABEL, left + 8, top + 7);
  setStyleCaption(doc);
  doc.setTextColor(...COLORS.gold);
  doc.text(contactLine, left + 8, top + 13);
  return top + h;
}

/**
 * Footer canònic complet per a tots els PDFs.
 * Bloc de contacte ancorat + línia daurada de peu en totes les pàgines.
 * Cridar-la sempre a l'últim, després de tot el contingut.
 */
export function drawAllPageFooters(
  doc: jsPDFType,
  contentEndY: number,
): void {
  // Bloc de contacte: ancorat al peu si hi ha espai
  if (contentEndY < PDF_FILL_BOTTOM - 24) {
    fillToFooter(doc, contentEndY, 'contact');
  } else if (contentEndY < PDF_FILL_BOTTOM - 8) {
    const anchorY = PDF_FILL_BOTTOM - 22;
    if (anchorY > contentEndY) fillToFooter(doc, anchorY, 'contact');
  }

  // Línia daurada + paginació en totes les pàgines
  const totalPages = doc.internal.pages.length - 1;
  const website = normalizeWebsite(SITE_CONFIG.web.url);
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    drawCanonicalPdfFooter(doc, page, totalPages, website);
  }
}
