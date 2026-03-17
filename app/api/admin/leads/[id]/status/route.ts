import { NextRequest } from 'next/server';
import { handleLeadStatusPatch } from '@/lib/services/leads/statusRouteHandler';

interface Params {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return handleLeadStatusPatch(req, params.id);
}

