import { NextRequest } from 'next/server';
import { handleLeadQuoteGet, handleLeadQuotePost } from '@/lib/services/leads/quoteRouteHandler';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  return handleLeadQuoteGet(req, params.id, false);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  return handleLeadQuotePost(req, params.id, false);
}
