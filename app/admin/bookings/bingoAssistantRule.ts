import {
  BINGO_ASSISTANT_LINE_LABEL,
  BINGO_ASSISTANT_LINE_NOTE,
  bingoAssistantRequiredForGuestCount,
  isAdultBingoMusicalName,
  isBingoAssistantLine,
} from '@/lib/constants/orbita-services';
import type { BookingServiceLineFormInput } from './booking-form.types';

function hasAdultBingoLine(lines: BookingServiceLineFormInput[]): boolean {
  return lines.some((line) => (
    line.kind === 'PROVIDER_SERVICE'
    && isAdultBingoMusicalName(line.label)
  ));
}

function isAutoBingoAssistantLine(line: BookingServiceLineFormInput): boolean {
  return Boolean(
    isBingoAssistantLine(line)
    && line.notes?.includes('bingo-assistant-threshold')
    && (line.revenueAmount ?? 0) === 0
    && (line.costAmount == null || line.costAmount === 0)
  );
}

export function buildBingoAssistantLine(): BookingServiceLineFormInput {
  return {
    kind: 'OTHER',
    label: BINGO_ASSISTANT_LINE_LABEL,
    revenueAmount: 0,
    quantity: 1,
    notes: BINGO_ASSISTANT_LINE_NOTE,
    travelHeadcount: 1,
  };
}

export function syncBingoAssistantForGuests(
  lines: BookingServiceLineFormInput[],
  guestCount?: string | number | null,
): BookingServiceLineFormInput[] {
  const required = bingoAssistantRequiredForGuestCount(guestCount) && hasAdultBingoLine(lines);
  const hasAssistant = lines.some(isBingoAssistantLine);

  if (required && !hasAssistant) {
    return [...lines, buildBingoAssistantLine()];
  }

  if (!required && hasAssistant) {
    const next = lines.filter((line) => !isAutoBingoAssistantLine(line));
    return next.length === lines.length ? lines : next;
  }

  return lines;
}
