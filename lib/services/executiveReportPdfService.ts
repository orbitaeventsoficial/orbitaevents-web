import { COLORS, PAGE } from '@/lib/pdf-config';
import { ORBITA_LOGO_BASE64 } from '@/lib/logo-base64';
import type { ExecutiveReport } from '@/lib/services/executiveReportService';

// ───────────────────────────────────────────────────────────────────────────
// PURE — Executive Report PDF generation
// ───────────────────────────────────────────────────────────────────────────

type RGB = [number, number, number];

const REPORT_TITLE = 'Informe Executiu';
const BRAND_NAME = 'ORBITA EVENTS';

function addReportHeader(doc: import('jspdf').jsPDF, subtitle: string): number {
  doc.setFillColor(...COLORS.blackSoft);
  doc.rect(0, 0, PAGE.width, 44, 'F');
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 0, 5, 44, 'F');
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 42, PAGE.width, 2, 'F');

  let textX = 18;
  try {
    doc.addImage(ORBITA_LOGO_BASE64, 'PNG', 10, 4, 32, 32);
    textX = 48;
  } catch { /* fallback text only */ }

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(BRAND_NAME, textX, 20);
  doc.setTextColor(...COLORS.grayLight);
  doc.setFontSize(10);
  doc.text(subtitle.toUpperCase(), textX, 32);

  return 54;
}

function addReportFooter(doc: import('jspdf').jsPDF, page: number, total: number): void {
  const y = PAGE.height - 18;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(PAGE.marginLeft, y, PAGE.width - PAGE.marginRight, y);
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pagina ${page} / ${total}`, PAGE.width - PAGE.marginRight, y + 8, { align: 'right' });
  doc.text('orbitaevents.com', PAGE.marginLeft, y + 8);
}

function checkBreak(doc: import('jspdf').jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE.safeBottom) {
    doc.addPage();
    return addReportHeader(doc, REPORT_TITLE);
  }
  return y;
}

function sectionTitle(doc: import('jspdf').jsPDF, y: number, text: string): number {
  y = checkBreak(doc, y, 18);
  doc.setFillColor(...COLORS.gold);
  doc.rect(PAGE.marginLeft, y, 3, 10, 'F');
  doc.setTextColor(...COLORS.blackSoft);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(text, PAGE.marginLeft + 8, y + 8);
  return y + 16;
}

function kpiCard(
  doc: import('jspdf').jsPDF,
  x: number,
  y: number,
  w: number,
  label: string,
  value: string,
  accent: RGB = COLORS.gold,
): void {
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(x, y, w, 22, 2, 2, 'F');
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.6);
  doc.line(x, y, x + w, y);

  doc.setTextColor(...accent);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(value, x + w / 2, y + 10, { align: 'center' });

  doc.setTextColor(...COLORS.grayDark);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(label, x + w / 2, y + 18, { align: 'center' });
}

function simpleTable(
  doc: import('jspdf').jsPDF,
  y: number,
  headers: string[],
  rows: string[][],
  colWidths?: number[],
): number {
  const startX = PAGE.marginLeft;
  const totalW = PAGE.contentWidth;
  const cols = headers.length;
  const widths = colWidths || Array(cols).fill(totalW / cols);
  const rowH = 7;

  y = checkBreak(doc, y, rowH * (rows.length + 2));

  // Header
  doc.setFillColor(...COLORS.blackSoft);
  doc.rect(startX, y, totalW, rowH, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  let cx = startX;
  for (let i = 0; i < cols; i++) {
    doc.text(headers[i], cx + 2, y + 5);
    cx += widths[i];
  }
  y += rowH;

  // Rows
  for (let r = 0; r < rows.length; r++) {
    y = checkBreak(doc, y, rowH);
    if (r % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(startX, y, totalW, rowH, 'F');
    }
    doc.setTextColor(...COLORS.blackSoft);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    cx = startX;
    for (let i = 0; i < cols; i++) {
      doc.text(rows[r][i] ?? '', cx + 2, y + 5);
      cx += widths[i];
    }
    y += rowH;
  }

  return y + 4;
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('ca-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

export async function exportExecutiveReportPdf(report: ExecutiveReport): Promise<ArrayBuffer> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  const genDate = new Date(report.generatedAt).toLocaleDateString('ca-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  let y = addReportHeader(doc, REPORT_TITLE);

  // ── Date line ──
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generat el ${genDate}`, PAGE.width - PAGE.marginRight, y, { align: 'right' });
  y += 8;

  // ── KPI Cards (2 rows of 4) ──
  y = sectionTitle(doc, y, 'Indicadors principals');
  const kpis = [
    { label: 'Clients', value: fmt(report.headline.customers) },
    { label: 'Leads oberts', value: fmt(report.headline.openLeads) },
    { label: 'Reserves tancades', value: fmt(report.headline.bookingsClosed) },
    { label: 'Ingressos (EUR)', value: fmt(report.headline.revenueClosed, 0) },
    { label: 'Pipeline brut (EUR)', value: fmt(report.headline.pipelineRaw, 0) },
    { label: 'Forecast ponderat (EUR)', value: fmt(report.headline.forecastWeighted, 0) },
    { label: 'SLA trencats', value: fmt(report.headline.slaBroken), accent: COLORS.grayDark as RGB },
  ];
  const cardW = 40;
  const cardGap = 2;
  const cardsPerRow = 4;
  for (let i = 0; i < kpis.length; i++) {
    const row = Math.floor(i / cardsPerRow);
    const col = i % cardsPerRow;
    const x = PAGE.marginLeft + col * (cardW + cardGap);
    const cardY = y + row * 28;
    kpiCard(doc, x, cardY, cardW, kpis[i].label, kpis[i].value, (kpis[i] as { accent?: RGB }).accent || COLORS.gold);
  }
  y += Math.ceil(kpis.length / cardsPerRow) * 28 + 4;

  // ── Funnel ──
  y = sectionTitle(doc, y, 'Embut comercial');
  const funnelEntries = Object.entries(report.funnel) as [string, number][];
  y = simpleTable(
    doc, y,
    ['Estat', 'Quantitat'],
    funnelEntries.map(([status, count]) => [status, fmt(count)]),
    [100, 70],
  );

  // ── Conversion by source ──
  y = sectionTitle(doc, y, 'Conversio per origen');
  y = simpleTable(
    doc, y,
    ['Origen', 'Total', 'Guanyats', 'Taxa', 'Ingres mig (EUR)'],
    report.conversionBySource.map((s) => [
      s.source, fmt(s.total), fmt(s.won), pct(s.winRate), fmt(s.avgRevenue, 2),
    ]),
    [50, 25, 25, 30, 40],
  );

  // ── Recurrence ──
  y = sectionTitle(doc, y, 'Recurrencia');
  y = simpleTable(
    doc, y,
    ['Metrica', 'Valor'],
    [
      ['Total clients', fmt(report.recurrence.totalCustomers)],
      ['Clients recurrents', fmt(report.recurrence.returning)],
      ['Taxa recurrencia', pct(report.recurrence.returningRate)],
      ['Mitjana events/client', report.recurrence.avgEventsPerCustomer.toFixed(2)],
    ],
    [100, 70],
  );

  // ── Margin ──
  y = sectionTitle(doc, y, 'Marge');
  y = simpleTable(
    doc, y,
    ['Metrica', 'Valor'],
    [
      ['Ingressos totals (EUR)', fmt(report.margin.totalRevenue, 2)],
      ['Cost total (EUR)', fmt(report.margin.totalCost, 2)],
      ['Marge brut (EUR)', fmt(report.margin.grossMargin, 2)],
      ['Taxa marge', pct(report.margin.marginRate)],
    ],
    [100, 70],
  );

  // ── Monthly trend ──
  y = sectionTitle(doc, y, 'Tendencia mensual (6 mesos)');
  y = simpleTable(
    doc, y,
    ['Mes', 'Leads', 'Reserves', 'Ingressos (EUR)'],
    report.monthlyTrend.map((m) => [
      m.month, fmt(m.leads), fmt(m.bookings), fmt(m.revenue, 2),
    ]),
    [45, 35, 35, 55],
  );

  // ── Top risk leads ──
  if (report.topRiskLeads.length > 0) {
    y = sectionTitle(doc, y, 'Leads en risc');
    y = simpleTable(
      doc, y,
      ['Nom', 'Estat', 'Origen', 'Score', 'Prob.', 'Valor (EUR)'],
      report.topRiskLeads.slice(0, 15).map((l) => [
        l.name, l.status, l.source, fmt(l.score), pct(l.probability), fmt(l.weightedAmount, 2),
      ]),
      [40, 25, 25, 20, 25, 35],
    );
  }

  // ── Footers ──
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addReportFooter(doc, i, totalPages);
  }

  return doc.output('arraybuffer');
}
