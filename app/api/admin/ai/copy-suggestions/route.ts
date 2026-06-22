import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { generateCopySuggestions, type CopyContextType } from '@/lib/services/copyAiSuggestionsService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const { type, context } = (await req.json()) as {
    type?: CopyContextType;
    context?: string;
  };

  const validTypes: CopyContextType[] = ['quote-why-us', 'social-caption'];
  if (!type || !validTypes.includes(type) || !context?.trim()) {
    return NextResponse.json({ suggestions: [], generatedAt: new Date().toISOString() });
  }

  const result = await generateCopySuggestions({ type, context });
  return NextResponse.json(result);
}
