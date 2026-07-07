import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, mockRefresh, toastApi, nextLines } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockRefresh: vi.fn(),
  toastApi: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  nextLines: [{ kind: 'DJ', label: 'DJ principal', revenueAmount: 500, costAmount: 120 }],
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

vi.mock('@/app/admin/components/ToastProvider', () => ({
  useToast: () => toastApi,
}));

vi.mock('@/app/admin/bookings/BookingServiceLinesSection', () => ({
  default: ({ onChange }: { onChange: (next: typeof nextLines) => void }) => (
    <button type="button" onClick={() => onChange(nextLines)}>
      Canviar línies
    </button>
  ),
}));

import BookingServiceLinesEditor from '@/app/admin/bookings/[id]/BookingServiceLinesEditor';

describe('BookingServiceLinesEditor', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('mostra error visible si el PATCH de línies falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'No s’ha pogut recalcular el marge' }),
    } as Response);

    render(<BookingServiceLinesEditor bookingId="booking-1" initialLines={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Canviar línies' }));
    const saveButton = screen.getByRole('button', { name: 'Desar línies de servei' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No s’ha pogut recalcular el marge');
    });

    expect(saveButton).toHaveAttribute('aria-invalid', 'true');
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(toastApi.error).toHaveBeenCalledWith('No s’ha pogut recalcular el marge');
    expect(mockRefresh).not.toHaveBeenCalled();
    const [, request] = mockFetchWithCsrf.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toEqual({ serviceLines: nextLines });
  });
});
