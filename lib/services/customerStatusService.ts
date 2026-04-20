import { BookingStatus, LeadStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CUSTOMER_ACTIVITY_ACTIONS } from '@/lib/constants';

type CustomerHubStatus = 'LEAD' | 'NEGOTIATION' | 'CONFIRMED' | 'POSTEVENT' | 'LOST';

export async function updateCustomerHubStatus(customerId: string, status: CustomerHubStatus) {
  const leadStatusMap: Record<CustomerHubStatus, LeadStatus> = {
    LEAD: 'NEW',
    NEGOTIATION: 'NEGOTIATING',
    CONFIRMED: 'WON',
    POSTEVENT: 'WON',
    LOST: 'LOST',
  };
  const leadStatus = leadStatusMap[status] || LeadStatus.NEW;

  const leads = await prisma.lead.findMany({
    where: { customerId },
    select: { id: true },
  });
  const leadIds = leads.map((lead) => lead.id);

  await prisma.lead.updateMany({
    where: { customerId },
    data: { status: leadStatus },
  });

  const bookingFilter = leadIds.length > 0
    ? { OR: [{ customerId }, { leadId: { in: leadIds } }] }
    : { customerId };

  if (status === 'CONFIRMED') {
    await prisma.booking.updateMany({
      where: { ...bookingFilter, status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    });
  }

  if (status === 'POSTEVENT') {
    await prisma.booking.updateMany({
      where: { ...bookingFilter, status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.PREPARING] } },
      data: { status: 'COMPLETED' },
    });
  }

  if (status === 'LOST') {
    await prisma.booking.updateMany({
      where: { ...bookingFilter, status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } },
      data: { status: 'CANCELLED' },
    });
  }

  await prisma.customerActivity.create({
    data: {
      customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.STATUS_CHANGED,
      details: { newStatus: status },
    },
  });

  return { ok: true, status };
}

