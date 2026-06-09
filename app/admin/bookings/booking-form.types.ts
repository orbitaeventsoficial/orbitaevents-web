export type BookingFormData = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventType: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  eventVenue: string;
  guestCount: string;
  packId: string;
  extraHours: string;
  distanceKm: string;
  fuelCostPerKm: string;
  discount: string;
  discountCode: string;
  notes: string;
};

export const INITIAL_BOOKING_FORM: BookingFormData = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  eventType: 'OTHER',
  eventDate: '',
  eventStartTime: '22:00',
  eventEndTime: '04:00',
  eventLocation: '',
  eventVenue: '',
  guestCount: '',
  packId: '',
  extraHours: '0',
  distanceKm: '',
  fuelCostPerKm: '0.19',
  discount: '0',
  discountCode: '',
  notes: '',
};

export type BookingPack = {
  id: string;
  slug: string;
  service?: string | null;
  price: number;
  originalPrice: number | null;
  extraHourPrice: number;
  djHours: number;
  soundWatts: number;
  includesFog: boolean;
  includesMic: boolean;
  recommendedOperatorExtraHourPrice?: number;
  translations: Array<{ name: string; description: string }>;
};

export type BookingExtra = {
  id: string;
  slug: string;
  price: number;
  priceType: string;
  translations: Array<{ name: string }>;
  isOperatorExtra?: boolean;
};

export type BookingLeadData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  eventType: string | null;
  eventDate: string | null;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  eventLocation: string | null;
  eventAddress?: string | null;
  guestCount: number | null;
  budget: string | null;
  interestedPackId?: string | null;
  customerId: string | null;
  sourceCollaboratorId?: string | null;
};

export type BookingPartnerOption = {
  id: string;
  name: string;
  company: string | null;
  roles?: string[];
  isFavorite?: boolean;
};

export type BookingServiceLineKind = 'DJ' | 'SOUND_TECH' | 'PROVIDER_SERVICE' | 'EQUIPMENT' | 'OTHER';

export type BookingServiceLineFormInput = {
  collaboratorId?: string;
  kind: BookingServiceLineKind;
  label: string;
  revenueAmount?: number;
  costAmount?: number;
  quantity?: number;
  notes?: string;
};

export type RawExtraConfig = {
  id?: string | number | null;
  slug?: string | null;
  price?: number | string | null;
  priceType?: string | null;
  name?: string | null;
};

export type BookingConflictRow = {
  id: string;
  reference: string;
  clientName: string;
  eventStartTime?: string | null;
  status: string;
};

export type BookingDateConflict = {
  id: string;
  reference: string;
  clientName: string;
  eventStartTime: string | null;
};

export type BookingSelectedExtras = Record<string, { quantity: number; price: number }>;

export type BookingDiscountValidation = {
  valid: boolean;
  type?: string;
  value?: number;
  source?: string;
  reason?: string;
};

export const OPERATOR_EXTRA_ID = '__operator_extra__';

/** Key d'autosave de la nova reserva (compartida entre el hook i el prefill). */
export function bookingAutosaveKey(leadId?: string | null, customerId?: string | null): string {
  return `booking-new-${leadId || customerId || 'lliure'}`;
}
