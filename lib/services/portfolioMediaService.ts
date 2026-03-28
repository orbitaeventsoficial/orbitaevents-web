/**
 * PORTFOLIO MEDIA SERVICE
 * Gestió de media directe per al portfolio (no lligat a bookings)
 * Suporta imatges i vídeos per cada categoria del portfolio
 */

import { PORTFOLIO_CATEGORIES } from '@/app/config/portfolio-images';
import { PORTFOLIO_MEDIA_IMAGE_MIME_TYPES, PORTFOLIO_MEDIA_VIDEO_MIME_TYPES } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/storage';
import { buildPortfolioUploadImagePath, normalizePortfolioImageBuffer } from '@/lib/services/portfolioImageService';

const VALID_SLUGS = PORTFOLIO_CATEGORIES.map(({ slug }) => slug);

export function isValidSlug(slug: string): boolean {
  return VALID_SLUGS.includes(slug);
}

export function detectMediaType(mimeType: string): 'image' | 'video' | null {
  if ((PORTFOLIO_MEDIA_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) return 'image';
  if ((PORTFOLIO_MEDIA_VIDEO_MIME_TYPES as readonly string[]).includes(mimeType)) return 'video';
  return null;
}

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

  const ext = fileName.split('.').pop()?.toLowerCase() || 'mp4';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const filePath = mediaType === 'image'
    ? buildPortfolioUploadImagePath(slug, fileName)
    : `portfolio/${slug}/${timestamp}-${random}.${ext}`;

  const normalizedBuffer = mediaType === 'image'
    ? await normalizePortfolioImageBuffer(fileBuffer)
    : fileBuffer;

  await uploadFile(filePath, normalizedBuffer);

  const maxOrder = await prisma.portfolioMedia.aggregate({
    where: { slug },
    _max: { sortOrder: true },
  });

  return prisma.portfolioMedia.create({
    data: {
      slug,
      mediaUrl: getPublicUrl(filePath),
      mediaType,
      caption,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      uploadedBy,
    },
    include: {
      event: {
        select: { id: true, title: true, slug: true },
      },
    },
  });
}

export async function listPortfolioMedia(slug: string) {
  return prisma.portfolioMedia.findMany({
    where: { slug },
    include: {
      event: {
        select: { id: true, title: true, slug: true },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

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

export async function updatePortfolioMedia(
  mediaId: string,
  data: { caption?: string | null; sortOrder?: number; eventId?: string | null }
) {
  return prisma.portfolioMedia.update({
    where: { id: mediaId },
    data,
    include: {
      event: {
        select: { id: true, title: true, slug: true },
      },
    },
  });
}

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
