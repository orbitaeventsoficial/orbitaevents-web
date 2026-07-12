// lib/services/socialPostService.ts
// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL POST SERVICE
// CRUD + calendari per al Social Media Calendar de l'admin
// ═══════════════════════════════════════════════════════════════════════════

import { Prisma, type SocialPost } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { syncSocialPostToGoogleCalendar } from '@/lib/services/googleCalendarSyncService';
import {
  SOCIAL_PLATFORMS,
  SOCIAL_POST_STATUSES,
  SOCIAL_CONTENT_TYPES,
  SOCIAL_CATEGORIES,
  SOCIAL_POST_ORIGIN_TYPES,
  SOCIAL_VALIDATION_SETS,
  type SocialPlatform,
  type SocialPostStatus,
  type SocialContentType,
  type SocialCategory,
  type SocialPostOriginType,
} from '@/lib/constants';
import { validateSocialPostReviewGate } from '@/lib/socialPostReviewGuard';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type SocialPostCreateInput = {
  title: string;
  caption?: string | null;
  hashtags?: string[];
  platforms: SocialPlatform[];
  status?: SocialPostStatus;
  contentType?: SocialContentType;
  category?: SocialCategory | null;
  scheduledAt?: string | Date | null;
  publishedAt?: string | Date | null;
  mediaUrls?: string[];
  bookingId?: string | null;
  originType?: SocialPostOriginType | null;
  originId?: string | null;
  originLabel?: string | null;
  notes?: string | null;
};

export type SocialPostUpdateInput = Partial<SocialPostCreateInput>;

export type SocialPostListFilters = {
  status?: SocialPostStatus | null;
  platform?: SocialPlatform | null;
  category?: SocialCategory | null;
  bookingId?: string | null;
  from?: Date | null;
  to?: Date | null;
};

// ───────────────────────────────────────────────────────────────────────────
// VALIDATION
// ───────────────────────────────────────────────────────────────────────────

export function validateSocialPostInput(input: SocialPostCreateInput): string | null {
  if (!input.title || input.title.trim().length === 0) {
    return 'El títol és obligatori';
  }
  if (input.title.length > 200) {
    return 'El títol no pot superar 200 caràcters';
  }
  if (!Array.isArray(input.platforms) || input.platforms.length === 0) {
    return 'Cal almenys una plataforma';
  }
  for (const p of input.platforms) {
    if (!SOCIAL_VALIDATION_SETS.platforms.has(p)) return `Plataforma invàlida: ${p}`;
  }
  if (input.status && !SOCIAL_VALIDATION_SETS.statuses.has(input.status)) {
    return `Estat invàlid: ${input.status}`;
  }
  if (input.contentType && !SOCIAL_VALIDATION_SETS.contentTypes.has(input.contentType)) {
    return `Tipus de contingut invàlid: ${input.contentType}`;
  }
  if (input.category && !SOCIAL_VALIDATION_SETS.categories.has(input.category)) {
    return `Categoria invàlida: ${input.category}`;
  }
  const origin = resolveCreateSocialOrigin(input);
  if (origin.error) return origin.error;
  if (input.status === SOCIAL_POST_STATUSES.SCHEDULED && !input.scheduledAt) {
    return 'Les publicacions programades requereixen una data';
  }
  return null;
}

function cleanOriginValue(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateResolvedOrigin(input: {
  originType: SocialPostOriginType;
  originId: string | null;
  bookingId: string | null;
}): string | null {
  if (!SOCIAL_VALIDATION_SETS.originTypes.has(input.originType)) {
    return `Origen social invàlid: ${input.originType}`;
  }
  if (input.originType === SOCIAL_POST_ORIGIN_TYPES.MANUAL && input.originId) {
    return "L'origen manual no pot tenir originId";
  }
  if (input.originType !== SOCIAL_POST_ORIGIN_TYPES.MANUAL && !input.originId) {
    return "Cal originId per a publicacions socials derivades";
  }
  if (
    input.originType === SOCIAL_POST_ORIGIN_TYPES.BOOKING &&
    input.bookingId &&
    input.originId &&
    input.bookingId !== input.originId
  ) {
    return 'bookingId i originId no coincideixen per a origen BOOKING';
  }
  return null;
}

function resolveCreateSocialOrigin(input: SocialPostCreateInput): {
  originType: SocialPostOriginType;
  originId: string | null;
  originLabel: string | null;
  bookingId: string | null;
  error: string | null;
} {
  const inputOriginType = input.originType ?? null;
  const bookingId = cleanOriginValue(input.bookingId);
  const originType = inputOriginType ?? (bookingId ? SOCIAL_POST_ORIGIN_TYPES.BOOKING : SOCIAL_POST_ORIGIN_TYPES.MANUAL);
  const originId = cleanOriginValue(input.originId) ?? (originType === SOCIAL_POST_ORIGIN_TYPES.BOOKING ? bookingId : null);
  const resolvedBookingId = bookingId ?? (originType === SOCIAL_POST_ORIGIN_TYPES.BOOKING ? originId : null);
  const originLabel = cleanOriginValue(input.originLabel);
  const error = validateResolvedOrigin({ originType, originId, bookingId: resolvedBookingId });
  return { originType, originId, originLabel, bookingId: resolvedBookingId, error };
}

function resolveUpdateSocialOrigin(
  existing: SocialPost & {
    originType?: SocialPostOriginType | null;
    originId?: string | null;
    originLabel?: string | null;
  },
  input: SocialPostUpdateInput,
): {
  changed: boolean;
  originType: SocialPostOriginType;
  originId: string | null;
  originLabel: string | null;
  error: string | null;
} {
  const explicitOriginChange = input.originType !== undefined || input.originId !== undefined || input.originLabel !== undefined;
  const bookingChanged = input.bookingId !== undefined;
  const existingOriginType = existing.originType ?? (existing.bookingId ? SOCIAL_POST_ORIGIN_TYPES.BOOKING : SOCIAL_POST_ORIGIN_TYPES.MANUAL);
  const nextBookingId = bookingChanged ? cleanOriginValue(input.bookingId) : cleanOriginValue(existing.bookingId);
  const bookingActuallyChanged = bookingChanged && nextBookingId !== cleanOriginValue(existing.bookingId);
  let originType = input.originType ?? existingOriginType;
  let originId = input.originId !== undefined ? cleanOriginValue(input.originId) : cleanOriginValue(existing.originId);
  let originLabel = input.originLabel !== undefined ? cleanOriginValue(input.originLabel) : cleanOriginValue(existing.originLabel);

  if (!explicitOriginChange && bookingActuallyChanged && (existingOriginType === SOCIAL_POST_ORIGIN_TYPES.MANUAL || existingOriginType === SOCIAL_POST_ORIGIN_TYPES.BOOKING)) {
    originType = nextBookingId ? SOCIAL_POST_ORIGIN_TYPES.BOOKING : SOCIAL_POST_ORIGIN_TYPES.MANUAL;
    originId = nextBookingId;
    if (!nextBookingId) originLabel = null;
  }

  if (originType === SOCIAL_POST_ORIGIN_TYPES.BOOKING && !originId && nextBookingId) {
    originId = nextBookingId;
  }
  if (originType === SOCIAL_POST_ORIGIN_TYPES.MANUAL && input.originType === SOCIAL_POST_ORIGIN_TYPES.MANUAL) {
    originId = null;
    originLabel = null;
  }

  const error = validateResolvedOrigin({ originType, originId, bookingId: nextBookingId });
  return { changed: explicitOriginChange || bookingActuallyChanged, originType, originId, originLabel, error };
}

// ───────────────────────────────────────────────────────────────────────────
// CRUD
// ───────────────────────────────────────────────────────────────────────────

export async function createSocialPost(input: SocialPostCreateInput): Promise<SocialPost> {
  const error = validateSocialPostInput(input);
  if (error) throw new Error(error);
  const origin = resolveCreateSocialOrigin(input);
  if (origin.error) throw new Error(origin.error);
  const reviewError = validateSocialPostReviewGate({
    status: input.status ?? SOCIAL_POST_STATUSES.IDEA,
    bookingId: origin.bookingId,
    category: input.category,
    notes: input.notes,
  });
  if (reviewError) throw new Error(reviewError);

  const data: Prisma.SocialPostCreateInput = {
    title: input.title.trim(),
    caption: input.caption ?? null,
    hashtags: input.hashtags ?? [],
    platforms: input.platforms,
    status: input.status ?? SOCIAL_POST_STATUSES.IDEA,
    contentType: input.contentType ?? SOCIAL_CONTENT_TYPES.IMAGE,
    category: input.category ?? null,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
    mediaUrls: input.mediaUrls ?? [],
    originType: origin.originType,
    originId: origin.originId,
    originLabel: origin.originLabel,
    notes: input.notes ?? null,
    ...(origin.bookingId ? { booking: { connect: { id: origin.bookingId } } } : {}),
  };

  const post = await prisma.socialPost.create({ data });
  await syncSocialPostToGoogleCalendar(post.id);
  return post;
}

export async function getSocialPost(id: string): Promise<SocialPost | null> {
  return prisma.socialPost.findUnique({
    where: { id },
    include: {
      booking: {
        select: {
          id: true,
          reference: true,
          eventType: true,
          eventDate: true,
          clientName: true,
        },
      },
    },
  });
}

export async function listSocialPosts(filters: SocialPostListFilters = {}): Promise<SocialPost[]> {
  const where: Prisma.SocialPostWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.platform) where.platforms = { has: filters.platform };
  if (filters.category) where.category = filters.category;
  if (filters.bookingId) where.bookingId = filters.bookingId;

  if (filters.from || filters.to) {
    where.scheduledAt = {};
    if (filters.from) where.scheduledAt.gte = filters.from;
    if (filters.to) where.scheduledAt.lte = filters.to;
  }

  return prisma.socialPost.findMany({
    where,
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function updateSocialPost(id: string, input: SocialPostUpdateInput): Promise<SocialPost> {
  const existing = await prisma.socialPost.findUnique({ where: { id } });
  if (!existing) throw new Error('Social post no trobat');

  // Validem només si es modifiquen camps crítics
  if (input.title !== undefined || input.platforms !== undefined || input.status !== undefined) {
    const merged: SocialPostCreateInput = {
      title: input.title ?? existing.title,
      platforms: input.platforms ?? (existing.platforms as SocialPlatform[]),
      status: (input.status ?? existing.status) as SocialPostStatus,
      scheduledAt: input.scheduledAt !== undefined ? input.scheduledAt : existing.scheduledAt,
      contentType: (input.contentType ?? existing.contentType) as SocialContentType,
      category: (input.category !== undefined ? input.category : existing.category) as SocialCategory | null,
    };
    const error = validateSocialPostInput(merged);
    if (error) throw new Error(error);
  }
  const reviewError = validateSocialPostReviewGate({
    status: input.status ?? existing.status,
    bookingId: input.bookingId !== undefined ? input.bookingId : existing.bookingId,
    category: input.category !== undefined ? input.category : existing.category,
    notes: input.notes !== undefined ? input.notes : existing.notes,
  });
  if (reviewError) throw new Error(reviewError);
  const origin = resolveUpdateSocialOrigin(existing, input);
  if (origin.error) throw new Error(origin.error);

  const data: Prisma.SocialPostUpdateInput = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.caption !== undefined) data.caption = input.caption;
  if (input.hashtags !== undefined) data.hashtags = input.hashtags;
  if (input.platforms !== undefined) data.platforms = input.platforms;
  if (input.status !== undefined) data.status = input.status;
  if (input.contentType !== undefined) data.contentType = input.contentType;
  if (input.category !== undefined) data.category = input.category;
  if (input.scheduledAt !== undefined) {
    data.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  }
  if (input.publishedAt !== undefined) {
    data.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
  }
  if (input.mediaUrls !== undefined) data.mediaUrls = input.mediaUrls;
  if (input.notes !== undefined) data.notes = input.notes;
  if (origin.changed) {
    data.originType = origin.originType;
    data.originId = origin.originId;
    data.originLabel = origin.originLabel;
  }
  if (input.bookingId !== undefined) {
    data.booking = input.bookingId
      ? { connect: { id: input.bookingId } }
      : { disconnect: true };
  }

  // Auto-set publishedAt quan passa a PUBLISHED sense data
  if (input.status === SOCIAL_POST_STATUSES.PUBLISHED && !existing.publishedAt && input.publishedAt === undefined) {
    data.publishedAt = new Date();
  }

  const post = await prisma.socialPost.update({ where: { id }, data });
  await syncSocialPostToGoogleCalendar(post.id);
  return post;
}

export async function deleteSocialPost(id: string): Promise<void> {
  await syncSocialPostToGoogleCalendar(id, 'delete');
  await prisma.socialPost.delete({ where: { id } });
}

// ───────────────────────────────────────────────────────────────────────────
// CALENDAR
// ───────────────────────────────────────────────────────────────────────────

export type CalendarRange = { from: Date; to: Date };

/** Retorna posts agrupats per dia (clau YYYY-MM-DD) dins un rang */
export async function getSocialCalendar(range: CalendarRange): Promise<Record<string, SocialPost[]>> {
  const posts = await prisma.socialPost.findMany({
    where: {
      OR: [
        { scheduledAt: { gte: range.from, lte: range.to } },
        { publishedAt: { gte: range.from, lte: range.to } },
      ],
    },
    orderBy: { scheduledAt: 'asc' },
  });

  const grouped: Record<string, SocialPost[]> = {};
  for (const post of posts) {
    const ref = post.scheduledAt ?? post.publishedAt;
    if (!ref) continue;
    const key = ref.toISOString().slice(0, 10);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(post);
  }
  return grouped;
}

/** Resum d'estats per KPI */
export async function getSocialPostCounts(): Promise<Record<SocialPostStatus, number>> {
  const rows = await prisma.socialPost.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  const counts: Record<SocialPostStatus, number> = {
    IDEA: 0,
    DRAFT: 0,
    SCHEDULED: 0,
    PUBLISHED: 0,
    ARCHIVED: 0,
  };
  for (const row of rows) {
    counts[row.status as SocialPostStatus] = row._count._all;
  }
  return counts;
}
