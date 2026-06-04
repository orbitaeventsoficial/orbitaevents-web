import { COLORS, PAGE } from '@/lib/pdf-config';
import {
  PDF_DESIGN, PDF_BODY_SIZE, PDF_FILL_BOTTOM,
  CHART_COLORS,
  drawCanonicalPdfHeader,
  drawCanonicalSectionTitle,
  paintCanonicalPdfPage,
  setStyleLabel, setStyleValue, setStyleBody, setStyleCaption,
  drawAllPageFooters,
} from '@/lib/pdf-header';
import type { ExecutiveReport } from '@/lib/services/executiveReportService';

type RGB = [number, number, number];
type jsPDFType = import('jspdf').jsPDF;

// ── Formateig ────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('ca-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

function shortMonth(isoMonth: string): string {
  // "2026-05" → "mai"
  try {
    const [year, month] = isoMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('ca-ES', { month: 'short' }).replace('.', '');
  } catch {
    return isoMonth.slice(5, 7);
  }
}

// ── Gràfica de línies ────────────────────────────────────────────────────────

interface LineSeries {
  data: number[];
  color: RGB;
  label: string;
}

function drawLineChart(
  doc: jsPDFType,
  x: number, y: number, w: number, h: number,
  series: LineSeries[],
  xLabels: string[],
): void {
  const padL = 16;
  const padB = 9;
  const padT = 4;
  const padR = 3;

  const px = x + padL;
  const py = y + padT;
  const pw = w - padL - padR;
  const ph = h - padB - padT;

  const allVals = series.flatMap(s => s.data);
  const maxV = Math.max(...allVals, 1);
  const points = xLabels.length;

  const sx = (i: number): number => px + (points <= 1 ? pw / 2 : (i / (points - 1)) * pw);
  const sy = (v: number): number => py + ph - (v / maxV) * ph;

  // Grid horitzontal
  const gridN = 4;
  for (let g = 0; g <= gridN; g++) {
    const gy = py + (g / gridN) * ph;
    doc.setDrawColor(...COLORS.grayLight);
    doc.setLineWidth(0.15);
    doc.line(px, gy, px + pw, gy);
    const val = maxV * (1 - g / gridN);
    doc.setTextColor(...COLORS.paperMuted);
    doc.setFontSize(PDF_DESIGN.type.caption);
    doc.setFont('helvetica', 'normal');
    doc.text(fmt(val), px - 1.5, gy + 1.5, { align: 'right' });
  }

  // Labels eix X
  doc.setTextColor(...COLORS.paperMuted);
  doc.setFontSize(PDF_DESIGN.type.caption);
  for (let i = 0; i < points; i++) {
    doc.text(xLabels[i], sx(i), py + ph + 7, { align: 'center' });
  }

  // Marc del plot
  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.2);
  doc.rect(px, py, pw, ph, 'D');

  // Línies de sèrie
  for (const s of series) {
    doc.setDrawColor(...s.color);
    doc.setLineWidth(0.65);
    for (let i = 1; i < s.data.length; i++) {
      doc.line(sx(i - 1), sy(s.data[i - 1]), sx(i), sy(s.data[i]));
    }
    // Punts
    doc.setFillColor(...s.color);
    for (let i = 0; i < s.data.length; i++) {
      doc.circle(sx(i), sy(s.data[i]), 1.2, 'F');
    }
  }

  // Llegenda (dalt dreta)
  let ly = py + 3;
  const lx = px + pw - 2;
  for (const s of [...series].reverse()) {
    doc.setFillColor(...s.color);
    doc.circle(lx - 28, ly, 1.1, 'F');
    doc.setTextColor(...COLORS.paperMuted);
    doc.setFontSize(PDF_DESIGN.type.caption);
    doc.setFont('helvetica', 'normal');
    doc.text(s.label, lx - 25, ly + 1.7);
    ly += 6.5;
  }
}

// ── Gràfica de barres ────────────────────────────────────────────────────────

interface BarItem {
  label: string;
  value: number;
  color?: RGB;
}

function drawBarChart(
  doc: jsPDFType,
  x: number, y: number, w: number, h: number,
  bars: BarItem[],
): void {
  const padB = 13;
  const padT = 6;
  const padL = 2;
  const padR = 2;

  const px = x + padL;
  const py = y + padT;
  const pw = w - padL - padR;
  const ph = h - padB - padT;

  const maxV = Math.max(...bars.map(b => b.value), 1);
  const n = bars.length;
  const barW = Math.min(13, (pw - (n + 1) * 2.5) / n);
  const gap = (pw - barW * n) / (n + 1);

  // Baseline
  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.2);
  doc.line(px, py + ph, px + pw, py + ph);

  for (let i = 0; i < n; i++) {
    const bh = maxV > 0 ? (bars[i].value / maxV) * ph : 0;
    const bx = px + gap + i * (barW + gap);
    const by = py + ph - bh;
    const color = bars[i].color || (COLORS.gold as RGB);

    if (bh > 0.5) {
      doc.setFillColor(...color);
      doc.roundedRect(bx, by, barW, bh, 0.5, 0.5, 'F');
    }

    // Valor sobre la barra
    doc.setTextColor(...COLORS.paperText);
    doc.setFontSize(PDF_DESIGN.type.caption);
    doc.setFont('helvetica', 'bold');
    doc.text(String(bars[i].value), bx + barW / 2, by - 1.5, { align: 'center' });

    // Etiqueta sota (abreujada si cal)
    doc.setTextColor(...COLORS.paperMuted);
    doc.setFontSize(PDF_DESIGN.type.caption);
    doc.setFont('helvetica', 'normal');
    const abbr = bars[i].label.length > 6 ? bars[i].label.substring(0, 5) : bars[i].label;
    doc.text(abbr, bx + barW / 2, py + ph + 5, { align: 'center' });
    if (bars[i].label.length > 5) {
      doc.text(bars[i].label.substring(5, 10), bx + barW / 2, py + ph + 9, { align: 'center' });
    }
  }
}

// ── Gràfica de donut ─────────────────────────────────────────────────────────

interface DonutSegment {
  label: string;
  value: number;
  color: RGB;
}

function drawDonutChart(
  doc: jsPDFType,
  cx: number, cy: number, outerR: number,
  segments: DonutSegment[],
  centerLabel = 'leads',
): void {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total <= 0) return;

  let currentAngle = -Math.PI / 2;

  for (const seg of segments) {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const triCount = Math.max(3, Math.ceil((sweep / (2 * Math.PI)) * 72));

    doc.setFillColor(...seg.color);
    for (let t = 0; t < triCount; t++) {
      const a1 = currentAngle + (t / triCount) * sweep;
      const a2 = currentAngle + ((t + 1) / triCount) * sweep;
      const x1 = cx + outerR * Math.cos(a1);
      const y1 = cy + outerR * Math.sin(a1);
      const x2 = cx + outerR * Math.cos(a2);
      const y2 = cy + outerR * Math.sin(a2);
      doc.triangle(cx, cy, x1, y1, x2, y2, 'F');
    }
    currentAngle += sweep;
  }

  // Forat donut (fons paper)
  doc.setFillColor(...COLORS.paperBg);
  doc.circle(cx, cy, outerR * 0.44, 'F');

  // Total centrat
  doc.setTextColor(...COLORS.paperText);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_DESIGN.type.section);
  doc.text(String(total), cx, cy + 1.5, { align: 'center' });
  doc.setFontSize(PDF_DESIGN.type.caption);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.paperMuted);
  doc.text(centerLabel, cx, cy + 5.5, { align: 'center' });
}

function drawDonutLegend(
  doc: jsPDFType,
  x: number, y: number,
  segments: DonutSegment[],
  total: number,
): void {
  const lineH = 7;
  for (let i = 0; i < segments.length; i++) {
    const ly = y + i * lineH;
    doc.setFillColor(...segments[i].color);
    doc.roundedRect(x, ly, 5, 3.5, 0.5, 0.5, 'F');
    doc.setTextColor(...COLORS.paperText);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_DESIGN.type.caption);
    doc.text(segments[i].label, x + 7, ly + 3.2);
    doc.setTextColor(...COLORS.paperMuted);
    doc.setFont('helvetica', 'normal');
    const share = total > 0 ? `${Math.round((segments[i].value / total) * 100)}%` : '0%';
    doc.text(`${segments[i].value} · ${share}`, x + 7, ly + 7.5);
  }
}

// ── KPI Strip ────────────────────────────────────────────────────────────────

interface KpiItem {
  label: string;
  value: string;
  accent?: RGB;
}

function drawKpiStrip(
  doc: jsPDFType,
  y: number,
  kpis: KpiItem[],
): number {
  const cellH = 24;
  const n = kpis.length;
  const cellW = PDF_DESIGN.width / n;
  const startX = PDF_DESIGN.left;

  // Fons franja
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.grayLight);
  doc.setLineWidth(0.2);
  doc.roundedRect(startX, y, PDF_DESIGN.width, cellH, 1.5, 1.5, 'FD');

  for (let i = 0; i < n; i++) {
    const cx = startX + i * cellW;

    // Separadors verticals
    if (i > 0) {
      doc.setDrawColor(...COLORS.grayLight);
      doc.setLineWidth(0.15);
      doc.line(cx, y + 3, cx, y + cellH - 3);
    }

    // Hairline accent superior
    const accent = kpis[i].accent || (COLORS.gold as RGB);
    doc.setFillColor(...accent);
    doc.rect(cx + 2, y, cellW - 4, 0.8, 'F');

    // Valor gran
    doc.setTextColor(...COLORS.paperText);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_DESIGN.type.title);
    doc.text(kpis[i].value, cx + cellW / 2, y + 13, { align: 'center' });

    // Label
    doc.setTextColor(...COLORS.paperMuted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_DESIGN.type.caption);
    doc.text(kpis[i].label, cx + cellW / 2, y + 20, { align: 'center' });
  }

  return y + cellH + PDF_DESIGN.blockGap;
}

// ── Taula simple ─────────────────────────────────────────────────────────────

function simpleTable(
  doc: jsPDFType,
  y: number,
  headers: string[],
  rows: string[][],
  colWidths?: number[],
): number {
  const startX = PDF_DESIGN.left;
  const totalW = PDF_DESIGN.width;
  const cols = headers.length;
  const widths = colWidths || Array(cols).fill(totalW / cols);
  const rowH = 6.5;

  // Capçalera taula
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.3);
  doc.line(startX, y, startX + totalW, y);
  doc.line(startX, y + rowH, startX + totalW, y + rowH);
  setStyleLabel(doc);
  let cx = startX;
  for (let i = 0; i < cols; i++) {
    doc.text(headers[i].toUpperCase(), cx + 2, y + 4.5);
    cx += widths[i];
  }
  y += rowH;

  // Files
  for (let r = 0; r < rows.length; r++) {
    if (r % 2 === 0) {
      doc.setFillColor(247, 245, 240);
      doc.rect(startX, y, totalW, rowH, 'F');
    }
    doc.setDrawColor(...COLORS.grayLight);
    doc.setLineWidth(0.12);
    doc.line(startX, y + rowH, startX + totalW, y + rowH);
    setStyleBody(doc);
    cx = startX;
    for (let i = 0; i < cols; i++) {
      doc.text(rows[r][i] ?? '', cx + 2, y + 4.5);
      cx += widths[i];
    }
    y += rowH;
  }

  return y + PDF_DESIGN.blockGap;
}

// ── Bloc resum 2 columnes ────────────────────────────────────────────────────

function drawSummaryBlock(
  doc: jsPDFType,
  x: number, y: number, w: number,
  title: string,
  rows: Array<{ label: string; value: string; strong?: boolean }>,
): void {
  drawCanonicalSectionTitle(doc, y, title);
  const rowH = 6.5;
  let ry = y + 14;
  for (const row of rows) {
    doc.setFont('helvetica', row.strong ? 'bold' : 'normal');
    doc.setFontSize(PDF_BODY_SIZE);
    doc.setTextColor(...(row.strong ? COLORS.paperText : COLORS.paperMuted));
    doc.text(row.label, x + 2, ry);
    doc.setTextColor(...(row.strong ? COLORS.gold : COLORS.paperText));
    doc.setFont('helvetica', 'bold');
    doc.text(row.value, x + w - 2, ry, { align: 'right' });
    if (row.strong) {
      doc.setDrawColor(...COLORS.grayLight);
      doc.setLineWidth(0.15);
      doc.line(x + 2, ry - 4, x + w - 2, ry - 4);
    }
    ry += rowH;
  }
}

// ── Exportació principal ─────────────────────────────────────────────────────

export async function exportExecutiveReportPdf(report: ExecutiveReport): Promise<ArrayBuffer> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  paintCanonicalPdfPage(doc);

  const genDate = new Date(report.generatedAt).toLocaleDateString('ca-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const periodLabel = (() => {
    if (report.monthlyTrend.length === 0) return genDate;
    const first = shortMonth(report.monthlyTrend[0].month);
    const last = shortMonth(report.monthlyTrend[report.monthlyTrend.length - 1].month);
    const year = report.monthlyTrend[report.monthlyTrend.length - 1].month.slice(0, 4);
    return `${first}–${last} ${year}`;
  })();

  let y = drawCanonicalPdfHeader(doc, {
    title: 'Informe Executiu',
    subtitle: `Període: ${periodLabel}`,
    ref: `Generat ${genDate}`,
  });

  // ── KPI Strip ────────────────────────────────────────────────────────────
  const kpis: KpiItem[] = [
    { label: 'Clients', value: fmt(report.headline.customers) },
    { label: 'Leads oberts', value: fmt(report.headline.openLeads) },
    { label: 'Reserves', value: fmt(report.headline.bookingsClosed) },
    { label: 'Ingressos €', value: fmt(report.headline.revenueClosed) },
    { label: 'Pipeline €', value: fmt(report.headline.pipelineRaw) },
    { label: 'Forecast €', value: fmt(report.headline.forecastWeighted) },
    { label: 'SLA trencats', value: fmt(report.headline.slaBroken), accent: report.headline.slaBroken > 0 ? (COLORS.danger as RGB) : (COLORS.gold as RGB) },
  ];
  y = drawKpiStrip(doc, y, kpis);

  // ── Gràfica línies: tendència mensual (full width) ────────────────────────
  y = drawCanonicalSectionTitle(doc, y, 'Tendència mensual');

  const trendMonths = report.monthlyTrend;
  const revenueMax = Math.max(...trendMonths.map(m => m.revenue), 1);

  // Normalitzem ingressos per caber a la mateixa escala (als 0-max de leads/reserves)
  const leadsMax = Math.max(...trendMonths.map(m => m.leads), 1);
  const bookingsMax = Math.max(...trendMonths.map(m => m.bookings), 1);
  const scaleMax = Math.max(leadsMax, bookingsMax);
  const revenueScaled = trendMonths.map(m => (m.revenue / revenueMax) * scaleMax);

  const trendSeries: LineSeries[] = [
    { data: revenueScaled, color: COLORS.gold as RGB, label: `Ingressos (escala)` },
    { data: trendMonths.map(m => m.leads), color: CHART_COLORS[2], label: 'Leads' },
    { data: trendMonths.map(m => m.bookings), color: CHART_COLORS[1], label: 'Reserves' },
  ];
  const xLabels = trendMonths.map(m => shortMonth(m.month));

  drawLineChart(doc, PDF_DESIGN.left, y, PDF_DESIGN.width, 50, trendSeries, xLabels);
  y += 54;

  // ── Barres (embut) + Donut (orígens) ─────────────────────────────────────
  const colW = (PDF_DESIGN.width - PDF_DESIGN.columnGap) / 2;
  const leftX = PDF_DESIGN.left;
  const rightX = PDF_DESIGN.left + colW + PDF_DESIGN.columnGap;

  // Secció esquerra — Embut comercial
  drawCanonicalSectionTitle(doc, y, 'Embut comercial');

  const funnelBars: BarItem[] = [
    { label: 'NEW', value: report.funnel.NEW, color: CHART_COLORS[2] },
    { label: 'CONT', value: report.funnel.CONTACTED, color: CHART_COLORS[2] },
    { label: 'QUOT', value: report.funnel.QUOTE_SENT, color: COLORS.gold as RGB },
    { label: 'NEG', value: report.funnel.NEGOTIATING, color: COLORS.gold as RGB },
    { label: 'WON', value: report.funnel.WON, color: CHART_COLORS[1] },
    { label: 'LOST', value: report.funnel.LOST, color: CHART_COLORS[3] },
  ];
  drawBarChart(doc, leftX, y + 13, colW, 44, funnelBars);

  // Secció dreta — Distribució per origen
  drawCanonicalSectionTitle(doc, y, 'Distribució per origen');

  const sourceSegments: DonutSegment[] = report.conversionBySource.slice(0, 6).map((s, i) => ({
    label: s.source,
    value: s.total,
    color: (CHART_COLORS[i % CHART_COLORS.length] as RGB),
  }));
  const donutTotal = sourceSegments.reduce((acc, s) => acc + s.value, 0);

  if (sourceSegments.length > 0) {
    const donutR = 18;
    const donutCx = rightX + 22;
    const donutCy = y + 13 + 22;
    drawDonutChart(doc, donutCx, donutCy, donutR, sourceSegments);
    drawDonutLegend(doc, rightX + 46, y + 15, sourceSegments, donutTotal);
  }

  y += 13 + 44 + PDF_DESIGN.blockGap;

  // ── Taula resum: Marge + Recurrència ─────────────────────────────────────
  drawSummaryBlock(doc, leftX, y, colW, 'Marge', [
    { label: 'Ingressos totals', value: `${fmt(report.margin.totalRevenue)} €` },
    { label: 'Cost total', value: `${fmt(report.margin.totalCost)} €` },
    { label: 'Marge brut', value: `${fmt(report.margin.grossMargin)} €`, strong: true },
    { label: 'Taxa marge', value: pct(report.margin.marginRate), strong: true },
  ]);

  drawSummaryBlock(doc, rightX, y, colW, 'Recurrència', [
    { label: 'Total clients', value: fmt(report.recurrence.totalCustomers) },
    { label: 'Clients recurrents', value: fmt(report.recurrence.returning) },
    { label: 'Taxa recurrència', value: pct(report.recurrence.returningRate), strong: true },
    { label: 'Mitjana events/client', value: report.recurrence.avgEventsPerCustomer.toFixed(1), strong: true },
  ]);

  y += 60;

  // ── Si hi ha espai: taula conversió per origen ────────────────────────────
  if (y + 40 < PAGE.safeBottom && report.conversionBySource.length > 0) {
    y = drawCanonicalSectionTitle(doc, y, 'Conversió per origen');
    y = simpleTable(
      doc, y,
      ['Origen', 'Total', 'Guanyats', 'Taxa', 'Ingr. mig €'],
      report.conversionBySource.slice(0, 6).map(s => [
        s.source, fmt(s.total), fmt(s.won), pct(s.winRate), fmt(s.avgRevenue),
      ]),
      [46, 24, 26, 30, 48],
    );
  }

  drawAllPageFooters(doc, y);
  return doc.output('arraybuffer');
}
