import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CommSummaryPanel from '@/app/admin/inbox/CommSummaryPanel';

const fetchMock = vi.fn();

Object.defineProperty(globalThis, 'fetch', {
  value: fetchMock,
  writable: true,
});

function makeSummary() {
  return {
    entries: [],
    total: 1,
    channels: {
      EMAIL: 1,
      WHATSAPP: 0,
      CALL: 0,
      NOTE: 0,
      INSTAGRAM: 0,
      FORM: 0,
      SYSTEM: 0,
    },
    lastContactAt: '2026-04-25T10:00:00.000Z',
    lastContactChannel: 'EMAIL',
    lastContactDirection: 'OUTBOUND',
    pendingResponseFrom: 'CLIENT',
    daysSinceLastContact: 2,
    responseGap: 5,
  };
}

describe('CommSummaryPanel', () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  it('consulta el resum del lead sense customerId quan no hi ha client vinculat', async () => {
    fetchMock.mockResolvedValue({
      json: async () => makeSummary(),
    });

    render(<CommSummaryPanel leadId="lead-1" />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/leads/lead-1/comm-summary');
    });

    expect(await screen.findByText('1 interaccions')).toBeInTheDocument();
  });

  it('afegeix customerId a la consulta quan el lead ja està vinculat', async () => {
    fetchMock.mockResolvedValue({
      json: async () => makeSummary(),
    });

    render(<CommSummaryPanel leadId="lead-1" customerId="cust-1" />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/leads/lead-1/comm-summary?customerId=cust-1'
      );
    });
  });

  it('mostra Instagram i Formulari quan el resum canònic els porta', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        ...makeSummary(),
        total: 3,
        channels: {
          EMAIL: 0,
          WHATSAPP: 0,
          CALL: 0,
          NOTE: 0,
          INSTAGRAM: 1,
          FORM: 2,
          SYSTEM: 0,
        },
      }),
    });

    render(<CommSummaryPanel leadId="lead-2" />);

    expect(await screen.findByText('Instagram')).toBeInTheDocument();
    expect(await screen.findByText('Formulari')).toBeInTheDocument();
  });
});
