import { CustomQuoteStatus, Prisma } from '@prisma/client';
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

function normalizeComponents(components?: unknown[]): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(components || [])) as Prisma.InputJsonValue;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function sanitizeMoney(value: number | string | null | undefined, fallback = 0): number {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? roundMoney(amount) : fallback;
}

function sanitizeOptionalMoney(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? roundMoney(amount) : null;
}

function sanitizeMarginPct(value: number | string | null | undefined): number {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? roundMoney(amount) : 30;
}

function normalizeCustomQuoteStatus(status?: string | null): CustomQuoteStatus {
  return status === 'SENT' ? 'SENT' : status === 'ACCEPTED' ? 'ACCEPTED' : status === 'REJECTED' ? 'REJECTED' : 'DRAFT';
}

export async function listAdminCustomQuotes() {
  return prisma.customQuote.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createAdminCustomQuote(input: CustomQuoteInput) {
  if (!input.name?.trim()) {
    return { status: 400, body: { error: 'El nom és obligatori' } };
  }

  const quote = await prisma.customQuote.create({
    data: {
      name: input.name.trim(),
      clientName: input.clientName?.trim() || null,
      clientEmail: input.clientEmail?.trim() || null,
      components: normalizeComponents(input.components),
      totalCost: sanitizeMoney(input.totalCost),
      suggestedPrice: sanitizeMoney(input.suggestedPrice),
      marginPct: sanitizeMarginPct(input.marginPct),
      finalPrice: sanitizeOptionalMoney(input.finalPrice),
      status: normalizeCustomQuoteStatus(input.status),
      notes: input.notes?.trim() || null,
    },
  });

  return { status: 201, body: quote };
}

export async function getAdminCustomQuote(id: string) {
  const quote = await prisma.customQuote.findUnique({ where: { id } });
  if (!quote) {
    return { status: 404, body: { error: 'No trobat' } };
  }
  return { status: 200, body: quote };
}

export async function updateAdminCustomQuote(id: string, input: CustomQuoteInput) {
  const quote = await prisma.customQuote.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.clientName !== undefined && { clientName: input.clientName?.trim() || null }),
      ...(input.clientEmail !== undefined && { clientEmail: input.clientEmail?.trim() || null }),
      ...(input.components !== undefined && { components: normalizeComponents(input.components) }),
      ...(input.totalCost !== undefined && { totalCost: sanitizeMoney(input.totalCost) }),
      ...(input.suggestedPrice !== undefined && { suggestedPrice: sanitizeMoney(input.suggestedPrice) }),
      ...(input.marginPct !== undefined && { marginPct: sanitizeMarginPct(input.marginPct) }),
      ...(input.finalPrice !== undefined && { finalPrice: sanitizeOptionalMoney(input.finalPrice) }),
      ...(input.status !== undefined && { status: normalizeCustomQuoteStatus(input.status) }),
      ...(input.sentAt !== undefined && { sentAt: input.sentAt ? new Date(input.sentAt) : null }),
      ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
    },
  });

  return { status: 200, body: quote };
}

export async function deleteAdminCustomQuote(id: string) {
  await prisma.customQuote.delete({ where: { id } });
  return { status: 200, body: { ok: true } };
}
