import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleLeadStatusPatch } from '@/lib/services/leads/statusRouteHandler';

interface Params {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return handleLeadStatusPatch(req, params.id);
}

