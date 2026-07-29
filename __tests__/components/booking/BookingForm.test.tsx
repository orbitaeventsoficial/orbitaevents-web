import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { BookingForm } from '../../../components/booking/BookingForm';

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    const dict: Record<string, string> = {
      'errors.create': "No s'ha pogut crear la reserva",
      'errors.processing': 'Error en processar la reserva. Torna-ho a intentar.',
      'serverErrors.DATE_UNAVAILABLE': "Aquesta data ja no està disponible. Tria'n una altra.",
      'success.title': 'Sol·licitud rebuda!',
      'success.email': 'Hem rebut la sol·licitud i revisarem disponibilitat i detalls abans de confirmar-la.',
      'success.redirecting': 'Redirigint...',
      'sections.client': 'Les teves dades',
      'sections.event': "Detalls de l'esdeveniment",
      'sections.pack': 'Tria el teu pack',
      'sections.extras': 'Extres (opcional)',
      'labels.clientName': 'Nom complet',
      'labels.email': 'Email',
      'labels.phone': 'Telèfon',
      'labels.eventType': "Tipus d'esdeveniment",
      'labels.eventDate': "Data de l'esdeveniment",
      'labels.startTime': "Hora d'inici",
      'labels.endTime': 'Hora de finalització',
      'labels.location': 'Ubicació',
      'labels.venue': 'Local / recinte (opcional)',
      'labels.guestCount': 'Nombre de convidats',
      'labels.extraHours': 'Hores extra (opcional)',
      'labels.notes': 'Notes addicionals (opcional)',
      'placeholders.clientName': 'El teu nom',
      'placeholders.email': 'el-teu@email.com',
      'placeholders.phone': '+34 600 000 000',
      'placeholders.location': 'Barcelona, Girona...',
      'placeholders.venue': 'Nom del local',
      'placeholders.notes': "Explica'ns més detalls sobre el teu esdeveniment...",
      'eventTypes.wedding': 'Boda',
      'eventTypes.birthday': 'Aniversari',
      'eventTypes.corporate': 'Esdeveniment corporatiu',
      'eventTypes.privateParty': 'Festa privada / temàtica',
      'eventTypes.other': 'Altres',
      'pack.serviceHours': '{hours} h de servei',
      'pack.extraHourPrice': '+{price}/h extra',
      'total.base': 'Base del servei',
      'total.vat': 'IVA ({rate}%)',
      'total.label': 'Total final estimat:',
      'total.note': '* Inclou IVA; subjecte a confirmació final de disponibilitat i detalls.',
      'actions.processing': 'Processant...',
      'actions.submit': 'Sol·licitar reserva',
      'legal.prefix': 'En enviar la sol·licitud, acceptes els nostres',
      'legal.terms': 'termes i condicions',
    };
    return (dict[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => String(values?.[name] ?? `{${name}}`));
  },
}));

const PACKS = [
  {
    id: 'pack-1',
    slug: 'zen',
    name: 'Pack Zen',
    price: 500,
    extraHourPrice: 90,
    djHours: 4,
  },
];

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/Nom complet/i), { target: { value: 'Maria López' } });
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'maria@example.com' } });
  fireEvent.change(screen.getByLabelText(/Telèfon/i), { target: { value: '+34699111222' } });
  fireEvent.change(screen.getByLabelText(/Data de l'esdeveniment/i), { target: { value: '2026-09-15' } });
  fireEvent.change(screen.getByLabelText(/Ubicació/i), { target: { value: 'Barcelona' } });
  fireEvent.click(screen.getByRole('radio', { name: /Pack Zen/i }));
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('BookingForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPush.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('redirigeix a la confirmació amb el locale de la pàgina pública', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: { reference: 'OE-2026-ABCD/42' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<BookingForm packs={PACKS} extras={[]} locale="ca" />);
    expect(screen.getByText('Les teves dades')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /termes i condicions/i })).toHaveAttribute(
      'href',
      '/ca/legal/terminos'
    );
    expect(
      Array.from(screen.getByLabelText(/Tipus d'esdeveniment/i).querySelectorAll('option')).map((option) => option.value)
    ).not.toContain('THEMED_PARTY');
    fillRequiredFields();

    fireEvent.click(screen.getByRole('button', { name: /Sol·licitar reserva/i }));

    await flushPromises();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse((init as RequestInit).body as string)).toEqual(
      expect.objectContaining({ preferredLocale: 'ca' })
    );

    expect(screen.getByText(/Sol·licitud rebuda/i)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockPush).toHaveBeenCalledWith('/ca/reserva-confirmada?ref=OE-2026-ABCD%2F42');
  });

  it('posa la data mínima amb el dia local, no amb UTC', () => {
    vi.setSystemTime(new Date(2026, 6, 5, 0, 30));

    render(<BookingForm packs={PACKS} extras={[]} locale="ca" />);

    expect(screen.getByLabelText(/Data de l'esdeveniment/i)).toHaveAttribute('min', '2026-07-05');
  });

  it('mostra el total final amb el mateix IVA que desa el backend', () => {
    render(<BookingForm packs={PACKS} extras={[]} locale="ca" />);

    fillRequiredFields();

    expect(screen.getByText('Base del servei')).toBeInTheDocument();
    expect(screen.getByText('IVA (21%)')).toBeInTheDocument();
    expect(screen.getByText('Total final estimat:')).toBeInTheDocument();
    expect(screen.getAllByText(/500,00/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/105,00/)).toBeInTheDocument();
    expect(screen.getByText(/605,00/)).toBeInTheDocument();
  });

  it('tradueix errors de servidor per codi i no mostra el literal backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        success: false,
        error: 'This date is not available. Please choose another date.',
        errorCode: 'DATE_UNAVAILABLE',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<BookingForm packs={PACKS} extras={[]} locale="ca" />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole('button', { name: /Sol·licitar reserva/i }));

    await flushPromises();

    expect(screen.getByText("Aquesta data ja no està disponible. Tria'n una altra.")).toBeInTheDocument();
    expect(screen.queryByText(/This date is not available/i)).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('no mostra errors tècnics si la xarxa falla', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    render(<BookingForm packs={PACKS} extras={[]} locale="ca" />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole('button', { name: /Sol·licitar reserva/i }));

    await flushPromises();

    expect(screen.getByText('Error en processar la reserva. Torna-ho a intentar.')).toBeInTheDocument();
    expect(screen.queryByText(/Failed to fetch/i)).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('no mostra errors tècnics si la resposta no és JSON vàlid', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected end of JSON input')),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<BookingForm packs={PACKS} extras={[]} locale="ca" />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole('button', { name: /Sol·licitar reserva/i }));

    await flushPromises();

    expect(screen.getByText('Error en processar la reserva. Torna-ho a intentar.')).toBeInTheDocument();
    expect(screen.queryByText(/Unexpected end of JSON input/i)).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
