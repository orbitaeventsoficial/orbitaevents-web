import { prisma } from '@/lib/prisma';
import type { CustomerContactDTO } from '@/lib/customer-hub/dto';

export type CreateContactInput = {
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  isPrimary?: boolean;
};

export type UpdateContactInput = Partial<CreateContactInput>;

function mapContact(c: {
  id: string; customerId: string; name: string; role: string | null; email: string | null;
  phone: string | null; notes: string | null; isPrimary: boolean; createdAt: Date; updatedAt: Date;
}): CustomerContactDTO {
  return {
    id: c.id,
    name: c.name,
    role: c.role,
    email: c.email,
    phone: c.phone,
    notes: c.notes,
    isPrimary: c.isPrimary,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function listCustomerContacts(customerId: string): Promise<CustomerContactDTO[]> {
  const rows = await prisma.customerContact.findMany({
    where: { customerId },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
  return rows.map(mapContact);
}

export async function createCustomerContact(customerId: string, data: CreateContactInput): Promise<CustomerContactDTO> {
  if (data.isPrimary) {
    await prisma.customerContact.updateMany({ where: { customerId }, data: { isPrimary: false } });
  }
  const contact = await prisma.customerContact.create({
    data: {
      customerId,
      name: data.name,
      role: data.role ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
      isPrimary: data.isPrimary ?? false,
    },
  });
  return mapContact(contact);
}

export async function updateCustomerContact(
  customerId: string, contactId: string, data: UpdateContactInput
): Promise<CustomerContactDTO | null> {
  const existing = await prisma.customerContact.findFirst({ where: { id: contactId, customerId } });
  if (!existing) return null;

  if (data.isPrimary) {
    await prisma.customerContact.updateMany({
      where: { customerId, id: { not: contactId } },
      data: { isPrimary: false },
    });
  }

  const updated = await prisma.customerContact.update({
    where: { id: contactId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.email !== undefined && { email: data.email ?? null }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
    },
  });
  return mapContact(updated);
}

export async function deleteCustomerContact(customerId: string, contactId: string): Promise<void> {
  await prisma.customerContact.deleteMany({ where: { id: contactId, customerId } });
}
