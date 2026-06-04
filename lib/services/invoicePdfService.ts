import { COLORS, PAGE, formatPdfMoney } from '@/lib/pdf-config';
import {
  PDF_DESIGN, PDF_BODY_SIZE, PDF_FILL_BOTTOM,
  drawCanonicalPdfHeader, drawCanonicalSectionTitle,
  paintCanonicalPdfPage,
  setStyleLabel, setStyleValue, setStyleBody, setStyleMuted, setStyleCaption, setStylePrice,
  drawAllPageFooters,
} from '@/lib/pdf-header';
import { toIntlLocale } from '@/lib/constants';

type jsPDFType = import('jspdf').jsPDF;

// ── Tipus ────────────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  description: string;
  quantity?: number;
  unitPrice: number;
  total: number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate?: Date | string;

  // Prestador (nosaltres)
  companyName: string;
  companyNIF: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyIBAN: string;

  // Client
  clientName: string;
  clientNIF?: string;
  clientAddress?: string;
  clientEmail: string;
  clientPhone?: string;

  // Event
  eventType: string;
  eventDate: Date | string;
  eventLocation: string;

  // Línies
  lines: InvoiceLineItem[];

  // Totals
  subtotal: number;
  vatRate: number;   // 0 = exempt
  vatAmount: number;
  total: number;

  // Pagaments
  depositAmount: number;
  depositPaid: boolean;
  depositPaidAt?: Date | null;
  remainingAmount: number;
  remainingPaid: boolean;
  remainingPaidAt?: Date | null;

  // Notes opcionals
  notes?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('ca-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(d: Date | string, locale = 'ca'): string {
  if (typeof d === 'string') {
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return d;
  }
  return new Date(d).toLocaleDateString(toIntlLocale(locale as 'ca' | 'es' | 'en'), {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function statusDot(paid: boolean): [number, number, number] {
  return paid ? COLORS.success : COLORS.danger;
}

// ── Generador ────────────────────────────────────────────────────────────────

export async function generateInvoicePDF(
  data: InvoicePdfData,
  locale: 'ca' | 'es' | 'en' = 'ca',
): Promise<jsPDFType> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  paintCanonicalPdfPage(doc);

  const T = {
    ca: {
      title: 'FACTURA', subtitle: 'Prestació de serveis',
      from: 'De', to: 'A', nif: 'NIF', address: 'Adreça', email: 'Email', phone: 'Telèfon',
      event: 'Esdeveniment', date: 'Data event', location: 'Lloc',
      description: 'Descripció', qty: 'Unitats', unitPrice: 'Preu unit.', total: 'Total',
      subtotal: 'Subtotal', vat: `IVA ${data.vatRate}%`, vatExempt: 'Exempt d\'IVA',
      totalLabel: 'TOTAL', iban: 'IBAN per transferència',
      deposit: 'Dipòsit (30%)', depositPaid: 'Pagat', depositPending: 'Pendent',
      remaining: 'Resta (70%)', remainingPaid: 'Pagat', remainingPending: 'Pendent',
      payments: 'Estat dels pagaments', notes: 'Notes',
    },
    es: {
      title: 'FACTURA', subtitle: 'Prestación de servicios',
      from: 'De', to: 'A', nif: 'NIF', address: 'Dirección', email: 'Email', phone: 'Teléfono',
      event: 'Evento', date: 'Fecha evento', location: 'Lugar',
      description: 'Descripción', qty: 'Uds.', unitPrice: 'Precio unit.', total: 'Total',
      subtotal: 'Subtotal', vat: `IVA ${data.vatRate}%`, vatExempt: 'Exento de IVA',
      totalLabel: 'TOTAL', iban: 'IBAN para transferencia',
      deposit: 'Señal (30%)', depositPaid: 'Pagado', depositPending: 'Pendiente',
      remaining: 'Resto (70%)', remainingPaid: 'Pagado', remainingPending: 'Pendiente',
      payments: 'Estado de pagos', notes: 'Notas',
    },
    en: {
      title: 'INVOICE', subtitle: 'Service provision',
      from: 'From', to: 'To', nif: 'VAT ID', address: 'Address', email: 'Email', phone: 'Phone',
      event: 'Event', date: 'Event date', location: 'Location',
      description: 'Description', qty: 'Qty', unitPrice: 'Unit price', total: 'Total',
      subtotal: 'Subtotal', vat: `VAT ${data.vatRate}%`, vatExempt: 'VAT exempt',
      totalLabel: 'TOTAL', iban: 'IBAN for transfer',
      deposit: 'Deposit (30%)', depositPaid: 'Paid', depositPending: 'Pending',
      remaining: 'Remaining (70%)', remainingPaid: 'Paid', remainingPending: 'Pending',
      payments: 'Payment status', notes: 'Notes',
    },
  }[locale];

  const left = PDF_DESIGN.left;
  const right = PDF_DESIGN.right;
  const width = PDF_DESIGN.width;
  const colW = (width - 8) / 2;

  // ── Header ────────────────────────────────────────────────────────────────
  let y = drawCanonicalPdfHeader(doc, {
    title: T.title,
    subtitle: T.subtitle,
    ref: `${data.invoiceNumber} · ${fmtDate(data.issueDate, locale)}`,
  });

  // ── Parts: De / A ─────────────────────────────────────────────────────────
  const partyContentWidth = colW - 8;
  const partyLineHeight = 4.5;
  const measureParty = (name: string, fields: Array<[string, string | undefined]>) => {
    const nameLines = doc.splitTextToSize(name, partyContentWidth);
    const fieldLines = fields
      .filter((field): field is [string, string] => Boolean(field[1]))
      .map(([label, value]) => doc.splitTextToSize(`${label}: ${value}`, partyContentWidth));
    const height = 13 + nameLines.length * 5 + fieldLines.reduce((total, lines) => total + lines.length * partyLineHeight, 0);
    return { nameLines, fieldLines, height };
  };
  const drawParty = (
    x: number,
    top: number,
    role: string,
    measured: ReturnType<typeof measureParty>,
  ) => {
    setStyleLabel(doc);
    doc.text(role.toUpperCase(), x, top + 5);
    setStyleValue(doc);
    doc.text(measured.nameLines, x, top + 11);
    let py = top + 11 + measured.nameLines.length * 5;
    for (const lines of measured.fieldLines) {
      setStyleBody(doc);
      doc.text(lines, x, py);
      py += lines.length * partyLineHeight;
    }
  };

  const companyFields: Array<[string, string | undefined]> = [
    [T.nif, data.companyNIF],
    [T.address, data.companyAddress],
    [T.email, data.companyEmail],
    [T.phone, data.companyPhone],
  ];
  const clientFields: Array<[string, string | undefined]> = [
    [T.nif, data.clientNIF],
    [T.address, data.clientAddress],
    [T.email, data.clientEmail],
    [T.phone, data.clientPhone],
  ];
  const companyParty = measureParty(data.companyName, companyFields);
  const clientParty = measureParty(data.clientName, clientFields);
  const partyCardHeight = Math.max(companyParty.height, clientParty.height);

  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.2);
  doc.roundedRect(left, y, colW, partyCardHeight, 2, 2, 'FD');
  doc.roundedRect(left + colW + PDF_DESIGN.columnGap, y, colW, partyCardHeight, 2, 2, 'FD');

  drawParty(left + 4, y, T.from, companyParty);
  drawParty(left + colW + PDF_DESIGN.columnGap + 4, y, T.to, clientParty);
  y += partyCardHeight + PDF_DESIGN.blockGap;

  // ── Event ─────────────────────────────────────────────────────────────────
  y = drawCanonicalSectionTitle(doc, y, T.event);
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.15);
  const eventFields = [
    { label: T.date, value: fmtDate(data.eventDate, locale) },
    { label: T.location, value: data.eventLocation },
    { label: T.event, value: data.eventType },
  ];
  const fieldW = width / eventFields.length;
  const measuredEventFields = eventFields.map((field) => ({
    ...field,
    lines: doc.splitTextToSize(field.value, fieldW - 10),
  }));
  const eventCardHeight = 11 + Math.max(...measuredEventFields.map((field) => field.lines.length)) * 5;
  doc.roundedRect(left, y, width, eventCardHeight, 1.5, 1.5, 'FD');
  measuredEventFields.forEach(({ label, lines }, i) => {
    const fx = left + i * fieldW + 5;
    setStyleLabel(doc);
    doc.text(label.toUpperCase(), fx, y + 5);
    setStyleValue(doc);
    doc.text(lines, fx, y + 11);
  });
  y += eventCardHeight + PDF_DESIGN.blockGap;

  // ── Taula de línies ───────────────────────────────────────────────────────
  y = drawCanonicalSectionTitle(doc, y, 'Línies de facturació');

  // Capçalera taula
  const descW = width - 25 - 30 - 35;
  doc.setFillColor(...COLORS.blackSoft);
  doc.rect(left, y, width, 7, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_DESIGN.type.caption);
  doc.text(T.description, left + 3, y + 5);
  doc.text(T.qty, left + descW + 3, y + 5);
  doc.text(T.unitPrice, left + descW + 28, y + 5);
  doc.text(T.total, right - 3, y + 5, { align: 'right' });
  y += 7;

  // Files
  for (let i = 0; i < data.lines.length; i++) {
    const line = data.lines[i];
    const descLines = doc.splitTextToSize(line.description, descW - 4);
    const rowH = Math.max(7, descLines.length * 4.5 + 3);
    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.paperBg);
      doc.rect(left, y, width, rowH, 'F');
    }
    doc.setDrawColor(...COLORS.grayLight);
    doc.setLineWidth(0.1);
    doc.line(left, y + rowH, right, y + rowH);
    setStyleBody(doc);
    doc.text(descLines, left + 3, y + 5);
    setStyleMuted(doc);
    doc.text(String(line.quantity ?? 1), left + descW + 3, y + 5);
    doc.text(formatPdfMoney(line.unitPrice, locale), left + descW + 28, y + 5);
    setStyleBody(doc);
    doc.text(formatPdfMoney(line.total, locale), right - 3, y + 5, { align: 'right' });
    y += rowH;
  }
  y += PDF_DESIGN.blockGap;

  // ── Totals ────────────────────────────────────────────────────────────────
  // Subtotals en column dreta lleugera, TOTAL full-width
  const totalsColX = left + width * 0.55;

  const drawTotal = (label: string, value: string, strong = false) => {
    if (strong) {
      // TOTAL: targeta fosca full-width com al pressupost
      doc.setFillColor(...COLORS.blackSoft);
      doc.roundedRect(left + 3, y - 0.5, width - 6, 10, 1.6, 1.6, 'F');
      doc.setFillColor(...COLORS.gold);
      doc.roundedRect(left + 3, y - 0.5, 2.5, 10, 0.5, 0.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(PDF_DESIGN.type.section);
      doc.setTextColor(...COLORS.gold);
      doc.text(label, left + 9, y + 5.8);
      doc.setFontSize(PDF_DESIGN.type.money);
      doc.setTextColor(...COLORS.white);
      doc.text(value, right - 6, y + 7.2, { align: 'right' });
      y += 14;
    } else {
      setStyleMuted(doc);
      doc.text(label, totalsColX, y + 5);
      setStyleBody(doc);
      doc.text(value, right - 3, y + 5, { align: 'right' });
      doc.setDrawColor(...COLORS.grayLight);
      doc.setLineWidth(0.1);
      doc.line(totalsColX, y + 7, right, y + 7);
      y += 8;
    }
  };

  drawTotal(T.subtotal, formatPdfMoney(data.subtotal, locale));
  if (data.vatRate > 0) {
    drawTotal(T.vat, formatPdfMoney(data.vatAmount, locale));
  } else {
    drawTotal(T.vatExempt, '0€');
  }
  drawTotal(T.totalLabel, formatPdfMoney(data.total, locale), true);

  // ── Pagaments ─────────────────────────────────────────────────────────────
  y += PDF_DESIGN.blockGap;
  y = drawCanonicalSectionTitle(doc, y, T.payments);

  const drawPaymentRow = (label: string, amount: number, paid: boolean, paidAt?: Date | null) => {
    const color = statusDot(paid);
    doc.setFillColor(...color);
    doc.circle(left + 3, y + 3.5, 2.5, 'F');
    setStyleValue(doc);
    doc.text(label, left + 9, y + 5);
    setStyleBody(doc);
    doc.text(formatPdfMoney(amount, locale), left + 80, y + 5);
    setStyleMuted(doc);
    const statusText = paid
      ? `${T.depositPaid}${paidAt ? ` · ${fmtDate(paidAt, locale)}` : ''}`
      : (label.includes(T.deposit.split(' ')[0]) ? T.depositPending : T.remainingPending);
    doc.text(statusText, left + 115, y + 5);
    doc.setDrawColor(...COLORS.grayLight);
    doc.setLineWidth(0.1);
    doc.line(left, y + 8, right, y + 8);
    y += 9;
  };

  drawPaymentRow(T.deposit, data.depositAmount, data.depositPaid, data.depositPaidAt);
  drawPaymentRow(T.remaining, data.remainingAmount, data.remainingPaid, data.remainingPaidAt);

  // IBAN
  y += 2;
  setStyleLabel(doc);
  doc.text(`${T.iban}:`, left, y);
  setStyleBody(doc);
  doc.text(data.companyIBAN, left + 55, y);
  y += 8;

  // Notes
  if (data.notes?.trim()) {
    y += 2;
    y = drawCanonicalSectionTitle(doc, y, T.notes);
    setStyleMuted(doc);
    const noteLines = doc.splitTextToSize(data.notes.trim(), width).slice(0, 4);
    doc.text(noteLines, left, y);
    y += noteLines.length * 5.5;
  }

  drawAllPageFooters(doc, y);
  return doc;
}
