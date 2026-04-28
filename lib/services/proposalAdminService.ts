import { Prisma, ProposalStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type ProposalListInput = {
  customerId?: string;
  leadId?: string;
  bookingId?: string;
  status?: string | null;
  page?: number;
  limit?: number;
};

type ProposalCreateInput = {
  customerId?: string;
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

const DEFAULT_PROPOSALS_PAGE = 1;
const DEFAULT_PROPOSALS_LIMIT = 50;
const MAX_PROPOSALS_LIMIT = 200;

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
  const page = Math.max(1, Number(input.page) || DEFAULT_PROPOSALS_PAGE);
  const limit = Math.min(MAX_PROPOSALS_LIMIT, Math.max(1, Number(input.limit) || DEFAULT_PROPOSALS_LIMIT));
  const where = {
    ...(input.customerId ? { customerId: input.customerId } : {}),
    ...(input.leadId ? { leadId: input.leadId } : {}),
    ...(input.bookingId ? { bookingId: input.bookingId } : {}),
    ...(input.status && Object.values(ProposalStatus).includes(input.status as ProposalStatus)
      ? { status: input.status as ProposalStatus }
      : {}),
  };

  const [proposals, total] = await Promise.all([
    prisma.proposal.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.proposal.count({ where }),
  ]);

  return {
    ok: true,
    proposals,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function createAdminProposal(data: ProposalCreateInput) {
  const reference = await generateProposalReference();
  const customer = data.customerId
    ? await prisma.customer.findUnique({
        where: { id: data.customerId },
        select: { preferredLocale: true },
      })
    : null;
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

type ReassignProposalInput = {
  proposalId: string;
  customerId?: string | null;
  leadId?: string | null;
  bookingId?: string | null;
  actor?: string;
};

export type ReassignProposalResult =
  | { ok: true; proposal: unknown; changed: { customerId: boolean; leadId: boolean; bookingId: boolean } }
  | { ok: false; error: string; status: number };

export async function reassignProposalOwner(
  input: ReassignProposalInput,
): Promise<ReassignProposalResult> {
  const existing = await prisma.proposal.findUnique({
    where: { id: input.proposalId },
    select: { id: true, customerId: true, leadId: true, bookingId: true },
  });
  if (!existing) {
    return { ok: false, error: 'Pressupost no trobat', status: 404 };
  }

  const customerIdProvided = input.customerId !== undefined;
  const leadIdProvided = input.leadId !== undefined;
  const bookingIdProvided = input.bookingId !== undefined;

  if (!customerIdProvided && !leadIdProvided && !bookingIdProvided) {
    return { ok: false, error: 'Cap canvi sol·licitat', status: 400 };
  }

  if (customerIdProvided && input.customerId) {
    const exists = await prisma.customer.findUnique({
      where: { id: input.customerId },
      select: { id: true },
    });
    if (!exists) return { ok: false, error: 'Client no trobat', status: 404 };
  }
  if (leadIdProvided && input.leadId) {
    const exists = await prisma.lead.findUnique({
      where: { id: input.leadId },
      select: { id: true },
    });
    if (!exists) return { ok: false, error: 'Lead no trobat', status: 404 };
  }
  if (bookingIdProvided && input.bookingId) {
    const exists = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: { id: true },
    });
    if (!exists) return { ok: false, error: 'Reserva no trobada', status: 404 };
  }

  const updateData: Prisma.ProposalUpdateInput = {};
  if (customerIdProvided) {
    updateData.customer = input.customerId
      ? { connect: { id: input.customerId } }
      : { disconnect: true };
  }
  if (leadIdProvided) {
    updateData.lead = input.leadId
      ? { connect: { id: input.leadId } }
      : { disconnect: true };
  }
  if (bookingIdProvided) {
    updateData.booking = input.bookingId
      ? { connect: { id: input.bookingId } }
      : { disconnect: true };
  }

  const proposal = await prisma.proposal.update({
    where: { id: input.proposalId },
    data: updateData,
    include: {
      customer: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, name: true, email: true } },
      booking: { select: { id: true, reference: true, status: true } },
    },
  });

  return {
    ok: true,
    proposal,
    changed: {
      customerId: customerIdProvided && existing.customerId !== input.customerId,
      leadId: leadIdProvided && existing.leadId !== input.leadId,
      bookingId: bookingIdProvided && existing.bookingId !== input.bookingId,
    },
  };
}
