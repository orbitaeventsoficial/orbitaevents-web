import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithCsrf } from '@/lib/csrf';
import QuickActions from '@/app/admin/components/QuickActions';
import ManualActionsPanel from '@/app/admin/emails/ManualActionsPanel';

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: vi.fn(),
}));

const mockFetchWithCsrf = vi.mocked(fetchWithCsrf);

function okResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status: 200 });
}

describe('post-event manual confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('QuickActions entra pel hub post-event sense disparar emails reals', () => {
    render(<QuickActions />);

    const link = screen.getByRole('link', { name: 'Revisar post-event' });
    expect(link).toHaveAttribute('href', '/admin/post-event');
    expect(mockFetchWithCsrf).not.toHaveBeenCalled();
  });

  it('ManualActionsPanel exigeix segon clic abans del cron post-event', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce(okResponse({
      ok: true,
      summary: { processed: 1, sent: 1, skipped: 0, errors: 0 },
    }));

    render(<ManualActionsPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Preparar enviament' }));

    expect(mockFetchWithCsrf).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Torna a clicar per enviar emails reals');

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar enviament' }));

    await waitFor(() => {
      expect(mockFetchWithCsrf).toHaveBeenCalledWith('/api/admin/emails/run-cron', {
        method: 'POST',
      });
    });
  });
});
