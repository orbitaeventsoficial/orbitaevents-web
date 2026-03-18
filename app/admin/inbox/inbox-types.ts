/**
 * Tipus i constants per a la safata d'entrada.
 * Extret de InboxClient.tsx per reduir la mida del component.
 */

export interface LeadData {
  id: string;
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

export const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-300',
  CONTACTED: 'bg-yellow-500/20 text-yellow-300',
  QUOTE_SENT: 'bg-purple-500/20 text-purple-300',
  NEGOTIATING: 'bg-orange-500/20 text-orange-300',
  WON: 'bg-emerald-500/20 text-emerald-300',
  LOST: 'bg-rose-500/20 text-rose-300',
};
