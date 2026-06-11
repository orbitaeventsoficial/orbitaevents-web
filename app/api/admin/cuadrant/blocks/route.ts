import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { listCrewBlocks, createCrewBlock, deleteCrewBlock } from '@/lib/services/crewScheduleService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const blocks = await listCrewBlocks();
    return NextResponse.json({ blocks });
  } catch (error) {
    log.error('Error llistant bloquejos:', error as Error);
    return NextResponse.json({ blocks: [], error: 'Taula no disponible' }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const body = await req.json();
    const result = await createCrewBlock(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant bloqueig:', error as Error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const id = req.nextUrl.searchParams.get('id') ?? '';
    const result = await deleteCrewBlock(id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant bloqueig:', error as Error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
