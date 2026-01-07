/**
 * API ROUTE: Upload publico para testimonios/valoraciones
 * ====================================================
 * POST - Subir foto o video de testimonios
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { verifyCsrf } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

// Limite por upload directo (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey);
}

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const allowedOrigins = new Set([
    'https://orbitaevents.com',
    'https://www.orbitaevents.com',
  ]);

  return allowedOrigins.has(origin);
}

export async function POST(request: NextRequest) {
  // Origin check
  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Origen no permitido' },
      { status: 403 }
    );
  }

  // CSRF Protection
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  // Rate limiting
  const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.uploads);
  if (rateLimitResult) return rateLimitResult;

  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Storage no configurado' },
        { status: 500 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    const validPhotoTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => null);
      const fileName = body?.fileName as string | undefined;
      const fileType = body?.fileType as string | undefined;
      const type = (body?.type as string) || 'photo';

      if (!fileName || !fileType) {
        return NextResponse.json(
          { success: false, error: 'Faltan parametros fileName y fileType' },
          { status: 400 }
        );
      }

      if (type === 'photo' && !validPhotoTypes.includes(fileType)) {
        return NextResponse.json(
          { success: false, error: 'Formato no permitido. Usa JPG, PNG, WebP o GIF.' },
          { status: 400 }
        );
      }

      if (type === 'video' && !validVideoTypes.includes(fileType)) {
        return NextResponse.json(
          { success: false, error: 'Formato no permitido. Usa MP4, MOV o WebM.' },
          { status: 400 }
        );
      }

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const ext = fileName.split('.').pop()?.toLowerCase() || 'bin';
      const folder = type === 'video' ? 'testimonials/videos' : 'testimonials/photos';
      const path = `${folder}/${timestamp}-${random}.${ext}`;

      const { data, error } = await supabaseAdmin.storage
        .from('media')
        .createSignedUploadUrl(path);

      if (error) {
        log.error('Error creando signed URL:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('media')
        .getPublicUrl(path);

      return NextResponse.json({
        success: true,
        useSignedUrl: true,
        signedUrl: data.signedUrl,
        token: data.token,
        path,
        url: urlData.publicUrl,
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'photo';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se ha proporcionado ningun fichero' },
        { status: 400 }
      );
    }

    if (type === 'photo' && !validPhotoTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Formato no permitido. Usa JPG, PNG, WebP o GIF.' },
        { status: 400 }
      );
    }

    if (type === 'video' && !validVideoTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Formato no permitido. Usa MP4, MOV o WebM.' },
        { status: 400 }
      );
    }

    const maxSize = type === 'video' ? 50 * 1024 * 1024 : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: type === 'video'
            ? 'Video demasiado grande. Maximo 50MB.'
            : 'Foto demasiado grande. Maximo 5MB.'
        },
        { status: 413 }
      );
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const folder = type === 'video' ? 'testimonials/videos' : 'testimonials/photos';
    const fileName = `${folder}/${timestamp}-${random}.${ext}`;

    if (file.size > 4 * 1024 * 1024) {
      const { data, error } = await supabaseAdmin.storage
        .from('media')
        .createSignedUploadUrl(fileName);

      if (error) {
        log.error('Error creando signed URL:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('media')
        .getPublicUrl(fileName);

      return NextResponse.json({
        success: true,
        useSignedUrl: true,
        signedUrl: data.signedUrl,
        token: data.token,
        path: fileName,
        url: urlData.publicUrl,
      });
    }

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
      log.error('Supabase upload error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    });

  } catch (error) {
    log.error('Error subiendo fichero:', error);
    return NextResponse.json(
      { success: false, error: 'Error procesando el fichero' },
      { status: 500 }
    );
  }
}