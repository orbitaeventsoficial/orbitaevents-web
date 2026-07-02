import { COLORS, formatPdfMoney } from '@/lib/pdf-config';
import {
  PDF_DESIGN,
  drawCanonicalPdfHeader, drawCanonicalSectionTitle,
  paintCanonicalPdfPage,
  setStyleLabel, setStyleValue, setStyleBody, setStyleMuted,
  drawAllPageFooters,
} from '@/lib/pdf-header';
import { toIntlLocale } from '@/lib/constants';
import type { CollaboratorPayoutSummary, CollaboratorPayoutBolo } from '@/lib/services/collaboratorPayoutService';

type jsPDFType = import('jspdf').jsPDF;

const STATUS_LABEL: Record<CollaboratorPayoutBolo['status'], string> = {
  PREVI: 'Previst',
  ENTREGAT: 'A pagar',
  PAGAT: 'Pagat',
};

function fmtDate(dateKey: string | null): string {
  if (!dateKey) return '—';
  return new Date(dateKey).toLocaleDateString(toIntlLocale('ca'), { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * PDF de liquidació d'un col·laborador (#1364): desglossament bolo a bolo de la seva
 * pasta amb la logística de la jornada (sortida / arribada / tornada, muntatge+desmuntatge).
 * Per presentar-li o entregar-li al col·laborador (p.ex. Masquerade).
 */
export async function generateCollaboratorPayoutPDF(
  summary: CollaboratorPayoutSummary,
): Promise<jsPDFType> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  paintCanonicalPdfPage(doc);

  const left = PDF_DESIGN.left;
  const right = PDF_DESIGN.right;
  const width = PDF_DESIGN.width;

  let y = drawCanonicalPdfHeader(doc, {
    title: 'LIQUIDACIÓ',
    subtitle: summary.collaboratorName,
    ref: `Generat ${new Date().toLocaleDateString(toIntlLocale('ca'), { day: 'numeric', month: 'long', year: 'numeric' })}`,
  });

  // ── Resum de totals ──────────────────────────────────────────────────────────
  y = drawCanonicalSectionTitle(doc, y, 'Resum');
  const cardW = (width - 8) / 3;
  const cards: Array<[string, number]> = [
    ['Previst', summary.totals.previ],
    ['A pagar', summary.totals.aPagar],
    ['Pagat', summary.totals.pagat],
  ];
  cards.forEach(([label, value], i) => {
    const cx = left + i * (cardW + 4);
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.grayLight);
    doc.setLineWidth(0.2);
    doc.roundedRect(cx, y, cardW, 16, 1.5, 1.5, 'FD');
    setStyleLabel(doc);
    doc.text(label.toUpperCase(), cx + 4, y + 6);
    setStyleValue(doc);
    doc.setFontSize(PDF_DESIGN.type.money);
    doc.text(formatPdfMoney(value, 'ca'), cx + 4, y + 13);
  });
  y += 16 + PDF_DESIGN.blockGap;

  // ── Taula de bolos ───────────────────────────────────────────────────────────
  y = drawCanonicalSectionTitle(doc, y, 'Detall per bolo');

  // Capçalera
  doc.setFillColor(...COLORS.blackSoft);
  doc.rect(left, y, width, 7, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_DESIGN.type.caption);
  doc.text('Bolo', left + 3, y + 5);
  doc.text('Data', left + width * 0.42, y + 5);
  doc.text('Estat', left + width * 0.62, y + 5);
  doc.text('Pasta', right - 3, y + 5, { align: 'right' });
  y += 7;

  const pageBottom = PDF_DESIGN.pageHeight - 20;
  for (let i = 0; i < summary.bolos.length; i++) {
    const b = summary.bolos[i];
    const j = b.jornada;
    const hasLogistics = j.departureTime && j.returnTime;
    const rowH = hasLogistics ? 12 : 8;

    if (y + rowH > pageBottom) {
      doc.addPage();
      paintCanonicalPdfPage(doc);
      y = PDF_DESIGN.contentTop;
    }

    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.paperBg);
      doc.rect(left, y, width, rowH, 'F');
    }
    doc.setDrawColor(...COLORS.grayLight);
    doc.setLineWidth(0.1);
    doc.line(left, y + rowH, right, y + rowH);

    setStyleBody(doc);
    doc.text(doc.splitTextToSize(b.parentRef, width * 0.4)[0] ?? b.parentRef, left + 3, y + 5);
    setStyleMuted(doc);
    doc.text(fmtDate(b.dateKey), left + width * 0.42, y + 5);
    doc.text(STATUS_LABEL[b.status], left + width * 0.62, y + 5);
    setStyleBody(doc);
    doc.text(formatPdfMoney(b.amount, 'ca'), right - 3, y + 5, { align: 'right' });

    // Logística de la jornada com a subtext.
    if (hasLogistics) {
      setStyleMuted(doc);
      doc.setFontSize(PDF_DESIGN.type.caption);
      const parts = [
        `Sortida ${j.departureTime}`,
        `arribada ${j.arrivalTime}`,
        b.eventStartTime && b.eventEndTime ? `event ${b.eventStartTime}–${b.eventEndTime}` : null,
        `tornada ${j.returnTime}`,
        j.workHours != null ? `${j.workHours} h jornada` : null,
      ].filter(Boolean);
      doc.text(parts.join(' · '), left + 3, y + 9.5);
    }
    y += rowH;
  }

  y += PDF_DESIGN.blockGap;

  // ── Total a pagar (entregat pendent) ────────────────────────────────────────
  doc.setFillColor(...COLORS.blackSoft);
  doc.roundedRect(left + 3, y, width - 6, 10, 1.6, 1.6, 'F');
  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(left + 3, y, 2.5, 10, 0.5, 0.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_DESIGN.type.section);
  doc.setTextColor(...COLORS.gold);
  doc.text('TOTAL A PAGAR', left + 9, y + 6.3);
  doc.setFontSize(PDF_DESIGN.type.money);
  doc.setTextColor(...COLORS.white);
  doc.text(formatPdfMoney(summary.totals.aPagar, 'ca'), right - 6, y + 7.5, { align: 'right' });
  y += 14;

  setStyleMuted(doc);
  doc.setFontSize(PDF_DESIGN.type.caption);
  doc.text('Muntatge i desmuntatge: 45 min cadascun. Temps de ruta estimat sobre la distància del bolo.', left + 3, y + 4);

  drawAllPageFooters(doc, y + 6);
  return doc;
}
