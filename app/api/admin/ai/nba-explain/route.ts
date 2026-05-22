import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { loadNextBestActions } from '@/lib/services/nextBestActionService';
import { generateNBAExplanation } from '@/lib/services/nbaAiExplainService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const report = await loadNextBestActions();
  const top5 = report.actions.slice(0, 5);
  const { explanation, generatedAt } = await generateNBAExplanation(top5);

  return NextResponse.json({
    explanation,
    actions: top5.slice(0, 3),
    generatedAt,
  });
}
