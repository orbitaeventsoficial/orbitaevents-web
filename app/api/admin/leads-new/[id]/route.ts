// app/api/admin/leads-new/[id]/route.ts
// API per gestionar lead individual
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';

interface Params {
  params: { id: string };
}

// Schema de validació per PATCH - Usem els enums correctes de Prisma
const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  eventDate: z.string().optional(),
  // EventType enum de Prisma
  eventType: z.enum(['WEDDING', 'BIRTHDAY', 'CORPORATE', 'COMMUNION', 'BAPTISM', 'GRADUATION', 'ANNIVERSARY', 'PRIVATE_PARTY', 'OTHER']).optional(),
  // LeadStatus enum de Prisma
  status: z.enum(['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON', 'LOST']).optional(),
  // Priority enum de Prisma
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  source: z.string().optional(),
  budget: z.string().optional(),
  message: z.string().optional(), // És string a Prisma (ex: "5000€")
  guestCount: z.number().int().positive().optional(),
  eventLocation: z.string().optional(),
  eventVenue: z.string().optional(),
  notes: z.string().optional(),
  interestedPackId: z.string().optional(),
  interestedExtras: z.array(z.string()).optional(),
  landingPage: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  assignedTo: z.string().optional(),
}).strict();

// GET - Detall d'un lead
export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        notes: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        booking: {
          include: {
            pack: { include: { translations: true } },
            extras: { include: { extra: { include: { translations: true } } } },
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead no trobat' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      lead,
    });
  } catch (error) {
    log.error('Error obtenint lead', error, { context: { leadId: params.id } });
    return NextResponse.json(
      { error: 'Error obtenint lead' },
      { status: 500 }
    );
  }
}

// PATCH - Actualitzar lead
export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    // Parsejar JSON amb gestió d'errors
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'JSON invàlid' },
        { status: 400 }
      );
    }
    const { id } = params;

    // Validar amb Zod
    const parseResult = updateLeadSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const body: Record<string, unknown> = { ...parseResult.data };

    const existing = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Lead no trobat' },
        { status: 404 }
      );
    }

    // Processar dates amb validació
    if (body.eventDate && typeof body.eventDate === 'string') {
      const parsedDate = new Date(body.eventDate);
      // Validar que la data és vàlida
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Data invàlida', details: { eventDate: 'Format de data incorrecte' } },
          { status: 400 }
        );
      }
      body.eventDate = parsedDate;
    }

    // Si canvia a WON, actualitzar convertedAt
    if (body.status === 'WON' && existing.status !== 'WON') {
      body.convertedAt = new Date();
    }

    // Si canvia a CONTACTED, actualitzar contactedAt
    if (body.status === 'CONTACTED' && !existing.contactedAt) {
      body.contactedAt = new Date();
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: body,
    });

    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'lead',
        entityId: id,
        details: { changes: Object.keys(body), newStatus: body.status as string | undefined },
      },
    });

    return NextResponse.json({
      ok: true,
      lead,
    });
  } catch (error) {
    log.error('Error actualitzant lead', error, { context: { leadId: params.id } });
    return NextResponse.json(
      { error: 'Error actualitzant lead' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar lead
export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const { id } = params;

    const existing = await prisma.lead.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Lead no trobat' },
        { status: 404 }
      );
    }

    // No permetre eliminar si té reserva
    if (existing.booking) {
      return NextResponse.json(
        { error: 'No es pot eliminar un lead amb reserva associada' },
        { status: 400 }
      );
    }

    await prisma.lead.delete({
      where: { id },
    });

    await prisma.adminLog.create({
      data: {
        action: 'DELETE',
        entity: 'lead',
        entityId: id,
        details: { name: existing.name, email: existing.email },
      },
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    log.error('Error eliminant lead', error, { context: { leadId: params.id } });
    return NextResponse.json(
      { error: 'Error eliminant lead' },
      { status: 500 }
    );
  }
}