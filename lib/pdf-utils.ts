/**
 * PDF Generation Utilities for Òrbita Events
 * Uses jsPDF for client-side PDF generation
 */

import jsPDF from 'jspdf';
import { getPacksByService, EXTRAS, type ServiceSlug, type PackDefinition } from '@/app/config/packs-config';

// Brand colors
const COLORS = {
  gold: [212, 175, 55] as [number, number, number],
  black: [10, 10, 10] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gray: [128, 128, 128] as [number, number, number],
  lightGray: [200, 200, 200] as [number, number, number],
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
 * Add header with logo and branding to PDF
 */
function addHeader(doc: jsPDF, title: string) {
  // Background header
  doc.setFillColor(...COLORS.black);
  doc.rect(0, 0, 210, 40, 'F');

  // Gold accent line
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 38, 210, 2, 'F');

  // Title
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ÒRBITA EVENTS', 20, 20);

  // Subtitle
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 20, 32);

  return 50; // Return Y position after header
}

/**
 * Add footer with contact info
 */
function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;

  // Footer line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(20, pageHeight - 25, 190, pageHeight - 25);

  // Contact info
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  doc.text('orbitaevents.com | info@orbitaevents.com | +34 600 000 000', 20, pageHeight - 18);
  doc.text('Barcelona + Girona', 20, pageHeight - 12);

  // Page number
  doc.text(`${pageNum} / ${totalPages}`, 190, pageHeight - 12, { align: 'right' });
}

/**
 * Generate service brochure PDF
 */
export function generateServiceBrochure(
  service: ServiceSlug,
  locale: 'ca' | 'es' | 'en' = 'ca'
): jsPDF {
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

    // Pack name
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(pack.name, 20, y + 8);

    // Price
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(pack.price, 20, y + 20);

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
      doc.text(`• ${cleanFeature.substring(0, 60)}`, 20, y + 30 + i * 5);
    });

    // Ideal for
    if (pack.ideal) {
      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(8);
      doc.text(`${t.idealFor}: ${pack.ideal}`, 20, y + 48);
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
      const row = Math.floor(i / 2) * 12;
      const priceText = extra.price ? `${extra.price}€` : 'Consultar';
      doc.text(`• ${extra.name} (${priceText})`, col, y + row);
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
  basePrice: number;
  extrasPrice: number;
  discount: number;
  discountReason: string;
  total: number;
  clientName?: string;
  clientEmail?: string;
}

export function generateQuotePDF(
  data: QuoteData,
  locale: 'ca' | 'es' | 'en' = 'ca'
): jsPDF {
  const doc = new jsPDF();

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
      features: 'Característiques',
      extras: 'Extres Seleccionats',
      priceSummary: 'Resum de Preus',
      basePack: 'Pack base',
      extrasTotal: 'Total extres',
      discount: 'Descompte',
      total: 'TOTAL',
      validUntil: 'Pressupost vàlid durant 15 dies',
      disclaimer: 'Els preus no inclouen IVA. Consulta condicions.',
      toConfirm: 'Per confirmar el teu event',
      contact: 'Contacta amb nosaltres per confirmar disponibilitat i tancar la reserva.',
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
      features: 'Características',
      extras: 'Extras Seleccionados',
      priceSummary: 'Resumen de Precios',
      basePack: 'Pack base',
      extrasTotal: 'Total extras',
      discount: 'Descuento',
      total: 'TOTAL',
      validUntil: 'Presupuesto válido durante 15 días',
      disclaimer: 'Los precios no incluyen IVA. Consulta condiciones.',
      toConfirm: 'Para confirmar tu evento',
      contact: 'Contáctanos para confirmar disponibilidad y cerrar la reserva.',
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
      features: 'Features',
      extras: 'Selected Extras',
      priceSummary: 'Price Summary',
      basePack: 'Base package',
      extrasTotal: 'Extras total',
      discount: 'Discount',
      total: 'TOTAL',
      validUntil: 'Quote valid for 15 days',
      disclaimer: 'Prices do not include VAT. See conditions.',
      toConfirm: 'To confirm your event',
      contact: 'Contact us to confirm availability and finalize your booking.',
    },
  }[locale];

  // Header
  let y = addHeader(doc, t.quote);

  // Quote number and date
  const quoteNum = `OE-${Date.now().toString(36).toUpperCase()}`;
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(10);
  doc.text(`Ref: ${quoteNum}`, 190, y, { align: 'right' });
  doc.text(`${new Date().toLocaleDateString(locale === 'ca' ? 'ca-ES' : locale === 'es' ? 'es-ES' : 'en-GB')}`, 190, y + 6, { align: 'right' });

  // Client name if provided
  if (data.clientName) {
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(data.clientName, 20, y + 5);
    y += 10;
  }

  y += 15;

  // Event Details Section
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, y, 180, 35, 3, 3, 'F');

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t.eventDetails, 20, y + 8);

  doc.setTextColor(...COLORS.black);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const eventTypeName = SERVICE_NAMES[data.eventType as ServiceSlug]?.[locale] || data.eventType;
  doc.text(`${t.eventType}: ${eventTypeName}`, 20, y + 18);
  doc.text(`${t.date}: ${data.date || '-'}`, 20, y + 26);
  doc.text(`${t.guests}: ${data.guests}`, 110, y + 26);

  y += 45;

  // Selected Pack Section
  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(15, y, 180, 50, 3, 3, 'F');

  doc.setTextColor(...COLORS.black);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t.selectedPack, 20, y + 10);

  doc.setFontSize(16);
  doc.text(data.pack.name, 20, y + 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${t.duration}: ${data.pack.durationHours} ${t.hours}`, 20, y + 32);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.pack.price, 170, y + 25, { align: 'right' });

  y += 60;

  // Features
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(t.features, 20, y);
  y += 8;

  doc.setTextColor(...COLORS.black);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  data.pack.features.slice(0, 6).forEach((feature) => {
    const cleanFeature = feature.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    doc.text(`• ${cleanFeature.substring(0, 80)}`, 20, y);
    y += 5;
  });

  y += 10;

  // Extras if any
  if (data.extras.length > 0) {
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(t.extras, 20, y);
    y += 8;

    doc.setTextColor(...COLORS.black);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    data.extras.forEach((extraName) => {
      const extra = EXTRAS.find((e) => e.name === extraName || e.id === extraName);
      const price = extra?.price ? `+${extra.price}€` : '';
      doc.text(`• ${extraName} ${price}`, 20, y);
      y += 5;
    });
    y += 5;
  }

  // Price Summary
  y = Math.max(y, 200);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(100, y, 95, 55, 3, 3, 'F');

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(t.priceSummary, 105, y + 8);

  doc.setTextColor(...COLORS.black);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let priceY = y + 18;
  doc.text(t.basePack, 105, priceY);
  doc.text(`${data.basePrice}€`, 185, priceY, { align: 'right' });

  if (data.extrasPrice > 0) {
    priceY += 7;
    doc.text(t.extrasTotal, 105, priceY);
    doc.text(`${data.extrasPrice}€`, 185, priceY, { align: 'right' });
  }

  if (data.discount > 0) {
    priceY += 7;
    doc.setTextColor(0, 150, 0);
    doc.text(`${t.discount} (${data.discountReason})`, 105, priceY);
    doc.text(`-${data.discount}€`, 185, priceY, { align: 'right' });
  }

  // Total
  priceY += 10;
  doc.setDrawColor(...COLORS.gold);
  doc.line(105, priceY - 3, 190, priceY - 3);
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(t.total, 105, priceY + 5);
  doc.text(`${data.total}€`, 185, priceY + 5, { align: 'right' });

  // Footer info
  y = 265;
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(t.validUntil, 20, y);
  doc.text(t.disclaimer, 20, y + 5);

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
