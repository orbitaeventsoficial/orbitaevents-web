/**
 * Document Service - Generació de Pressupostos i Contractes PDF
 *
 * Òrbita Events - 2024
 */

import { SITE_CONFIG } from '@/app/config/site-config';
import { EVENT_TYPE_DOCUMENT_LABELS, getDocumentCompanyInfo } from '@/lib/constants';
import { VAT_RATE_INVOICE, calcVatAmount, roundMoney } from '@/lib/constants/pricing';
import { INCLUDED_TRAVEL_KM } from '@/lib/services/travelCost';
import { escapeHtml } from '@/lib/utils/sanitize';


// ============================================
// TIPUS
// ============================================

export interface QuoteData {
  // Client
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  clientNIF?: string;

  // Event
  eventType: string;
  eventDate: Date;
  eventTime?: string;
  eventLocation: string;
  eventEndTime?: string;
  guestCount: number;

  // Serveis
  packName: string;
  packDescription?: string;
  packPrice: number;
  djHours: number;
  extraHourPrice: number;
  extras?: QuoteExtra[];

  // Totals
  subtotal: number;
  discount?: number;
  discountCode?: string;
  iva: number;
  total: number;

  // Meta
  quoteNumber: string;
  validUntil: Date;
  notes?: string;
}

export interface QuoteExtra {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

interface QuoteTemplateOverrides {
  introTitle?: string;
  introSubtitle?: string;
  ctaTitle?: string;
  ctaSubtitle?: string;
  conditions?: string[];
}

export interface ContractData extends QuoteData {
  // Condicions contractuals
  depositAmount: number;
  depositDueDate: Date;
  finalPaymentDueDate: Date;

  // Dades empresa
  companyName: string;
  companyNIF: string;
  companyAddress: string;

  // Contract specifics
  contractNumber: string;
  contractDate: Date;
  cancellationPolicy: string;
}

// ============================================
// GENERAR NÚMERO DE DOCUMENT
// ============================================

export function generateQuoteNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `PRE-${year}-${timestamp}`;
}

// ============================================
// GENERAR HTML DEL PRESSUPOST
// ============================================

export function generateQuoteHTML(data: QuoteData, template: QuoteTemplateOverrides = {}): string {
  const companyInfo = getDocumentCompanyInfo();
  const eventTypeLabel = getEventTypeLabel(data.eventType);
  const formattedDate = new Date(data.eventDate).toLocaleDateString('ca-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const validUntil = new Date(data.validUntil).toLocaleDateString('ca-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const introTitle = template.introTitle?.trim() || 'PRESSUPOST';
  const introSubtitle =
    template.introSubtitle?.trim() || 'Proposta feta a mida per al teu esdeveniment';
  const ctaTitle = template.ctaTitle?.trim() || "T'agrada el que veus?";
  const ctaSubtitle =
    template.ctaSubtitle?.trim() || "Reserva la teva data ara i assegura't el millor preu";
  const conditions = Array.isArray(template.conditions) && template.conditions.length > 0
    ? template.conditions
    : [
        "Reserva: la data queda confirmada amb el pagament del 30% d'aval.",
        "Pagament final: el 70% restant s'abona 7 dies abans de l'esdeveniment.",
        "Cancel·lació: >60 dies, 100% retorn de l'aval; 30-60 dies, 50% retorn; <30 dies, l'aval no és reemborsable.",
        `Desplaçament: inclòs fins a ${INCLUDED_TRAVEL_KM} km de Granollers. Per a distàncies superiors, et passarem pressupost.`,
        "Hores extres: si l'esdeveniment s'allarga, es facturaran al preu indicat.",
      ];

  return `
<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pressupost ${data.quoteNumber} - Òrbita Events</title>
  <style>
    @page { margin: 20mm; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #e5e7eb;
      background: #0f1113;
    }

    .document {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      background: #14181c;
      border: 1px solid #2a2f36;
      border-radius: 12px;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #d4b06e;
    }
    .logo { display: flex; align-items: center; }
    .logo img { width: 210px; max-width: 100%; height: auto; }
    .company-info { text-align: right; font-size: 9pt; color: #a1acb8; }

    /* Document Title */
    .doc-title {
      background: linear-gradient(135deg, #181d22, #232a31);
      color: #fff;
      padding: 20px 30px;
      border-radius: 8px;
      margin-bottom: 30px;
      border: 1px solid #2f3740;
    }
    .doc-title h1 { font-size: 18pt; font-weight: 300; margin-bottom: 8px; }
    .doc-title .number { font-size: 14pt; color: #d4b06e; font-weight: 600; }
    .doc-title .date { font-size: 10pt; color: #9ba4af; margin-top: 8px; }

    /* Client & Event Info */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .info-box {
      background: #1a1f25;
      border: 1px solid #2d343c;
      padding: 20px;
      border-radius: 8px;
    }
    .info-box h3 {
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #d4b06e;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #313a44;
    }
    .info-box p { margin-bottom: 6px; }
    .info-box .label { color: #94a3b8; font-size: 9pt; }
    .info-box .value { font-weight: 500; }

    /* Services Table */
    .services-section { margin-bottom: 30px; }
    .services-section h2 {
      font-size: 12pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #f1f5f9;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #d4b06e;
    }

    table { width: 100%; border-collapse: collapse; }
    thead { background: #20262d; color: #f8fafc; }
    th {
      padding: 12px 16px;
      text-align: left;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th:last-child { text-align: right; }
    td {
      padding: 16px;
      border-bottom: 1px solid #2b333d;
      vertical-align: top;
    }
    td:last-child { text-align: right; font-weight: 500; }
    .item-name { font-weight: 600; color: #f3f4f6; }
    .item-desc { font-size: 9pt; color: #9ca3af; margin-top: 4px; }

    /* Totals */
    .totals {
      margin-left: auto;
      width: 280px;
      background: #1a1f25;
      border: 1px solid #2d343c;
      padding: 20px;
      border-radius: 8px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #2b333d;
    }
    .totals-row:last-child { border-bottom: none; }
    .totals-row.total {
      font-size: 14pt;
      font-weight: 700;
      color: #d4b06e;
      border-top: 2px solid #d4b06e;
      padding-top: 12px;
      margin-top: 8px;
    }
    .totals-row .label { color: #a1acb8; }
    .discount { color: #22c55e; }

    /* Notes & Conditions */
    .notes-section {
      margin-top: 30px;
      padding: 20px;
      background: #2b2419;
      border-left: 4px solid #d4b06e;
      border-radius: 0 8px 8px 0;
    }
    .notes-section h3 { font-size: 10pt; color: #f7d9a6; margin-bottom: 8px; }
    .notes-section p { font-size: 9pt; color: #e9c98c; }

    .conditions {
      margin-top: 30px;
      padding: 20px;
      background: #1a1f25;
      border: 1px solid #2d343c;
      border-radius: 8px;
      font-size: 9pt;
      color: #b7c0cb;
    }
    .conditions h3 { font-size: 10pt; color: #e2e8f0; margin-bottom: 12px; }
    .conditions ul { padding-left: 20px; }
    .conditions li { margin-bottom: 6px; }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #2b333d;
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      color: #a1acb8;
    }
    .validity {
      background: #20262d;
      color: #fff;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 10pt;
      border: 1px solid #2f3740;
    }
    .validity strong { color: #d4b06e; }

    /* CTA */
    .cta-section {
      margin-top: 30px;
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, #181d22, #232a31);
      border-radius: 12px;
      color: #fff;
      border: 1px solid #2f3740;
    }
    .cta-section h3 { font-size: 14pt; margin-bottom: 8px; }
    .cta-section p { color: #aeb6c0; font-size: 10pt; margin-bottom: 16px; }
    .cta-buttons { display: flex; justify-content: center; gap: 16px; }
    .cta-btn {
      display: inline-block;
      padding: 12px 24px;
      background: #d4b06e;
      color: #111827;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 10pt;
    }
    .cta-btn.secondary { background: #26303a; color: #f3f4f6; border: 1px solid #3a4652; }
  </style>
</head>
<body>
  <div class="document">
    <!-- Header -->
    <div class="header">
      <div class="logo"><img src="${companyInfo.logoUrl}" alt="Òrbita Events" /></div>
      <div class="company-info">
        <strong>${companyInfo.legalName}</strong><br>
        ${companyInfo.address}<br>
        ${companyInfo.phoneDisplay || companyInfo.phone}<br>
        ${companyInfo.email}<br>
        ${companyInfo.web}
      </div>
    </div>

    <!-- Document Title -->
    <div class="doc-title">
      <h1>${escapeHtml(introTitle)}</h1>
      <div class="number">${data.quoteNumber}</div>
      <div style="font-size: 10pt; color: #b7c0cb; margin-top: 6px;">${escapeHtml(introSubtitle)}</div>
      <div class="date">Emès: ${new Date().toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>

    <!-- Client & Event Info -->
    <div class="info-grid">
      <div class="info-box">
        <h3>Dades del Client</h3>
        <p><span class="value">${escapeHtml(data.clientName)}</span></p>
        <p><span class="label">Email:</span> ${escapeHtml(data.clientEmail)}</p>
        ${data.clientPhone ? `<p><span class="label">Telèfon:</span> ${escapeHtml(data.clientPhone)}</p>` : ''}
        ${data.clientAddress ? `<p><span class="label">Adreça:</span> ${escapeHtml(data.clientAddress)}</p>` : ''}
        ${data.clientNIF ? `<p><span class="label">NIF:</span> ${escapeHtml(data.clientNIF)}</p>` : ''}
      </div>
      <div class="info-box">
        <h3>Dades de l'Esdeveniment</h3>
        <p><span class="value">${escapeHtml(eventTypeLabel)}</span></p>
        <p><span class="label">Data:</span> ${escapeHtml(formattedDate)}</p>
        ${data.eventTime ? `<p><span class="label">Hora:</span> ${escapeHtml(data.eventTime)}${data.eventEndTime ? ` - ${escapeHtml(data.eventEndTime)}` : ''}</p>` : ''}
        <p><span class="label">Lloc:</span> ${escapeHtml(data.eventLocation)}</p>
        <p><span class="label">Convidats:</span> ${data.guestCount} persones</p>
      </div>
    </div>

    <!-- Services -->
    <div class="services-section">
      <h2>Serveis Inclosos</h2>
      <table>
        <thead>
          <tr>
            <th>Servei</th>
            <th>Detalls</th>
            <th>Import</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="item-name">${escapeHtml(data.packName)}</div>
              ${data.packDescription ? `<div class="item-desc">${escapeHtml(data.packDescription)}</div>` : ''}
            </td>
            <td>
              ${data.djHours}h de DJ professional<br>
              <span style="font-size: 9pt; color: #9ca3af;">Hora extra: ${data.extraHourPrice}€</span>
            </td>
            <td>${data.packPrice.toFixed(2)}€</td>
          </tr>
          ${data.extras?.map(extra => `
          <tr>
            <td>
              <div class="item-name">${escapeHtml(extra.name)}</div>
              ${extra.description ? `<div class="item-desc">${escapeHtml(extra.description)}</div>` : ''}
            </td>
            <td>${extra.quantity > 1 ? `${extra.quantity} unitats` : ''}</td>
            <td>${(extra.price * extra.quantity).toFixed(2)}€</td>
          </tr>
          `).join('') || ''}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-row">
        <span class="label">Subtotal</span>
        <span>${data.subtotal.toFixed(2)}€</span>
      </div>
      ${data.discount ? `
      <div class="totals-row discount">
        <span class="label">Descompte ${data.discountCode ? `(${escapeHtml(data.discountCode)})` : ''}</span>
        <span>-${data.discount.toFixed(2)}€</span>
      </div>
      ` : ''}
      <div class="totals-row">
        <span class="label">IVA (${VAT_RATE_INVOICE}%)</span>
        <span>${data.iva.toFixed(2)}€</span>
      </div>
      <div class="totals-row total">
        <span>TOTAL</span>
        <span>${data.total.toFixed(2)}€</span>
      </div>
    </div>

    ${data.notes ? `
    <!-- Notes -->
    <div class="notes-section">
      <h3>Notes</h3>
      <p>${escapeHtml(data.notes)}</p>
    </div>
    ` : ''}

    <!-- Conditions -->
    <div class="conditions">
      <h3>Condicions del pressupost</h3>
      <ul>
        ${conditions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>
        <strong>Òrbita Events</strong><br>
        L'Esdeveniment Que La Teva Gent NO Oblidarà
      </div>
      <div class="validity">
        Vàlid fins: <strong>${validUntil}</strong>
      </div>
    </div>

    <!-- CTA -->
    <div class="cta-section">
      <h3>${escapeHtml(ctaTitle)}</h3>
      <p>${escapeHtml(ctaSubtitle)}</p>
      <div class="cta-buttons">
        <a href="https://wa.me/${SITE_CONFIG.business.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hola! Vull confirmar el pressupost ${data.quoteNumber} per ${eventTypeLabel} el ${formattedDate}.`)}" class="cta-btn">Confirmar per WhatsApp</a>
        <a href="tel:${SITE_CONFIG.business.phone}" class="cta-btn secondary">${SITE_CONFIG.business.phoneDisplay}</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================
// HELPERS
// ============================================

function getEventTypeLabel(eventType: string): string {
  return EVENT_TYPE_DOCUMENT_LABELS[eventType] || eventType;
}

// ============================================
// CREAR PRESSUPOST DES D'UN LEAD
// ============================================

export function createQuoteFromLead(
  lead: {
    name: string;
    email: string;
    phone?: string | null;
    eventType: string;
    eventDate?: Date | null;
    guestCount?: number | null;
    budget?: string | null;
    message?: string | null;
    eventLocation?: string | null;
    interestedPackId?: string | null;
  },
  packData: {
    name: string;
    price: number;
    djHours: number;
    extraHourPrice: number;
    description?: string;
  },
  extras?: QuoteExtra[]
): QuoteData {
  const subtotal = packData.price + (extras?.reduce((sum, e) => sum + e.price * e.quantity, 0) || 0);
  const iva = calcVatAmount(subtotal, true);
  const total = roundMoney(subtotal + iva);

  // Validesa: 15 dies
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 15);

  return {
    clientName: lead.name,
    clientEmail: lead.email,
    clientPhone: lead.phone || undefined,

    eventType: lead.eventType,
    eventDate: lead.eventDate || new Date(),
    eventLocation: lead.eventLocation || 'A determinar',
    guestCount: lead.guestCount || 100,

    packName: packData.name,
    packDescription: packData.description,
    packPrice: packData.price,
    djHours: packData.djHours,
    extraHourPrice: packData.extraHourPrice,
    extras,

    subtotal,
    iva,
    total,

    quoteNumber: generateQuoteNumber(),
    validUntil,
    notes: lead.message || undefined,
  };
}



