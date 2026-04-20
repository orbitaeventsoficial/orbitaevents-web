// lib/services/socialIdeasService.ts
// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL IDEAS SERVICE
// Genera idees de post automàtiques a partir de bookings, testimonials i
// portfolio recents. Part pura (generateSocialIdeas) sense DB + wrapper
// (loadSocialIdeas) que carrega les dades i crida la pura.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import {
  SOCIAL_PLATFORMS,
  SOCIAL_CONTENT_TYPES,
  SOCIAL_CATEGORIES,
  type SocialPlatform,
  type SocialContentType,
  type SocialCategory,
} from '@/lib/constants';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type SocialIdeaSource = 'booking' | 'testimonial' | 'portfolio' | 'upcoming-event';

export type SocialIdea = {
  id: string;
  source: SocialIdeaSource;
  title: string;
  caption: string;
  hashtags: string[];
  platforms: SocialPlatform[];
  contentType: SocialContentType;
  category: SocialCategory;
  scheduledAt: Date | null;
  mediaUrl: string | null;
  sourceRef: { type: SocialIdeaSource; id: string; label: string };
  reason: string;
};

export type SocialIdeasInput = {
  recentBookings: Array<{
    id: string;
    eventDate: Date;
    eventType: string | null;
    packName: string | null;
    customerName: string | null;
    hasSocialPost: boolean;
  }>;
  newTestimonials: Array<{
    id: string;
    customerName: string;
    text: string;
    rating: number;
    eventType: string | null;
    photoUrl: string | null;
    hasSocialPost: boolean;
  }>;
  portfolioEvents: Array<{
    id: string;
    slug: string;
    title: string;
    categorySlug: string;
    coverImage: string;
    createdAt: Date;
  }>;
  upcomingEvents: Array<{
    id: string;
    eventDate: Date;
    eventType: string | null;
    venue: string | null;
  }>;
  now: Date;
};

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

const DAY_MS = 1000 * 60 * 60 * 24;

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / DAY_MS);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export function generateSocialIdeas(input: SocialIdeasInput): SocialIdea[] {
  const ideas: SocialIdea[] = [];

  // ── Recent bookings completed (showcase) ──────────────────────────────
  for (const booking of input.recentBookings) {
    if (booking.hasSocialPost) continue;
    const daysSince = daysBetween(input.now, booking.eventDate);
    if (daysSince < 1 || daysSince > 30) continue;

    const eventLabel = booking.eventType || 'esdeveniment';
    ideas.push({
      id: `booking:${booking.id}`,
      source: 'booking',
      title: `Ressenya ${eventLabel}${booking.packName ? ` · ${booking.packName}` : ''}`,
      caption: `Fa ${daysSince} dia${daysSince === 1 ? '' : 's'} vam viure un ${eventLabel} espectacular. Gràcies per confiar-nos el vostre dia!`,
      hashtags: ['#OrbitaEvents', `#${eventLabel.replace(/\s+/g, '')}`, '#EventsGirona'],
      platforms: [SOCIAL_PLATFORMS.INSTAGRAM, SOCIAL_PLATFORMS.FACEBOOK],
      contentType: SOCIAL_CONTENT_TYPES.CAROUSEL,
      category: SOCIAL_CATEGORIES.EVENT_SHOWCASE,
      scheduledAt: null,
      mediaUrl: null,
      sourceRef: {
        type: 'booking',
        id: booking.id,
        label: booking.customerName || booking.packName || eventLabel,
      },
      reason: `Esdeveniment fa ${daysSince}d, sense post associat`,
    });
  }

  // ── Approved testimonials ──────────────────────────────────────────────
  for (const t of input.newTestimonials) {
    if (t.hasSocialPost) continue;

    const eventLabel = t.eventType || 'esdeveniment';
    const stars = '⭐'.repeat(Math.max(1, Math.min(5, t.rating)));
    ideas.push({
      id: `testimonial:${t.id}`,
      source: 'testimonial',
      title: `Testimoni de ${t.customerName}`,
      caption: `${stars}\n\n"${truncate(t.text, 220)}"\n\n— ${t.customerName}`,
      hashtags: ['#OrbitaEvents', '#TestimoniClient', `#${eventLabel.replace(/\s+/g, '')}`],
      platforms: [SOCIAL_PLATFORMS.INSTAGRAM, SOCIAL_PLATFORMS.FACEBOOK],
      contentType: t.photoUrl ? SOCIAL_CONTENT_TYPES.IMAGE : SOCIAL_CONTENT_TYPES.TEXT,
      category: SOCIAL_CATEGORIES.TESTIMONIAL,
      scheduledAt: null,
      mediaUrl: t.photoUrl,
      sourceRef: { type: 'testimonial', id: t.id, label: t.customerName },
      reason: `Testimoni ${t.rating}★ aprovat sense publicar`,
    });
  }

  // ── New portfolio items ────────────────────────────────────────────────
  for (const p of input.portfolioEvents) {
    const daysSince = daysBetween(input.now, p.createdAt);
    if (daysSince > 45) continue;

    ideas.push({
      id: `portfolio:${p.id}`,
      source: 'portfolio',
      title: `Nou al portfolio · ${p.title}`,
      caption: `Acabem d'afegir ${p.title} al nostre portfolio. Descobreix com el vam fer possible a la nostra web.`,
      hashtags: ['#OrbitaEvents', `#${p.categorySlug.replace(/-/g, '')}`, '#Portfolio'],
      platforms: [SOCIAL_PLATFORMS.INSTAGRAM, SOCIAL_PLATFORMS.FACEBOOK, SOCIAL_PLATFORMS.PINTEREST],
      contentType: SOCIAL_CONTENT_TYPES.CAROUSEL,
      category: SOCIAL_CATEGORIES.EVENT_SHOWCASE,
      scheduledAt: null,
      mediaUrl: p.coverImage,
      sourceRef: { type: 'portfolio', id: p.id, label: p.title },
      reason: `Afegit al portfolio fa ${daysSince}d`,
    });
  }

  // ── Upcoming events (teaser countdown) ─────────────────────────────────
  for (const e of input.upcomingEvents) {
    const daysUntil = daysBetween(e.eventDate, input.now);
    if (daysUntil < 2 || daysUntil > 14) continue;

    // Suggest publishing 2 days before the event
    const suggestedScheduledAt = new Date(e.eventDate.getTime() - 2 * DAY_MS);
    const eventLabel = e.eventType || 'esdeveniment';
    const venueText = e.venue ? ` a ${e.venue}` : '';

    ideas.push({
      id: `upcoming:${e.id}`,
      source: 'upcoming-event',
      title: `Teaser ${eventLabel} (${daysUntil}d)`,
      caption: `Compte enrere! Queden ${daysUntil} dies per aquest ${eventLabel}${venueText}. Prepareu-vos per una nit inoblidable.`,
      hashtags: ['#OrbitaEvents', '#Countdown', `#${eventLabel.replace(/\s+/g, '')}`],
      platforms: [SOCIAL_PLATFORMS.INSTAGRAM],
      contentType: SOCIAL_CONTENT_TYPES.STORY,
      category: SOCIAL_CATEGORIES.EVENT_SHOWCASE,
      scheduledAt: suggestedScheduledAt,
      mediaUrl: null,
      sourceRef: {
        type: 'upcoming-event',
        id: e.id,
        label: e.venue || eventLabel,
      },
      reason: `Esdeveniment d'aquí ${daysUntil}d`,
    });
  }

  return ideas;
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER: carrega dades i crida la funció pura
// ───────────────────────────────────────────────────────────────────────────

export async function loadSocialIdeas(now: Date = new Date()): Promise<SocialIdea[]> {
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const fortyFiveDaysAgo = new Date(now.getTime() - 45 * DAY_MS);
  const fourteenDaysAhead = new Date(now.getTime() + 14 * DAY_MS);

  const [bookingRows, testimonialRows, portfolioRows, upcomingRows, existingPostKeys] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: { in: ['COMPLETED', 'CONFIRMED'] },
        eventDate: { gte: thirtyDaysAgo, lte: now },
      },
      select: {
        id: true,
        eventDate: true,
        eventType: true,
        clientName: true,
        pack: { select: { slug: true } },
      },
      orderBy: { eventDate: 'desc' },
      take: 20,
    }),
    prisma.customerTestimonial.findMany({
      where: { isApproved: true },
      select: {
        id: true,
        text: true,
        rating: true,
        eventType: true,
        photoUrl: true,
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.portfolioEvent.findMany({
      where: { published: true, createdAt: { gte: fortyFiveDaysAgo } },
      select: {
        id: true,
        slug: true,
        title: true,
        categorySlug: true,
        coverImage: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        eventDate: { gt: now, lte: fourteenDaysAhead },
      },
      select: {
        id: true,
        eventDate: true,
        eventType: true,
        eventLocation: true,
      },
      orderBy: { eventDate: 'asc' },
      take: 10,
    }),
    prisma.socialPost.findMany({
      where: { bookingId: { not: null } },
      select: { bookingId: true },
    }),
  ]);

  const bookingsWithPost = new Set(
    existingPostKeys.map((p) => p.bookingId).filter((id): id is string => Boolean(id))
  );

  const input: SocialIdeasInput = {
    recentBookings: bookingRows.map((b) => ({
      id: b.id,
      eventDate: b.eventDate,
      eventType: b.eventType as string | null,
      packName: b.pack?.slug || null,
      customerName: b.clientName || null,
      hasSocialPost: bookingsWithPost.has(b.id),
    })),
    newTestimonials: testimonialRows.map((t) => ({
      id: t.id,
      customerName: t.customer?.name || 'Client',
      text: t.text,
      rating: t.rating,
      eventType: t.eventType as string | null,
      photoUrl: t.photoUrl,
      hasSocialPost: false,
    })),
    portfolioEvents: portfolioRows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      categorySlug: p.categorySlug,
      coverImage: p.coverImage,
      createdAt: p.createdAt,
    })),
    upcomingEvents: upcomingRows.map((e) => ({
      id: e.id,
      eventDate: e.eventDate,
      eventType: e.eventType as string | null,
      venue: e.eventLocation,
    })),
    now,
  };

  return generateSocialIdeas(input);
}
