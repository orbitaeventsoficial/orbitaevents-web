/**
 * Tipus i constants per a la safata d'entrada.
 * Extret de InboxClient.tsx per reduir la mida del component.
 */

import { getLeadStatusDisplay } from '@/lib/constants';

export interface LeadData {
  id: string;
  customerId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  eventType: string | null;
  status: string;
  preferredLocale: string | null;
  interestedPackId: string | null;
  interestedExtras: string[];
  budget: string | null;
  guestCount: number | null;
  eventDate: Date | null;
  eventLocation: string | null;
  createdAt: Date;
  updatedAt: Date;
  source: string | null;
}

export interface ImapEmail {
  id: string;
  uid: number;
  from: { name: string; address: string };
  subject: string;
  date: Date;
  bodyText: string;
  bodyHtml: string;
  isRead: boolean;
}

export interface UnifiedEmail {
  id: string;
  type: 'lead' | 'imap';
  from: string;
  fromName: string;
  subject: string;
  preview: string;
  date: Date;
  read: boolean;
  leadData?: LeadData;
  imapData?: ImapEmail;
}

export interface InboxStats {
  totalLeads: number;
  unreadLeads: number;
  todayLeads: number;
}

export interface QuotePackOption {
  id: string;
  label: string;
  price: number;
}


export function getLeadStatusTone(status: string) {
  return getLeadStatusDisplay(status);
}
