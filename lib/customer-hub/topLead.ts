import type { LeadDTO } from './dto';

const LEAD_PRIORITY_ORDER: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const LEAD_STATUS_ORDER: Record<string, number> = {
  NEW: 0,
  CONTACTED: 1,
  QUOTE_SENT: 2,
  NEGOTIATING: 3,
  WON: 4,
  LOST: 5,
  DISQUALIFIED: 6,
};

export function sortCustomerHubLeads(leads: LeadDTO[]): LeadDTO[] {
  return [...leads].sort((a, b) => {
    const priorityDiff = (LEAD_PRIORITY_ORDER[a.priority] ?? 99) - (LEAD_PRIORITY_ORDER[b.priority] ?? 99);
    if (priorityDiff !== 0) return priorityDiff;

    const statusDiff = (LEAD_STATUS_ORDER[a.status] ?? 99) - (LEAD_STATUS_ORDER[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;

    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

export function getTopCustomerHubLead(leads: LeadDTO[]): LeadDTO | undefined {
  return sortCustomerHubLeads(leads)[0];
}
