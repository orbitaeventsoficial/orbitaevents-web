import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, mockLogError } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

vi.mock('@/lib/logger', () => ({
  log: { error: (...args: unknown[]) => mockLogError(...args) },
}));

import SendPostEventButton from '@/app/admin/emails/SendPostEventButton';

describe('emails post-event costura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no envia un email post-event real amb el primer clic a Emails', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(<SendPostEventButton bookingId="booking-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Envia post-event al client' }));

    expect(mockFetchWithCsrf).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('email real al client');

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar enviament' }));

    await waitFor(() => {
      expect(mockFetchWithCsrf).toHaveBeenCalledWith(
        '/api/admin/emails/send-post-event',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });
  });

  it('Emails reutilitza el botó canònic en comptes de reimplementar l enviament', () => {
    const source = readFileSync(join(process.cwd(), 'app/admin/emails/SendPostEventButton.tsx'), 'utf8');

    expect(source).toContain("export { default } from '@/app/admin/components/PostEventEmailButton'");
    expect(source).not.toContain('fetchWithCsrf');
  });

  it('cada pendent d Emails pot tornar al bloc post-event de la reserva', () => {
    const source = readFileSync(join(process.cwd(), 'app/admin/emails/page.tsx'), 'utf8');

    expect(source).toContain("import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref'");
    expect(source).toContain("href={buildBookingHref(booking.id, 'sec-post-event')}");
    expect(source).toContain('Obrir post-event');
    expect(source).toContain('<SendPostEventButton bookingId={booking.id} />');
  });

  it('el pas 3 manual de Control entra pel hub post-event', () => {
    const source = readFileSync(join(process.cwd(), 'app/admin/control/page.tsx'), 'utf8');
    const marker = 'Comença per pas 3';
    const markerIndex = source.indexOf(marker);
    const block = source.slice(Math.max(0, markerIndex - 220), markerIndex + marker.length + 120);

    expect(markerIndex).toBeGreaterThan(-1);
    expect(block).toContain('href="/admin/post-event"');
    expect(block).not.toContain('href="/admin/emails"');
  });
});
