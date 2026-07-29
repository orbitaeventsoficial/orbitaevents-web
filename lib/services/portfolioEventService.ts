/**
 * PORTFOLIO EVENT SERVICE
 * Gestió d'events concrets per al portfolio (mini-pàgines)
 * Cada event té metadades (títol, lloc, data, serveis) + galeria de fotos/vídeos
 */

import { PORTFOLIO_CATEGORIES } from '@/app/config/portfolio-images';
import type { Prisma } from '@prisma/client';
import {
  PORTFOLIO_EVENT_COVER_SOURCE_ERROR,
  PORTFOLIO_EVENT_ORIGIN_TYPES,
  extractBookingIdFromPortfolioCoverImage,
  isPortfolioEventCoverImage,
  type PortfolioEventOriginType,
} from '@/lib/constants/portfolio-media';
import { prisma } from '@/lib/prisma';

const VALID_SLUGS = PORTFOLIO_CATEGORIES.map(({ slug }) => slug);

export type EnsurePostEventPortfolioEventResult =
  | { status: 'BOOKING_NOT_FOUND' }
  | { status: 'REPORT_REQUIRED' }
  | { status: 'PORTFOLIO_MEDIA_REQUIRED' }
  | { status: 'EXISTS'; event: Awaited<ReturnType<typeof prisma.portfolioEvent.findFirst>> }
  | { status: 'CREATED'; event: Awaited<ReturnType<typeof prisma.portfolioEvent.create>> };

type PortfolioEventOriginInput = {
  coverImage?: string | null;
  originType?: PortfolioEventOriginType | null;
  sourceBookingId?: string | null;
  sourceGalleryPhotoId?: string | null;
  sourceTestimonialId?: string | null;
  originLabel?: string | null;
};

function cleanOriginValue(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function slugifyPortfolioEventPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function buildPortfolioEventSlug(reference: string, clientName: string): string {
  const referenceSlug = slugifyPortfolioEventPart(reference);
  const clientSlug = slugifyPortfolioEventPart(clientName);
  return [referenceSlug, clientSlug].filter(Boolean).join('-') || `event-${Date.now()}`;
}

function buildPostEventPortfolioOriginLabel(booking: { reference: string; clientName: string }): string {
  return `${booking.reference} · ${booking.clientName}`.slice(0, 200);
}

function resolvePortfolioEventOrigin(input: PortfolioEventOriginInput): {
  originType: PortfolioEventOriginType;
  sourceBookingId: string | null;
  sourceGalleryPhotoId: string | null;
  sourceTestimonialId: string | null;
  originLabel: string | null;
  error: string | null;
} {
  const coverBookingId = extractBookingIdFromPortfolioCoverImage(input.coverImage);
  const sourceBookingId = cleanOriginValue(input.sourceBookingId) ?? coverBookingId;
  const sourceGalleryPhotoId = cleanOriginValue(input.sourceGalleryPhotoId);
  const sourceTestimonialId = cleanOriginValue(input.sourceTestimonialId);
  const originType = input.originType
    ?? (sourceTestimonialId
      ? PORTFOLIO_EVENT_ORIGIN_TYPES.TESTIMONIAL
      : sourceBookingId
        ? PORTFOLIO_EVENT_ORIGIN_TYPES.BOOKING_GALLERY
        : PORTFOLIO_EVENT_ORIGIN_TYPES.MANUAL);
  const originLabel = cleanOriginValue(input.originLabel);

  if (coverBookingId && sourceBookingId && coverBookingId !== sourceBookingId) {
    return { originType, sourceBookingId, sourceGalleryPhotoId, sourceTestimonialId, originLabel, error: 'La portada de booking no coincideix amb sourceBookingId' };
  }
  if ((originType === PORTFOLIO_EVENT_ORIGIN_TYPES.BOOKING_GALLERY || originType === PORTFOLIO_EVENT_ORIGIN_TYPES.POST_EVENT_REPORT) && !sourceBookingId) {
    return { originType, sourceBookingId, sourceGalleryPhotoId, sourceTestimonialId, originLabel, error: 'sourceBookingId és obligatori per a portfolio derivat de reserva o post-event' };
  }
  if (originType === PORTFOLIO_EVENT_ORIGIN_TYPES.TESTIMONIAL && !sourceTestimonialId) {
    return { originType, sourceBookingId, sourceGalleryPhotoId, sourceTestimonialId, originLabel, error: 'sourceTestimonialId és obligatori per a portfolio derivat de testimoni' };
  }
  if (originType === PORTFOLIO_EVENT_ORIGIN_TYPES.MANUAL) {
    return {
      originType,
      sourceBookingId: null,
      sourceGalleryPhotoId: null,
      sourceTestimonialId: null,
      originLabel: null,
      error: null,
    };
  }

  return { originType, sourceBookingId, sourceGalleryPhotoId, sourceTestimonialId, originLabel, error: null };
}

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
  originType?: PortfolioEventOriginType | null;
  sourceBookingId?: string | null;
  sourceGalleryPhotoId?: string | null;
  sourceTestimonialId?: string | null;
  originLabel?: string | null;
}) {
  if (!VALID_SLUGS.includes(input.categorySlug)) {
    throw new Error(`Categoria invàlida: ${input.categorySlug}`);
  }
  if (!isPortfolioEventCoverImage(input.coverImage)) {
    throw new Error(PORTFOLIO_EVENT_COVER_SOURCE_ERROR);
  }
  const origin = resolvePortfolioEventOrigin(input);
  if (origin.error) throw new Error(origin.error);

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
      originType: origin.originType,
      sourceBookingId: origin.sourceBookingId,
      sourceGalleryPhotoId: origin.sourceGalleryPhotoId,
      sourceTestimonialId: origin.sourceTestimonialId,
      originLabel: origin.originLabel,
    },
  });
}

export async function ensurePortfolioEventFromPostEventReport(
  bookingId: string,
): Promise<EnsurePostEventPortfolioEventResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      reference: true,
      clientName: true,
      eventDate: true,
      eventType: true,
      eventLocation: true,
      eventVenue: true,
      guestCount: true,
      postEventReport: {
        select: {
          status: true,
          lessonsLearned: true,
          memorableMoment: true,
          whatWorkedBest: true,
        },
      },
      galleryPhotos: {
        where: { isPortfolio: true },
        orderBy: { sortOrder: 'asc' },
        take: 1,
        select: {
          id: true,
          photoUrl: true,
          caption: true,
          portfolioSlug: true,
        },
      },
    },
  });

  if (!booking) return { status: 'BOOKING_NOT_FOUND' };
  if (booking.postEventReport?.status !== 'COMPLETED') return { status: 'REPORT_REQUIRED' };

  const existing = await prisma.portfolioEvent.findFirst({
    where: {
      sourceBookingId: booking.id,
      originType: {
        in: [
          PORTFOLIO_EVENT_ORIGIN_TYPES.POST_EVENT_REPORT,
          PORTFOLIO_EVENT_ORIGIN_TYPES.BOOKING_GALLERY,
        ],
      },
    },
  });
  if (existing) return { status: 'EXISTS', event: existing };

  const coverPhoto = booking.galleryPhotos[0] ?? null;
  const categorySlug = coverPhoto?.portfolioSlug ?? null;
  if (!coverPhoto || !categorySlug || !VALID_SLUGS.includes(categorySlug)) {
    return { status: 'PORTFOLIO_MEDIA_REQUIRED' };
  }

  const event = await createPortfolioEvent({
    slug: buildPortfolioEventSlug(booking.reference, booking.clientName),
    categorySlug,
    title: booking.clientName,
    subtitle: booking.eventVenue || booking.eventLocation,
    venue: booking.eventVenue || undefined,
    location: booking.eventLocation,
    eventDate: booking.eventDate,
    guestCount: booking.guestCount,
    description: booking.postEventReport.memorableMoment
      || booking.postEventReport.whatWorkedBest
      || booking.postEventReport.lessonsLearned
      || coverPhoto.caption
      || undefined,
    services: [String(booking.eventType)],
    coverImage: coverPhoto.photoUrl,
    published: false,
    originType: PORTFOLIO_EVENT_ORIGIN_TYPES.POST_EVENT_REPORT,
    sourceBookingId: booking.id,
    sourceGalleryPhotoId: coverPhoto.id,
    originLabel: buildPostEventPortfolioOriginLabel(booking),
  });

  return { status: 'CREATED', event };
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
    originType?: PortfolioEventOriginType | null;
    sourceBookingId?: string | null;
    sourceGalleryPhotoId?: string | null;
    sourceTestimonialId?: string | null;
    originLabel?: string | null;
  },
) {
  if (data.coverImage !== undefined && !isPortfolioEventCoverImage(data.coverImage)) {
    throw new Error(PORTFOLIO_EVENT_COVER_SOURCE_ERROR);
  }
  const {
    originType,
    sourceBookingId,
    sourceGalleryPhotoId,
    sourceTestimonialId,
    originLabel,
    ...eventData
  } = data;
  const originRelevant = originType !== undefined
    || sourceBookingId !== undefined
    || sourceGalleryPhotoId !== undefined
    || sourceTestimonialId !== undefined
    || originLabel !== undefined
    || Boolean(extractBookingIdFromPortfolioCoverImage(data.coverImage));
  const updateData: Prisma.PortfolioEventUncheckedUpdateInput = { ...eventData };
  if (originRelevant) {
    const origin = resolvePortfolioEventOrigin({
      coverImage: data.coverImage,
      originType,
      sourceBookingId,
      sourceGalleryPhotoId,
      sourceTestimonialId,
      originLabel,
    });
    if (origin.error) throw new Error(origin.error);
    Object.assign(updateData, {
      originType: origin.originType,
      sourceBookingId: origin.sourceBookingId,
      sourceGalleryPhotoId: origin.sourceGalleryPhotoId,
      sourceTestimonialId: origin.sourceTestimonialId,
      originLabel: origin.originLabel,
    });
  }

  return prisma.portfolioEvent.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Eliminar un event (media queda amb eventId=null)
 */
export async function deletePortfolioEvent(id: string) {
  return prisma.portfolioEvent.delete({ where: { id } });
}
