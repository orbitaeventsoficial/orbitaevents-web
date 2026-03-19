export type HubStatus = 'LEAD' | 'NEGOTIATION' | 'CONFIRMED' | 'POSTEVENT' | 'LOST';

export type HubKpi = {
  nextEventDate?: string;
  lastContactAt?: string;
  totalQuoted?: number;
  totalPaid?: number;
  marginEstimated?: number;
};

export type ProposalStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type ProposalDTO = {
  id: string;
  reference: string;
  status: ProposalStatus;
  total: number;
  createdAt: string;
  sentAt?: string;
  acceptedAt?: string;
  snapshot?: Record<string, unknown>;
  // Contract fields
  contractReference?: string | null;
  contractStatus?: string | null;
  contractSentAt?: string | null;
  contractSignedAt?: string | null;
};

export type BookingDTO = {
  id: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  location?: string;
  venue?: string;
  depositAmount?: number;
  totalAmount?: number;
  reference?: string;
  eventType?: string;
  packName?: string;
  guestCount?: number;
  depositPaid?: boolean;
  remainingPaid?: boolean;
  discountCode?: string;
};

export type DiscountCodeDTO = {
  id: string;
  code: string;
  discountPercent: number;
  validFrom: string;
  validUntil: string;
  maxUses: number;
  currentUses: number;
  sourceType: string;
  isActive: boolean;
  usedAt?: string;
};

export type TaskDTO = {
  id: string;
  title: string;
  dueDate?: string;
  done: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  leadId?: string;
};

export type MessageDTO = {
  id: string;
  channel: 'EMAIL' | 'NOTE' | 'WHATSAPP' | 'CALL';
  direction?: 'OUTBOUND' | 'INBOUND';
  subject?: string;
  bodyPreview?: string;
  sentAt?: string;
  createdAt: string;
  leadId?: string;
};

export type TimelineEventType =
  | 'PROPOSAL_CREATED'
  | 'PROPOSAL_SENT'
  | 'PROPOSAL_ACCEPTED'
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'TASK_CREATED'
  | 'TASK_DONE'
  | 'MESSAGE_SENT'
  | 'EMAIL_RECEIVED'
  | 'WHATSAPP_SENT'
  | 'PHONE_CALL'
  | 'NOTE_ADDED'
  | 'ACTIVITY';

export type TimelineEventDTO = {
  id: string;
  type: TimelineEventType;
  at: string;
  title: string;
  meta?: Record<string, unknown>;
  link?: { label: string; href: string };
};

export type ActiveDocumentDTO = {
  proposalId?: string;
  source: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'NONE';
};

export type LeadDTO = {
  id: string;
  name: string;
  email: string;
  eventType: string;
  eventDate?: string;
  status: string;
  priority: string;
  createdAt: string;
  booking?: {
    id: string;
    reference: string;
    status: string;
    total: number;
  };
};

export type CustomerHubDTO = {
  customer: {
    id: string;
    customerNumber?: number | null;
    name: string;
    email?: string;
    phone?: string;
    status: HubStatus;
    createdAt: string;
  };
  kpis: HubKpi;
  active: ActiveDocumentDTO;
  proposals: ProposalDTO[];
  bookings: BookingDTO[];
  tasks: TaskDTO[];
  messages: MessageDTO[];
  timeline: TimelineEventDTO[];
  discountCodes: DiscountCodeDTO[];
  leads: LeadDTO[];
};

