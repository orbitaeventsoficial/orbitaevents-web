/**
 * GET /api/admin/inbox/messages/[uid]/attachment
 * ?folder=INBOX&part=2.2&filename=document.pdf&contentType=application/pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { fetchAttachmentPart } from '@/lib/imap';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ uid: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { uid } = await params;
  const uidNum = Number.parseInt(uid, 10);
  if (!Number.isFinite(uidNum)) {
    return NextResponse.json({ error: 'UID invàlid' }, { status: 400 });
  }

  const sp = request.nextUrl.searchParams;
  const partKey = sp.get('part') || '';
  const folder = sp.get('folder') || 'INBOX';
  const filename = sp.get('filename') || 'adjunt';
  const contentType = sp.get('contentType') || 'application/octet-stream';

  if (!partKey) {
    return NextResponse.json({ error: 'Cal el paràmetre part' }, { status: 400 });
  }

  const buffer = await fetchAttachmentPart(uidNum, partKey, folder);
  if (!buffer) {
    return NextResponse.json({ error: 'Adjunt no trobat' }, { status: 404 });
  }

  const safeFilename = encodeURIComponent(filename).replace(/%20/g, '+');
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${safeFilename}`,
      'Content-Length': String(buffer.byteLength),
      'Cache-Control': 'private, no-store',
    },
  });
}
