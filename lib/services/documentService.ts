/**
 * Document Service - Generació de Pressupostos i Contractes PDF
 *
 * Òrbita Events - 2024
 */

import { SITE_CONFIG } from '@/app/config/site-config';

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
// CONFIGURACIÓ EMPRESA
// ============================================

const COMPANY_INFO = {
  name: 'Òrbita Events',
  legalName: 'Carles Ros Oliveras', // Autònom
  nif: 'XXXXXXXX-X', // Substituir pel real
  address: 'Granollers, Barcelona',
  phone: SITE_CONFIG.business.phone,
  email: SITE_CONFIG.business.email,
  web: 'www.orbitaevents.com',
  iban: 'ESXX XXXX XXXX XXXX XXXX XXXX', // Substituir pel real
};

// ============================================
// GENERAR NÚMERO DE DOCUMENT
// ============================================

export function generateQuoteNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `PRE-${year}-${timestamp}`;
}

export function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `CTR-${year}-${timestamp}`;
}

// ============================================
// GENERAR HTML DEL PRESSUPOST
// ============================================

export function generateQuoteHTML(data: QuoteData): string {
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
      color: #1a1a1a;
      background: #fff;
    }

    .document { max-width: 210mm; margin: 0 auto; padding: 20mm; }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #DAA520;
    }
    .logo { font-size: 28pt; font-weight: 800; color: #1a1a1a; }
    .logo span { color: #DAA520; }
    .company-info { text-align: right; font-size: 9pt; color: #666; }

    /* Document Title */
    .doc-title {
      background: linear-gradient(135deg, #1a1a1a, #333);
      color: #fff;
      padding: 20px 30px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .doc-title h1 { font-size: 18pt; font-weight: 300; margin-bottom: 8px; }
    .doc-title .number { font-size: 14pt; color: #DAA520; font-weight: 600; }
    .doc-title .date { font-size: 10pt; color: #999; margin-top: 8px; }

    /* Client & Event Info */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .info-box { background: #f8f8f8; padding: 20px; border-radius: 8px; }
    .info-box h3 {
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #DAA520;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #ddd;
    }
    .info-box p { margin-bottom: 6px; }
    .info-box .label { color: #888; font-size: 9pt; }
    .info-box .value { font-weight: 500; }

    /* Services Table */
    .services-section { margin-bottom: 30px; }
    .services-section h2 {
      font-size: 12pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #1a1a1a;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #DAA520;
    }

    table { width: 100%; border-collapse: collapse; }
    thead { background: #1a1a1a; color: #fff; }
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
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }
    td:last-child { text-align: right; font-weight: 500; }
    .item-name { font-weight: 600; color: #1a1a1a; }
    .item-desc { font-size: 9pt; color: #666; margin-top: 4px; }

    /* Totals */
    .totals {
      margin-left: auto;
      width: 280px;
      background: #f8f8f8;
      padding: 20px;
      border-radius: 8px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .totals-row:last-child { border-bottom: none; }
    .totals-row.total {
      font-size: 14pt;
      font-weight: 700;
      color: #DAA520;
      border-top: 2px solid #DAA520;
      padding-top: 12px;
      margin-top: 8px;
    }
    .totals-row .label { color: #666; }
    .discount { color: #22c55e; }

    /* Notes & Conditions */
    .notes-section {
      margin-top: 30px;
      padding: 20px;
      background: #fffbeb;
      border-left: 4px solid #DAA520;
      border-radius: 0 8px 8px 0;
    }
    .notes-section h3 { font-size: 10pt; color: #92400e; margin-bottom: 8px; }
    .notes-section p { font-size: 9pt; color: #78350f; }

    .conditions {
      margin-top: 30px;
      padding: 20px;
      background: #f1f5f9;
      border-radius: 8px;
      font-size: 9pt;
      color: #64748b;
    }
    .conditions h3 { font-size: 10pt; color: #334155; margin-bottom: 12px; }
    .conditions ul { padding-left: 20px; }
    .conditions li { margin-bottom: 6px; }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      color: #888;
    }
    .validity {
      background: #1a1a1a;
      color: #fff;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 10pt;
    }
    .validity strong { color: #DAA520; }

    /* CTA */
    .cta-section {
      margin-top: 30px;
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, #1a1a1a, #333);
      border-radius: 12px;
      color: #fff;
    }
    .cta-section h3 { font-size: 14pt; margin-bottom: 8px; }
    .cta-section p { color: #999; font-size: 10pt; margin-bottom: 16px; }
    .cta-buttons { display: flex; justify-content: center; gap: 16px; }
    .cta-btn {
      display: inline-block;
      padding: 12px 24px;
      background: #DAA520;
      color: #000;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 10pt;
    }
    .cta-btn.secondary { background: #333; color: #fff; border: 1px solid #555; }
  </style>
</head>
<body>
  <div class="document">
    <!-- Header -->
    <div class="header">
      <div class="logo">ÒRBITA <span>EVENTS</span></div>
      <div class="company-info">
        <strong>${COMPANY_INFO.legalName}</strong><br>
        ${COMPANY_INFO.address}<br>
        ${COMPANY_INFO.phone}<br>
        ${COMPANY_INFO.email}
      </div>
    </div>

    <!-- Document Title -->
    <div class="doc-title">
      <h1>PRESSUPOST</h1>
      <div class="number">${data.quoteNumber}</div>
      <div class="date">Emès: ${new Date().toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>

    <!-- Client & Event Info -->
    <div class="info-grid">
      <div class="info-box">
        <h3>Dades del Client</h3>
        <p><span class="value">${data.clientName}</span></p>
        <p><span class="label">Email:</span> ${data.clientEmail}</p>
        ${data.clientPhone ? `<p><span class="label">Telèfon:</span> ${data.clientPhone}</p>` : ''}
        ${data.clientAddress ? `<p><span class="label">Adreça:</span> ${data.clientAddress}</p>` : ''}
        ${data.clientNIF ? `<p><span class="label">NIF:</span> ${data.clientNIF}</p>` : ''}
      </div>
      <div class="info-box">
        <h3>Dades de l'Esdeveniment</h3>
        <p><span class="value">${eventTypeLabel}</span></p>
        <p><span class="label">Data:</span> ${formattedDate}</p>
        ${data.eventTime ? `<p><span class="label">Hora:</span> ${data.eventTime}${data.eventEndTime ? ` - ${data.eventEndTime}` : ''}</p>` : ''}
        <p><span class="label">Lloc:</span> ${data.eventLocation}</p>
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
              <div class="item-name">${data.packName}</div>
              ${data.packDescription ? `<div class="item-desc">${data.packDescription}</div>` : ''}
            </td>
            <td>
              ${data.djHours}h de DJ professional<br>
              <span style="font-size: 9pt; color: #888;">Hora extra: ${data.extraHourPrice}€</span>
            </td>
            <td>${data.packPrice.toFixed(2)}€</td>
          </tr>
          ${data.extras?.map(extra => `
          <tr>
            <td>
              <div class="item-name">${extra.name}</div>
              ${extra.description ? `<div class="item-desc">${extra.description}</div>` : ''}
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
        <span class="label">Descompte ${data.discountCode ? `(${data.discountCode})` : ''}</span>
        <span>-${data.discount.toFixed(2)}€</span>
      </div>
      ` : ''}
      <div class="totals-row">
        <span class="label">IVA (21%)</span>
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
      <p>${data.notes}</p>
    </div>
    ` : ''}

    <!-- Conditions -->
    <div class="conditions">
      <h3>Condicions del pressupost</h3>
      <ul>
        <li><strong>Reserva:</strong> Es considera reserva ferma amb el pagament del 30% d'aval.</li>
        <li><strong>Pagament final:</strong> El 70% restant s'abona 7 dies abans de l'esdeveniment.</li>
        <li><strong>Cancel·lació:</strong> L'aval no és reemborsable un cop confirmada la reserva.</li>
        <li><strong>Desplaçament:</strong> Inclòs fins a 50km de Granollers. Consulteu per a distàncies superiors.</li>
        <li><strong>Hores extres:</strong> Es facturaran al preu indicat si l'esdeveniment s'allarga.</li>
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
      <h3>T'agrada el que veus?</h3>
      <p>Reserva la teva data ara i assegura't el millor preu</p>
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
  const labels: Record<string, string> = {
    WEDDING: 'Boda',
    BIRTHDAY: 'Aniversari / Cumpleaños',
    CORPORATE: 'Esdeveniment Corporatiu',
    COMMUNION: 'Comunió',
    BAPTISM: 'Bateig',
    GRADUATION: 'Graduació',
    ANNIVERSARY: 'Aniversari',
    PRIVATE_PARTY: 'Festa Privada',
    OTHER: 'Esdeveniment',
  };
  return labels[eventType] || eventType;
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
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

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
