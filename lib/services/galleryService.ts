/**
 * GALLERY SERVICE
 * Gestió de fotos d'events (galeria per booking)
 * - CRUD de fotos
 * - Portfolio públic
 * - Portal client
 */

import { prisma } from '@/lib/prisma';
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/storage';

// ═══════════════════════════════════════════════════════════════════════════
// CRUD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Afegir foto a la galeria d'un booking
 */
export async function addGalleryPhoto(input: {
  bookingId: string;
  fileBuffer: Buffer;
  fileName: string;
  caption?: string;
  isPortfolio?: boolean;
  isPortal?: boolean;
  portfolioSlug?: string;
  uploadedBy?: string;
}) {
  const { bookingId, fileBuffer, fileName, caption, isPortfolio = false, isPortal = true, portfolioSlug, uploadedBy } = input;

  // Verificar que el booking existeix
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking no trobat');

  // Generar path únic
  const ext = fileName.split('.').pop()?.toLowerCase() || 'webp';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const filePath = `bookings/${bookingId}/gallery/${timestamp}-${random}.${ext}`;

  // Pujar fitxer
  await uploadFile(filePath, fileBuffer);

  // Obtenir ordre actual
  const maxOrder = await prisma.bookingGalleryPhoto.aggregate({
    where: { bookingId },
    _max: { sortOrder: true },
  });

  // Crear registre
  const photo = await prisma.bookingGalleryPhoto.create({
    data: {
      bookingId,
      photoUrl: getPublicUrl(filePath),
      caption,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      isPortfolio,
      isPortal,
      portfolioSlug: isPortfolio ? portfolioSlug : null,
      uploadedBy,
    },
  });

  return photo;
}

/**
 * Llistar fotos d'un booking
 */
export async function listGalleryPhotos(bookingId: string) {
  return prisma.bookingGalleryPhoto.findMany({
    where: { bookingId },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Llistar fotos per al portal client (només isPortal)
 */
export async function listPortalPhotos(bookingId: string) {
  return prisma.bookingGalleryPhoto.findMany({
    where: { bookingId, isPortal: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      photoUrl: true,
      caption: true,
      sortOrder: true,
    },
  });
}

/**
 * Llistar fotos per al portfolio públic (tots els bookings)
 */
export async function listPortfolioPhotos(opts: { slug?: string; limit?: number; offset?: number } = {}) {
  const { slug, limit = 50, offset = 0 } = opts;

  const where: { isPortfolio: boolean; portfolioSlug?: string } = { isPortfolio: true };
  if (slug) where.portfolioSlug = slug;

  const [photos, total] = await Promise.all([
    prisma.bookingGalleryPhoto.findMany({
      where,
      include: {
        booking: {
          select: {
            eventType: true,
            eventDate: true,
            eventLocation: true,
            eventVenue: true,
          },
        },
      },
      orderBy: [{ booking: { eventDate: 'desc' } }, { sortOrder: 'asc' }],
      take: limit,
      skip: offset,
    }),
    prisma.bookingGalleryPhoto.count({ where }),
  ]);

  return { photos, total };
}

/**
 * Actualitzar foto (caption, flags, ordre)
 */
export async function updateGalleryPhoto(
  photoId: string,
  data: {
    caption?: string;
    isPortfolio?: boolean;
    isPortal?: boolean;
    portfolioSlug?: string | null;
    sortOrder?: number;
  }
) {
  // Si es desmarca portfolio, netejar slug
  if (data.isPortfolio === false) {
    data.portfolioSlug = null;
  }
  return prisma.bookingGalleryPhoto.update({
    where: { id: photoId },
    data,
  });
}

/**
 * Eliminar foto
 */
export async function deleteGalleryPhoto(photoId: string) {
  const photo = await prisma.bookingGalleryPhoto.findUnique({ where: { id: photoId } });
  if (!photo) throw new Error('Foto no trobada');

  // Eliminar fitxer físic
  try {
    const pathMatch = photo.photoUrl.match(/\/api\/uploads\/(.+)$/);
    if (pathMatch) {
      await deleteFile(pathMatch[1]);
    }
  } catch (err) {
    console.error('Error eliminant fitxer físic:', err);
  }

  // Eliminar registre
  await prisma.bookingGalleryPhoto.delete({ where: { id: photoId } });
  return true;
}

/**
 * Obtenir resum de galeria per un booking
 */
export async function getGallerySummary(bookingId: string) {
  const [total, portfolioCount, portalCount] = await Promise.all([
    prisma.bookingGalleryPhoto.count({ where: { bookingId } }),
    prisma.bookingGalleryPhoto.count({ where: { bookingId, isPortfolio: true } }),
    prisma.bookingGalleryPhoto.count({ where: { bookingId, isPortal: true } }),
  ]);
  return { total, portfolioCount, portalCount };
}
