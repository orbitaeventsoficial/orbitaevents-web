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
import { computeDossierTransportBudget } from '@/lib/services/dossierMarginGuardService';
import { orderDossierProductsForDossier } from '@/lib/services/dossierProductMappingService';

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

export type DossierExtra = { nom: string; preu: number };
export type DossierCompositeTransport = {
  travelKm?: number;
  travelTollsEur?: number;
  travelLocation?: string;
};

export type GenerateDossierCompositePdfInput = {
  client: DossierClientInfo;
  products: AnimacioProduct[];
  productIds: string[];
  collaboratorProducts?: DossierCollaboratorProduct[];
  extras?: DossierExtra[];
  transport?: DossierCompositeTransport;
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
  doc.text('PER A', PAGE.width / 2, 146, { align: 'center', charSpace: 1.4 });
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(26);
  const nameLines = doc.splitTextToSize(client.nom, 126);
  doc.text(nameLines, PAGE.width / 2, 161, { align: 'center' });

  if (client.empresa) {
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(11);
    doc.text(client.empresa, PAGE.width / 2, 184, { align: 'center' });
  }
  if (client.eventDesc) {
    doc.setTextColor(...COLORS.textSecondary);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(client.eventDesc, 120), PAGE.width / 2, 198, { align: 'center' });
  }

  doc.setTextColor(...COLORS.gold);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tenim moltes ganes de fer-ho realitat amb vosaltres', PAGE.width / 2, 258, { align: 'center' });
}

function drawIntro(doc: jsPDFType, client: DossierClientInfo, productCount: number): void {
  doc.addPage();
  doc.setFillColor(...COLORS.paperBg);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');
  const optionLabel = productCount === 1 ? 'una opció' : productCount > 1 ? `${productCount} opcions` : 'algunes opcions';

  let y = 42;
  doc.setTextColor(...COLORS.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('HOLA!', PDF_DESIGN.left, y, { charSpace: 0.8 });
  y += 14;

  doc.setTextColor(...COLORS.paperText);
  doc.setFontSize(22);
  doc.text(doc.splitTextToSize('Ritme, joc i moments que la gent recorda.', 150), PDF_DESIGN.left, y);
  y += 30;

  setStyleBody(doc);
  const greeting = client.salutacio ||
    `Hola ${client.nom}, gràcies per pensar en nosaltres! Aquest dossier ordena ${optionLabel} perquè pugueu imaginar el ritme del dia: què anima, què acompanya i què pot quedar com a moment especial. Mireu-ho amb calma; després acabem d'ajustar-ho a espai, horaris i convidats.`;
  doc.text(doc.splitTextToSize(greeting, 150), PDF_DESIGN.left, y);
  y += 42;

  y = drawCanonicalSectionTitle(doc, y, 'Com està ordenat');
  const paragraphs = [
    'Ho hem separat per moments: animació per a adults, animació per als més petits i el suport musical. Així és fàcil veure què va bé per a cada estona de la festa.',
    'Cada proposta porta el seu preu de referència. Els extres i els detalls els tanquem junts quan sapiguem quanta gent vindrà, els horaris i l\'espai.',
  ];
  paragraphs.forEach((paragraph) => {
    setStyleBody(doc);
    const lines = doc.splitTextToSize(paragraph, 150);
    doc.text(lines, PDF_DESIGN.left, y);
    y += lines.length * 6.2 + 7;
  });
}

function getCategoryStory(category?: string): string | null {
  switch (category) {
    case 'Animació adulta':
      return 'Propostes pensades per fer participar el grup gran sense trencar el ritme de la festa: música, joc i conducció en directe.';
    case 'Animació infantil':
      return 'Formats perquè els infants tinguin el seu moment propi, amb personatges, aventura i dinàmica adaptada a l\'edat.';
    case 'DJ':
      return 'La capa musical que sosté el conjunt: entrada, ambient, ball o reforç quan la proposta necessita continuïtat.';
    case 'DJ i so per a casaments':
      return 'Solucions per cuidar els moments sonors del dia, des de la cerimònia fins al ball final.';
    default:
      return null;
  }
}

function drawProductChapter(doc: jsPDFType, product: AnimacioProduct, index: number, locale: SupportedLocale, imageDataUrl?: string | null, categoryLabel?: string): void {
  doc.addPage();
  doc.setFillColor(...COLORS.paperBg);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

  // Imatge del producte com a peça visual completa: mai es retalla, el text comença a sota.
  let textWidth = 150;
  let imageBottom = 0;
  let y = 40;
  if (imageDataUrl) {
    try {
      const imgBoxW = PDF_DESIGN.right - PDF_DESIGN.left;
      const imgBoxH = 104;
      const props = doc.getImageProperties(imageDataUrl);
      const fitted = fitWithin(props.width, props.height, imgBoxW, imgBoxH);
      const imgX = PDF_DESIGN.left + (imgBoxW - fitted.width) / 2;
      const imgY = 28;
      const format = getImageFormatFromDataUrl(imageDataUrl);
      doc.addImage(imageDataUrl, format, imgX, imgY, fitted.width, fitted.height);
      imageBottom = imgY + fitted.height;
      if (product.durada) {
        setStyleCaption(doc);
        doc.setTextColor(...COLORS.gold);
        doc.text(product.durada, PDF_DESIGN.right, imageBottom + 5, { align: 'right' });
        imageBottom += 7;
      }
      y = imageBottom + 14;
    } catch {
      // Si la imatge falla, el capítol continua sense ella.
    }
  }

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
  y += categoryLabel ? 8 : 13;

  const categoryStory = getCategoryStory(categoryLabel);
  if (categoryStory) {
    setStyleMuted(doc);
    doc.text(doc.splitTextToSize(categoryStory, textWidth), PDF_DESIGN.left, y);
    y += 15;
  } else if (categoryLabel) {
    y += 5;
  }

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

function drawExtras(doc: jsPDFType, extras: DossierExtra[], locale: SupportedLocale): void {
  if (extras.length === 0) return;
  doc.addPage();
  doc.setFillColor(...COLORS.paperBg);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

  let y = 40;
  doc.setTextColor(...COLORS.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('PER ARRODONIR-HO', PDF_DESIGN.left, y, { charSpace: 0.8 });
  y += 13;

  doc.setTextColor(...COLORS.paperText);
  doc.setFontSize(24);
  doc.text('Extres opcionals', PDF_DESIGN.left, y);
  y += 14;

  setStyleMuted(doc);
  doc.text(doc.splitTextToSize('Petits detalls que podeu afegir si us fan il·lusió. No cal decidir-ho ara.', 150), PDF_DESIGN.left, y);
  y += 14;

  const moneyLocale = locale === 'ca' ? 'ca-ES' : locale;
  extras.forEach((extra) => {
    doc.setDrawColor(...COLORS.grayLight);
    doc.setLineWidth(0.2);
    doc.roundedRect(PDF_DESIGN.left, y, PDF_DESIGN.width, 13, 1.5, 1.5);
    doc.setFillColor(...COLORS.gold);
    doc.circle(PDF_DESIGN.left + 5, y + 6.5, 1.1, 'F');
    setStyleBody(doc);
    doc.setTextColor(...COLORS.paperText);
    doc.text(extra.nom, PDF_DESIGN.left + 10, y + 8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.gold);
    doc.text(formatCurrency(extra.preu, moneyLocale), PDF_DESIGN.right - 4, y + 8, { align: 'right' });
    y += 17;
  });
}

function drawTravelSummary(doc: jsPDFType, transport: DossierCompositeTransport | undefined, locale: SupportedLocale): void {
  const km = typeof transport?.travelKm === 'number' && transport.travelKm > 0 ? transport.travelKm : 0;
  if (km <= 0) return;
  const tolls = typeof transport?.travelTollsEur === 'number' && transport.travelTollsEur > 0 ? transport.travelTollsEur : 0;
  const budget = computeDossierTransportBudget(km, tolls);
  const moneyLocale = locale === 'ca' ? 'ca-ES' : locale;

  doc.addPage();
  doc.setFillColor(...COLORS.paperBg);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

  let y = 42;
  doc.setTextColor(...COLORS.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('DESPLAÇAMENT', PDF_DESIGN.left, y, { charSpace: 0.8 });
  y += 14;

  doc.setTextColor(...COLORS.paperText);
  doc.setFontSize(24);
  doc.text('Cost del desplaçament', PDF_DESIGN.left, y);
  y += 15;

  setStyleMuted(doc);
  const routeLabel = transport?.travelLocation
    ? `${transport.travelLocation} · ${Math.round(km)} km anada i tornada`
    : `${Math.round(km)} km anada i tornada`;
  doc.text(doc.splitTextToSize(routeLabel, 150), PDF_DESIGN.left, y);
  y += 18;

  doc.setTextColor(...COLORS.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text(formatCurrency(budget.clientCharge, moneyLocale), PDF_DESIGN.left, y);
  y += 18;

  const rows: Array<[string, number]> = [
    ['Vehicle i combustible', budget.clientVehicleCost],
    [`${budget.headcount} operaris en ruta`, budget.peopleCost],
  ];
  if (budget.tollsCost > 0) rows.push(['Peatges de ruta', budget.tollsCost]);
  if (budget.mealAllowance > 0) rows.push(['Dietes de ruta llarga', budget.mealAllowance]);

  rows.forEach(([label, amount]) => {
    doc.setDrawColor(...COLORS.grayLight);
    doc.roundedRect(PDF_DESIGN.left, y, PDF_DESIGN.width, 12, 1.5, 1.5);
    setStyleBody(doc);
    doc.setTextColor(...COLORS.paperText);
    doc.text(label, PDF_DESIGN.left + 5, y + 7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.gold);
    doc.text(formatCurrency(amount, moneyLocale), PDF_DESIGN.right - 4, y + 7.5, { align: 'right' });
    y += 16;
  });
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

  // Ordena editorialment igual que l'HTML: experiències principals primer i
  // extres/equipament al final. Els productes sense categoria queden a suport.
  const fallbackCategory = 'Els nostres serveis';
  const allChapters = orderDossierProductsForDossier(merged);
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

  drawTravelSummary(doc, input.transport, locale);
  drawExtras(doc, input.extras ?? [], locale);

  drawFootersExceptCover(doc);
  return doc;
}
