/**
 * API ROUTE: Export Customer Data (GDPR Art. 15/20)
 * Exporta totes les dades d'un client en format JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { exportCustomerData } from '@/lib/services/privacyService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const portable = searchParams.get('portable') === '1';

    const data = await exportCustomerData(id, portable);

    if (searchParams.get('download') === '1') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="customer-data-${id}.json"`,
        },
      });
    }

    return NextResponse.json({ ok: true, body: data });
  } catch (error) {
    console.error('Error exportant dades client:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Error desconegut' },
      { status: 500 }
    );
  }
}
