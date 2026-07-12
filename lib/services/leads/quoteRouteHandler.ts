import { NextResponse } from 'next/server';

export function buildLegacyQuoteDisabledResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: 'Flux antic de pressupost desactivat. Crea o envia pressupostos des de Proposal.',
      canonicalRoute: '/admin/presupuestos',
    },
    { status: 410 },
  );
}

export async function handleLeadQuoteGet(_req?: unknown, _leadId?: string) {
  return buildLegacyQuoteDisabledResponse();
}

export async function handleLeadQuotePost(_req?: unknown, _leadId?: string) {
  return buildLegacyQuoteDisabledResponse();
}
