import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUOTE_SENT',
  'NEGOTIATING',
  'WON',
  'LOST',
] as const;

type LeadStatus = (typeof VALID_STATUSES)[number];

interface Params {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status } = body;

    // Validar estat
    if (!status || !VALID_STATUSES.includes(status as LeadStatus)) {
      return NextResponse.json(
        { error: 'Estat invàlid' },
        { status: 400 }
      );
    }

    // Verificar que el lead existeix
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead no trobat' },
        { status: 404 }
      );
    }

    // Actualitzar estat
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: status as LeadStatus,
        contactedAt: status === 'CONTACTED' && !existingLead.contactedAt ? new Date() : undefined,
        convertedAt: status === 'WON' && !existingLead.convertedAt ? new Date() : undefined,
      },
    });

    // Registrar nota de canvi d'estat
    await prisma.leadNote.create({
      data: {
        leadId: id,
        content: `Canvi d'estat: ${existingLead.status} → ${status}`,
      },
    });

    return NextResponse.json({
      ok: true,
      lead: updatedLead,
    });
  } catch (error) {
    console.error('Error actualitzant estat del lead:', error);
    return NextResponse.json(
      { error: 'Error actualitzant estat' },
      { status: 500 }
    );
  }
}
