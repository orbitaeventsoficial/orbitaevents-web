import { Prisma, ProposalStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type ProposalListInput = {
  customerId?: string;
  leadId?: string;
  bookingId?: string;
  status?: string | null;
};

type ProposalCreateInput = {
  customerId: string;
  leadId?: string;
  bookingId?: string;
  status?: ProposalStatus;
  locale?: string;
  currency: string;
  validityDays: number;
  subtotal: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  snapshot: Record<string, unknown>;
  pdfUrl?: string;
  pdfKey?: string;
};

type ProposalUpdateInput = {
  status?: ProposalStatus;
  locale?: string;
  currency?: string;
  validityDays?: number;
  subtotal?: number;
  discount?: number;
  vatRate?: number;
  vatAmount?: number;
  total?: number;
  snapshot?: Record<string, unknown>;
  pdfUrl?: string;
  pdfKey?: string;
  sentAt?: string | null;
  acceptedAt?: string | null;
};

function normalizeProposalSnapshot(
  snapshot: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  if (snapshot === undefined) return undefined;
  return JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue;
}
async function generateProposalReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PROP-${year}-`;
  const last = await prisma.proposal.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });
  const current = last?.reference.split('-').pop();
  const next = Number.isFinite(Number(current)) ? Number(current) + 1 : 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

export async function listAdminProposals(input: ProposalListInput) {
  const proposals = await prisma.proposal.findMany({
    where: {
      ...(input.customerId ? { customerId: input.customerId } : {}),
      ...(input.leadId ? { leadId: input.leadId } : {}),
      ...(input.bookingId ? { bookingId: input.bookingId } : {}),
      ...(input.status && Object.values(ProposalStatus).includes(input.status as ProposalStatus)
        ? { status: input.status as ProposalStatus }
        : {}),
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return { ok: true, proposals };
}

export async function createAdminProposal(data: ProposalCreateInput) {
  const reference = await generateProposalReference();
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
    select: { preferredLocale: true },
  });
  const resolvedLocale = (data.locale || customer?.preferredLocale || 'ca').toLowerCase();

  const proposal = await prisma.proposal.create({
    data: {
      reference,
      customerId: data.customerId,
      leadId: data.leadId,
      bookingId: data.bookingId,
      status: data.status ?? 'DRAFT',
      locale: resolvedLocale,
      currency: data.currency,
      validityDays: data.validityDays,
      subtotal: data.subtotal,
      discount: data.discount,
      vatRate: data.vatRate,
      vatAmount: data.vatAmount,
      total: data.total,
      snapshot: normalizeProposalSnapshot(data.snapshot) ?? {},
      pdfUrl: data.pdfUrl,
      pdfKey: data.pdfKey,
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  return { ok: true, proposal };
}

export async function getAdminProposalById(id: string) {
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, name: true, email: true } },
      booking: { select: { id: true, reference: true, status: true } },
    },
  });

  if (!proposal) {
    return { status: 404, body: { ok: false, error: 'Pressupost no trobat' } };
  }

  return { status: 200, body: { ok: true, proposal } };
}

export async function updateAdminProposal(id: string, data: ProposalUpdateInput) {
  const proposal = await prisma.proposal.update({
    where: { id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.locale !== undefined ? { locale: data.locale } : {}),
      ...(data.currency !== undefined ? { currency: data.currency } : {}),
      ...(data.validityDays !== undefined ? { validityDays: data.validityDays } : {}),
      ...(data.subtotal !== undefined ? { subtotal: data.subtotal } : {}),
      ...(data.discount !== undefined ? { discount: data.discount } : {}),
      ...(data.vatRate !== undefined ? { vatRate: data.vatRate } : {}),
      ...(data.vatAmount !== undefined ? { vatAmount: data.vatAmount } : {}),
      ...(data.total !== undefined ? { total: data.total } : {}),
      ...(data.snapshot !== undefined ? { snapshot: normalizeProposalSnapshot(data.snapshot) } : {}),
      ...(data.pdfUrl !== undefined ? { pdfUrl: data.pdfUrl } : {}),
      ...(data.pdfKey !== undefined ? { pdfKey: data.pdfKey } : {}),
      sentAt: data.sentAt === undefined ? undefined : data.sentAt ? new Date(data.sentAt) : null,
      acceptedAt: data.acceptedAt === undefined ? undefined : data.acceptedAt ? new Date(data.acceptedAt) : null,
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  return { status: 200, body: { ok: true, proposal } };
}



