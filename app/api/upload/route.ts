/**
 * API ROUTE: File Upload (Local Storage)
 * POST - Pujar fitxer al filesystem local
 */

import { NextRequest, NextResponse } from 'next/server';
import { API_UPLOAD_DIRECT_LIMIT, API_UPLOAD_MESSAGES, API_UPLOAD_VALID_TYPES, type ApiUploadLocale } from '@/lib/constants';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { uploadFile, getPublicUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';


function resolveApiUploadLocale(request: NextRequest): ApiUploadLocale {
  const header = request.headers.get('accept-language')?.toLowerCase() || '';
  if (header.includes('ca')) return 'ca';
  if (header.includes('en')) return 'en';
  return 'es';
}

function normalizeFolder(input: unknown): string | null {
  const folder = typeof input === 'string' ? input.trim() : '';
  if (!folder) return 'uploads';
  if (folder.startsWith('/') || folder.startsWith('\\') || folder.includes('..') || folder.includes(':')) {
    return null;
  }
  if (!/^[a-zA-Z0-9/_-]+$/.test(folder)) {
    return null;
  }
  return folder;
}

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;

  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;
  if (!ADMIN_USER || !ADMIN_PASS) return false;

  try {
    const base64Credentials = authHeader.split(' ')[1]!;
    const decoded =
      typeof atob === 'function'
        ? atob(base64Credentials)
        : Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [user, ...passParts] = decoded.split(':');
    const pass = passParts.join(':');
    return user === ADMIN_USER && pass === ADMIN_PASS;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const locale = resolveApiUploadLocale(request);
  const t = API_UPLOAD_MESSAGES[locale];
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.uploads);
  if (rateLimitResult) return rateLimitResult;

  if (!verifyAuth(request)) {
    log.warn('Intento de upload sense autenticació', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json(
      { error: t.unauthorized },
      { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Upload"' } }
    );
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { fileName, fileType, folder: folderInput } = body;
      const folder = normalizeFolder(folderInput);

      if (!fileName || !fileType) {
        return NextResponse.json({ error: t.missingFileNameOrType }, { status: 400 });
      }
      if (!folder) {
        return NextResponse.json({ error: t.invalidFolder }, { status: 400 });
      }
      if (!API_UPLOAD_VALID_TYPES.includes(fileType as (typeof API_UPLOAD_VALID_TYPES)[number])) {
        return NextResponse.json({ error: t.invalidFileType }, { status: 400 });
      }

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const ext = fileName.split('.').pop() || 'bin';
      const path = `${folder}/${timestamp}-${random}.${ext}`;

      return NextResponse.json({
        success: true,
        path,
        publicUrl: getPublicUrl(path),
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = normalizeFolder(formData.get('folder'));

    if (!file) {
      return NextResponse.json({ error: t.missingFile }, { status: 400 });
    }
    if (!folder) {
      return NextResponse.json({ error: t.invalidFolder }, { status: 400 });
    }
    if (!API_UPLOAD_VALID_TYPES.includes(file.type as (typeof API_UPLOAD_VALID_TYPES)[number])) {
      return NextResponse.json({ error: t.invalidFileType }, { status: 400 });
    }
    if (file.size > API_UPLOAD_DIRECT_LIMIT) {
      return NextResponse.json({ error: t.fileTooLarge }, { status: 413 });
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop() || 'bin';
    const filePath = `${folder}/${timestamp}-${random}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFile(filePath, buffer);

    log.info('Fitxer pujat correctament', { path: result.path });

    return NextResponse.json({
      success: true,
      url: result.publicUrl,
      path: result.path,
    });
  } catch (error) {
    log.error('Error pujant fitxer', error);
    return NextResponse.json({ error: t.processingError }, { status: 500 });
  }
}
