// lib/services/reactivationService.ts
// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER REACTIVATION SERVICE
// Identifica clients dormants/en risc i genera missatges de reactivació
// suggerits. Part pura + wrapper que carrega des de Prisma.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { CUSTOMER_DORMANT_MONTHS } from '@/lib/constants';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type ReactivationReason =
  | 'DORMANT_VIP'
  | 'DORMANT_HIGH_VALUE'
  | 'DORMANT_RECURRING'
  | 'DORMANT_FIRST_TIME'
  | 'AT_RISK_HEALTH'
  | 'CHURNED_RECOVERY';

export type ReactivationChannel = 'whatsapp' | 'email' | 'instagram';

export type ReactivationPriority = 'ALTA' | 'MITJANA' | 'BAIXA';

export type ReactivationCandidate = {
  customerId: string;
  name: string;
  email: string;
  phone: string | null;
  phoneNormalized: string | null;
  instagram: string | null;
  lifecycleStage: string;
  totalEvents: number;
  totalSpent: number;
  healthScore: number | null;
  daysSinceLastEvent: number | null;
  daysSinceLastContact: number | null;
  preferredLocale: string;
  priority: ReactivationPriority;
  reason: ReactivationReason;
  reasonLabel: string;
  score: number;
  suggestedChannels: ReactivationChannel[];
  suggestedSubject: string;
  suggestedMessage: string;
  whatsappUrl: string | null;
  mailtoUrl: string;
};

export type ReactivationInput = {
  customers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    phoneNormalized: string | null;
    instagram: string | null;
    lifecycleStage: string;
    totalEvents: number;
    totalSpent: number;
    healthScore: number | null;
    lastEventDate: Date | null;
    lastContactedAt: Date | null;
    preferredLocale: string;
    marketingConsent: boolean;
  }>;
  now: Date;
};

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

const DAY_MS = 1000 * 60 * 60 * 24;
const DORMANT_DAYS = CUSTOMER_DORMANT_MONTHS * 30;

function daysBetween(a: Date, b: Date | null): number | null {
  if (!b) return null;
  return Math.floor((a.getTime() - b.getTime()) / DAY_MS);
}

function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

function buildWhatsappUrl(phoneNormalized: string | null, message: string): string | null {
  if (!phoneNormalized) return null;
  const clean = phoneNormalized.replace(/[^\d]/g, '');
  if (!clean) return null;
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

function buildMailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ───────────────────────────────────────────────────────────────────────────
// MESSAGE TEMPLATES (per locale + reason)
// ───────────────────────────────────────────────────────────────────────────

type Template = { subject: string; body: (name: string, daysSince: number | null) => string };

const TEMPLATES: Record<string, Record<ReactivationReason, Template>> = {
  ca: {
    DORMANT_VIP: {
      subject: 'Et trobem a faltar 💜',
      body: (name) =>
        `Hola ${name}!\n\nFa temps que no coincidim i volíem saludar-te. Sempre ens ha fet especial il·lusió preparar els teus esdeveniments.\n\nSi estàs pensant en una nova celebració, ens encantaria tornar-te a acompanyar. Contacta'ns quan vulguis — com a client VIP tindràs prioritat total.\n\nUna abraçada,\nÒrbita Events`,
    },
    DORMANT_HIGH_VALUE: {
      subject: 'Fem un cafè virtual? ☕',
      body: (name) =>
        `Hola ${name},\n\nFa uns mesos que no ens veiem. Volem saber com estàs i si hi ha alguna data propera al cap en què puguem tornar a fer la teva festa inoblidable.\n\nTenim novetats de catàleg i ofertes per a clients fidels. Ens en parles?\n\nGràcies,\nÒrbita Events`,
    },
    DORMANT_RECURRING: {
      subject: 'Hem notat que fa temps...',
      body: (name) =>
        `Hola ${name}!\n\nJa saps que confiem cada vegada que ens trobem per a un nou event — aquesta vegada t'hem notat a faltar. Si vols recuperar el ritme, aquí ens tens preparats.\n\nContacta'ns i mirem dates.\n\nÒrbita Events`,
    },
    DORMANT_FIRST_TIME: {
      subject: 'Fem una segona?',
      body: (name) =>
        `Hola ${name},\n\nFa temps del teu primer event amb nosaltres i esperem que tinguis un record fantàstic. Si tens una nova celebració a la vista, ens encantaria repetir-la amb tu.\n\nEns dius?\nÒrbita Events`,
    },
    AT_RISK_HEALTH: {
      subject: 'Volem estar segurs que tot va bé',
      body: (name) =>
        `Hola ${name},\n\nFa un temps que no estem en contacte i volem assegurar-nos que tot està bé. Si hi ha alguna cosa que puguem millorar o algun esdeveniment pel qual puguem ajudar-te, digues-nos.\n\nGràcies per confiar en nosaltres,\nÒrbita Events`,
    },
    CHURNED_RECOVERY: {
      subject: 'Ens agradaria recuperar-te 🙏',
      body: (name) =>
        `Hola ${name},\n\nFa molt temps que no ens trobem i ens agradaria saber com ha anat. Si hi ha alguna cosa que puguem fer per tornar a formar part dels teus esdeveniments, ens encantaria escoltar-te.\n\nGràcies,\nÒrbita Events`,
    },
  },
  es: {
    DORMANT_VIP: {
      subject: 'Te echamos de menos 💜',
      body: (name) =>
        `¡Hola ${name}!\n\nHace tiempo que no coincidimos y queríamos saludarte. Siempre nos ha hecho especial ilusión preparar tus eventos.\n\nSi estás pensando en una nueva celebración, nos encantaría acompañarte de nuevo. Contáctanos cuando quieras — como cliente VIP tendrás prioridad total.\n\nUn abrazo,\nÒrbita Events`,
    },
    DORMANT_HIGH_VALUE: {
      subject: '¿Nos tomamos un café virtual? ☕',
      body: (name) =>
        `Hola ${name},\n\nHace unos meses que no nos vemos. Queremos saber cómo estás y si hay alguna fecha próxima en mente en la que podamos volver a hacer tu fiesta inolvidable.\n\nTenemos novedades de catálogo y ofertas para clientes fieles. ¿Nos cuentas?\n\nGracias,\nÒrbita Events`,
    },
    DORMANT_RECURRING: {
      subject: 'Hemos notado que hace tiempo...',
      body: (name) =>
        `¡Hola ${name}!\n\nYa sabes que confiamos cada vez que nos encontramos para un nuevo evento — esta vez te hemos echado de menos. Si quieres recuperar el ritmo, aquí estamos preparados.\n\nContáctanos y miramos fechas.\n\nÒrbita Events`,
    },
    DORMANT_FIRST_TIME: {
      subject: '¿Una segunda vez?',
      body: (name) =>
        `Hola ${name},\n\nHa pasado tiempo desde tu primer evento con nosotros y esperamos que tengas un recuerdo fantástico. Si tienes una nueva celebración a la vista, nos encantaría repetirla contigo.\n\n¿Nos cuentas?\nÒrbita Events`,
    },
    AT_RISK_HEALTH: {
      subject: 'Queremos asegurarnos de que todo va bien',
      body: (name) =>
        `Hola ${name},\n\nHace un tiempo que no estamos en contacto y queremos asegurarnos de que todo está bien. Si hay algo que podamos mejorar o algún evento para el que podamos ayudarte, dínoslo.\n\nGracias por confiar en nosotros,\nÒrbita Events`,
    },
    CHURNED_RECOVERY: {
      subject: 'Nos gustaría recuperarte 🙏',
      body: (name) =>
        `Hola ${name},\n\nHace mucho tiempo que no coincidimos y nos gustaría saber cómo ha ido. Si hay algo que podamos hacer para volver a formar parte de tus eventos, nos encantaría escucharte.\n\nGracias,\nÒrbita Events`,
    },
  },
};

function pickTemplate(locale: string, reason: ReactivationReason): Template {
  const lang = locale === 'ca' || locale === 'es' ? locale : 'es';
  return TEMPLATES[lang][reason];
}

// ───────────────────────────────────────────────────────────────────────────
// CANDIDATE CLASSIFICATION
// ───────────────────────────────────────────────────────────────────────────

const REASON_LABELS: Record<ReactivationReason, string> = {
  DORMANT_VIP: 'VIP dormant',
  DORMANT_HIGH_VALUE: 'Alt valor dormant',
  DORMANT_RECURRING: 'Recurrent dormant',
  DORMANT_FIRST_TIME: 'Primer event dormant',
  AT_RISK_HEALTH: 'Health score baix',
  CHURNED_RECOVERY: 'Recuperació churn',
};

function classifyCandidate(
  customer: ReactivationInput['customers'][number],
  daysSinceLastEvent: number | null
): { reason: ReactivationReason; priority: ReactivationPriority; score: number } | null {
  const isDormant = daysSinceLastEvent != null && daysSinceLastEvent >= DORMANT_DAYS;
  const isChurned = customer.lifecycleStage === 'CHURNED';
  const hasLowHealth = customer.healthScore != null && customer.healthScore <= 40;

  // CHURNED_RECOVERY — excliem si fa més de 24 mesos (massa perdut)
  if (isChurned) {
    if (daysSinceLastEvent != null && daysSinceLastEvent > 24 * 30) return null;
    return { reason: 'CHURNED_RECOVERY', priority: 'BAIXA', score: 30 };
  }

  // DORMANT_VIP — lifecycle VIP + dormant → màxima prioritat
  if (customer.lifecycleStage === 'VIP' && isDormant) {
    return { reason: 'DORMANT_VIP', priority: 'ALTA', score: 95 };
  }

  // DORMANT_HIGH_VALUE — totalSpent >= 2000 i dormant
  if (customer.totalSpent >= 2000 && isDormant) {
    return { reason: 'DORMANT_HIGH_VALUE', priority: 'ALTA', score: 85 };
  }

  // DORMANT_RECURRING — totalEvents >= 2 i dormant
  if (customer.totalEvents >= 2 && isDormant) {
    return { reason: 'DORMANT_RECURRING', priority: 'MITJANA', score: 70 };
  }

  // DORMANT_FIRST_TIME — 1 event i dormant
  if (customer.totalEvents === 1 && isDormant) {
    return { reason: 'DORMANT_FIRST_TIME', priority: 'MITJANA', score: 55 };
  }

  // AT_RISK_HEALTH — healthScore baix però no dormant
  if (hasLowHealth && customer.totalEvents > 0) {
    return { reason: 'AT_RISK_HEALTH', priority: 'MITJANA', score: 50 };
  }

  return null;
}

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function generateReactivationCandidates(input: ReactivationInput): ReactivationCandidate[] {
  const candidates: ReactivationCandidate[] = [];

  for (const customer of input.customers) {
    const daysSinceLastEvent = daysBetween(input.now, customer.lastEventDate);
    const daysSinceLastContact = daysBetween(input.now, customer.lastContactedAt);

    const classification = classifyCandidate(customer, daysSinceLastEvent);
    if (!classification) continue;

    const template = pickTemplate(customer.preferredLocale, classification.reason);
    const nameFirst = firstName(customer.name) || customer.name;
    const subject = template.subject;
    const message = template.body(nameFirst, daysSinceLastEvent);

    const suggestedChannels: ReactivationChannel[] = [];
    if (customer.phoneNormalized) suggestedChannels.push('whatsapp');
    if (customer.email && customer.marketingConsent) suggestedChannels.push('email');
    else if (customer.email && classification.priority === 'ALTA') suggestedChannels.push('email');
    if (customer.instagram) suggestedChannels.push('instagram');

    candidates.push({
      customerId: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      phoneNormalized: customer.phoneNormalized,
      instagram: customer.instagram,
      lifecycleStage: customer.lifecycleStage,
      totalEvents: customer.totalEvents,
      totalSpent: customer.totalSpent,
      healthScore: customer.healthScore,
      daysSinceLastEvent,
      daysSinceLastContact,
      preferredLocale: customer.preferredLocale,
      priority: classification.priority,
      reason: classification.reason,
      reasonLabel: REASON_LABELS[classification.reason],
      score: classification.score,
      suggestedChannels,
      suggestedSubject: subject,
      suggestedMessage: message,
      whatsappUrl: buildWhatsappUrl(customer.phoneNormalized, message),
      mailtoUrl: buildMailtoUrl(customer.email, subject, message),
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadReactivationCandidates(
  now: Date = new Date(),
  limit = 50
): Promise<ReactivationCandidate[]> {
  const rows = await prisma.customer.findMany({
    where: {
      OR: [
        { lifecycleStage: { in: ['DORMANT', 'CHURNED', 'VIP', 'RETURNING', 'FIRST_TIME'] } },
        { healthScore: { lte: 40 } },
      ],
      totalEvents: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      phoneNormalized: true,
      instagram: true,
      lifecycleStage: true,
      totalEvents: true,
      totalSpent: true,
      healthScore: true,
      lastEventDate: true,
      lastContactedAt: true,
      preferredLocale: true,
      marketingConsent: true,
    },
    orderBy: [{ totalSpent: 'desc' }, { lastEventDate: 'asc' }],
    take: 500,
  });

  const input: ReactivationInput = {
    customers: rows.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      phoneNormalized: c.phoneNormalized,
      instagram: c.instagram,
      lifecycleStage: c.lifecycleStage as string,
      totalEvents: c.totalEvents,
      totalSpent: c.totalSpent,
      healthScore: c.healthScore,
      lastEventDate: c.lastEventDate,
      lastContactedAt: c.lastContactedAt,
      preferredLocale: c.preferredLocale,
      marketingConsent: c.marketingConsent,
    })),
    now,
  };

  return generateReactivationCandidates(input).slice(0, limit);
}
