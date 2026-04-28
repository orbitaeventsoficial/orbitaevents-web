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

export type CustomerCommSummaryDTO = {
  total: number;
  channels: {
    EMAIL: number;
    WHATSAPP: number;
    CALL: number;
    NOTE: number;
    SYSTEM: number;
  };
  lastContactAt: string | null;
  lastContactChannel: 'EMAIL' | 'WHATSAPP' | 'CALL' | 'NOTE' | 'SYSTEM' | null;
  lastContactDirection: 'OUTBOUND' | 'INBOUND' | 'INTERNAL' | null;
  pendingResponseFrom: 'TEAM' | 'CLIENT' | 'NONE';
  daysSinceLastContact: number | null;
  responseGap: number | null;
};

export type CustomerFollowUpItemDTO = {
  leadId: string;
  name: string;
  phone: string | null;
  urgency: 'URGENT' | 'NORMAL' | 'LOW';
  daysSinceOutbound: number;
  suggestedAction: string;
};

export type CustomerFollowUpSummaryDTO = {
  total: number;
  urgent: number;
  normal: number;
  low: number;
  topItem: CustomerFollowUpItemDTO | null;
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
  customerId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  eventType: string;
  eventDate?: string;
  status: string;
  priority: string;
  createdAt: string;
  commercialBlocker?: {
    label: string;
    context?: string;
    tone: 'DANGER' | 'WARNING' | 'INFO';
  } | null;
  booking?: {
    id: string;
    reference: string;
    status: string;
    total: number;
    depositAmount?: number;
    remainingAmount?: number;
    discountCode?: string;
    eventType?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    venue?: string;
    guestCount?: number;
    packName?: string;
    depositPaid?: boolean;
    remainingPaid?: boolean;
  };
};

export type ReferralDTO = {
  id: string;
  name: string;
  email: string;
  totalEvents: number;
  totalSpent: number;
};

export type CustomerPreferencesDTO = {
  musicStyles?: string[];
  preferredVenues?: string[];
  specialNeeds?: string;
  dietaryRestrictions?: string;
  notes?: string;
};

export type CustomerInsightsDTO = {
  nextAction: {
    type: string;
    label: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    context?: string;
  };
  commercialRisk: {
    level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    label: string;
    context?: string;
  };
  relationalHealth: 'EXCELLENT' | 'GOOD' | 'AT_RISK' | 'COLD' | 'LOST';
  ltv: number;
  recurrence: number;
  completedEvents: number;
  daysSinceLastContact: number | null;
  daysSinceLastEvent: number | null;
  daysUntilNextEvent: number | null;
  openTasksCount: number;
  pendingPaymentTotal: number;
};

export type CustomerReactivationDTO = {
  reasonLabel: string;
  priority: 'ALTA' | 'MITJANA' | 'BAIXA';
  score: number;
  suggestedChannels: Array<'whatsapp' | 'email' | 'instagram'>;
  suggestedSubject: string;
  suggestedMessage: string;
  whatsappUrl: string | null;
  mailtoUrl: string;
  daysSinceLastEvent: number | null;
  daysSinceLastContact: number | null;
};

export type CustomerHubDTO = {
  customer: {
    id: string;
    customerNumber?: number | null;
    name: string;
    email?: string;
    phone?: string;
    phoneNormalized?: string | null;
    instagram?: string | null;
    status: HubStatus;
    createdAt: string;
    // CRM Potenciat
    tags?: string[];
    lifecycleStage?: string;
    healthScore?: number | null;
    preferences?: CustomerPreferencesDTO | null;
    birthday?: string | null;
    lastContactedAt?: string | null;
    lastEventDate?: string | null;
    preferredLocale?: string;
    marketingConsent?: boolean;
    totalEvents?: number;
    totalSpent?: number;
    referredBy?: { id: string; name: string; email: string } | null;
    referrals?: ReferralDTO[];
  };
  kpis: HubKpi;
  active: ActiveDocumentDTO;
  proposals: ProposalDTO[];
  bookings: BookingDTO[];
  tasks: TaskDTO[];
  messages: MessageDTO[];
  commSummary: CustomerCommSummaryDTO;
  followUpSummary?: CustomerFollowUpSummaryDTO;
  timeline: TimelineEventDTO[];
  discountCodes: DiscountCodeDTO[];
  leads: LeadDTO[];
  insights: CustomerInsightsDTO;
  reactivation?: CustomerReactivationDTO | null;
};
