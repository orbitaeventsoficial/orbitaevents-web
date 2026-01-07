/**
 * API: Generar Pressupost PDF
 * GET /api/admin/leads/[id]/quote
 * POST /api/admin/leads/[id]/quote - Genera i guarda
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { generateQuoteHTML, createQuoteFromLead, generateQuoteNumber } from "@/lib/services/documentService";
import { getPackById, getPacksByService, type PackDefinition } from "@/config/packs-config";
import { requireAuth } from '@/lib/auth';

type QuotePack = {
  name: string;
  price: number;
  djHours: number;
  extraHourPrice: number;
  description: string;
};

function packToQuotePack(pack: PackDefinition | undefined): QuotePack {
  if (!pack) {
    return {
      name: 'Servei DJ Professional',
      price: 500,
      djHours: 4,
      extraHourPrice: 80,
      description: 'Servei DJ complet amb so i il·luminació',
    };
  }

  const djHours = typeof (pack as any).durationHours === 'number' ? (pack as any).durationHours : 4;
  return {
    name: pack.name,
    price: pack.priceValue ?? 500,
    djHours,
    extraHourPrice: 80,
    description: (pack as any).emotion || pack.tagline || pack.name,
  };
}

function resolvePack(packKey: string): QuotePack {
  const pack =
    getPackById(packKey) ||
    getPacksByService('fiestas').find((p) => p.slug === packKey) ||
    getPacksByService('fiestas')[0];
  return packToQuotePack(pack);
}

interface RouteContext {
  params: { id: string };
}

// GET: Obtenir HTML del pressupost (preview)
export async function GET(req: NextRequest, { params }: RouteContext) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead no trobat' }, { status: 404 });
    }

    // Determinar pack des de config centralitzada
    const packKey = lead.interestedPackId?.toLowerCase() || 'default';
    const packData = resolvePack(packKey);

    // Crear dades del pressupost
    const quoteData = createQuoteFromLead(lead, packData);

    // Generar HTML
    const html = generateQuoteHTML(quoteData);

    // Retornar com HTML renderitzable
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    log.error('Error generant pressupost:', error);
    return NextResponse.json(
      { error: 'Error generant pressupost' },
      { status: 500 }
    );
  }
}

// POST: Generar pressupost i guardar-lo
export async function POST(req: NextRequest, { params }: RouteContext) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const body = await req.json().catch(() => ({}));
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com';
    
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead no trobat' }, { status: 404 });
    }

    // Determinar pack (del body o del lead) des de config centralitzada
    const packKey = body.packId?.toLowerCase() || lead.interestedPackId?.toLowerCase() || 'default';
    const basePack = resolvePack(packKey);

    // Override amb dades del body si existeixen
    const packData = {
      ...basePack,
      price: body.customPrice ?? basePack.price,
      djHours: body.customHours ?? basePack.djHours,
    };

    // Crear dades del pressupost
    const quoteData = createQuoteFromLead(
      {
        ...lead,
        eventLocation: body.eventLocation || lead.eventLocation,
      },
      packData,
      body.extras
    );

    // Generar número únic
    const quoteNumber = generateQuoteNumber();
    quoteData.quoteNumber = quoteNumber;

    // Actualitzar lead amb estat QUOTE_SENT
    await prisma.lead.update({
      where: { id: params.id },
      data: {
        status: 'QUOTE_SENT',
        updatedAt: new Date(),
      },
    });

    // Afegir nota
    await prisma.leadNote.create({
      data: {
        leadId: params.id,
        content: `📄 Pressupost generat: ${quoteNumber}\n💰 Total: ${quoteData.total.toFixed(2)}€\n📦 Pack: ${packData.name}`,
      },
    });

    const quoteUrl = `${baseUrl}/api/admin/leads/${params.id}/quote`;
    const documentTitle = `Pressupost ${quoteNumber}`;

    await prisma.leadDocument.create({
      data: {
        leadId: params.id,
        type: 'QUOTE',
        source: 'AUTO',
        title: documentTitle,
        fileUrl: quoteUrl,
        mimeType: 'text/html',
        createdBy: 'Sistema',
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: params.id,
        type: 'DOCUMENT',
        title: 'Pressupost generat',
        description: documentTitle,
        metadata: { quoteNumber },
        createdBy: 'Sistema',
      },
    });

    // Generar HTML
    const html = generateQuoteHTML(quoteData);

    return NextResponse.json({
      success: true,
      quoteNumber,
      total: quoteData.total,
      html, // El frontend pot usar això per preview o PDF
      message: 'Pressupost generat correctament',
    });
  } catch (error) {
    log.error('Error generant pressupost:', error);
    return NextResponse.json(
      { error: 'Error generant pressupost' },
      { status: 500 }
    );
  }
}