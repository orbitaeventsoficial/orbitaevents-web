/**
 * API ROUTE: File Upload
 * ======================
 * POST - Pujar foto/vídeo
 *
 * NOTA: Aquesta és una versió simplificada.
 * Per producció, connectar amb Supabase Storage o Cloudinary.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Mida màxima 10MB
const MAX_SIZE = 10 * 1024 * 1024;

/**
 * POST - Pujar fitxer
 * Retorna URL temporal (per ara només validem i retornem una URL placeholder)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No s\'ha proporcionat cap fitxer' },
        { status: 400 }
      );
    }

    // Validar mida
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'El fitxer és massa gran (màx 10MB)' },
        { status: 400 }
      );
    }

    // Validar tipus
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipus de fitxer no permès. Usa JPG, PNG, WebP o MP4.' },
        { status: 400 }
      );
    }

    // TODO: Implementar pujada real a Supabase Storage o Cloudinary
    // Per ara, retornem una URL placeholder basada en el nom
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const placeholderUrl = `/uploads/${timestamp}-${safeName}`;

    // En una implementació real:
    // const { data, error } = await supabase.storage
    //   .from('testimonials')
    //   .upload(`${timestamp}-${safeName}`, file);
    // const url = supabase.storage.from('testimonials').getPublicUrl(data.path).data.publicUrl;

    return NextResponse.json({
      success: true,
      url: placeholderUrl,
      message: 'Fitxer validat correctament',
    });
  } catch (error) {
    console.error('Error pujant fitxer:', error);
    return NextResponse.json(
      { error: 'Error processant el fitxer' },
      { status: 500 }
    );
  }
}
