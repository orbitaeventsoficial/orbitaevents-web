import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateInboxReplySuggestions } from '@/lib/services/inboxAiReplyService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { fromName, subject, bodyText, eventType } = (await req.json()) as {
    fromName?: string;
    subject?: string;
    bodyText?: string;
    eventType?: string | null;
  };

  if (!bodyText?.trim()) {
    return NextResponse.json({ suggestions: [], generatedAt: new Date().toISOString() });
  }

  const result = await generateInboxReplySuggestions({
    fromName: fromName ?? '',
    subject: subject ?? '',
    bodyText,
    eventType,
  });

  return NextResponse.json(result);
}
