import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { requireAuth, requirePermission, getAdminRole } from '@/lib/auth';
import { log } from '@/lib/logger';
import {
  getActivePortalAccessForBooking,
  issueClientPortalAccess,
  normalizePortalLocale,
  revokeActiveClientPortalAccess,
} from '@/lib/services/clientPortalAccess';
import {
  CLIENT_PORTAL_PERSONALIZATION_LIMITS,
  type PortalPersonalization,
} from '@/lib/constants/clientPortalPersonalization';
import { normalizePortalAccentHex } from '@/lib/clientPortalUtils';

interface Params {
  params: { id: string };
}

function toRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
}

function sanitizePersonalization(input: unknown): PortalPersonalization | undefined {
  const source = toRecord(input);

  const toOptionalString = (value: unknown, max: number): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.slice(0, max);
  };

  const toHiddenFlag = (value: unknown): false | undefined => {
    return value === false ? false : undefined;
  };

  const personalization: PortalPersonalization = {
    headline: toOptionalString(source.headline, CLIENT_PORTAL_PERSONALIZATION_LIMITS.headline),
    introMessage: toOptionalString(source.introMessage, CLIENT_PORTAL_PERSONALIZATION_LIMITS.introMessage),
    accentColor: normalizePortalAccentHex(
      toOptionalString(source.accentColor, CLIENT_PORTAL_PERSONALIZATION_LIMITS.accentColor),
    ),
    showTimeline: toHiddenFlag(source.showTimeline),
    showPayments: toHiddenFlag(source.showPayments),
    showDocuments: toHiddenFlag(source.showDocuments),
    showPostEvent: toHiddenFlag(source.showPostEvent),
    showQuestionnaire: toHiddenFlag(source.showQuestionnaire),
  };

  const hasAnyValue = Object.values(personalization).some((value) => typeof value !== 'undefined');
  return hasAnyValue ? personalization : undefined;
}

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  try {
    const active = await getActivePortalAccessForBooking(params.id);
    return NextResponse.json({ ok: true, active });
  } catch (error) {
    log.error('Error obtenint estat del portal client', error, { context: { bookingId: params.id } });
    return NextResponse.json({ ok: false, error: 'Error obtenint estat del portal' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const body = toRecord(await req.json().catch(() => ({})));
    const expiresInDaysRaw = Number(body.expiresInDays);
    const expiresInDays = Number.isFinite(expiresInDaysRaw) ? Math.round(expiresInDaysRaw) : undefined;
    const locale = normalizePortalLocale(typeof body.locale === 'string' ? body.locale : undefined);
    const personalization = sanitizePersonalization(body.personalization);

    const result = await issueClientPortalAccess({
      bookingId: params.id,
      expiresInDays,
      locale,
      personalization,
      createdBy: getAdminRole(req),
    });

    return NextResponse.json({
      ok: true,
      active: result.access,
      url: result.url,
      token: result.token,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'BOOKING_NOT_FOUND') {
      return NextResponse.json({ ok: false, error: 'Reserva no trobada' }, { status: 404 });
    }

    log.error('Error generant enllaç de portal client', error, { context: { bookingId: params.id } });
    return NextResponse.json({ ok: false, error: 'Error generant l\'enllaç del portal' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const revoked = await revokeActiveClientPortalAccess(params.id);
    return NextResponse.json({ ok: true, revoked });
  } catch (error) {
    log.error('Error revocant enllaç de portal client', error, { context: { bookingId: params.id } });
    return NextResponse.json({ ok: false, error: 'Error revocant enllaç de portal' }, { status: 500 });
  }
}
