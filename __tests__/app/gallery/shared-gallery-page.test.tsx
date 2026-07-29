import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { mockGetGalleryByShareToken, mockPush } = vi.hoisted(() => ({
  mockGetGalleryByShareToken: vi.fn(),
  mockPush: vi.fn(),
}));

vi.mock('@/lib/services/galleryService', () => ({
  getGalleryByShareToken: mockGetGalleryByShareToken,
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useRouter: () => ({ push: mockPush }),
}));

import PublicGalleryPage from '@/app/[locale]/gallery/[shareToken]/page';
import GalleryPasswordGate from '@/app/[locale]/gallery/[shareToken]/GalleryPasswordGate';

describe('shared public gallery', () => {
  it('renderitza el copy en el locale normalitzat de la pàgina', async () => {
    mockGetGalleryByShareToken.mockResolvedValueOnce({
      status: 'OK',
      bookingReference: 'OE-2026-001',
      eventDate: new Date('2026-09-20T10:00:00.000Z'),
      photos: [],
    });

    render(await PublicGalleryPage({
      params: { locale: 'es', shareToken: 'share-1' },
      searchParams: {},
    }));

    expect(screen.getByRole('heading', { name: 'Galería de fotos' })).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay fotos disponibles.')).toBeInTheDocument();
    expect(screen.getAllByText('Òrbita Events')).toHaveLength(2);
  });

  it('passa només la primera contrasenya si el query param arriba repetit', async () => {
    mockGetGalleryByShareToken.mockResolvedValueOnce({
      status: 'OK',
      bookingReference: 'OE-2026-002',
      eventDate: new Date('2026-09-20T10:00:00.000Z'),
      photos: [],
    });

    render(await PublicGalleryPage({
      params: { locale: 'ca', shareToken: 'share-2' },
      searchParams: { password: ['bona', 'dolenta'] },
    }));

    expect(mockGetGalleryByShareToken).toHaveBeenCalledWith('share-2', 'bona');
  });

  it('anuncia que les fotos obren una pestanya nova', async () => {
    mockGetGalleryByShareToken.mockResolvedValueOnce({
      status: 'OK',
      bookingReference: 'OE-2026-003',
      eventDate: new Date('2026-09-20T10:00:00.000Z'),
      photos: [{ id: 'photo-1', photoUrl: '/photo.jpg', caption: null }],
    });

    render(await PublicGalleryPage({
      params: { locale: 'en', shareToken: 'share-3' },
      searchParams: {},
    }));

    expect(screen.getByRole('link', { name: 'Photo 1 (opens in a new tab)' })).toHaveAttribute('target', '_blank');
  });

  it('renderitza el gate protegit amb labels injectats', () => {
    render(
      <GalleryPasswordGate
        shareToken="share-3"
        locale="en"
        wrongPassword
        brandName="Òrbita Events"
        labels={{
          title: 'Protected gallery',
          prompt: 'Enter the password to view the photos',
          passwordLabel: 'Password',
          passwordPlaceholder: 'Password',
          wrongPassword: 'Incorrect password. Please try again.',
          submitting: 'Checking...',
          access: 'Access',
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Protected gallery' })).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('placeholder', 'Password');
    expect(screen.getByRole('alert')).toHaveTextContent('Incorrect password. Please try again.');
    expect(screen.getByRole('button', { name: 'Access' })).toBeDisabled();
  });
});
