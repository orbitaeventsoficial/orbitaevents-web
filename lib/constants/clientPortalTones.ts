export const CLIENT_PORTAL_TONE_CLASS = {
  successText: 'text-[var(--oe-green)]',
  successSoft: 'border-[color-mix(in_oklab,var(--oe-green)_28%,transparent)] bg-[color-mix(in_oklab,var(--oe-green)_10%,transparent)] text-[color-mix(in_oklab,var(--oe-green)_70%,white)]',
  successBorder: 'border-[color-mix(in_oklab,var(--oe-green)_24%,transparent)]',
  warningText: 'text-[var(--oe-amber)]',
  warningSoft: 'border-[color-mix(in_oklab,var(--oe-amber)_28%,transparent)] bg-[color-mix(in_oklab,var(--oe-amber)_10%,transparent)] text-[color-mix(in_oklab,var(--oe-amber)_72%,white)]',
  dangerText: 'text-[color-mix(in_oklab,var(--oe-orange)_82%,white)]',
  dangerSoft: 'border-[color-mix(in_oklab,var(--oe-orange)_28%,transparent)] bg-[color-mix(in_oklab,var(--oe-orange)_10%,transparent)] text-[color-mix(in_oklab,var(--oe-orange)_82%,white)]',
} as const;

export function clientPortalPaymentTone(isPaid: boolean): string {
  return isPaid ? CLIENT_PORTAL_TONE_CLASS.successText : CLIENT_PORTAL_TONE_CLASS.warningText;
}
