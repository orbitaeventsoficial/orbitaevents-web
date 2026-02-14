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

const nullableString = z.union([z.string(), z.null()]).optional();
const nullableArrayString = z.union([z.array(z.string()), z.null()]).optional();

// Schema de validació per PATCH - Usem els enums correctes de Prisma
const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: nullableString,
  eventDate: z.string().optional(),
  // EventType enum de Prisma
  eventType: z.enum(['WEDDING', 'BIRTHDAY', 'CORPORATE', 'COMMUNION', 'BAPTISM', 'GRADUATION', 'ANNIVERSARY', 'PRIVATE_PARTY', 'OTHER']).optional(),
  // LeadStatus enum de Prisma
  status: z.enum(['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON', 'LOST']).optional(),
  // Priority enum de Prisma
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  source: nullableString,
  budget: nullableString,
  message: nullableString, // És string a Prisma (ex: "5000€")
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
}).strict();

// GET - Detall d'un lead
export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        customerId: true,
        name: true,
        email: true,
        phone: true,
        eventType: true,
        eventDate: true,
        eventLocation: true,
        guestCount: true,
        budget: true,
        message: true,
        interestedPackId: true,
        interestedExtras: true,
        source: true,
        landingPage: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        status: true,
        priority: true,
        assignedTo: true,
        preferredLocale: true,
        createdAt: true,
        updatedAt: true,
        contactedAt: true,
        convertedAt: true,
        notes: { orderBy: { createdAt: 'desc' }, take: 10 },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        tasks: { orderBy: { createdAt: 'desc' }, take: 10 },
        documents: { orderBy: { createdAt: 'desc' }, take: 10 },
        booking: {
          include: {
            pack: { include: { translations: { take: 1 } } },
            extras: { include: { extra: { include: { translations: { take: 1 } } } } },
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
    // Camps no existents al model Lead: evitem error Prisma.
    delete body.eventVenue;
    delete body.notes;

    // Camps obligatoris al model: mai null.
    if (body.source === null) delete body.source;
    if (body.preferredLocale === null) delete body.preferredLocale;

    const existing = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        contactedAt: true,
      },
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
      select: {
        id: true,
        name: true,
        email: true,
        booking: { select: { id: true } },
      },
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
