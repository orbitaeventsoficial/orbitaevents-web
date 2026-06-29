import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customer: { findUnique: vi.fn() },
    lead: { findUnique: vi.fn() },
    booking: { findUnique: vi.fn() },
    proposal: { findUnique: vi.fn() },
    leadActivity: { findUnique: vi.fn() },
    leadDocument: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/tasks/leadScopedTaskService', () => ({
  findTaskLinkByTaskOrLegacyId: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/services/customerActivityService', () => ({
  readCustomerActivityLog: vi.fn(),
}));

import { resolveCustomerHubCustomerId } from '@/lib/customer-hub/data';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customer.findUnique.mockResolvedValue(null);
  mockPrisma.lead.findUnique.mockResolvedValue(null);
  mockPrisma.booking.findUnique.mockResolvedValue(null);
  mockPrisma.proposal.findUnique.mockResolvedValue(null);
  mockPrisma.leadActivity.findUnique.mockResolvedValue(null);
  mockPrisma.leadDocument.findUnique.mockResolvedValue(null);
});

describe('resolveCustomerHubCustomerId', () => {
  it('resol un client fusionat cap al customer canònic', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust-old',
      mergedIntoId: 'cust-main',
    });

    await expect(resolveCustomerHubCustomerId('cust-old')).resolves.toBe('cust-main');
  });

  it('manté el client directe si no està fusionat', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust-main',
      mergedIntoId: null,
    });

    await expect(resolveCustomerHubCustomerId('cust-main')).resolves.toBe('cust-main');
  });
});
