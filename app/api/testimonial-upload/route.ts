/**
 * API ROUTE: Upload públic per testimonis/valoracions
 * ====================================================
 * POST - Pujar foto o vídeo de testimonis
 * PÚBLIC: No requereix autenticació, però té rate limiting estricte
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Límit per upload directe (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Rate limiting simple per IP
const uploadAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_UPLOADS_PER_HOUR = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const hourAgo = now - 3600000;

  for (const [key, record] of uploadAttempts.entries()) {
    if (record.timestamp < hourAgo) {
      uploadAttempts.delete(key);
    }
  }

  const record = uploadAttempts.get(ip);
  
  if (!record || record.timestamp < hourAgo) {
    uploadAttempts.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  if (record.count >= MAX_UPLOADS_PER_HOUR) {
    return false;
  }
  
  record.count++;
  return true;
}

// Supabase admin client
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey);
}

export async function POST(request: NextRequest) {
  // 1. Rate limiting per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Massa intents. Espera una hora.' },
      { status: 429 }
    );
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Storage no configurat' },
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
          { success: false, error: 'Falten paràmetres fileName i fileType' },
          { status: 400 }
        );
      }

      if (type === 'photo' && !validPhotoTypes.includes(fileType)) {
        return NextResponse.json(
          { success: false, error: 'Format no permès. Usa JPG, PNG, WebP o GIF.' },
          { status: 400 }
        );
      }

      if (type === 'video' && !validVideoTypes.includes(fileType)) {
        return NextResponse.json(
          { success: false, error: 'Format no permès. Usa MP4, MOV o WebM.' },
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
        log.error('Error creant signed URL:', error);
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
    const type = formData.get('type') as string || 'photo'; // 'photo' o 'video'

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No s'ha proporcionat cap fitxer" },
        { status: 400 }
      );
    }

    // Validar tipus segons si és foto o vídeo
    if (type === 'photo' && !validPhotoTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Format no permès. Usa JPG, PNG, WebP o GIF.' },
        { status: 400 }
      );
    }
    
    if (type === 'video' && !validVideoTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Format no permès. Usa MP4, MOV o WebM.' },
        { status: 400 }
      );
    }

    // Validar mida
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: type === 'video' 
            ? 'Vídeo massa gran. Màxim 50MB.' 
            : 'Foto massa gran. Màxim 5MB.' 
        },
        { status: 413 }
      );
    }

    // Generar nom únic
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const folder = type === 'video' ? 'testimonials/videos' : 'testimonials/photos';
    const fileName = `${folder}/${timestamp}-${random}.${ext}`;

    // Si el fitxer és massa gran per upload directe a Vercel (4MB), usar signed URL
    if (file.size > 4 * 1024 * 1024) {
      // Per fitxers grans, retornar signed URL
      const { data, error } = await supabaseAdmin.storage
        .from('media')
        .createSignedUploadUrl(fileName);

      if (error) {
        log.error('Error creant signed URL:', error);
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

    // Upload directe per fitxers petits
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

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    });

  } catch (error) {
    log.error('Error pujant fitxer:', error);
    return NextResponse.json(
      { success: false, error: 'Error processant el fitxer' },
      { status: 500 }
    );
  }
}
