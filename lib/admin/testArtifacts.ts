import {
  ADMIN_TEST_ARTIFACT_PREFIX_MARKERS,
  ADMIN_TEST_ARTIFACT_TEXT_MARKERS,
} from '@/lib/constants/adminTestArtifacts';

export function isAdminTestArtifactText(value: string | null | undefined): boolean {
  const text = (value ?? '').toLowerCase().trim();
  if (!text) return false;
  return (
    ADMIN_TEST_ARTIFACT_TEXT_MARKERS.some((marker) => text.includes(marker)) ||
    ADMIN_TEST_ARTIFACT_PREFIX_MARKERS.some((marker) => text === marker || text.startsWith(`${marker} `))
  );
}

export function isAdminTestArtifactFromParts(parts: Array<string | null | undefined>): boolean {
  return (
    parts.some((part) => isAdminTestArtifactText(part)) ||
    isAdminTestArtifactText(parts.filter(Boolean).join(' '))
  );
}

type AdminTestArtifactNoteValue =
  | string
  | null
  | undefined
  | Array<{ content?: string | null }>;

export type AdminTestBookingArtifactInput = {
  reference?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  eventLocation?: string | null;
  eventVenue?: string | null;
  notes?: string | null;
  lead?: ({
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    notes?: AdminTestArtifactNoteValue;
  } & Record<string, unknown>) | null;
} & Record<string, unknown>;

function noteValues(value: AdminTestArtifactNoteValue): Array<string | null | undefined> {
  if (!Array.isArray(value)) return [value];
  return value.map((note) => note.content);
}

export function isAdminTestBookingArtifact(booking: AdminTestBookingArtifactInput | null | undefined): boolean {
  if (!booking) return false;
  return isAdminTestArtifactFromParts([
    booking.reference,
    booking.clientName,
    booking.clientEmail,
    booking.clientPhone,
    booking.eventLocation,
    booking.eventVenue,
    booking.notes,
    booking.lead?.name,
    booking.lead?.email,
    booking.lead?.phone,
    ...noteValues(booking.lead?.notes),
  ]);
}
