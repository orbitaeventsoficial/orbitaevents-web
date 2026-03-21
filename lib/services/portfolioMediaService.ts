/**
 * PORTFOLIO MEDIA SERVICE
 * Gestió de media directe per al portfolio (no lligat a bookings)
 * Suporta imatges i vídeos per cada categoria del portfolio
 */

import { PORTFOLIO_CATEGORIES } from '@/app/config/portfolio-images';
import { prisma } from '@/lib/prisma';
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/storage';

const VALID_SLUGS = PORTFOLIO_CATEGORIES.map(({ slug }) => slug);

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mpeg'];

export function isValidSlug(slug: string): boolean {
  return VALID_SLUGS.includes(slug);
}

export function detectMediaType(mimeType: string): 'image' | 'video' | null {
  if (IMAGE_TYPES.includes(mimeType)) return 'image';
  if (VIDEO_TYPES.includes(mimeType)) return 'video';
  return null;
}

/**
 * Pujar media directament a una categoria del portfolio
 */
export async function addPortfolioMedia(input: {
  slug: string;
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  caption?: string;
  uploadedBy?: string;
}) {
  const { slug, fileBuffer, fileName, mimeType, caption, uploadedBy } = input;

  if (!isValidSlug(slug)) throw new Error(`Slug invàlid: ${slug}`);

  const mediaType = detectMediaType(mimeType);
  if (!mediaType) throw new Error(`Tipus de fitxer no permès: ${mimeType}`);

  const ext = fileName.split('.').pop()?.toLowerCase() || (mediaType === 'video' ? 'mp4' : 'webp');
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const filePath = `portfolio/${slug}/${timestamp}-${random}.${ext}`;

  await uploadFile(filePath, fileBuffer);

  const maxOrder = await prisma.portfolioMedia.aggregate({
    where: { slug },
    _max: { sortOrder: true },
  });

  const media = await prisma.portfolioMedia.create({
    data: {
      slug,
      mediaUrl: getPublicUrl(filePath),
      mediaType,
      caption,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      uploadedBy,
    },
  });

  return media;
}

/**
 * Llistar media d'una categoria
 */
export async function listPortfolioMedia(slug: string) {
  return prisma.portfolioMedia.findMany({
    where: { slug },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Llistar media de totes les categories amb recompte
 */
export async function getPortfolioMediaCounts() {
  const counts = await prisma.portfolioMedia.groupBy({
    by: ['slug'],
    _count: { id: true },
  });
  const map: Record<string, number> = {};
  for (const c of counts) {
    map[c.slug] = c._count.id;
  }
  return map;
}

/**
 * Actualitzar media (caption, ordre)
 */
export async function updatePortfolioMedia(
  mediaId: string,
  data: { caption?: string; sortOrder?: number }
) {
  return prisma.portfolioMedia.update({
    where: { id: mediaId },
    data,
  });
}

/**
 * Eliminar media
 */
export async function deletePortfolioMedia(mediaId: string) {
  const media = await prisma.portfolioMedia.findUnique({ where: { id: mediaId } });
  if (!media) throw new Error('Media no trobat');

  try {
    const pathMatch = media.mediaUrl.match(/\/api\/uploads\/(.+)$/);
    if (pathMatch) {
      await deleteFile(pathMatch[1]);
    }
  } catch (err) {
    console.error('Error eliminant fitxer físic:', err);
  }

  await prisma.portfolioMedia.delete({ where: { id: mediaId } });
  return true;
}
