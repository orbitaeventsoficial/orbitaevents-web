// app/api/admin/leads/[id]/route.ts
// API per gestionar lead individual
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { deleteLeadIfAllowed, getLeadDetail, updateLeadFromInput } from '@/lib/services/leadRouteService';

interface Params {
  params: { id: string };
}

const nullableString = z.union([z.string(), z.null()]).optional();
const nullableArrayString = z.union([z.array(z.string()), z.null()]).optional();

const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: nullableString,
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requerit').optional(),
  eventType: z.enum(['WEDDING', 'BIRTHDAY', 'CORPORATE', 'COMMUNION', 'BAPTISM', 'GRADUATION', 'ANNIVERSARY', 'PRIVATE_PARTY', 'OTHER']).optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON', 'LOST']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  source: nullableString,
  sourceCollaboratorId: nullableString,
  budget: nullableString,
  message: nullableString,
  dni: nullableString,
  guestCount: z.union([z.number().int().positive(), z.null()]).optional(),
  eventLocation: nullableString,
  eventVenue: nullableString,
  notes: nullableString,
  interestedPackId: nullableString,
  interestedExtras: nullableArrayString,
  landingPage: nullableString,
  utmSource: nullableString,
  utmMedium: nullableString,
  utmCampaign: nullableString,
  assignedTo: nullableString,
  preferredLocale: nullableString,
  eventStartTime: nullableString,
  eventEndTime: nullableString,
  eventPhone: nullableString,
  eventAddress: nullableString,
}).strict();

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const result = await getLeadDetail(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint lead', error, { context: { leadId: params.id } });
    return NextResponse.json(
      { error: 'Error obtenint lead' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  try {
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'JSON invàlid' },
        { status: 400 }
      );
    }

    const parseResult = updateLeadSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const result = await updateLeadFromInput(params.id, parseResult.data);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant lead', error, { context: { leadId: params.id } });
    return NextResponse.json(
      { error: 'Error actualitzant lead' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  try {
    const result = await deleteLeadIfAllowed(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant lead', error, { context: { leadId: params.id } });
    return NextResponse.json(
      { error: 'Error eliminant lead' },
      { status: 500 }
    );
  }
}
