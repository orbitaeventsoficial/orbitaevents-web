import type { ClientPortalLocale } from '@/lib/clientPortalMessages';

export function buildClientPortalQuestionnairePath(locale: ClientPortalLocale, token: string): string {
  return `/${locale}/portal/${token}/questionnaire`;
}
