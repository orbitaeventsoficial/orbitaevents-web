// lib/services/referralsService.ts
// ═══════════════════════════════════════════════════════════════════════════
// REFERRALS SERVICE
// Calcula el programa de referrals: qui ha portat clients, quant valor han
// generat i quins clients són els millors candidats a ser preguntats.
// Part pura + wrapper que carrega des de Prisma.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type ReferralCustomerInput = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  lifecycleStage: string;
  totalEvents: number;
  totalSpent: number;
  healthScore: number | null;
  referredById: string | null;
  preferredLocale: string;
};

export type ReferralsInput = {
  customers: ReferralCustomerInput[];
};

export type TopReferrer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  lifecycleStage: string;
  referralsCount: number;
  referralsValue: number;
  referralsNames: string[];
};

export type ReferralCandidate = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  lifecycleStage: string;
  totalEvents: number;
  totalSpent: number;
  healthScore: number | null;
  priority: 'ALTA' | 'MITJANA' | 'BAIXA';
  reason: 'VIP_NO_REFERRAL' | 'HIGH_VALUE_NO_REFERRAL' | 'RECURRING_NO_REFERRAL' | 'HAPPY_FIRST_TIME';
  reasonLabel: string;
  score: number;
  suggestedSubject: string;
  suggestedMessage: string;
  whatsappUrl: string | null;
  mailtoUrl: string;
};

export type ReferralsStats = {
  totalCustomers: number;
  totalReferrers: number;
  totalReferred: number;
  referralRate: number; // % de clients que ha vingut per referral
  totalReferralValue: number;
  avgValuePerReferral: number;
  topReferrerName: string | null;
};

export type ReferralsSummary = {
  stats: ReferralsStats;
  topReferrers: TopReferrer[];
  candidates: ReferralCandidate[];
};

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  const clean = phone.replace(/[^\d]/g, '');
  return clean || null;
}

function buildWhatsappUrl(phone: string | null, message: string): string | null {
  const clean = normalizePhone(phone);
  if (!clean) return null;
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

function buildMailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ───────────────────────────────────────────────────────────────────────────
// MESSAGE TEMPLATES
// ───────────────────────────────────────────────────────────────────────────

type Template = { subject: string; body: (name: string) => string };

const TEMPLATES: Record<string, Record<ReferralCandidate['reason'], Template>> = {
  ca: {
    VIP_NO_REFERRAL: {
      subject: 'Ens ajudes a créixer? 🙏',
      body: (name) =>
        `Hola ${name}!\n\nEts un dels nostres clients més especials i ens encantaria que, si coneixes algú que estigui organitzant un event, li parlis de nosaltres.\n\nCom a agraïment, tindràs un detall exclusiu en la teva propera reserva.\n\nGràcies per confiar en nosaltres,\nÒrbita Events`,
    },
    HIGH_VALUE_NO_REFERRAL: {
      subject: 'Una petita proposta per a tu',
      body: (name) =>
        `Hola ${name},\n\nSi algú proper a tu està pensant en organitzar un event i li parles de nosaltres, tots dos tindreu un descompte especial.\n\nEns ajudes a arribar a més famílies com la teva?\n\nÒrbita Events`,
    },
    RECURRING_NO_REFERRAL: {
      subject: 'Comparteix l\'experiència?',
      body: (name) =>
        `Hola ${name}!\n\nCada vegada que ens trobem per a un nou event ens sentim a casa. Si coneixes algú que també vulgui una festa especial, ens faries un gran favor recomanant-nos.\n\nGràcies sempre,\nÒrbita Events`,
    },
    HAPPY_FIRST_TIME: {
      subject: 'Content/a amb la teva festa?',
      body: (name) =>
        `Hola ${name},\n\nEsperem que encara recordis amb un somriure el teu event. Si algun amic o familiar t'ha demanat qui ha organitzat la festa, ens encantaria que ens el presentis.\n\nGràcies per recomanar-nos,\nÒrbita Events`,
    },
  },
  es: {
    VIP_NO_REFERRAL: {
      subject: '¿Nos ayudas a crecer? 🙏',
      body: (name) =>
        `¡Hola ${name}!\n\nEres uno de nuestros clientes más especiales y nos encantaría que, si conoces a alguien que esté organizando un evento, le hables de nosotros.\n\nComo agradecimiento, tendrás un detalle exclusivo en tu próxima reserva.\n\nGracias por confiar en nosotros,\nÒrbita Events`,
    },
    HIGH_VALUE_NO_REFERRAL: {
      subject: 'Una pequeña propuesta para ti',
      body: (name) =>
        `Hola ${name},\n\nSi alguien cercano a ti está pensando en organizar un evento y le hablas de nosotros, los dos tendréis un descuento especial.\n\n¿Nos ayudas a llegar a más familias como la tuya?\n\nÒrbita Events`,
    },
    RECURRING_NO_REFERRAL: {
      subject: '¿Compartes la experiencia?',
      body: (name) =>
        `¡Hola ${name}!\n\nCada vez que nos encontramos para un nuevo evento nos sentimos como en casa. Si conoces a alguien que también quiera una fiesta especial, nos harías un gran favor recomendándonos.\n\nGracias siempre,\nÒrbita Events`,
    },
    HAPPY_FIRST_TIME: {
      subject: '¿Contento/a con tu fiesta?',
      body: (name) =>
        `Hola ${name},\n\nEsperamos que aún recuerdes con una sonrisa tu evento. Si algún amigo o familiar te ha preguntado quién ha organizado la fiesta, nos encantaría que nos lo presentes.\n\nGracias por recomendarnos,\nÒrbita Events`,
    },
  },
};

function pickTemplate(locale: string, reason: ReferralCandidate['reason']): Template {
  const lang = locale === 'ca' || locale === 'es' ? locale : 'es';
  return TEMPLATES[lang][reason];
}

// ───────────────────────────────────────────────────────────────────────────
// REASON LABELS
// ───────────────────────────────────────────────────────────────────────────

const REASON_LABELS: Record<ReferralCandidate['reason'], string> = {
  VIP_NO_REFERRAL: 'VIP sense referral',
  HIGH_VALUE_NO_REFERRAL: 'Alt valor sense referral',
  RECURRING_NO_REFERRAL: 'Recurrent sense referral',
  HAPPY_FIRST_TIME: 'Primer event satisfet',
};

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function computeReferralsSummary(input: ReferralsInput): ReferralsSummary {
  const { customers } = input;

  // Build map by id for quick lookup
  const byId = new Map<string, ReferralCustomerInput>();
  for (const c of customers) byId.set(c.id, c);

  // Group referred customers by referrer
  const referralsByReferrer = new Map<string, ReferralCustomerInput[]>();
  for (const c of customers) {
    if (!c.referredById) continue;
    if (!byId.has(c.referredById)) continue;
    const list = referralsByReferrer.get(c.referredById) ?? [];
    list.push(c);
    referralsByReferrer.set(c.referredById, list);
  }

  // Build top referrers list
  const topReferrers: TopReferrer[] = [];
  for (const [referrerId, referred] of referralsByReferrer.entries()) {
    const referrer = byId.get(referrerId);
    if (!referrer) continue;
    const referralsValue = referred.reduce((sum, r) => sum + r.totalSpent, 0);
    topReferrers.push({
      id: referrer.id,
      name: referrer.name,
      email: referrer.email,
      phone: referrer.phone,
      lifecycleStage: referrer.lifecycleStage,
      referralsCount: referred.length,
      referralsValue,
      referralsNames: referred.map((r) => r.name),
    });
  }
  topReferrers.sort((a, b) => {
    if (b.referralsValue !== a.referralsValue) return b.referralsValue - a.referralsValue;
    return b.referralsCount - a.referralsCount;
  });

  // Stats
  const totalReferred = customers.filter((c) => c.referredById && byId.has(c.referredById)).length;
  const totalReferrers = topReferrers.length;
  const totalReferralValue = topReferrers.reduce((sum, r) => sum + r.referralsValue, 0);
  const avgValuePerReferral = totalReferred > 0 ? totalReferralValue / totalReferred : 0;
  const referralRate = customers.length > 0 ? totalReferred / customers.length : 0;
  const topReferrerName = topReferrers[0]?.name ?? null;

  // Candidates — clients sense referrals encara + alt potencial
  const referrerIds = new Set(topReferrers.map((r) => r.id));
  const candidates: ReferralCandidate[] = [];

  for (const c of customers) {
    // Ja ha fet referrals — no el tornem a preguntar (de moment)
    if (referrerIds.has(c.id)) continue;
    // Sense events — no pot recomanar experiència
    if (c.totalEvents === 0) continue;
    // Churned/dormant — no el preguntem
    if (c.lifecycleStage === 'CHURNED' || c.lifecycleStage === 'DORMANT') continue;
    // Health baix — no és moment de preguntar
    if (c.healthScore != null && c.healthScore < 60) continue;

    let classification:
      | { reason: ReferralCandidate['reason']; priority: ReferralCandidate['priority']; score: number }
      | null = null;

    if (c.lifecycleStage === 'VIP') {
      classification = { reason: 'VIP_NO_REFERRAL', priority: 'ALTA', score: 95 };
    } else if (c.totalSpent >= 2000) {
      classification = { reason: 'HIGH_VALUE_NO_REFERRAL', priority: 'ALTA', score: 85 };
    } else if (c.totalEvents >= 2 || c.lifecycleStage === 'RETURNING') {
      classification = { reason: 'RECURRING_NO_REFERRAL', priority: 'MITJANA', score: 70 };
    } else if (
      (c.lifecycleStage === 'FIRST_TIME' || c.totalEvents === 1) &&
      (c.healthScore == null || c.healthScore >= 70)
    ) {
      classification = { reason: 'HAPPY_FIRST_TIME', priority: 'MITJANA', score: 55 };
    }

    if (!classification) continue;

    const template = pickTemplate(c.preferredLocale, classification.reason);
    const nameFirst = firstName(c.name) || c.name;
    const subject = template.subject;
    const message = template.body(nameFirst);

    candidates.push({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      lifecycleStage: c.lifecycleStage,
      totalEvents: c.totalEvents,
      totalSpent: c.totalSpent,
      healthScore: c.healthScore,
      priority: classification.priority,
      reason: classification.reason,
      reasonLabel: REASON_LABELS[classification.reason],
      score: classification.score,
      suggestedSubject: subject,
      suggestedMessage: message,
      whatsappUrl: buildWhatsappUrl(c.phone, message),
      mailtoUrl: buildMailtoUrl(c.email, subject, message),
    });
  }

  candidates.sort((a, b) => b.score - a.score);

  return {
    stats: {
      totalCustomers: customers.length,
      totalReferrers,
      totalReferred,
      referralRate,
      totalReferralValue,
      avgValuePerReferral,
      topReferrerName,
    },
    topReferrers,
    candidates,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadReferralsSummary(limit = 50): Promise<ReferralsSummary> {
  const rows = await prisma.customer.findMany({
    where: {
      mergedIntoId: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      lifecycleStage: true,
      totalEvents: true,
      totalSpent: true,
      healthScore: true,
      referredById: true,
      preferredLocale: true,
    },
  });

  const customers: ReferralCustomerInput[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    lifecycleStage: c.lifecycleStage as string,
    totalEvents: c.totalEvents,
    totalSpent: c.totalSpent,
    healthScore: c.healthScore,
    referredById: c.referredById,
    preferredLocale: c.preferredLocale,
  }));

  const summary = computeReferralsSummary({ customers });

  // Limit top referrers and candidates
  return {
    ...summary,
    topReferrers: summary.topReferrers.slice(0, limit),
    candidates: summary.candidates.slice(0, limit),
  };
}
