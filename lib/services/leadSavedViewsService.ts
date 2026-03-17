import { prisma } from '@/lib/prisma';

const KEY = 'leads.views';

export interface LeadSavedView {
  id: string;
  name: string;
  query: string;
  createdAt: string;
}

export function getLeadViewsKey(user?: string | null): string {
  return user ? `${KEY}.${user}` : KEY;
}

export function sanitizeLeadSavedViews(input: unknown): LeadSavedView[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((raw) => {
      const view = raw as Partial<LeadSavedView> | null | undefined;
      return {
        id: String(view?.id || '').trim(),
        name: String(view?.name || '').trim().slice(0, 80),
        query: String(view?.query || '').trim(),
        createdAt: String(view?.createdAt || '').trim(),
      };
    })
    .filter((view) => view.id && view.name && view.query && view.createdAt)
    .slice(0, 50);
}

export async function getLeadSavedViews(key: string): Promise<LeadSavedView[]> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting?.value) return [];

  try {
    return sanitizeLeadSavedViews(JSON.parse(setting.value));
  } catch {
    return [];
  }
}

export async function saveLeadSavedViews(key: string, views: LeadSavedView[]): Promise<LeadSavedView[]> {
  const sanitized = sanitizeLeadSavedViews(views);
  await prisma.setting.upsert({
    where: { key },
    update: { value: JSON.stringify(sanitized), type: 'JSON', category: 'config' },
    create: { key, value: JSON.stringify(sanitized), type: 'JSON', category: 'config' },
  });
  return sanitized;
}

export function createLeadSavedView(input: { name: unknown; query: unknown }): LeadSavedView | null {
  const name = String(input.name || '').trim().slice(0, 80);
  const query = String(input.query || '').trim();
  if (!name || !query) return null;

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name,
    query,
    createdAt: new Date().toISOString(),
  };
}