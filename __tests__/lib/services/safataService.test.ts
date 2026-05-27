import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/constants', () => ({ PLACEHOLDER_EMAIL_DOMAIN: '@placeholder.test' }));

import { getSafataLeads, getSafataStats, getEmailSignatureSetting, saveEmailSignatureSetting } from '@/lib/services/safataService';

describe('safataService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getSafataLeads', () => {
    it('retorna leads excloent placeholder domain', async () => {
      const leads = [{ id: '1', name: 'Test', email: 'test@real.com' }];
      mockPrisma.lead.findMany.mockResolvedValue(leads);

      const result = await getSafataLeads();

      expect(result).toEqual(leads);
      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: { not: { contains: '@placeholder.test' } } },
          take: 50,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('propaga errors de base de dades', async () => {
      mockPrisma.lead.findMany.mockRejectedValue(new Error('DB error'));
      await expect(getSafataLeads()).rejects.toThrow('DB error');
    });
  });

  describe('getSafataStats', () => {
    it('retorna totalLeads, unreadLeads i todayLeads', async () => {
      mockPrisma.lead.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);

      const result = await getSafataStats();

      expect(result).toEqual({ totalLeads: 10, unreadLeads: 3, todayLeads: 2 });
      expect(mockPrisma.lead.count).toHaveBeenCalledTimes(3);
    });

    it('el filtre unreadLeads usa status NEW', async () => {
      mockPrisma.lead.count.mockResolvedValue(0);
      await getSafataStats();

      const calls = mockPrisma.lead.count.mock.calls;
      expect(calls[1][0]).toMatchObject({ where: expect.objectContaining({ status: 'NEW' }) });
    });
  });

  describe('getEmailSignatureSetting', () => {
    it("retorna el valor de la clau 'email.signature'", async () => {
      mockPrisma.setting.findUnique.mockResolvedValue({ value: 'Firma personalitzada' });
      const result = await getEmailSignatureSetting();
      expect(result).toBe('Firma personalitzada');
    });

    it("retorna string buit si no existeix la clau", async () => {
      mockPrisma.setting.findUnique.mockResolvedValue(null);
      const result = await getEmailSignatureSetting();
      expect(result).toBe('');
    });
  });

  describe('saveEmailSignatureSetting', () => {
    it('fa upsert amb la clau i el valor correctes', async () => {
      mockPrisma.setting.upsert.mockResolvedValue({});
      await saveEmailSignatureSetting('Nova firma');

      expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'email.signature' },
          update: { value: 'Nova firma' },
          create: expect.objectContaining({ key: 'email.signature', value: 'Nova firma' }),
        }),
      );
    });

    it('propaga errors de base de dades', async () => {
      mockPrisma.setting.upsert.mockRejectedValue(new Error('Upsert failed'));
      await expect(saveEmailSignatureSetting('test')).rejects.toThrow('Upsert failed');
    });
  });
});
