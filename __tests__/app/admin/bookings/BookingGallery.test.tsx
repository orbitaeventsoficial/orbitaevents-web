import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('./GallerySharePanel', () => ({
  default: () => <div data-testid="gallery-share-panel" />,
}));

vi.mock('@/app/admin/bookings/[id]/GallerySharePanel', () => ({
  default: () => <div data-testid="gallery-share-panel" />,
}));

import BookingGallery from '@/app/admin/bookings/[id]/BookingGallery';

const photo = {
  id: 'photo-1',
  photoUrl: '/uploads/photo-1.webp',
  caption: null,
  isPortfolio: false,
  isPortal: true,
  portfolioSlug: null,
  sortOrder: 0,
  createdAt: '2026-07-07T08:00:00.000Z',
};

function mockInitialGallery() {
  mockFetchWithCsrf.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ ok: true, body: [photo] }),
  });
}

describe('BookingGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra error visible si falla el PATCH de visibilitat', async () => {
    mockInitialGallery();
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ ok: false, error: 'No pots publicar aquesta foto' }),
    });

    render(<BookingGallery bookingId="booking-1" />);

    await screen.findByText('Galeria de fotos (1)');
    fireEvent.click(screen.getByAltText('Foto event'));
    const portalSwitch = screen.getByRole('switch', { name: 'Visible al portal client' });
    fireEvent.click(portalSwitch);

    expect(await screen.findByRole('alert')).toHaveTextContent('No pots publicar aquesta foto');
    expect(portalSwitch).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('switch', { name: 'Visible al portfolio públic' })).not.toHaveAttribute('aria-invalid');
    expect(mockFetchWithCsrf).toHaveBeenNthCalledWith(
      2,
      '/api/admin/bookings/booking-1/gallery',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('mostra error visible si falla el DELETE de foto', async () => {
    mockInitialGallery();
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ ok: false, error: 'No s’ha pogut eliminar del storage' }),
    });

    render(<BookingGallery bookingId="booking-2" />);

    await screen.findByText('Galeria de fotos (1)');
    const deleteButton = screen.getByRole('button', { name: 'Eliminar foto' });
    fireEvent.click(deleteButton);

    expect(await screen.findByRole('alert')).toHaveTextContent('No s’ha pogut eliminar del storage');
    expect(deleteButton).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByAltText('Foto event')).toBeInTheDocument();
    expect(mockFetchWithCsrf).toHaveBeenNthCalledWith(
      2,
      '/api/admin/bookings/booking-2/gallery?photoId=photo-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
