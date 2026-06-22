import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { runTaskAutomation } from '@/lib/services/tasks/taskAutomationService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const result = await runTaskAutomation();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    log.error('Error executant automatització de tasques', error);
    return NextResponse.json({ ok: false, error: 'No s\'ha pogut executar l\'automatització' }, { status: 500 });
  }
}
