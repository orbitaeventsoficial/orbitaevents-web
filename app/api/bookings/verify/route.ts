/**
 * API ROUTE: Verificar Booking per Codi
 * =====================================
 * GET /api/bookings/verify?code=ORBITA-2024-XXXX
 * Verifica que el codi existeix i retorna info del booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.toUpperCase().trim();

    if (!code) {
      return NextResponse.json(
        { error: 'Cal proporcionar un codi' },
        { status: 400 }
      );
    }

    // Buscar booking per codi de verificació
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        reference,
        verification_code,
        event_type,
        event_date,
        event_location,
        status,
        client_name,
        client_email,
        review_requested_at
      `)
      .eq('verification_code', code)
      .single();

    if (error || !booking) {
      // Intentar buscar per referència (ex: OE-2024-001)
      const { data: bookingByRef, error: refError } = await supabaseAdmin
        .from('bookings')
        .select(`
          id,
          reference,
          verification_code,
          event_type,
          event_date,
          event_location,
          status,
          client_name,
          client_email,
          review_requested_at
        `)
        .eq('reference', code)
        .single();

      if (refError || !bookingByRef) {
        return NextResponse.json(
          { error: 'Codi no trobat. Comprova que sigui correcte.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: bookingByRef.id,
        customerName: bookingByRef.client_name,
        customerEmail: bookingByRef.client_email,
        eventType: bookingByRef.event_type,
        eventDate: bookingByRef.event_date,
        eventLocation: bookingByRef.event_location,
        status: bookingByRef.status,
        alreadyReviewed: !!bookingByRef.review_requested_at,
      });
    }

    return NextResponse.json({
      id: booking.id,
      customerName: booking.client_name,
      customerEmail: booking.client_email,
      eventType: booking.event_type,
      eventDate: booking.event_date,
      eventLocation: booking.event_location,
      status: booking.status,
      alreadyReviewed: !!booking.review_requested_at,
    });
  } catch (error) {
    console.error('Error verificant booking:', error);
    return NextResponse.json(
      { error: 'Error verificant el codi' },
      { status: 500 }
    );
  }
}
