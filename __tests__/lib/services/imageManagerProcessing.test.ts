import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSharpChain = vi.hoisted(() => {
  const chain = {
    rotate: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    avif: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    metadata: vi.fn().mockResolvedValue({ width: 800, height: 600, format: 'jpeg' }),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed')),
  };
  return chain;
});

const mockSharp = vi.hoisted(() => vi.fn(() => mockSharpChain));

vi.mock('sharp', () => ({ default: mockSharp }));

const mockNormalizePortfolio = vi.hoisted(() => vi.fn().mockResolvedValue(Buffer.from('avif-output')));

vi.mock('@/lib/services/portfolioImageService', () => ({
  normalizePortfolioImageBuffer: mockNormalizePortfolio,
}));

import { processImageManagerUpload } from '@/lib/services/imageManagerProcessing';

beforeEach(() => {
  vi.clearAllMocks();
  mockSharpChain.metadata.mockResolvedValue({ width: 800, height: 600, format: 'jpeg' });
  mockSharpChain.toBuffer.mockResolvedValue(Buffer.from('processed'));
  mockNormalizePortfolio.mockResolvedValue(Buffer.from('avif-output'));
});

describe('processImageManagerUpload', () => {
  it('SVG: passthrough sense conversió', async () => {
    const input = Buffer.from('<svg></svg>');
    const result = await processImageManagerUpload(
      'layout.logo.header',
      input,
      'image/svg+xml',
      'logo.svg',
    );

    expect(result.buffer).toBe(input);
    expect(result.mimeType).toBe('image/svg+xml');
    expect(result.ext).toBe('.svg');
    expect(mockSharp).not.toHaveBeenCalled();
    expect(mockNormalizePortfolio).not.toHaveBeenCalled();
  });

  it('AVIF: conversió per placement normal', async () => {
    const input = Buffer.from('jpeg-raw');
    const result = await processImageManagerUpload(
      'services.bodas.hero',
      input,
      'image/jpeg',
      'hero.jpg',
    );

    expect(mockNormalizePortfolio).toHaveBeenCalledWith(input);
    expect(result.mimeType).toBe('image/avif');
    expect(result.ext).toBe('.avif');
  });

  it('JPEG-OG: conversió per SEO placements', async () => {
    const input = Buffer.from('jpeg-raw');
    const result = await processImageManagerUpload(
      'seo.og.default',
      input,
      'image/jpeg',
      'og.jpg',
    );

    expect(mockSharp).toHaveBeenCalledWith(input);
    expect(mockSharpChain.resize).toHaveBeenCalledWith(1200, 630, { fit: 'cover' });
    expect(mockSharpChain.jpeg).toHaveBeenCalledWith({ quality: 85 });
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.ext).toBe('.jpg');
    expect(result.width).toBe(1200);
    expect(result.height).toBe(630);
  });

  it('optimize-keep-format: manté format per brand (PNG)', async () => {
    const input = Buffer.from('png-raw');
    const result = await processImageManagerUpload(
      'layout.favicon.main',
      input,
      'image/png',
      'favicon.png',
    );

    expect(mockSharp).toHaveBeenCalledWith(input);
    expect(mockSharpChain.resize).toHaveBeenCalledWith({
      width: 1024,
      height: 1024,
      fit: 'inside',
      withoutEnlargement: true,
    });
    expect(mockSharpChain.png).toHaveBeenCalledWith({ quality: 90 });
    expect(result.mimeType).toBe('image/png');
    expect(result.ext).toBe('.png');
  });

  it('optimize-keep-format: manté format per brand (WebP)', async () => {
    const input = Buffer.from('webp-raw');
    const result = await processImageManagerUpload(
      'layout.logo.admin',
      input,
      'image/webp',
      'logo.webp',
    );

    expect(mockSharpChain.webp).toHaveBeenCalledWith({ quality: 85 });
    expect(result.mimeType).toBe('image/webp');
    expect(result.ext).toBe('.webp');
  });

  it('retorna sizeBytes correctament', async () => {
    const result = await processImageManagerUpload(
      'services.bodas.hero',
      Buffer.from('raw'),
      'image/jpeg',
      'test.jpg',
    );

    expect(result.sizeBytes).toBe(Buffer.from('avif-output').length);
  });
});
