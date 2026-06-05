import { generateQuotePDF, generateServiceBrochure } from '../lib/pdf-utils';
import { exportExecutiveReportPdf } from '../lib/services/executiveReportPdfService';
import { getPacksByService } from '../app/config/packs-config';
import type { ExecutiveReport } from '../lib/services/executiveReportService';
import { writeFileSync } from 'fs';

const pack = getPacksByService('bodas')[0];

const quote = await generateQuotePDF({
  eventType: 'bodas', pack,
  date: '2026-09-20', eventSchedule: '19:00 - 02:00',
  eventLocation: 'Mas de Can Torras, Cardedeu', guests: 140,
  extras: ['Photobooth', 'Saxofonista'],
  basePrice: pack.priceValue, extrasPrice: 580,
  discount: 100, discountReason: 'Reserva anticipada',
  total: pack.priceValue + 580 - 100,
  clientName: 'Marta Soler i Jordi Vila',
  clientEmail: 'marta@example.com', clientPhone: '612 345 678',
  validityDays: 15,
  conditions: ['30% de dipòsit per confirmar la reserva.', 'Preu inclou desplaçament fins a 50km.'],
}, 'ca');
writeFileSync('/tmp/test-pressupost.pdf', Buffer.from(quote.output('arraybuffer')));
console.log('pressupost', quote.internal.pages.length - 1, 'pàgines');

const brochure = await generateServiceBrochure('bodas', 'ca');
writeFileSync('/tmp/test-cataleg.pdf', Buffer.from(brochure.output('arraybuffer')));
console.log('catàleg', brochure.internal.pages.length - 1, 'pàgines');

const report: ExecutiveReport = {
  generatedAt: new Date().toISOString(),
  period: { monthStart: '2026-06-01', quarterStart: '2026-04-01' },
  headline: { customers: 248, openLeads: 32, bookingsClosed: 41, revenueClosed: 86400, pipelineRaw: 152000, forecastWeighted: 68400, slaBroken: 3 },
  funnel: { NEW: 8, CONTACTED: 6, QUOTE_SENT: 5, NEGOTIATING: 4, WON: 12, LOST: 9 },
  conversionBySource: [
    { source: 'Web', total: 64, won: 21, winRate: 0.328, avgRevenue: 2100 },
    { source: 'Instagram', total: 48, won: 14, winRate: 0.292, avgRevenue: 1850 },
    { source: 'Referits', total: 22, won: 11, winRate: 0.500, avgRevenue: 2800 },
    { source: 'Google', total: 31, won: 9, winRate: 0.290, avgRevenue: 1650 },
  ],
  recurrence: { totalCustomers: 248, returning: 74, returningRate: 0.298, avgEventsPerCustomer: 1.8 },
  margin: { totalRevenue: 86400, totalCost: 41700, grossMargin: 44700, marginRate: 0.517 },
  monthlyTrend: [
    { month: '2025-12', leads: 14, bookings: 3, revenue: 7200 },
    { month: '2026-01', leads: 18, bookings: 5, revenue: 12400 },
    { month: '2026-02', leads: 22, bookings: 7, revenue: 16800 },
    { month: '2026-03', leads: 28, bookings: 9, revenue: 21600 },
    { month: '2026-04', leads: 31, bookings: 10, revenue: 24800 },
    { month: '2026-05', leads: 26, bookings: 7, revenue: 18200 },
  ],
  topRiskLeads: [],
  lossSummary: { total: 9, uncategorized: 2, autoTotal: 3, commercialTotal: 4, byReason: [], byEventType: [], bySource: [], byMonth: [], topReason: null },
};
const infBuf = await exportExecutiveReportPdf(report);
writeFileSync('/tmp/test-informe.pdf', Buffer.from(infBuf));
console.log('informe OK');
