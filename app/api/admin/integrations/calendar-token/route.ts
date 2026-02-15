import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

const SETTING_KEY = 'integrations.calendar.feedToken';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const requestId = getRequestId(req);

  try {
    const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
    return NextResponse.json({ ok: true, token: setting?.value || null });
  } catch (error) {
    log.error('Error llegint token de calendari', error, {
      context: { requestId, endpoint: 'admin/integrations/calendar-token:GET' },
    });
    return NextResponse.json({ ok: false, error: 'Error llegint token' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'integrations');
  if (permissionError) return permissionError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const token = crypto.randomBytes(24).toString('base64url');
    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: {
        value: token,
        category: 'config',
        label: 'Calendar feed token',
        description: 'Token to expose booking calendar as ICS feed',
      },
      create: {
        key: SETTING_KEY,
        value: token,
        type: 'STRING',
        category: 'config',
        label: 'Calendar feed token',
        description: 'Token to expose booking calendar as ICS feed',
      },
    });

    return NextResponse.json({ ok: true, token });
  } catch (error) {
    log.error('Error regenerant token de calendari', error, {
      context: { requestId, endpoint: 'admin/integrations/calendar-token:POST' },
    });
    return NextResponse.json({ ok: false, error: 'Error regenerant token' }, { status: 500 });
  }
}
