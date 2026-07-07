import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GalleryClient from '@/app/[locale]/portal/[token]/gallery/GalleryClient';

vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, priority: _priority, sizes: _sizes, ...props }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    priority?: boolean;
    sizes?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} {...props} />
  ),
}));

vi.mock('framer-motion', () => {
  const MotionDiv = ({
    children,
    initial: _initial,
    animate: _animate,
    exit: _exit,
    transition: _transition,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
    transition?: unknown;
  }) => <div {...props}>{children}</div>;

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: { div: MotionDiv },
    useReducedMotion: () => true,
  };
});

const labels = {
  gallery: 'Galeria de fotos',
  galleryClose: 'Tancar',
  galleryDownload: 'Descarregar foto',
  galleryOf: 'de',
  galleryPhotoLabel: 'Foto {index}',
  galleryPrev: 'Foto anterior',
  galleryNext: 'Foto següent',
  opensInNewTab: 's\'obre en una pestanya nova',
};

describe('GalleryClient', () => {
  it('dona un nom concret i localitzat a les fotos sense peu', () => {
    render(
      <GalleryClient
        photos={[
          { id: 'p1', photoUrl: '/foto-1.jpg', caption: null },
          { id: 'p2', photoUrl: '/foto-2.jpg', caption: 'Entrada al cocktail' },
        ]}
        labels={labels}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Foto 1' }));

    const dialog = screen.getByRole('dialog', { name: 'Foto 1' });

    expect(dialog).toHaveAccessibleDescription('1 de 2');
    expect(screen.getByRole('link', {
      name: 'Descarregar foto (s\'obre en una pestanya nova)',
    })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Foto 1' })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Foto 1' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Entrada al cocktail' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Galeria de fotos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Galeria de fotos 1/ })).not.toBeInTheDocument();
  });
});
