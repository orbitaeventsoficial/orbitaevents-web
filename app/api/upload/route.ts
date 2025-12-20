/**
 * API ROUTE: File Upload a Supabase Storage
 * ==========================================
 * POST - Pujar fitxer petit directament o generar signed URL per fitxers grans
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Límit per upload directe (4MB per evitar límit Vercel)
const DIRECT_UPLOAD_LIMIT = 4 * 1024 * 1024;

// Supabase admin client (amb service key)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey);
}

/**
 * POST - Pujar fitxer a Supabase Storage
 * Per fitxers > 4MB, retorna signed URL per upload directe
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Storage no configurat' },
        { status: 500 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    // Si és una petició per obtenir signed URL
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { fileName, fileType, folder = 'uploads' } = body;

      if (!fileName || !fileType) {
        return NextResponse.json(
          { error: 'Falten paràmetres fileName i fileType' },
          { status: 400 }
        );
      }

      // Generar nom únic
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const ext = fileName.split('.').pop() || 'bin';
      const path = `${folder}/${timestamp}-${random}.${ext}`;

      // Crear signed URL per upload directe (vàlid 1 hora)
      const { data, error } = await supabaseAdmin.storage
        .from('media')
        .createSignedUploadUrl(path);

      if (error) {
        console.error('Error creating signed URL:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('media')
        .getPublicUrl(path);

      return NextResponse.json({
        success: true,
        signedUrl: data.signedUrl,
        token: data.token,
        path: path,
        publicUrl: urlData.publicUrl,
      });
    }

    // Upload directe per fitxers petits
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json(
        { error: 'No s\'ha proporcionat cap fitxer' },
        { status: 400 }
      );
    }

    // Validar tipus
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipus de fitxer no permès. Usa JPG, PNG, WebP, GIF o MP4.' },
        { status: 400 }
      );
    }

    // Si és massa gran, retornar instruccions per usar signed URL
    if (file.size > DIRECT_UPLOAD_LIMIT) {
      return NextResponse.json(
        { error: 'Fitxer massa gran per upload directe. Usa signed URL.', useSignedUrl: true },
        { status: 413 }
      );
    }

    // Generar nom únic
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${folder}/${timestamp}-${random}.${ext}`;

    // Convertir a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload a Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('media')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
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
    console.error('Error pujant fitxer:', error);
    return NextResponse.json(
      { error: 'Error processant el fitxer' },
      { status: 500 }
    );
  }
}
