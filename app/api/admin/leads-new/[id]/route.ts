// app/api/admin/leads-new/[id]/route.ts
// API per gestionar lead individual
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface Params {
  params: { id: string };
}

// Schema de validació per PATCH
const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  eventDate: z.string().optional(),
  eventType: z.enum(['BODA', 'FIESTA_PRIVADA', 'CORPORATIVO', 'COMUNION', 'BAUTIZO', 'CUMPLEANOS', 'OTRO']).optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'QUOTE_SENT', 'NEGOTIATING', 'WON', 'LOST']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  source: z.string().optional(),
  budget: z.number().optional(),
  guestCount: z.number().optional(),
  notes: z.string().optional(),
  venue: z.string().optional(),
  assignedTo: z.string().optional(),
}).strict();

// GET - Detall d'un lead
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        notes: { orderBy: { createdAt: 'desc' } },
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
    console.error('Error obtenint lead:', error);
    return NextResponse.json(
      { error: 'Error obtenint lead' },
      { status: 500 }
    );
  }
}

// PATCH - Actualitzar lead
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const rawBody = await req.json();
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

    // Processar dates
    if (body.eventDate && typeof body.eventDate === 'string') {
      body.eventDate = new Date(body.eventDate);
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
    console.error('Error actualitzant lead:', error);
    return NextResponse.json(
      { error: 'Error actualitzant lead' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar lead
export async function DELETE(req: NextRequest, { params }: Params) {
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
    console.error('Error eliminant lead:', error);
    return NextResponse.json(
      { error: 'Error eliminant lead' },
      { status: 500 }
    );
  }
}
