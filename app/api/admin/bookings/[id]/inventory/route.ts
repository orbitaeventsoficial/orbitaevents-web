// app/api/admin/bookings/[id]/inventory/route.ts
// API per gestionar l'inventari assignat a una reserva
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import {
  assignBookingInventory,
  getBookingInventoryView,
  removeBookingInventoryAssignment,
  updateBookingInventoryAssignment,
} from '@/lib/services/bookingInventoryService';

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const result = await getBookingInventoryView(params.id, req.url);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint inventari de reserva:', error);
    return NextResponse.json({ error: 'Error obtenint inventari' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const result = await assignBookingInventory(params.id, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error assignant element a reserva:', error);
    return NextResponse.json({ error: 'Error assignant element' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const result = await updateBookingInventoryAssignment(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant assignació:', error);
    return NextResponse.json({ error: 'Error actualitzant assignació' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const { searchParams } = new URL(req.url);
    const result = await removeBookingInventoryAssignment(searchParams.get('assignmentId'));
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant assignació:', error);
    return NextResponse.json({ error: 'Error eliminant assignació' }, { status: 500 });
  }
}