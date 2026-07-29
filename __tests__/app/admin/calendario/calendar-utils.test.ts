import { describe, expect, it } from 'vitest';

import {
  formatCalendarEconomicRiskActionReason,
  formatCalendarEconomicRiskSummary,
  resolveCalendarEconomicRiskActionHash,
  selectCalendarEconomicRiskBooking,
  summarizeCalendarEconomicRisk,
  type CalendarApiDay,
} from '@/app/admin/calendario/calendar-utils';

function booking(id: string, level?: 'critical' | 'warning'): CalendarApiDay['reservas'][number] {
  return {
    id,
    fechaEvento: '2026-07-07T18:00:00.000Z',
    economicRisk: level
      ? {
          level,
          label: level === 'critical' ? 'Marge 12%' : 'Pagament pendent',
          reasons: level === 'critical' ? ['Marge per sota del mínim'] : [],
          marginPct: level === 'critical' ? 12 : 42,
          outstandingAmount: level === 'warning' ? 300 : 0,
          netMargin: level === 'critical' ? 90 : 600,
          daysUntil: 4,
        }
      : null,
  };
}

describe('calendar economic risk summary', () => {
  it('compta reserves amb risc economic per nivell', () => {
    expect(
      summarizeCalendarEconomicRisk({
        reservas: [
          booking('booking-critical', 'critical'),
          booking('booking-warning', 'warning'),
          booking('booking-safe'),
        ],
      }),
    ).toEqual({ total: 2, critical: 1, warning: 1 });
  });

  it('formata el resum sense duplicar la logica als components', () => {
    expect(formatCalendarEconomicRiskSummary({ total: 0, critical: 0, warning: 0 })).toBe('Cap');
    expect(formatCalendarEconomicRiskSummary({ total: 1, critical: 1, warning: 0 })).toBe('1 crític');
    expect(formatCalendarEconomicRiskSummary({ total: 2, critical: 1, warning: 1 })).toBe('2 (1 crític, 1 avís)');
  });

  it('tria primer el risc critic com a accio de copilot', () => {
    expect(
      selectCalendarEconomicRiskBooking({
        reservas: [
          booking('booking-warning', 'warning'),
          booking('booking-critical', 'critical'),
        ],
      })?.id,
    ).toBe('booking-critical');
    expect(selectCalendarEconomicRiskBooking({ reservas: [booking('booking-warning', 'warning')] })?.id).toBe('booking-warning');
    expect(selectCalendarEconomicRiskBooking({ reservas: [booking('booking-safe')] })).toBeNull();
  });

  it("formata la rao accionable del risc economic", () => {
    expect(formatCalendarEconomicRiskActionReason(booking('booking-critical', 'critical'))).toBe('Marge per sota del mínim');
    expect(formatCalendarEconomicRiskActionReason(booking('booking-warning', 'warning'))).toBe('Pagament pendent');
    expect(formatCalendarEconomicRiskActionReason(booking('booking-safe'))).toBeNull();
  });

  it('tria la seccio accionable de la fitxa de reserva', () => {
    expect(resolveCalendarEconomicRiskActionHash(booking('booking-warning', 'warning'))).toBe('sec-finances');
    expect(resolveCalendarEconomicRiskActionHash(booking('booking-critical', 'critical'))).toBe('sec-marge');
    expect(resolveCalendarEconomicRiskActionHash(booking('booking-safe'))).toBeNull();
  });
});
