/**
 * API ROUTE: Admin Customers
 * ==========================
 * GET - Obtenir tots els clients
 * POST - Crear nou client
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

// Verificar autenticació admin
function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  if (authHeader.startsWith('Basic ')) {
    const base64 = authHeader.slice(6);
    const decoded = Buffer.from(base64, 'base64').toString();
    const [user, pass] = decoded.split(':');
    return user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASSWORD;
  }

  if (authHeader.startsWith('Bearer ')) {
    const key = authHeader.slice(7);
    return key === process.env.ADMIN_KEY;
  }

  return false;
}

/**
 * GET - Obtenir clients
 */
export async function GET(request: NextRequest) {
  const dbError = checkSupabase();
  if (dbError) return dbError;

  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('stats') === 'true';

    const { data: customers, error } = await supabaseAdmin!
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const response: Record<string, unknown> = {
      success: true,
      data: customers || [],
    };

    if (includeStats) {
      const total = customers?.length || 0;
      const vip = customers?.filter(c => c.is_vip).length || 0;
      const withEvents = customers?.filter(c => c.total_events > 0).length || 0;

      // Contactes del últim mes
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const recentMonth = customers?.filter(c =>
        new Date(c.created_at) > oneMonthAgo
      ).length || 0;

      response.stats = {
        total,
        vip,
        withEvents,
        recentMonth,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error obtenint clients:', error);
    return NextResponse.json({ error: 'Error obtenint clients' }, { status: 500 });
  }
}

/**
 * POST - Crear client
 */
export async function POST(request: NextRequest) {
  const dbError = checkSupabase();
  if (dbError) return dbError;

  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, phone, city, instagram, notes, source } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nom i email són obligatoris' },
        { status: 400 }
      );
    }

    // Comprovar si ja existeix
    const { data: existing } = await supabaseAdmin!
      .from('customers')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Ja existeix un client amb aquest email' },
        { status: 409 }
      );
    }

    // Crear client
    const { data: customer, error } = await supabaseAdmin!
      .from('customers')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        city: city?.trim() || null,
        instagram: instagram?.replace('@', '').trim() || null,
        notes: notes?.trim() || null,
        source: source || 'manual',
        consent_data_processing: true,
        consent_data_processing_date: new Date().toISOString(),
        first_contact_date: new Date().toISOString(),
        last_contact_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error creant client:', error);
    return NextResponse.json({ error: 'Error creant client' }, { status: 500 });
  }
}
