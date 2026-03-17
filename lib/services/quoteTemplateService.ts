import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/app/config/site-config';
import { INCLUDED_TRAVEL_KM } from '@/lib/services/travelCost';

const QUOTE_TEMPLATE_SETTING_KEY = 'quotes.template';

export interface QuoteTemplateSettings {
  validityDays: number;
  introTitle: string;
  introSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  conditions: string[];
  sendAdminCopy: boolean;
  adminCopyEmail: string;
}

export const DEFAULT_QUOTE_TEMPLATE: QuoteTemplateSettings = {
  validityDays: 15,
  introTitle: 'PRESSUPOST',
  introSubtitle: 'Proposta personalitzada per al teu esdeveniment',
  ctaTitle: "T'agrada el que veus?",
  ctaSubtitle: 'Reserva la teva data ara i assegura`t el millor preu',
  conditions: [
    "Reserva: Es considera reserva ferma amb el pagament del 30% d'aval.",
    "Pagament final: El 70% restant s'abona 7 dies abans de l'esdeveniment.",
    "Cancel·lació: >60 dies, 100% retorn de l'aval; 30-60 dies, 50% retorn; <30 dies, l'aval no és reemborsable.",
    `Desplaçament: Inclòs fins a ${INCLUDED_TRAVEL_KM} km de Granollers. Consulteu per a distàncies superiors.`,
    "Hores extres: Es facturaran al preu indicat si l'esdeveniment s'allarga.",
  ],
  sendAdminCopy: true,
  adminCopyEmail: process.env.CONTACT_TO || SITE_CONFIG.business.email,
};

function clampValidityDays(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_QUOTE_TEMPLATE.validityDays;
  return Math.min(120, Math.max(1, Math.round(parsed)));
}
function sanitizeText(value: unknown, fallback: string): string { const text = typeof value === 'string' ? value.trim() : ''; return text || fallback; }
function sanitizeConditions(value: unknown): string[] {
  if (!Array.isArray(value)) return DEFAULT_QUOTE_TEMPLATE.conditions;
  const clean = value.map((line) => (typeof line === 'string' ? line.trim() : '')).filter(Boolean).slice(0, 12);
  return clean.length > 0 ? clean : DEFAULT_QUOTE_TEMPLATE.conditions;
}
function sanitizeEmail(value: unknown): string { const email = typeof value === 'string' ? value.trim() : ''; return email || DEFAULT_QUOTE_TEMPLATE.adminCopyEmail; }

export function normalizeQuoteTemplate(input: unknown): QuoteTemplateSettings {
  if (!input || typeof input !== 'object') return DEFAULT_QUOTE_TEMPLATE;
  const raw = input as Record<string, unknown>;
  return {
    validityDays: clampValidityDays(raw.validityDays),
    introTitle: sanitizeText(raw.introTitle, DEFAULT_QUOTE_TEMPLATE.introTitle),
    introSubtitle: sanitizeText(raw.introSubtitle, DEFAULT_QUOTE_TEMPLATE.introSubtitle),
    ctaTitle: sanitizeText(raw.ctaTitle, DEFAULT_QUOTE_TEMPLATE.ctaTitle),
    ctaSubtitle: sanitizeText(raw.ctaSubtitle, DEFAULT_QUOTE_TEMPLATE.ctaSubtitle),
    conditions: sanitizeConditions(raw.conditions),
    sendAdminCopy: typeof raw.sendAdminCopy === 'boolean' ? raw.sendAdminCopy : DEFAULT_QUOTE_TEMPLATE.sendAdminCopy,
    adminCopyEmail: sanitizeEmail(raw.adminCopyEmail),
  };
}

export async function getQuoteTemplateSettings(): Promise<QuoteTemplateSettings> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: QUOTE_TEMPLATE_SETTING_KEY } });
    if (!setting?.value) return DEFAULT_QUOTE_TEMPLATE;
    return normalizeQuoteTemplate(JSON.parse(setting.value));
  } catch {
    return DEFAULT_QUOTE_TEMPLATE;
  }
}

export async function upsertQuoteTemplateSettings(input: QuoteTemplateSettings): Promise<QuoteTemplateSettings> {
  const normalized = normalizeQuoteTemplate(input);
  await prisma.setting.upsert({
    where: { key: QUOTE_TEMPLATE_SETTING_KEY },
    update: {
      value: JSON.stringify(normalized),
      type: 'JSON',
      category: 'config',
      label: 'Plantilla de pressupostos',
      description: 'Configuració visual i operativa dels pressupostos enviats',
    },
    create: {
      key: QUOTE_TEMPLATE_SETTING_KEY,
      value: JSON.stringify(normalized),
      type: 'JSON',
      category: 'config',
      label: 'Plantilla de pressupostos',
      description: 'Configuració visual i operativa dels pressupostos enviats',
    },
  }).catch(() => {
    throw new Error('No se pudo guardar la plantilla de presupuesto');
  });

  await prisma.adminLog.create({
    data: { action: 'UPDATE', entity: 'setting', entityId: QUOTE_TEMPLATE_SETTING_KEY, details: { key: QUOTE_TEMPLATE_SETTING_KEY } },
  }).catch(() => undefined);

  return normalized;
}
