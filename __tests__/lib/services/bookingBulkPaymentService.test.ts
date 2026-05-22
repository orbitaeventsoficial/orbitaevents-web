import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { updateBulkPaymentField } from '@/lib/services/bookingBulkPaymentService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('updateBulkPaymentField', () => {
  it('actualitza depositPaid=true i escriu depositPaidAt', async () => {
    mockPrisma.booking.updateMany.mockResolvedValue({ count: 3 });
    const result = await updateBulkPaymentField(['b1', 'b2', 'b3'], 'depositPaid', true);
    expect(result.count).toBe(3);
    const call = mockPrisma.booking.updateMany.mock.calls[0][0];
    expect(call.where.id.in).toEqual(['b1', 'b2', 'b3']);
    expect(call.data.depositPaid).toBe(true);
    expect(call.data.depositPaidAt).toBeInstanceOf(Date);
    expect(call.data.remainingPaidAt).toBeUndefined();
  });

  it('actualitza depositPaid=false i esborra depositPaidAt (null)', async () => {
    mockPrisma.booking.updateMany.mockResolvedValue({ count: 1 });
    await updateBulkPaymentField(['b1'], 'depositPaid', false);
    const call = mockPrisma.booking.updateMany.mock.calls[0][0];
    expect(call.data.depositPaid).toBe(false);
    expect(call.data.depositPaidAt).toBeNull();
  });

  it('actualitza remainingPaid=true i escriu remainingPaidAt', async () => {
    mockPrisma.booking.updateMany.mockResolvedValue({ count: 2 });
    await updateBulkPaymentField(['b1', 'b2'], 'remainingPaid', true);
    const call = mockPrisma.booking.updateMany.mock.calls[0][0];
    expect(call.data.remainingPaid).toBe(true);
    expect(call.data.remainingPaidAt).toBeInstanceOf(Date);
    expect(call.data.depositPaidAt).toBeUndefined();
  });

  it('actualitza remainingPaid=false i esborra remainingPaidAt (null)', async () => {
    mockPrisma.booking.updateMany.mockResolvedValue({ count: 1 });
    await updateBulkPaymentField(['b1'], 'remainingPaid', false);
    const call = mockPrisma.booking.updateMany.mock.calls[0][0];
    expect(call.data.remainingPaid).toBe(false);
    expect(call.data.remainingPaidAt).toBeNull();
  });
});
