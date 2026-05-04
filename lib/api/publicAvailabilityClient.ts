export type AvailabilityUrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type AvailabilitySaturdayStatus = 'available' | 'booked' | 'blocked';

export type AvailabilitySaturdayDate = {
  date: string;
  status: AvailabilitySaturdayStatus;
};

export type AvailabilityMonth = {
  month: string;
  monthName: string;
  year: number;
  totalSaturdays: number;
  availableSaturdays: number;
  bookedSaturdays: number;
  blockedSaturdays: number;
  saturdayDates: AvailabilitySaturdayDate[];
};

export type AvailabilityValues = {
  nextAvailableDate: string | null;
  nextAvailableSaturday: string | null;
  monthlyAvailability: AvailabilityMonth[];
  scarcityMessage: string;
  urgencyLevel: AvailabilityUrgencyLevel;
};

export type PublicAvailabilityResponse = {
  ok: boolean;
  data: AvailabilityValues;
  generatedAt: string;
};

export async function fetchPublicAvailability(
  locale?: string,
  init?: RequestInit,
): Promise<PublicAvailabilityResponse> {
  const url = locale
    ? `/api/public/availability?locale=${encodeURIComponent(locale)}`
    : '/api/public/availability';
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`public-availability fetch failed (${response.status})`);
  }
  return (await response.json()) as PublicAvailabilityResponse;
}
