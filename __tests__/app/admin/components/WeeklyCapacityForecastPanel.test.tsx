import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WeeklyCapacityForecastPanel from '@/app/admin/components/WeeklyCapacityForecastPanel';
import type { WeeklyCapacityForecast } from '@/lib/services/operationalForecastService';

function week(overrides: Partial<WeeklyCapacityForecast>): WeeklyCapacityForecast {
  return {
    weekStart: '2026-06-01',
    weekEnd: '2026-06-07',
    bookingsCount: 0,
    totalGuests: 0,
    overloadedDays: 0,
    previousYearBookings: 0,
    yoyDelta: null,
    alertLevel: 'NONE',
    alertMessage: null,
    ...overrides,
  };
}

describe('WeeklyCapacityForecastPanel', () => {
  it('no renderitza res si totes les setmanes són NONE/INFO', () => {
    const { container } = render(
      <WeeklyCapacityForecastPanel
        forecast={[
          week({ alertLevel: 'NONE' }),
          week({ weekStart: '2026-06-08', alertLevel: 'INFO', bookingsCount: 2 }),
        ]}
      />,
    );
    expect(container.querySelector('section')).toBeNull();
  });

  it('renderitza panell quan hi ha una setmana WARNING', () => {
    render(
      <WeeklyCapacityForecastPanel
        forecast={[
          week({ alertLevel: 'NONE' }),
          week({
            weekStart: '2026-06-08',
            weekEnd: '2026-06-14',
            alertLevel: 'WARNING',
            bookingsCount: 5,
            alertMessage: 'Setmana intensa: 5 reserves.',
          }),
        ]}
      />,
    );
    expect(screen.getByText('Forecast capacitat (4 setmanes)')).toBeInTheDocument();
    expect(screen.getByText(/1 setmana amb alerta/)).toBeInTheDocument();
    expect(screen.getByText('Intensa')).toBeInTheDocument();
  });

  it('mostra alertes CRITICAL amb badge propi i dies sobrecarregats', () => {
    render(
      <WeeklyCapacityForecastPanel
        forecast={[
          week({
            alertLevel: 'CRITICAL',
            bookingsCount: 8,
            overloadedDays: 2,
            alertMessage: 'Setmana sobrecarregada.',
          }),
        ]}
      />,
    );
    expect(screen.getByText('Al límit')).toBeInTheDocument();
    expect(screen.getByText(/2d sobrec\./)).toBeInTheDocument();
  });

  it('mostra comparativa YoY amb % delta quan hi ha referència', () => {
    render(
      <WeeklyCapacityForecastPanel
        forecast={[
          week({
            alertLevel: 'WARNING',
            bookingsCount: 6,
            previousYearBookings: 3,
            yoyDelta: 1,
          }),
        ]}
      />,
    );
    expect(screen.getByText(/\+100%/)).toBeInTheDocument();
    expect(screen.getByText(/vs\. any anterior/)).toBeInTheDocument();
  });

  it("té CTA cap a /admin/calendario/capacity", () => {
    render(
      <WeeklyCapacityForecastPanel
        forecast={[week({ alertLevel: 'CRITICAL', bookingsCount: 9 })]}
      />,
    );
    const cta = screen.getByRole('link', { name: /Capacitat/ });
    expect(cta).toHaveAttribute('href', '/admin/calendario/capacity');
  });
});
