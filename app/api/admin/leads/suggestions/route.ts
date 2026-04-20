import { NextResponse } from 'next/server';
import { loadPipelineSuggestions } from '@/lib/services/leadPipelineSuggestionsService';

export const dynamic = 'force-dynamic';

export async function GET() {
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
