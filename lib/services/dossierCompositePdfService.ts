import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { formatCurrency } from '@/lib/constants';
import type { SupportedLocale } from '@/lib/services/catalogPdfService';
import { collaboratorProductToAnimacioProduct, type DossierCollaboratorProduct } from '@/lib/services/collaboratorProductService';
import { getJsPDF } from '@/lib/utils/pdfHelpers';
import type { DossierClientInfo } from '@/lib/utils/dossier-html-builder';
import {
  COLORS,
  PAGE,
  fitWithin,
  getImageFormatFromDataUrl,
  normalizeWebsite,
  type jsPDFType,
} from '@/lib/pdf-config';
import {
  PDF_DESIGN,
  drawCanonicalPdfFooter,
  drawCanonicalSectionTitle,
  setStyleBody,
  setStyleCaption,
  setStyleMuted,
} from '@/lib/pdf-header';
import { ORBITA_LOGO_LOCKUP_LIGHT_BASE64 } from '@/lib/logo-lockup-light-base64';
import { SITE_CONFIG } from '@/app/config/site-config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/** Carrega una imatge de /public com a data URL per a jsPDF. Retorna null si no existeix. */
async function loadImageDataUrl(imageUrl?: string | null): Promise<string | null> {
  if (!imageUrl) return null;
  try {
    const filePath = path.join(process.cwd(), 'public', imageUrl.replace(/^\//, ''));
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

export type GenerateDossierCompositePdfInput = {
  client: DossierClientInfo;
  products: AnimacioProduct[];
  productIds: string[];
  collaboratorProducts?: DossierCollaboratorProduct[];
  locale?: SupportedLocale;
  logoDataUri?: string;
};

function drawCover(doc: jsPDFType, client: DossierClientInfo, logoDataUri?: string): void {
  doc.setFillColor(...COLORS.sunk);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.35);
  doc.rect(12, 12, PAGE.width - 24, PAGE.height - 24);

  const logo = logoDataUri || ORBITA_LOGO_LOCKUP_LIGHT_BASE64;
  try {
    const format = getImageFormatFromDataUrl(logo);
    const props = doc.getImageProperties(logo);
    const fitted = fitWithin(props.width, props.height, 84, 28);
    doc.addImage(logo, format, (PAGE.width - fitted.width) / 2, 78, fitted.width, fitted.height);
  } catch {
    doc.setTextColor(...COLORS.gold);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('ORBITA EVENTS', PAGE.width / 2, 90, { align: 'center' });
  }

  doc.setFillColor(...COLORS.gold);
  doc.rect((PAGE.width - 18) / 2, 124, 18, 0.8, 'F');
  doc.setTextColor(...COLORS.textMuted);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('DOSSIER PREPARAT PER A', PAGE.width / 2, 146, { align: 'center', charSpace: 1.2 });
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(24);
  const nameLines = doc.splitTextToSize(client.nom, 126);
  doc.text(nameLines, PAGE.width / 2, 160, { align: 'center' });

  if (client.empresa) {
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(11);
    doc.text(client.empresa, PAGE.width / 2, 184, { align: 'center' });
  }
  if (client.eventDesc) {
    doc.setTextColor(...COLORS.textSecondary);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(doc.splitTextToSize(client.eventDesc, 120), PAGE.width / 2, 198, { align: 'center' });
  }

  doc.setTextColor(...COLORS.textMuted);
  doc.setFontSize(7);
  doc.text('DOSSIER NARRATIU + FITXES COMERCIALS SELECCIONADES', PAGE.width / 2, 260, { align: 'center', charSpace: 0.6 });
}

function drawIntro(doc: jsPDFType, client: DossierClientInfo, productCount: number): void {
  doc.addPage();
  doc.setFillColor(...COLORS.paperBg);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

  let y = 42;
  doc.setTextColor(...COLORS.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('UNA MIRADA A L\'EXPERIENCIA', PDF_DESIGN.left, y, { charSpace: 0.8 });
  y += 14;

  doc.setTextColor(...COLORS.paperText);
  doc.setFontSize(22);
  doc.text(doc.splitTextToSize('Un dossier per imaginar l\'esdeveniment abans de parlar de numeros.', 142), PDF_DESIGN.left, y);
  y += 34;

  setStyleBody(doc);
  const greeting = client.salutacio ||
    'Gracies per contactar amb nosaltres. Aquest document explica el to, el ritme i el valor de cada proposta. Les fitxes comercials amb preus i condicions apareixen al final, filtrades segons la seleccio real.';
  doc.text(doc.splitTextToSize(`Hola ${client.nom},\n\n${greeting}`, 150), PDF_DESIGN.left, y);
  y += 52;

  y = drawCanonicalSectionTitle(doc, y, 'Resum del document');
  const rows = [
    ['Oferta', productCount === 1 ? '1 proposta activada' : `${productCount} propostes activades`],
    ['Format', 'Dossier narratiu + cataleg comercial filtrat'],
    ['Objectiu', 'Entendre valor abans de comparar imports'],
  ];
  rows.forEach(([label, value], index) => {
    const top = y + index * 18;
    doc.setDrawColor(...COLORS.grayLight);
    doc.roundedRect(PDF_DESIGN.left, top, PDF_DESIGN.width, 13, 1.5, 1.5);
    setStyleCaption(doc);
    doc.setTextColor(...COLORS.gold);
    doc.text(label.toUpperCase(), PDF_DESIGN.left + 5, top + 5);
    setStyleBody(doc);
    doc.setFont('helvetica', 'bold');
    doc.text(value, PDF_DESIGN.left + 42, top + 5);
  });
}

function drawProductChapter(doc: jsPDFType, product: AnimacioProduct, index: number, locale: SupportedLocale, imageDataUrl?: string | null, categoryLabel?: string): void {
  doc.addPage();
  doc.setFillColor(...COLORS.paperBg);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

  // Imatge del producte a la cantonada superior dreta (quadrada). El text flueix a l'esquerra.
  let textWidth = 150;
  let imageBottom = 0;
  if (imageDataUrl) {
    try {
      const imgSize = 56;
      const imgX = PDF_DESIGN.right - imgSize;
      const imgY = 32;
      const format = getImageFormatFromDataUrl(imageDataUrl);
      doc.addImage(imageDataUrl, format, imgX, imgY, imgSize, imgSize);
      textWidth = imgX - PDF_DESIGN.left - 6;
      imageBottom = imgY + imgSize;
      // Durada sota la imatge (no solapada amb el header)
      if (product.durada) {
        setStyleCaption(doc);
        doc.setTextColor(...COLORS.gold);
        doc.text(product.durada, imgX + imgSize, imageBottom + 5, { align: 'right' });
        imageBottom += 7;
      }
    } catch {
      // Si la imatge falla, el capítol continua sense ella.
    }
  }

  let y = 40;
  // Capçalera de categoria (eyebrow) quan comença una secció nova; si no, número de capítol.
  doc.setTextColor(...COLORS.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const eyebrow = categoryLabel ? categoryLabel.toUpperCase() : `CAPITOL ${String(index + 1).padStart(2, '0')}`;
  doc.text(eyebrow, PDF_DESIGN.left, y, { charSpace: 0.8 });
  if (categoryLabel) {
    // Subratllat daurat per marcar inici de secció
    const w = Math.min(doc.getTextWidth(eyebrow) + 1, textWidth);
    doc.setFillColor(...COLORS.gold);
    doc.rect(PDF_DESIGN.left, y + 2, w, 0.5, 'F');
  }
  if (product.durada && !imageDataUrl) {
    doc.text(product.durada, PDF_DESIGN.right, y, { align: 'right' });
  }
  y += 13;

  doc.setTextColor(...COLORS.paperText);
  doc.setFontSize(24);
  doc.text(doc.splitTextToSize(product.nom, textWidth), PDF_DESIGN.left, y);
  y += 13;

  // Preu canònic "des de X€" (de trams/sellPrice, mai hardcoded)
  if (typeof product.priceFrom === 'number') {
    doc.setTextColor(...COLORS.gold);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`des de ${formatCurrency(product.priceFrom, locale === 'ca' ? 'ca-ES' : locale)}`, PDF_DESIGN.left, y);
  }
  y += 11;

  // La narrativa és el cos protagonista del capítol (més gran, amb aire).
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.paperText);
  product.descripcio.forEach((paragraph) => {
    // Mentre el text estigui a l'alçada de la imatge, l'amplada és reduïda; després, completa.
    const width = y < imageBottom ? textWidth : 150;
    const lines = doc.splitTextToSize(paragraph, width);
    doc.text(lines, PDF_DESIGN.left, y);
    y += lines.length * 6.2 + 5;
  });

  if (y < imageBottom) y = imageBottom + 4;

  // El que inclou queda com a línia discreta secundària (no inventari tècnic protagonista).
  const inclouItems = product.inclou.map((item) => item.replace(/^Durada:\s*/i, '').trim()).filter(Boolean);
  if (inclouItems.length > 0) {
    y += 6;
    setStyleCaption(doc);
    doc.setTextColor(...COLORS.gold);
    doc.text('INCLOU', PDF_DESIGN.left, y, { charSpace: 0.8 });
    y += 5;
    setStyleMuted(doc);
    const inclouLine = inclouItems.join('  ·  ');
    const lines = doc.splitTextToSize(inclouLine, 150);
    doc.text(lines, PDF_DESIGN.left, y);
    y += lines.length * 5 + 2;
  }

  if (product.noInclou && y < 236) {
    y += 4;
    doc.setDrawColor(...COLORS.gold);
    doc.line(PDF_DESIGN.left, y, PDF_DESIGN.left, y + 16);
    setStyleMuted(doc);
    doc.text(doc.splitTextToSize(product.noInclou, 145), PDF_DESIGN.left + 6, y + 5);
  }
}

function drawFootersExceptCover(doc: jsPDFType): void {
  const totalPages = doc.internal.pages.length - 1;
  const website = normalizeWebsite(SITE_CONFIG.web.url);
  for (let page = 2; page <= totalPages; page++) {
    doc.setPage(page);
    drawCanonicalPdfFooter(doc, page, totalPages, website, '', page === totalPages);
  }
}

export async function generateDossierCompositePDF(input: GenerateDossierCompositePdfInput): Promise<jsPDFType> {
  const { default: jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  const locale = input.locale ?? 'ca';

  // Productes de col·laborador presentats com a productes propis del catàleg (capítols uniformes).
  const collaboratorChapters = (input.collaboratorProducts ?? []).map(collaboratorProductToAnimacioProduct);
  const merged = [...input.products, ...collaboratorChapters];

  // Agrupa per categoria preservant l'ordre de primera aparició. Els productes sense
  // categoria queden a "Els nostres serveis".
  const fallbackCategory = 'Els nostres serveis';
  const categoryOrder: string[] = [];
  for (const product of merged) {
    const cat = product.categoria || fallbackCategory;
    if (!categoryOrder.includes(cat)) categoryOrder.push(cat);
  }
  const allChapters = categoryOrder.flatMap((cat) =>
    merged.filter((product) => (product.categoria || fallbackCategory) === cat),
  );
  const chapterImages = await Promise.all(allChapters.map((product) => loadImageDataUrl(product.image)));

  drawCover(doc, input.client, input.logoDataUri);
  drawIntro(doc, input.client, allChapters.length);

  let lastCategory: string | null = null;
  allChapters.forEach((product, index) => {
    const category = product.categoria || fallbackCategory;
    const isNewCategory = category !== lastCategory;
    drawProductChapter(doc, product, index, locale, chapterImages[index], isNewCategory ? category : undefined);
    lastCategory = category;
  });

  drawFootersExceptCover(doc);
  return doc;
}
