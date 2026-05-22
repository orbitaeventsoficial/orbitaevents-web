import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleLeadQuoteGet, handleLeadQuotePost } from '@/lib/services/leads/quoteRouteHandler';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return handleLeadQuoteGet(req, params.id);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return handleLeadQuotePost(req, params.id);
}

