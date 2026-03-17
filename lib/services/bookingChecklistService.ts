import { prisma } from '@/lib/prisma';

const SETTING_PREFIX = 'booking.checklist.';

export interface BookingChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export const DEFAULT_BOOKING_CHECKLIST_ITEMS: BookingChecklistItem[] = [
  { id: 'confirm-client', label: 'Confirmar data i hora amb el client', checked: false },
  { id: 'prepare-playlist', label: 'Preparar playlist / escaleta', checked: false },
  { id: 'check-equipment', label: 'Revisar equipament necessari', checked: false },
  { id: 'load-vehicle', label: 'Carregar vehicle', checked: false },
  { id: 'confirm-address', label: 'Confirmar adreça i accés al lloc', checked: false },
  { id: 'verify-payment', label: 'Verificar estat de pagament', checked: false },
  { id: 'check-contracts', label: 'Contracte / pressupost signat', checked: false },
];

function getChecklistKey(bookingId: string): string {
  return `${SETTING_PREFIX}${bookingId}`;
}

export function sanitizeBookingChecklistItems(input: unknown): BookingChecklistItem[] {
  if (!Array.isArray(input)) return DEFAULT_BOOKING_CHECKLIST_ITEMS;

  const items = input
    .map((raw) => {
      const item = raw as Partial<BookingChecklistItem> | null | undefined;
      return {
        id: String(item?.id || '').trim(),
        label: String(item?.label || '').trim(),
        checked: Boolean(item?.checked),
      };
    })
    .filter((item) => item.id && item.label);

  return items.length > 0 ? items : DEFAULT_BOOKING_CHECKLIST_ITEMS;
}

export async function getBookingChecklist(bookingId: string): Promise<BookingChecklistItem[]> {
  const setting = await prisma.setting.findUnique({ where: { key: getChecklistKey(bookingId) } });
  if (!setting?.value) return DEFAULT_BOOKING_CHECKLIST_ITEMS;

  try {
    return sanitizeBookingChecklistItems(JSON.parse(setting.value));
  } catch {
    return DEFAULT_BOOKING_CHECKLIST_ITEMS;
  }
}

export async function saveBookingChecklist(bookingId: string, input: unknown): Promise<BookingChecklistItem[]> {
  const items = sanitizeBookingChecklistItems(input);

  await prisma.setting.upsert({
    where: { key: getChecklistKey(bookingId) },
    create: {
      key: getChecklistKey(bookingId),
      value: JSON.stringify(items),
      category: 'checklist',
    },
    update: {
      value: JSON.stringify(items),
    },
  });

  return items;
}