/**
 * API ROUTE: Admin Events (Supabase)
 * ==================================
 * GET - Obtenir events completats/passats
 * PATCH - Actualitzar estat post-event
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { safeParseInt } from '@/lib/utils';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Check if Supabase is configured
function checkSupabase() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }
  return null;
}

/**
 * GET - Obtenir events passats/completats
 */
export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const dbError = checkSupabase();
  if (dbError) return dbError;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'completed';
    const daysAgo = safeParseInt(searchParams.get('days'), 30, 1, 365);

    // Calcular data límit
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    const { data: bookings, error } = await supabaseAdmin!
      .from('bookings')
      .select('*')
      .eq('status', status)
      .gte('event_date', cutoffDate.toISOString())
      .lte('event_date', new Date().toISOString())
      .order('event_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: bookings || [],
      stats: {
        total: bookings?.length || 0,
        pending: bookings?.filter(b => !b.post_event_sent_at).length || 0,
        sent: bookings?.filter(b => b.post_event_sent_at).length || 0,
      },
    });
  } catch (error) {
    log.error('Error obtenint events:', error);
    return NextResponse.json({ error: 'Error obtenint events' }, { status: 500 });
  }
}

/**
 * PATCH - Actualitzar booking (marcar post-event enviat)
 */
export async function PATCH(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const dbError = checkSupabase();
  if (dbError) return dbError;

  try {
    const body = await request.json();
    const { bookingId, post_event_sent_at, review_requested_at } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId és obligatori' }, { status: 400 });
    }

    const updateData: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };

    if (post_event_sent_at) {
      updateData.post_event_sent_at = post_event_sent_at;
    }
    if (review_requested_at) {
      updateData.review_requested_at = review_requested_at;
    }

    const { data: booking, error } = await supabaseAdmin!
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    log.error('Error actualitzant booking:', error);
    return NextResponse.json({ error: 'Error actualitzant booking' }, { status: 500 });
  }
}