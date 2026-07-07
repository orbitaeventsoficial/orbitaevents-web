import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CountdownTimer from '@/app/[locale]/portal/[token]/CountdownTimer';

describe('CountdownTimer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mostra les etiquetes rebudes del locale del portal', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-07-06T10:00:00.000Z').getTime());

    render(
      <CountdownTimer
        eventDateIso="2026-07-08T12:30:00.000Z"
        accentHex="#22d3ee"
        labels={{
          days: 'días',
          hours: 'horas',
          minutes: 'minutos',
        }}
      />,
    );

    expect(await screen.findByText('días')).toBeInTheDocument();
    expect(screen.getByText('horas')).toBeInTheDocument();
    expect(screen.getByText('minutos')).toBeInTheDocument();
    expect(screen.queryByText('dies')).not.toBeInTheDocument();
  });
});
