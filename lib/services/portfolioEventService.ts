/**
 * PORTFOLIO EVENT SERVICE
 * Gestió d'events concrets per al portfolio (mini-pàgines)
 * Cada event té metadades (títol, lloc, data, serveis) + galeria de fotos/vídeos
 */

import { PORTFOLIO_CATEGORIES } from '@/app/config/portfolio-images';
import { prisma } from '@/lib/prisma';

const VALID_SLUGS = PORTFOLIO_CATEGORIES.map(({ slug }) => slug);

/**
 * Crear un event de portfolio
 */
export async function createPortfolioEvent(input: {
  slug: string;
  categorySlug: string;
  title: string;
  subtitle?: string;
  venue?: string;
  location?: string;
  eventDate?: Date;
  guestCount?: number;
  description?: string;
  services?: string[];
  coverImage: string;
  published?: boolean;
}) {
  if (!VALID_SLUGS.includes(input.categorySlug)) {
    throw new Error(`Categoria invàlida: ${input.categorySlug}`);
  }

  const existing = await prisma.portfolioEvent.findUnique({ where: { slug: input.slug } });
  if (existing) throw new Error(`Ja existeix un event amb slug: ${input.slug}`);

  const maxOrder = await prisma.portfolioEvent.aggregate({
    where: { categorySlug: input.categorySlug },
    _max: { sortOrder: true },
  });

  return prisma.portfolioEvent.create({
    data: {
      ...input,
      services: input.services || [],
      published: input.published ?? false,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
}

/**
 * Llistar events d'una categoria (publicats per defecte)
 */
export async function listPortfolioEvents(opts: {
  categorySlug?: string;
  published?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  const { categorySlug, published = true, limit = 50, offset = 0 } = opts;

  const where: Record<string, unknown> = {};
  if (categorySlug) where.categorySlug = categorySlug;
  if (published !== undefined) where.published = published;

  const [events, total] = await Promise.all([
    prisma.portfolioEvent.findMany({
      where,
      include: { _count: { select: { media: true } } },
      orderBy: [{ sortOrder: 'asc' }, { eventDate: 'desc' }],
      take: limit,
      skip: offset,
    }),
    prisma.portfolioEvent.count({ where }),
  ]);

  return { events, total };
}

/**
 * Obtenir un event per slug (amb media)
 */
export async function getPortfolioEvent(slug: string) {
  return prisma.portfolioEvent.findUnique({
    where: { slug },
    include: {
      media: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

/**
 * Actualitzar un event
 */
export async function updatePortfolioEvent(
  id: string,
  data: {
    title?: string;
    subtitle?: string;
    venue?: string;
    location?: string;
    eventDate?: Date | null;
    guestCount?: number | null;
    description?: string | null;
    services?: string[];
    coverImage?: string;
    published?: boolean;
    sortOrder?: number;
  },
) {
  return prisma.portfolioEvent.update({
    where: { id },
    data,
  });
}

/**
 * Eliminar un event (media queda amb eventId=null)
 */
export async function deletePortfolioEvent(id: string) {
  return prisma.portfolioEvent.delete({ where: { id } });
}

/**
 * Vincular media existent a un event
 */
export async function linkMediaToEvent(mediaId: string, eventId: string) {
  return prisma.portfolioMedia.update({
    where: { id: mediaId },
    data: { eventId },
  });
}

/**
 * Desvincular media d'un event
 */
export async function unlinkMediaFromEvent(mediaId: string) {
  return prisma.portfolioMedia.update({
    where: { id: mediaId },
    data: { eventId: null },
  });
}

/**
 * Comptar events per categoria
 */
export async function getPortfolioEventCounts() {
  const counts = await prisma.portfolioEvent.groupBy({
    by: ['categorySlug'],
    where: { published: true },
    _count: { id: true },
  });
  const map: Record<string, number> = {};
  for (const c of counts) {
    map[c.categorySlug] = c._count.id;
  }
  return map;
}
