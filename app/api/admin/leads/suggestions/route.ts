import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { loadPipelineSuggestions } from '@/lib/services/leadPipelineSuggestionsService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const suggestions = await loadPipelineSuggestions();
    return NextResponse.json({ ok: true, suggestions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error carregant suggeriments' },
      { status: 500 }
    );
  }
}
