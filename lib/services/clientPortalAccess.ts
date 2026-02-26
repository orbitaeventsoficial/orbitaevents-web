import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

const DEFAULT_BASE_URL = 'https://orbitaevents.com';
const DEFAULT_EXPIRY_DAYS = 30;
const SUPPORTED_LOCALES = new Set(['ca', 'es', 'en']);
const portalAccessRepo = prisma.clientPortalAccess;

export type PortalPersonalization = {
  headline?: string;
  introMessage?: string;
  accentColor?: string;
  showTimeline?: boolean;
  showPayments?: boolean;
  showDocuments?: boolean;
  showPostEvent?: boolean;
};

export function hashPortalToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generatePortalToken(): string {
  return randomBytes(32).toString('base64url');
}

export function normalizePortalLocale(locale: string | null | undefined): string {
  const normalized = String(locale || 'ca').toLowerCase();
  return SUPPORTED_LOCALES.has(normalized) ? normalized : 'ca';
}

export function buildClientPortalUrl(token: string, locale: string): string {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  return `${baseUrl}/${normalizePortalLocale(locale)}/portal/${token}`;
}

export async function getActivePortalAccessForBooking(bookingId: string) {
  const now = new Date();
  return portalAccessRepo.findFirst({
    where: {
      bookingId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      tokenPrefix: true,
      locale: true,
      personalization: true,
      expiresAt: true,
      createdAt: true,
      createdBy: true,
      lastAccessedAt: true,
    },
  });
}

export async function issueClientPortalAccess(input: {
  bookingId: string;
  locale?: string | null;
  personalization?: PortalPersonalization | null;
  expiresInDays?: number | null;
  createdBy?: string | null;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    select: {
      id: true,
      customerId: true,
      preferredLocale: true,
    },
  });

  if (!booking) {
    throw new Error('BOOKING_NOT_FOUND');
  }

  const now = new Date();
  await portalAccessRepo.updateMany({
    where: {
      bookingId: booking.id,
      revokedAt: null,
    },
    data: {
      revokedAt: now,
    },
  });

  const token = generatePortalToken();
  const tokenHash = hashPortalToken(token);
  const normalizedLocale = normalizePortalLocale(input.locale || booking.preferredLocale);
  const expiresInDays = Math.max(1, Math.min(365, input.expiresInDays || DEFAULT_EXPIRY_DAYS));
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

  const access = await portalAccessRepo.create({
    data: {
      bookingId: booking.id,
      customerId: booking.customerId,
      tokenHash,
      tokenPrefix: token.slice(0, 12),
      locale: normalizedLocale,
      personalization: input.personalization || undefined,
      expiresAt,
      createdBy: input.createdBy || undefined,
    },
    select: {
      id: true,
      tokenPrefix: true,
      locale: true,
      personalization: true,
      expiresAt: true,
      createdAt: true,
      createdBy: true,
      lastAccessedAt: true,
    },
  });

  return {
    access,
    token,
    url: buildClientPortalUrl(token, normalizedLocale),
  };
}

export async function revokeActiveClientPortalAccess(bookingId: string) {
  const now = new Date();
  const result = await portalAccessRepo.updateMany({
    where: {
      bookingId,
      revokedAt: null,
    },
    data: {
      revokedAt: now,
    },
  });
  return result.count;
}

export async function findPortalAccessByRawToken(token: string) {
  if (!token || token.length < 20) return null;

  const now = new Date();
  const tokenHash = hashPortalToken(token);

  const access = await portalAccessRepo.findUnique({
    where: { tokenHash },
    include: {
      booking: {
        include: {
          pack: { include: { translations: true } },
          extras: { include: { extra: { include: { translations: true } } } },
          inventory: { include: { item: true } },
          proposals: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              status: true,
              reference: true,
              pdfUrl: true,
              createdAt: true,
            },
          },
          postEventReport: true,
          customer: true,
          lead: true,
        },
      },
      customer: true,
    },
  });

  if (!access) return null;
  if (access.revokedAt) return null;
  if (access.expiresAt && access.expiresAt <= now) return null;

  return access;
}

export async function markPortalAccessHit(input: {
  accessId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  try {
    await portalAccessRepo.update({
      where: { id: input.accessId },
      data: {
        lastAccessedAt: new Date(),
        lastAccessIp: input.ip || undefined,
        lastAccessUa: input.userAgent || undefined,
      },
    });
  } catch {
    // best-effort tracking
  }
}
