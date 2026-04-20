import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/app/config/site-config';

const SETTING_KEY = 'notification.recipients.v1';

export const NOTIFICATION_CATEGORIES = ['leads', 'reports', 'urgent'] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export interface NotificationRecipient {
  email: string;
  label: string;
  categories: NotificationCategory[];
  active: boolean;
}

interface StoredPayload {
  recipients: NotificationRecipient[];
}

function isValidCategory(value: unknown): value is NotificationCategory {
  return typeof value === 'string' && (NOTIFICATION_CATEGORIES as readonly string[]).includes(value);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseStored(raw: string | null | undefined): NotificationRecipient[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Partial<StoredPayload>;
    if (!Array.isArray(parsed?.recipients)) return [];
    return parsed.recipients
      .map((r): NotificationRecipient | null => {
        if (!r || typeof r !== 'object') return null;
        const emailRaw = (r as { email?: unknown }).email;
        if (typeof emailRaw !== 'string') return null;
        const email = normalizeEmail(emailRaw);
        if (!isValidEmail(email)) return null;
        const label = typeof (r as { label?: unknown }).label === 'string'
          ? (r as { label: string }).label.trim().slice(0, 80)
          : '';
        const categoriesRaw = (r as { categories?: unknown }).categories;
        const categories = Array.isArray(categoriesRaw)
          ? (categoriesRaw.filter(isValidCategory) as NotificationCategory[])
          : [];
        const active = (r as { active?: unknown }).active !== false;
        return { email, label, categories, active };
      })
      .filter((r): r is NotificationRecipient => r !== null);
  } catch {
    return [];
  }
}

function envFallbackEmails(): string[] {
  return (process.env.CONTACT_TO || '')
    .split(',')
    .map((e) => normalizeEmail(e))
    .filter((e) => isValidEmail(e));
}

export async function listNotificationRecipients(): Promise<NotificationRecipient[]> {
  const setting = await prisma.setting.findUnique({
    where: { key: SETTING_KEY },
    select: { value: true },
  });
  const stored = parseStored(setting?.value);
  if (stored.length > 0) return stored;

  const envEmails = envFallbackEmails();
  if (envEmails.length > 0) {
    return envEmails.map((email) => ({
      email,
      label: '',
      categories: [...NOTIFICATION_CATEGORIES],
      active: true,
    }));
  }

  const fallback = normalizeEmail(SITE_CONFIG.business.email);
  if (!isValidEmail(fallback)) return [];
  return [
    {
      email: fallback,
      label: 'Default',
      categories: [...NOTIFICATION_CATEGORIES],
      active: true,
    },
  ];
}

export async function getRecipientsFor(category: NotificationCategory): Promise<string[]> {
  const list = await listNotificationRecipients();
  const filtered = list
    .filter((r) => r.active && r.categories.includes(category))
    .map((r) => r.email);
  if (filtered.length > 0) return Array.from(new Set(filtered));
  const envEmails = envFallbackEmails();
  if (envEmails.length > 0) return Array.from(new Set(envEmails));
  const fallback = normalizeEmail(SITE_CONFIG.business.email);
  return isValidEmail(fallback) ? [fallback] : [];
}

export async function getRecipientsAsString(category: NotificationCategory): Promise<string> {
  const list = await getRecipientsFor(category);
  return list.join(', ');
}

export async function saveNotificationRecipients(
  recipients: NotificationRecipient[],
  userId?: string
): Promise<NotificationRecipient[]> {
  const seen = new Set<string>();
  const sanitized: NotificationRecipient[] = [];
  for (const r of recipients) {
    const email = normalizeEmail(r?.email || '');
    if (!isValidEmail(email) || seen.has(email)) continue;
    seen.add(email);
    const label = typeof r?.label === 'string' ? r.label.trim().slice(0, 80) : '';
    const categories = Array.isArray(r?.categories)
      ? (r.categories.filter(isValidCategory) as NotificationCategory[])
      : [];
    const active = r?.active !== false;
    sanitized.push({ email, label, categories, active });
  }

  const value = JSON.stringify({ recipients: sanitized } satisfies StoredPayload);

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: {
      value,
      type: 'JSON',
      category: 'notifications',
      label: 'Destinataris de notificacions',
      description: 'Llista d\'emails que reben notificacions per categoria (leads/reports/urgent)',
    },
    create: {
      key: SETTING_KEY,
      value,
      type: 'JSON',
      category: 'notifications',
      label: 'Destinataris de notificacions',
      description: 'Llista d\'emails que reben notificacions per categoria (leads/reports/urgent)',
    },
  });

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'setting',
      entityId: SETTING_KEY,
      userId: userId ?? null,
      details: { count: sanitized.length },
    },
  });

  return sanitized;
}
