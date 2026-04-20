import { describe, it, expect } from 'vitest';

import {
  slugifyPortfolioAssetName,
  buildPortfolioUploadImagePath,
  buildBookingGalleryImagePath,
} from '@/lib/services/portfolioImageService';

describe('slugifyPortfolioAssetName', () => {
  it('converts to lowercase and removes accents', () => {
    expect(slugifyPortfolioAssetName('Boda-Girona.jpg')).toBe('boda-girona');
  });

  it('replaces spaces and special chars with dashes', () => {
    expect(slugifyPortfolioAssetName('festa gran 2024!.png')).toBe('festa-gran-2024');
  });

  it('collapses multiple dashes', () => {
    expect(slugifyPortfolioAssetName('a---b___c.jpg')).toBe('a-b-c');
  });

  it('strips leading and trailing dashes', () => {
    expect(slugifyPortfolioAssetName('-event-.jpg')).toBe('event');
  });

  it('handles Catalan accented chars', () => {
    expect(slugifyPortfolioAssetName('Celebració-Especial.avif')).toBe('celebracio-especial');
  });

  it('treats dotfiles as names without extension (node path behaviour)', () => {
    // path.extname('.jpg') === '' → base is '.jpg' → slugifies to 'jpg'
    expect(slugifyPortfolioAssetName('.jpg')).toBe('jpg');
  });
});

describe('buildPortfolioUploadImagePath', () => {
  it('starts with portfolio/{slug}/', () => {
    const result = buildPortfolioUploadImagePath('my-event', 'photo.jpg');
    expect(result).toMatch(/^portfolio\/my-event\//);
  });

  it('ends with .avif', () => {
    const result = buildPortfolioUploadImagePath('slug', 'image.png');
    expect(result).toMatch(/\.avif$/);
  });

  it('includes slugified filename', () => {
    const result = buildPortfolioUploadImagePath('event', 'Gran Foto.jpg');
    expect(result).toContain('gran-foto');
  });

  it('uses slugified dotfile name (no fallback needed)', () => {
    // '.jpg' slugifies to 'jpg', not empty → no fallback triggered
    const result = buildPortfolioUploadImagePath('event', '.jpg');
    expect(result).toContain('-jpg.avif');
  });

  it('generates unique paths', () => {
    const a = buildPortfolioUploadImagePath('s', 'a.jpg');
    const b = buildPortfolioUploadImagePath('s', 'a.jpg');
    expect(a).not.toBe(b);
  });
});

describe('buildBookingGalleryImagePath', () => {
  it('starts with bookings/{id}/gallery/', () => {
    const result = buildBookingGalleryImagePath('b1', 'photo.jpg');
    expect(result).toMatch(/^bookings\/b1\/gallery\//);
  });

  it('ends with .avif', () => {
    const result = buildBookingGalleryImagePath('b1', 'image.png');
    expect(result).toMatch(/\.avif$/);
  });

  it('uses slugified dotfile name (no fallback needed)', () => {
    const result = buildBookingGalleryImagePath('b1', '.jpg');
    expect(result).toContain('-jpg.avif');
  });
});
