import { prisma } from '@/lib/prisma';

type CustomQuoteInput = {
  name?: string;
  clientName?: string | null;
  clientEmail?: string | null;
  components?: unknown[];
  totalCost?: number | string | null;
  suggestedPrice?: number | string | null;
  marginPct?: number | string | null;
  finalPrice?: number | string | null;
  status?: string | null;
  sentAt?: string | Date | null;
  notes?: string | null;
};

export const CUSTOM_QUOTE_RETIRED_ERROR =
  'La calculadora de costos ja no desa pressupostos paral·lels. Crea el document client-facing a Pressupostos, com a Proposal canònica.';

export async function listAdminCustomQuotes() {
  return prisma.customQuote.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createAdminCustomQuote(input: CustomQuoteInput) {
  void input;
  return { status: 410, body: { error: CUSTOM_QUOTE_RETIRED_ERROR, canonicalRoute: '/admin/presupuestos' } };
}

export async function getAdminCustomQuote(id: string) {
  const quote = await prisma.customQuote.findUnique({ where: { id } });
  if (!quote) {
    return { status: 404, body: { error: 'No trobat' } };
  }
  return { status: 200, body: quote };
}

export async function updateAdminCustomQuote(id: string, input: CustomQuoteInput) {
  void id;
  void input;
  return { status: 410, body: { error: CUSTOM_QUOTE_RETIRED_ERROR, canonicalRoute: '/admin/presupuestos' } };
}

export async function deleteAdminCustomQuote(id: string) {
  void id;
  return { status: 410, body: { error: CUSTOM_QUOTE_RETIRED_ERROR, canonicalRoute: '/admin/presupuestos' } };
}
