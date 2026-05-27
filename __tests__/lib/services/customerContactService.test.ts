import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customerContact: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listCustomerContacts,
  createCustomerContact,
  updateCustomerContact,
  deleteCustomerContact,
} from '@/lib/services/customerContactService';

const BASE_CONTACT = {
  id: 'c1',
  customerId: 'cust-1',
  name: 'Anna Puig',
  role: 'Responsable',
  email: 'anna@jardiland.com',
  phone: '+34600111222',
  notes: null,
  isPrimary: true,
  createdAt: new Date('2026-05-27T10:00:00Z'),
  updatedAt: new Date('2026-05-27T10:00:00Z'),
};

describe('customerContactService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCustomerContacts', () => {
    it('retorna la llista de contactes del client', async () => {
      mockPrisma.customerContact.findMany.mockResolvedValue([BASE_CONTACT]);
      const result = await listCustomerContacts('cust-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Anna Puig');
      expect(result[0].createdAt).toBe('2026-05-27T10:00:00.000Z');
    });

    it('retorna llista buida si no hi ha contactes', async () => {
      mockPrisma.customerContact.findMany.mockResolvedValue([]);
      const result = await listCustomerContacts('cust-x');
      expect(result).toHaveLength(0);
    });
  });

  describe('createCustomerContact', () => {
    it('crea un contacte nou', async () => {
      mockPrisma.customerContact.create.mockResolvedValue(BASE_CONTACT);
      const result = await createCustomerContact('cust-1', { name: 'Anna Puig', isPrimary: true });
      expect(result.name).toBe('Anna Puig');
      expect(mockPrisma.customerContact.create).toHaveBeenCalledOnce();
    });

    it('si isPrimary, desactiva els altres primer', async () => {
      mockPrisma.customerContact.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.customerContact.create.mockResolvedValue(BASE_CONTACT);
      await createCustomerContact('cust-1', { name: 'Anna', isPrimary: true });
      expect(mockPrisma.customerContact.updateMany).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        data: { isPrimary: false },
      });
    });

    it('no crida updateMany si isPrimary és false', async () => {
      mockPrisma.customerContact.create.mockResolvedValue({ ...BASE_CONTACT, isPrimary: false });
      await createCustomerContact('cust-1', { name: 'Jordi', isPrimary: false });
      expect(mockPrisma.customerContact.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('updateCustomerContact', () => {
    it('retorna null si el contacte no existeix', async () => {
      mockPrisma.customerContact.findFirst.mockResolvedValue(null);
      const result = await updateCustomerContact('cust-1', 'missing', { name: 'X' });
      expect(result).toBeNull();
    });

    it('actualitza el contacte', async () => {
      mockPrisma.customerContact.findFirst.mockResolvedValue(BASE_CONTACT);
      mockPrisma.customerContact.update.mockResolvedValue({ ...BASE_CONTACT, name: 'Joan Puig' });
      const result = await updateCustomerContact('cust-1', 'c1', { name: 'Joan Puig' });
      expect(result?.name).toBe('Joan Puig');
    });
  });

  describe('deleteCustomerContact', () => {
    it('crida deleteMany amb els paràmetres correctes', async () => {
      mockPrisma.customerContact.deleteMany.mockResolvedValue({ count: 1 });
      await deleteCustomerContact('cust-1', 'c1');
      expect(mockPrisma.customerContact.deleteMany).toHaveBeenCalledWith({
        where: { id: 'c1', customerId: 'cust-1' },
      });
    });
  });
});
