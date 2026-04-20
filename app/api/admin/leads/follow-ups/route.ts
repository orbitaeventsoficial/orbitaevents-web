import { NextResponse } from 'next/server';
import { loadPendingFollowUps } from '@/lib/services/responseTrackingService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const summary = await loadPendingFollowUps();
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error carregant follow-ups' },
      { status: 500 }
    );
  }
}
