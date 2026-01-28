/**
 * PDF Generation Utilities for Òrbita Events
 * Uses jsPDF for client-side PDF generation
 * NOTE: jsPDF is loaded dynamically to reduce initial bundle size
 */

import { getPacksByService, EXTRAS, type ExtraDefinition, type ServiceSlug, type PackDefinition } from '@/app/config/packs-config';

// Dynamic import for jsPDF - only loads when needed
type jsPDFType = import('jspdf').jsPDF;
let jsPDFModule: typeof import('jspdf') | null = null;

async function getJsPDF(): Promise<typeof import('jspdf')> {
  if (!jsPDFModule) {
    jsPDFModule = await import('jspdf');
  }
  return jsPDFModule;
}

// Brand colors - Enhanced palette
const COLORS = {
  // Primary brand colors
  gold: [218, 165, 32] as [number, number, number],      // #DAA520 - Gold
  goldLight: [255, 215, 0] as [number, number, number],  // #FFD700 - Light gold
  goldDark: [184, 134, 11] as [number, number, number],  // #B8860B - Dark gold

  // Neutrals
  black: [0, 0, 0] as [number, number, number],
  blackSoft: [26, 26, 26] as [number, number, number],    // #1a1a1a
  white: [255, 255, 255] as [number, number, number],

  // Grays
  gray: [128, 128, 128] as [number, number, number],
  grayLight: [229, 229, 229] as [number, number, number], // #e5e5e5
  grayDark: [74, 74, 74] as [number, number, number],     // #4a4a4a

  // Backgrounds
  bgLight: [250, 250, 250] as [number, number, number],   // #fafafa
  bgDark: [245, 245, 245] as [number, number, number],    // #f5f5f5

  // Accent
  success: [34, 197, 94] as [number, number, number],     // #22c55e - Green
};

// Service display names
const SERVICE_NAMES: Record<ServiceSlug, { ca: string; es: string; en: string }> = {
  bodas: { ca: 'Casaments', es: 'Bodas', en: 'Weddings' },
  fiestas: { ca: 'Festes', es: 'Fiestas', en: 'Parties' },
  discomovil: { ca: 'Discomòbil', es: 'Discomóvil', en: 'Mobile DJ' },
  empresas: { ca: 'Empreses', es: 'Empresas', en: 'Corporate' },
  produccion: { ca: 'Producció Tècnica', es: 'Producción Técnica', en: 'Technical Production' },
  alquiler: { ca: 'Lloguer d\'Equip', es: 'Alquiler de Equipo', en: 'Equipment Rental' },
};

/**
 * Add modern header with logo and branding to PDF
 */
function addHeader(doc: jsPDFType, title: string) {
  // Modern gradient background (simulated with rectangles)
  doc.setFillColor(...COLORS.blackSoft);
  doc.rect(0, 0, 210, 50, 'F');

  // Gold accent bar on the left
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 0, 6, 50, 'F');

  // Subtle bottom border
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 48, 210, 2, 'F');

  // Company name - Bold and modern
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('ÒRBITA', 22, 22);

  // "EVENTS" lighter
  doc.setFontSize(28);
  doc.setFont('helvetica', 'normal');
  doc.text('EVENTS', 68, 22);

  // Subtitle/Title
  doc.setTextColor(...COLORS.grayLight);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title.toUpperCase(), 22, 38);

  // Decorative element - Small gold box
  doc.setFillColor(...COLORS.gold);
  doc.rect(180, 15, 20, 3, 'F');
  doc.setFillColor(...COLORS.goldLight);
  doc.rect(180, 20, 20, 3, 'F');

  return 60; // Return Y position after header (more space)
}

/**
 * Add modern footer with contact info
 */
function addFooter(doc: jsPDFType, pageNum: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;

  // Top border line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(20, pageHeight - 30, 190, pageHeight - 30);

  // Left side - Contact info
  doc.setTextColor(...COLORS.grayDark);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('orbitaevents.com', 20, pageHeight - 22);
  doc.text('info@orbitaevents.com', 20, pageHeight - 17);
  doc.text('+34 674 23 85 76', 20, pageHeight - 12);

  // Center - Location
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.text('Barcelona • Girona • Catalunya', 105, pageHeight - 17, { align: 'center' });

  // Right side - Page number with modern style
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`${pageNum}`, 185, pageHeight - 17, { align: 'right' });
  doc.setTextColor(...COLORS.gray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`/ ${totalPages}`, 190, pageHeight - 17, { align: 'right' });

  // Bottom tagline
  doc.setTextColor(...COLORS.grayLight);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('L\'Esdeveniment Que La Teva Gent NO Oblidarà', 105, pageHeight - 8, { align: 'center' });
}

/**
 * Generate service brochure PDF
 */
export async function generateServiceBrochure(
  service: ServiceSlug,
  locale: 'ca' | 'es' | 'en' = 'ca'
): Promise<jsPDFType> {
  const { default: jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  const packs = getPacksByService(service);
  const serviceName = SERVICE_NAMES[service][locale];

  // Translations
  const t = {
    ca: {
      brochure: 'Catàleg de Serveis',
      ourPacks: 'Els Nostres Packs',
      duration: 'Durada',
      hours: 'hores',
      includes: 'Inclou',
      idealFor: 'Ideal per',
      popular: 'MÉS POPULAR',
      premium: 'PREMIUM',
      extras: 'Extres Disponibles',
      contactUs: 'Contacta\'ns',
      contactText: 'Tens dubtes? Escriu-nos sense compromís!',
    },
    es: {
      brochure: 'Catálogo de Servicios',
      ourPacks: 'Nuestros Packs',
      duration: 'Duración',
      hours: 'horas',
      includes: 'Incluye',
      idealFor: 'Ideal para',
      popular: 'MÁS POPULAR',
      premium: 'PREMIUM',
      extras: 'Extras Disponibles',
      contactUs: 'Contáctanos',
      contactText: '¿Tienes dudas? ¡Escríbenos sin compromiso!',
    },
    en: {
      brochure: 'Service Catalog',
      ourPacks: 'Our Packages',
      duration: 'Duration',
      hours: 'hours',
      includes: 'Includes',
      idealFor: 'Ideal for',
      popular: 'MOST POPULAR',
      premium: 'PREMIUM',
      extras: 'Available Extras',
      contactUs: 'Contact Us',
      contactText: 'Have questions? Contact us with no obligation!',
    },
  }[locale];

  // Page 1: Cover
  let y = addHeader(doc, `${t.brochure} - ${serviceName}`);

  // Service title
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text(serviceName.toUpperCase(), 105, y + 30, { align: 'center' });

  // Decorative line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(2);
  doc.line(60, y + 40, 150, y + 40);

  // Section: Our Packs
  y = y + 60;
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(t.ourPacks, 20, y);
  y += 15;

  // List each pack
  packs.forEach((pack, index) => {
    // Check if we need a new page
    if (y > 230) {
      doc.addPage();
      y = addHeader(doc, `${t.brochure} - ${serviceName}`);
      y += 10;
    }

    // Pack card background
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(15, y - 5, 180, 55, 3, 3, 'F');
    // Left accent bar
    doc.setFillColor(...COLORS.gold);
    doc.rect(15, y - 5, 2, 55, 'F');

    // Badge
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

    // Pack name with icon
    doc.setFillColor(...COLORS.gold);
    doc.circle(20, y + 8, 1.2, 'F');
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(pack.name, 24, y + 8);

    // Price
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(pack.price, 24, y + 20);

    // Duration
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t.duration}: ${pack.durationHours} ${t.hours}`, 60, y + 20);

    // Features (first 3)
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(9);
    pack.features.slice(0, 3).forEach((feature, i) => {
      // Clean emoji from feature text for PDF
      const cleanFeature = feature.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      const featureY = y + 30 + i * 5;
      doc.setFillColor(...COLORS.gold);
      doc.circle(20, featureY - 1.3, 1, 'F');
      doc.setTextColor(...COLORS.black);
      doc.text(cleanFeature.substring(0, 60), 24, featureY);
    });
    // Ideal for
    if (pack.ideal) {
      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(8);
      doc.text(`${t.idealFor}: ${pack.ideal}`, 24, y + 48);
    }

    y += 65;
  });

  // Add extras section if space, otherwise new page
  if (y > 180) {
    doc.addPage();
    y = addHeader(doc, `${t.brochure} - ${serviceName}`);
    y += 10;
  }

  // Extras section
  const compatibleExtras = EXTRAS.filter(
    (e) => !e.compatibleWith || e.compatibleWith.includes(service)
  ).slice(0, 8);

  if (compatibleExtras.length > 0) {
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(t.extras, 20, y + 10);
    y += 20;

    doc.setTextColor(...COLORS.black);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    compatibleExtras.forEach((extra, i) => {
      const col = i % 2 === 0 ? 20 : 110;
      const textCol = col + 4;
      const row = Math.floor(i / 2) * 12;
      const priceText = extra.price ? `${extra.price}?` : 'Consultar';
      doc.setFillColor(...COLORS.gold);
      doc.circle(col, y + row - 1.3, 1, 'F');
      doc.setTextColor(...COLORS.black);
      doc.text(`${extra.name} (${priceText})`, textCol, y + row);
    });
  }

  // Contact section
  y = 250;
  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(15, y, 180, 25, 3, 3, 'F');
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t.contactUs, 105, y + 10, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(t.contactText, 105, y + 18, { align: 'center' });

  // Add footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  return doc;
}

/**
 * Generate quote PDF from configurator
 */
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
}

export async function generateQuotePDF(
  data: QuoteData,
  locale: 'ca' | 'es' | 'en' = 'ca'
): Promise<jsPDFType> {
  const { default: jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  const extrasCatalog = data.extrasCatalog ?? EXTRAS;

  const t = {
    ca: {
      quote: 'Pressupost',
      eventDetails: 'Detalls de l\'Event',
      eventType: 'Tipus d\'event',
      date: 'Data',
      guests: 'Convidats',
      selectedPack: 'Pack Seleccionat',
      duration: 'Durada',
      hours: 'hores',
      features: 'Característiques Incloses',
      extras: 'Extres Seleccionats',
      priceSummary: 'Resum de Preus',
      basePack: 'Pack base',
      extrasTotal: 'Total extres',
      discount: 'Descompte',
      total: 'TOTAL',
      validUntil: 'Pressupost vàlid durant 15 dies',
      disclaimer: 'Els preus no inclouen IVA. Consulta condicions.',
      toConfirm: 'Per confirmar el teu event',
      contact: 'Contacta amb nosaltres per confirmar disponibilitat.',
      nextSteps: 'PRÒXIMS PASSOS',
      step1: 'Confirma disponibilitat contactant-nos',
      step2: 'Reserva amb un senyal del 30%',
      step3: 'Gaudeix del teu event perfecte',
    },
    es: {
      quote: 'Presupuesto',
      eventDetails: 'Detalles del Evento',
      eventType: 'Tipo de evento',
      date: 'Fecha',
      guests: 'Invitados',
      selectedPack: 'Pack Seleccionado',
      duration: 'Duración',
      hours: 'horas',
      features: 'Características Incluidas',
      extras: 'Extras Seleccionados',
      priceSummary: 'Resumen de Precios',
      basePack: 'Pack base',
      extrasTotal: 'Total extras',
      discount: 'Descuento',
      total: 'TOTAL',
      validUntil: 'Presupuesto válido durante 15 días',
      disclaimer: 'Los precios no incluyen IVA. Consulta condiciones.',
      toConfirm: 'Para confirmar tu evento',
      contact: 'Contáctanos para confirmar disponibilidad.',
      nextSteps: 'PRÓXIMOS PASOS',
      step1: 'Confirma disponibilidad contactándonos',
      step2: 'Reserva con una señal del 30%',
      step3: 'Disfruta de tu evento perfecto',
    },
    en: {
      quote: 'Quote',
      eventDetails: 'Event Details',
      eventType: 'Event type',
      date: 'Date',
      guests: 'Guests',
      selectedPack: 'Selected Package',
      duration: 'Duration',
      hours: 'hours',
      features: 'Included Features',
      extras: 'Selected Extras',
      priceSummary: 'Price Summary',
      basePack: 'Base package',
      extrasTotal: 'Extras total',
      discount: 'Discount',
      total: 'TOTAL',
      validUntil: 'Quote valid for 15 days',
      disclaimer: 'Prices do not include VAT. See conditions.',
      toConfirm: 'To confirm your event',
      contact: 'Contact us to confirm availability.',
      nextSteps: 'NEXT STEPS',
      step1: 'Confirm availability by contacting us',
      step2: 'Book with a 30% deposit',
      step3: 'Enjoy your perfect event',
    },
  }[locale];

  // Header
  let y = addHeader(doc, t.quote);

  // Quote number and date - Modern style
  const quoteNum = `OE-${Date.now().toString(36).toUpperCase()}`;
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`REF: ${quoteNum}`, 190, y, { align: 'right' });
  doc.setTextColor(...COLORS.grayDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${new Date().toLocaleDateString(locale === 'ca' ? 'ca-ES' : locale === 'es' ? 'es-ES' : 'en-GB')}`, 190, y + 5, { align: 'right' });

  // Client name if provided - Modern style
  if (data.clientName) {
    doc.setTextColor(...COLORS.blackSoft);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(data.clientName, 20, y);
    y += 8;
  }

  y += 10;

  // Event Details Section - Modern card
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, y, 180, 30, 4, 4, 'FD');

  // Left accent bar
  doc.setFillColor(...COLORS.gold);
  doc.rect(15, y, 3, 30, 'F');

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(t.eventDetails.toUpperCase(), 23, y + 8);

  doc.setTextColor(...COLORS.blackSoft);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const eventTypeName = SERVICE_NAMES[data.eventType as ServiceSlug]?.[locale] || data.eventType;
  doc.text(`${eventTypeName}`, 23, y + 17);

  if (data.date && data.date !== '-') {
    doc.setTextColor(...COLORS.grayDark);
    doc.setFontSize(8);
    doc.text(`📅 ${data.date}`, 23, y + 23);
    doc.text(`👥 ${data.guests} ${t.guests.toLowerCase()}`, 95, y + 23);
  } else {
    doc.setTextColor(...COLORS.grayDark);
    doc.setFontSize(8);
    doc.text(`👥 ${data.guests} ${t.guests.toLowerCase()}`, 23, y + 23);
  }

  y += 40;

  // Selected Pack Section - Hero card with gradient effect
  // Background layers for gradient effect
  doc.setFillColor(218, 165, 32); // Gold
  doc.roundedRect(15, y, 180, 50, 4, 4, 'F');

  doc.setFillColor(235, 185, 52); // Lighter gold overlay
  doc.roundedRect(15, y, 180, 25, 4, 4, 'F');

  // Left accent
  doc.setFillColor(255, 215, 0); // Bright gold
  doc.rect(15, y, 4, 50, 'F');

  // Pack label
  doc.setTextColor(...COLORS.blackSoft);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(t.selectedPack.toUpperCase(), 24, y + 8);

  // Pack name - Large and bold
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(data.pack.name.toUpperCase(), 24, y + 20);

  // Duration
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`⏱ ${data.pack.durationHours} ${t.hours}`, 24, y + 30);

  // Price - Large and prominent
  doc.setTextColor(...COLORS.blackSoft);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(data.pack.price, 175, y + 30, { align: 'right' });

  // "desde" indicator if price has "desde"
  if (data.pack.price.toLowerCase().includes('desde')) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('*precio aproximado', 175, y + 38, { align: 'right' });
  }

  y += 60;

  // Features Section - Modern list with icons
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(t.features.toUpperCase(), 20, y);
  y += 8;

  // Features in modern boxes
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.blackSoft);

  const maxFeatures = Math.min(data.pack.features.length, 8);
  const featuresPerColumn = Math.ceil(maxFeatures / 2);

  data.pack.features.slice(0, maxFeatures).forEach((feature, index) => {
    const cleanFeature = feature.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    const column = index < featuresPerColumn ? 0 : 1;
    const rowInColumn = index % featuresPerColumn;
    const x = column === 0 ? 20 : 110;
    const featureY = y + (rowInColumn * 7);

    // Feature bullet point - gold circle
    doc.setFillColor(...COLORS.gold);
    doc.circle(x + 1, featureY - 1.5, 1, 'F');

    // Feature text
    doc.setTextColor(...COLORS.blackSoft);
    doc.text(cleanFeature.substring(0, 45), x + 4, featureY);
  });

  y += (featuresPerColumn * 7) + 10;

  // Extras Section (if any)
  if (data.extras.length > 0) {
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(t.extras.toUpperCase(), 20, y);
    y += 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.blackSoft);

    data.extras.forEach((extraName) => {
      const extra = extrasCatalog.find((e) => e.name === extraName || e.id === extraName);
      const price = extra?.price ? `+${extra.price}€` : '';

      // Extra bullet
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
      y += 6;
    });
    y += 8;
  }

  // Price Summary - Modern card
  y = Math.max(y, 195);

  // Summary box with shadow effect
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(112, y + 2, 82, 50, 4, 4, 'F'); // Shadow
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.5);
  doc.roundedRect(110, y, 82, 50, 4, 4, 'FD');

  // Left gold accent
  doc.setFillColor(...COLORS.gold);
  doc.rect(110, y, 2, 50, 'F');

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(t.priceSummary.toUpperCase(), 117, y + 7);

  doc.setTextColor(...COLORS.blackSoft);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  let priceY = y + 15;
  doc.text(t.basePack, 117, priceY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.basePrice}€`, 185, priceY, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  if (data.extrasPrice > 0) {
    priceY += 6;
    doc.text(t.extrasTotal, 117, priceY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.extrasPrice}€`, 185, priceY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  }

  if (data.discount > 0) {
    priceY += 6;
    doc.setTextColor(...COLORS.success);
    doc.text(`${t.discount}`, 117, priceY);
    doc.setFont('helvetica', 'bold');
    doc.text(`-${data.discount}€`, 185, priceY, { align: 'right' });
    doc.setTextColor(...COLORS.blackSoft);
    doc.setFont('helvetica', 'normal');
  }

  // Total line
  priceY += 8;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.line(117, priceY - 2, 185, priceY - 2);

  // Total amount - Large and bold
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t.total, 117, priceY + 5);
  doc.setFontSize(16);
  doc.text(`${data.total}€`, 185, priceY + 5, { align: 'right' });

  // Next steps - Left side modern box
  const stepsY = y;
  doc.setFillColor(...COLORS.bgDark);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, stepsY, 90, 50, 4, 4, 'FD');

  // Top gold bar
  doc.setFillColor(...COLORS.gold);
  doc.rect(15, stepsY, 90, 2, 'F');

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(t.nextSteps, 20, stepsY + 9);

  doc.setTextColor(...COLORS.grayDark);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  // Step 1
  doc.setFillColor(...COLORS.gold);
  doc.circle(21, stepsY + 16, 1.5, 'F');
  doc.setTextColor(...COLORS.blackSoft);
  doc.text('1', 21, stepsY + 17, { align: 'center' });
  doc.setTextColor(...COLORS.grayDark);
  doc.text(t.step1, 25, stepsY + 17);

  // Step 2
  doc.setFillColor(...COLORS.gold);
  doc.circle(21, stepsY + 27, 1.5, 'F');
  doc.setTextColor(...COLORS.blackSoft);
  doc.text('2', 21, stepsY + 28, { align: 'center' });
  doc.setTextColor(...COLORS.grayDark);
  doc.text(t.step2, 25, stepsY + 28);

  // Step 3
  doc.setFillColor(...COLORS.gold);
  doc.circle(21, stepsY + 38, 1.5, 'F');
  doc.setTextColor(...COLORS.blackSoft);
  doc.text('3', 21, stepsY + 39, { align: 'center' });
  doc.setTextColor(...COLORS.grayDark);
  doc.text(t.step3, 25, stepsY + 39);

  // Footer info - Modern disclaimer
  y = 255;
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(15, y, 180, 12, 2, 2, 'F');

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('⏰', 20, y + 6);
  doc.text(t.validUntil, 25, y + 6);

  doc.setTextColor(...COLORS.grayDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(t.disclaimer, 25, y + 10);

  // Add footer
  addFooter(doc, 1, 1);

  return doc;
}

/**
 * Download a single image from URL
 */
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

/**
 * Download multiple images as individual files
 */
export async function downloadImages(
  images: { src: string; alt: string }[],
  prefix: string = 'orbita'
): Promise<void> {
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const ext = img.src.split('.').pop() || 'jpg';
    const filename = `${prefix}-${String(i + 1).padStart(2, '0')}.${ext}`;
    await downloadImage(img.src, filename);
    // Small delay between downloads
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}
