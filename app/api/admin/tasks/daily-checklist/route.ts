import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { generateDailyChecklistTasks } from '@/lib/services/dailyChecklist';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const result = await generateDailyChecklistTasks();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    log.error('Error generant checklist diari', error);
    return NextResponse.json({ ok: false, error: 'No s’ha pogut generar el checklist diari' }, { status: 500 });
  }
}
