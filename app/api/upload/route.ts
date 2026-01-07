/**
 * API ROUTE: File Upload a Supabase Storage
 * POST - Subir fichero pequeno o generar signed URL para ficheros grandes
 * PROTEGIDO: Requiere autenticacion admin y rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const DIRECT_UPLOAD_LIMIT = 4 * 1024 * 1024;
const VALID_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
];

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

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;

  if (!ADMIN_USER || !ADMIN_PASS) {
    return false;
  }

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

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey);
}

export async function POST(request: NextRequest) {
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.uploads);
  if (rateLimitResult) return rateLimitResult;

  if (!verifyAuth(request)) {
    log.warn('Intento de upload sin autenticacion', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Upload"' } }
    );
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Storage no configurado' },
        { status: 500 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { fileName, fileType, folder: folderInput } = body;
      const folder = normalizeFolder(folderInput);

      if (!fileName || !fileType) {
        return NextResponse.json(
          { error: 'Faltan parametros fileName y fileType' },
          { status: 400 }
        );
      }

      if (!folder) {
        return NextResponse.json(
          { error: 'Carpeta invalida' },
          { status: 400 }
        );
      }

      if (!VALID_UPLOAD_TYPES.includes(fileType)) {
        return NextResponse.json(
          { error: 'Tipo de fichero no permitido. Usa JPG, PNG, WebP, GIF o MP4.' },
          { status: 400 }
        );
      }

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const ext = fileName.split('.').pop() || 'bin';
      const path = `${folder}/${timestamp}-${random}.${ext}`;

      const { data, error } = await supabaseAdmin.storage
        .from('media')
        .createSignedUploadUrl(path);

      if (error) {
        log.error('Error creando signed URL', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('media')
        .getPublicUrl(path);

      return NextResponse.json({
        success: true,
        signedUrl: data.signedUrl,
        token: data.token,
        path,
        publicUrl: urlData.publicUrl,
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = normalizeFolder(formData.get('folder'));

    if (!file) {
      return NextResponse.json(
        { error: 'No se ha proporcionado ningun fichero' },
        { status: 400 }
      );
    }

    if (!folder) {
      return NextResponse.json(
        { error: 'Carpeta invalida' },
        { status: 400 }
      );
    }

    if (!VALID_UPLOAD_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de fichero no permitido. Usa JPG, PNG, WebP, GIF o MP4.' },
        { status: 400 }
      );
    }

    if (file.size > DIRECT_UPLOAD_LIMIT) {
      return NextResponse.json(
        {
          error: 'Fichero demasiado grande para upload directo. Usa signed URL.',
          useSignedUrl: true,
        },
        { status: 413 }
      );
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${folder}/${timestamp}-${random}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from('media')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      log.error('Supabase upload error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(data.path);

    log.info('Fichero subido correctamente', { path: data.path });

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    });
  } catch (error) {
    log.error('Error subiendo fichero', error);
    return NextResponse.json(
      { error: 'Error procesando el fichero' },
      { status: 500 }
    );
  }
}