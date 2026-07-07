import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { getAppBaseUrl } from '@/lib/site';
import { SUPPORTED_LOCALES as SHARED_SUPPORTED_LOCALES } from '@/lib/constants';
import { CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS } from '@/lib/constants/clientPortalPersonalization';
import type { PortalPersonalization } from '@/lib/constants/clientPortalPersonalization';
import type { ClientPortalLocale } from '@/lib/clientPortalMessages';

const portalAccessRepo = prisma.clientPortalAccess;

export type { PortalPersonalization };

function hashPortalToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generatePortalToken(): string {
  return randomBytes(32).toString('base64url');
}

export function normalizePortalLocale(locale: string | null | undefined): ClientPortalLocale {
  const normalized = String(locale || 'ca').trim().toLowerCase();
  return (SHARED_SUPPORTED_LOCALES as readonly string[]).includes(normalized)
    ? normalized as ClientPortalLocale
    : 'ca';
}

function buildClientPortalUrl(token: string, locale: string): string {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/${normalizePortalLocale(locale)}/portal/${token}`;
}

function isPortalAccessCurrentlyValid(access: { revokedAt: Date | null; expiresAt: Date | null }, now = new Date()): boolean {
  return !access.revokedAt && Boolean(access.expiresAt) && access.expiresAt! > now;
}

export async function getActivePortalAccessForBooking(bookingId: string) {
  const now = new Date();
  return portalAccessRepo.findFirst({
    where: {
      bookingId,
      revokedAt: null,
      expiresAt: { gt: now },
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
  const expiresInDays = Math.max(
    CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS.minDays,
    Math.min(
      CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS.maxDays,
      input.expiresInDays ?? CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS.defaultDays,
    ),
  );
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
          serviceLines: { select: { kind: true, label: true, revenueAmount: true, costAmount: true, collaboratorId: true, quantity: true } },
          proposals: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              status: true,
              reference: true,
              pdfUrl: true,
              createdAt: true,
              contractReference: true,
              contractStatus: true,
              contractPdfUrl: true,
              contractSignedAt: true,
              contractSignatureBlob: true,
            },
          },
          postEventReport: { select: { id: true } },
          clientFeedback: { select: { id: true } },
          customer: true,
          lead: true,
        },
      },
      customer: true,
    },
  });

  if (!access) return null;
  if (!isPortalAccessCurrentlyValid(access, now)) return null;

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
  } catch (error) {
    log.error('[ClientPortal] Error actualitzant accés:', error);
  }
}
