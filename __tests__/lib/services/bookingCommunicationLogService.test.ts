import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    adminLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { recordBookingCommunicationLog } from '@/lib/services/bookingCommunicationLogService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.adminLog.create.mockResolvedValue({});
});

describe('recordBookingCommunicationLog', () => {
  it('crea un adminLog de booking amb acció i detalls tipats', async () => {
    await recordBookingCommunicationLog({
      action: 'COMM_SENT',
      bookingId: 'bk-1',
      details: { flow: 'PAYMENT', channel: 'email', to: 'client@test.com' },
    });

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: {
        action: 'COMM_SENT',
        entity: 'booking',
        entityId: 'bk-1',
        details: { flow: 'PAYMENT', channel: 'email', to: 'client@test.com' },
      },
    });
  });
});
