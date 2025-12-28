/**
 * API: Generar Pressupost PDF
 * GET /api/admin/leads/[id]/quote
 * POST /api/admin/leads/[id]/quote - Genera i guarda
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQuoteHTML, createQuoteFromLead, generateQuoteNumber } from '@/lib/services/documentService';

// Configuració dels packs (simplificat - en producció vindria de BBDD)
const PACKS_CONFIG: Record<string, { name: string; price: number; djHours: number; extraHourPrice: number; description: string }> = {
  'flash': {
    name: 'Pack Flash ⚡',
    price: 450,
    djHours: 4,
    extraHourPrice: 75,
    description: '4h DJ + So 4000W + Il·luminació bàsica + Màquina de fum',
  },
  'party-starter': {
    name: 'Pack Party Starter 🎉',
    price: 650,
    djHours: 5,
    extraHourPrice: 75,
    description: '5h DJ + So 6000W + Il·luminació avançada + Fum + Micròfon',
  },
  'premium': {
    name: 'Pack Premium ✨',
    price: 950,
    djHours: 6,
    extraHourPrice: 85,
    description: '6h DJ + So 8000W + Il·luminació pro + Efectes especials + Micròfon',
  },
  'corporate': {
    name: 'Pack Corporate 🎯',
    price: 800,
    djHours: 5,
    extraHourPrice: 90,
    description: '5h DJ + So professional + Il·luminació ambient + Micròfon sense fils',
  },
  'wedding': {
    name: 'Pack Boda 💍',
    price: 1200,
    djHours: 8,
    extraHourPrice: 85,
    description: '8h DJ + So premium + Il·luminació elegant + Efectes + Coordinació amb fotògraf',
  },
  'default': {
    name: 'Servei DJ Professional',
    price: 500,
    djHours: 4,
    extraHourPrice: 75,
    description: 'Servei DJ complet amb so i il·luminació',
  },
};

interface RouteContext {
  params: { id: string };
}

// GET: Obtenir HTML del pressupost (preview)
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead no trobat' }, { status: 404 });
    }

    // Determinar pack
    const packKey = lead.interestedPackId?.toLowerCase() || 'default';
    const packData = PACKS_CONFIG[packKey] || PACKS_CONFIG['default'];

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
    console.error('Error generant pressupost:', error);
    return NextResponse.json(
      { error: 'Error generant pressupost' },
      { status: 500 }
    );
  }
}

// POST: Generar pressupost i guardar-lo
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const body = await req.json().catch(() => ({}));
    
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead no trobat' }, { status: 404 });
    }

    // Determinar pack (del body o del lead)
    const packKey = body.packId?.toLowerCase() || lead.interestedPackId?.toLowerCase() || 'default';
    const packData = PACKS_CONFIG[packKey] || PACKS_CONFIG['default'];

    // Override amb dades del body si existeixen
    if (body.customPrice) packData.price = body.customPrice;
    if (body.customHours) packData.djHours = body.customHours;

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
    console.error('Error generant pressupost:', error);
    return NextResponse.json(
      { error: 'Error generant pressupost' },
      { status: 500 }
    );
  }
}
