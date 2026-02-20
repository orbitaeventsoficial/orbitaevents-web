import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission, getAdminRole } from '@/lib/auth';
import { log } from '@/lib/logger';
import {
  getActivePortalAccessForBooking,
  issueClientPortalAccess,
  normalizePortalLocale,
  revokeActiveClientPortalAccess,
  type PortalPersonalization,
} from '@/lib/services/clientPortalAccess';

interface Params {
  params: { id: string };
}

function sanitizePersonalization(input: unknown): PortalPersonalization | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const source = input as Record<string, unknown>;

  const toOptionalString = (value: unknown, max = 300): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.slice(0, max);
  };

  const toOptionalBool = (value: unknown): boolean | undefined => {
    return typeof value === 'boolean' ? value : undefined;
  };

  const personalization: PortalPersonalization = {
    headline: toOptionalString(source.headline, 120),
    introMessage: toOptionalString(source.introMessage, 1200),
    accentColor: toOptionalString(source.accentColor, 20),
    showTimeline: toOptionalBool(source.showTimeline),
    showPayments: toOptionalBool(source.showPayments),
    showDocuments: toOptionalBool(source.showDocuments),
    showPostEvent: toOptionalBool(source.showPostEvent),
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
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const body = await req.json().catch(() => ({}));
    const expiresInDaysRaw = Number((body as { expiresInDays?: unknown })?.expiresInDays);
    const expiresInDays = Number.isFinite(expiresInDaysRaw) ? Math.round(expiresInDaysRaw) : undefined;
    const locale = normalizePortalLocale((body as { locale?: string }).locale);
    const personalization = sanitizePersonalization((body as { personalization?: unknown }).personalization);

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
