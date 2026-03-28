import path from 'path';
import sharp from 'sharp';

const PORTFOLIO_IMAGE_MAX_DIMENSION = 3200;
const PORTFOLIO_IMAGE_AVIF_QUALITY = 82;
const PORTFOLIO_IMAGE_AVIF_EFFORT = 6;

const SAFE_NAME_RE = /[^a-z0-9-]+/g;
const DASH_RE = /-+/g;

export function slugifyPortfolioAssetName(fileName: string): string {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);

  return base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(SAFE_NAME_RE, '-')
    .replace(DASH_RE, '-')
    .replace(/^-|-$/g, '');
}

export async function normalizePortfolioImageBuffer(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({
      width: PORTFOLIO_IMAGE_MAX_DIMENSION,
      height: PORTFOLIO_IMAGE_MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .avif({ quality: PORTFOLIO_IMAGE_AVIF_QUALITY, effort: PORTFOLIO_IMAGE_AVIF_EFFORT })
    .toBuffer();
}

export function buildPortfolioUploadImagePath(slug: string, fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeBase = slugifyPortfolioAssetName(fileName) || 'portfolio-image';
  return `portfolio/${slug}/${timestamp}-${random}-${safeBase}.avif`;
}

export function buildBookingGalleryImagePath(bookingId: string, fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeBase = slugifyPortfolioAssetName(fileName) || 'booking-gallery';
  return `bookings/${bookingId}/gallery/${timestamp}-${random}-${safeBase}.avif`;
}


