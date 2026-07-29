import { toIntlLocale } from '@/lib/constants';
import { COLORS, type jsPDFType } from '@/lib/pdf-config';
import {
  PDF_DESIGN,
  drawAllPageFooters,
  drawCanonicalCard,
  drawCanonicalPdfHeader,
  drawCanonicalSectionTitle,
  paintCanonicalPdfPage,
  setStyleBody,
  setStyleLabel,
  setStyleMuted,
  setStyleValue,
} from '@/lib/pdf-header';
import { getJsPDF } from '@/lib/utils/pdfHelpers';

export type DeliveryNotePdfItem = {
  type: string;
  label: string;
  quantity: number;
};

export type DeliveryNotePdfSnapshot = {
  bookingReference: string;
  clientName: string;
  eventDate: string | null;
  eventLocation: string;
  eventVenue: string | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
  guestCount: number | null;
  items: DeliveryNotePdfItem[];
};

export type DeliveryNotePdfData = {
  reference: string;
  status: string;
  createdAt: Date | string;
  deliveredAt?: Date | string | null;
  signedAt?: Date | string | null;
  signedBy?: string | null;
  snapshot: unknown;
};

type SnapshotRecord = Record<string, unknown>;

function asRecord(value: unknown): SnapshotRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as SnapshotRecord
    : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback: number | null = null): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatPdfDate(value: Date | string | null | undefined, locale: 'ca' | 'es' | 'en' = 'ca') {
  if (!value) return 'Pendent';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(toIntlLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatPdfDateTime(value: Date | string | null | undefined, locale: 'ca' | 'es' | 'en' = 'ca') {
  if (!value) return 'Pendent';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(toIntlLocale(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function deliveryNoteStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Esborrany',
    DELIVERED: 'Lliurat',
    SIGNED: 'Signat',
    CANCELLED: 'Cancel·lat',
  };
  return labels[status] || status;
}

export function normalizeDeliveryNotePdfSnapshot(snapshot: unknown): DeliveryNotePdfSnapshot {
  const root = asRecord(snapshot);
  const client = asRecord(root.client);
  const event = asRecord(root.event);
  const rawItems = Array.isArray(root.items) ? root.items : [];
  const items = rawItems
    .map((item): DeliveryNotePdfItem | null => {
      const row = asRecord(item);
      const label = asString(row.label);
      if (!label) return null;
      return {
        type: asString(row.type, 'SERVICE'),
        label,
        quantity: Math.max(1, Math.floor(asNumber(row.quantity, 1) || 1)),
      };
    })
    .filter((item): item is DeliveryNotePdfItem => Boolean(item));

  return {
    bookingReference: asString(root.bookingReference, 'Reserva'),
    clientName: asString(client.name, 'Client'),
    eventDate: asString(event.date) || null,
    eventLocation: asString(event.location),
    eventVenue: asString(event.venue) || null,
    eventStartTime: asString(event.startTime) || null,
    eventEndTime: asString(event.endTime) || null,
    guestCount: asNumber(event.guestCount),
    items,
  };
}

function drawInfoLine(doc: jsPDFType, label: string, value: string, x: number, y: number, width: number): number {
  setStyleLabel(doc);
  doc.text(label.toUpperCase(), x, y);
  setStyleValue(doc);
  const lines = doc.splitTextToSize(value || '-', width);
  doc.text(lines, x, y + 5);
  return y + 7 + lines.length * 4.2;
}

function ensureSpace(doc: jsPDFType, y: number, needed: number, reference: string): number {
  if (y + needed <= PDF_DESIGN.contentBottom) return y;
  doc.addPage();
  paintCanonicalPdfPage(doc);
  return drawCanonicalPdfHeader(doc, {
    title: 'ALBARÀ',
    subtitle: 'Continuació del servei',
    ref: reference,
  });
}

function drawPartyAndEvent(
  doc: jsPDFType,
  data: DeliveryNotePdfData,
  snapshot: DeliveryNotePdfSnapshot,
  y: number,
  locale: 'ca' | 'es' | 'en',
): number {
  const left = PDF_DESIGN.left;
  const colW = (PDF_DESIGN.width - PDF_DESIGN.columnGap) / 2;
  const cardHeight = 44;
  drawCanonicalCard(doc, left, y, colW, cardHeight);
  drawCanonicalCard(doc, left + colW + PDF_DESIGN.columnGap, y, colW, cardHeight);

  let leftY = y + 8;
  leftY = drawInfoLine(doc, 'Client', snapshot.clientName, left + 5, leftY, colW - 10);
  leftY = drawInfoLine(doc, 'Reserva', snapshot.bookingReference, left + 5, leftY + 1, colW - 10);
  drawInfoLine(doc, 'Albarà', data.reference, left + 5, leftY + 1, colW - 10);

  let rightY = y + 8;
  rightY = drawInfoLine(doc, 'Data del bolo', formatPdfDate(snapshot.eventDate, locale), left + colW + PDF_DESIGN.columnGap + 5, rightY, colW - 10);
  rightY = drawInfoLine(doc, 'Lloc', snapshot.eventVenue || snapshot.eventLocation, left + colW + PDF_DESIGN.columnGap + 5, rightY + 1, colW - 10);
  const schedule = [snapshot.eventStartTime, snapshot.eventEndTime].filter(Boolean).join(' - ') || 'Horari pendent';
  drawInfoLine(doc, 'Horari', schedule, left + colW + PDF_DESIGN.columnGap + 5, rightY + 1, colW - 10);

  return y + cardHeight + PDF_DESIGN.blockGap;
}

function drawItems(doc: jsPDFType, snapshot: DeliveryNotePdfSnapshot, y: number, reference: string): number {
  y = ensureSpace(doc, y, 28, reference);
  y = drawCanonicalSectionTitle(doc, y, 'Serveis executats');

  const left = PDF_DESIGN.left;
  const width = PDF_DESIGN.width;
  const rowHeight = 10;
  const headerHeight = 9;

  doc.setFillColor(...COLORS.blackSoft);
  doc.roundedRect(left, y, width, headerHeight, 1.5, 1.5, 'F');
  doc.setTextColor(...COLORS.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('CONCEPTE', left + 5, y + 6);
  doc.text('UNITATS', PDF_DESIGN.right - 5, y + 6, { align: 'right' });
  y += headerHeight;

  const items = snapshot.items.length > 0 ? snapshot.items : [{ type: 'SERVICE', label: 'Servei segons reserva', quantity: 1 }];
  items.forEach((item, index) => {
    y = ensureSpace(doc, y, rowHeight + 4, reference);
    const fill = index % 2 === 0 ? COLORS.white : COLORS.surfaceWarm;
    doc.setFillColor(...fill);
    doc.setDrawColor(...COLORS.grayLight);
    doc.setLineWidth(0.15);
    doc.rect(left, y, width, rowHeight, 'FD');
    setStyleBody(doc);
    const lines = doc.splitTextToSize(item.label, width - 38).slice(0, 2);
    doc.text(lines, left + 5, y + 6);
    setStyleValue(doc);
    doc.text(String(item.quantity), PDF_DESIGN.right - 5, y + 6, { align: 'right' });
    y += Math.max(rowHeight, 4 + lines.length * 4.2);
  });

  return y + PDF_DESIGN.blockGap;
}

function drawExecutionStatus(
  doc: jsPDFType,
  data: DeliveryNotePdfData,
  y: number,
  locale: 'ca' | 'es' | 'en',
): number {
  y = ensureSpace(doc, y, 38, data.reference);
  y = drawCanonicalSectionTitle(doc, y, 'Estat operatiu');
  const left = PDF_DESIGN.left;
  const width = PDF_DESIGN.width;
  const cardHeight = 35;
  drawCanonicalCard(doc, left, y, width, cardHeight, data.status === 'SIGNED');

  const colW = (width - 12) / 3;
  const top = y + 9;
  drawInfoLine(doc, 'Estat', deliveryNoteStatusLabel(data.status), left + 5, top, colW - 4);
  drawInfoLine(doc, 'Lliurament', formatPdfDateTime(data.deliveredAt, locale), left + 5 + colW, top, colW - 4);
  drawInfoLine(doc, 'Signatura', data.signedAt ? `${data.signedBy || 'Client'} · ${formatPdfDateTime(data.signedAt, locale)}` : 'Pendent', left + 5 + colW * 2, top, colW - 4);

  return y + cardHeight + PDF_DESIGN.blockGap;
}

export async function generateDeliveryNotePDF(
  data: DeliveryNotePdfData,
  locale: 'ca' | 'es' | 'en' = 'ca',
): Promise<jsPDFType> {
  const { default: jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  paintCanonicalPdfPage(doc);
  const snapshot = normalizeDeliveryNotePdfSnapshot(data.snapshot);

  let y = drawCanonicalPdfHeader(doc, {
    title: 'ALBARÀ',
    subtitle: 'Constància de servei',
    ref: `${data.reference} · ${snapshot.bookingReference}`,
  });

  y = drawPartyAndEvent(doc, data, snapshot, y, locale);
  y = drawItems(doc, snapshot, y, data.reference);
  y = drawExecutionStatus(doc, data, y, locale);

  setStyleMuted(doc);
  doc.text(
    doc.splitTextToSize('Aquest document deixa constància operativa dels serveis preparats o executats segons la reserva. No substitueix la factura ni modifica els imports acordats.', PDF_DESIGN.width),
    PDF_DESIGN.left,
    y + 5,
  );
  y += 20;

  drawAllPageFooters(doc, y, 'Albarà de servei');
  return doc;
}

export async function generateDeliveryNotePdfBuffer(
  data: DeliveryNotePdfData,
  locale: 'ca' | 'es' | 'en' = 'ca',
): Promise<Buffer> {
  const doc = await generateDeliveryNotePDF(data, locale);
  return Buffer.from(doc.output('arraybuffer'));
}
