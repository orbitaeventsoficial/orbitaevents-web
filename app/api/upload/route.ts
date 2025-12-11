/**
 * API ROUTE: Upload d'imatges
 * ===========================
 * Puja imatges a Supabase Storage
 * Bucket: testimonials
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

// Mida màxima: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No s\'ha proporcionat cap fitxer' }, { status: 400 });
    }

    // Validar tipus
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipus de fitxer no permès. Usa JPG, PNG, WebP o GIF.' },
        { status: 400 }
      );
    }

    // Validar mida
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El fitxer és massa gran. Màxim 5MB.' },
        { status: 400 }
      );
    }

    // Generar nom únic
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `testimonial_${timestamp}_${random}.${ext}`;

    // Convertir a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Pujar a Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('testimonials')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Error pujant a Supabase:', error);
      return NextResponse.json(
        { error: 'Error pujant la imatge' },
        { status: 500 }
      );
    }

    // Obtenir URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('testimonials')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error('Error en upload:', error);
    return NextResponse.json(
      { error: 'Error processant la imatge' },
      { status: 500 }
    );
  }
}
