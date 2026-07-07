import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { loadNextBestActions } from '@/lib/services/nextBestActionService';
import { generateNBAExplanation } from '@/lib/services/nbaAiExplainService';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  if (process.env.ADMIN_AI_ENABLED !== '1') {
    return NextResponse.json({
      explanation: '',
      actions: [],
      generatedAt: new Date().toISOString(),
    });
  }

  try {
    const report = await loadNextBestActions();
    const top5 = report.actions.slice(0, 5);
    const { explanation, generatedAt } = await generateNBAExplanation(top5);

    return NextResponse.json({
      explanation,
      actions: top5.slice(0, 3),
      generatedAt,
    });
  } catch (err) {
    log.error('nba-explain route failed', err);
    return NextResponse.json({
      explanation: '',
      actions: [],
      generatedAt: new Date().toISOString(),
    });
  }
}
