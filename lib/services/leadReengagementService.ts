// lib/services/leadReengagementService.ts
// ═══════════════════════════════════════════════════════════════════════════
// LEAD REENGAGEMENT SERVICE
// Identifica leads dormants, amb negociació refredada o cotitzacions sense
// resposta, i genera suggeriments de reengagement amb missatge + canal.
// Part pura + wrapper que carrega des de Prisma.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type ReengagementReason =
  | 'HOT_STALE'          // alta prioritat + sense contacte recent
  | 'QUOTE_NO_REPLY'     // pressupost enviat, sense resposta
  | 'NEGOTIATION_COLD'   // negociació refredada
  | 'EARLY_SILENCE'      // lead nou contactat sense resposta
  | 'UPCOMING_EVENT'     // event proper però lead no avança
  | 'LONG_DORMANT';      // dormant de llarg — últim intent

export type ReengagementChannel = 'whatsapp' | 'email';

export type ReengagementPriority = 'ALTA' | 'MITJANA' | 'BAIXA';

export type ReengagementCandidate = {
  leadId: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  priority: string;
  eventType: string;
  eventDate: Date | null;
  eventLocation: string | null;
  budget: string | null;
  preferredLocale: string;
  daysSinceCreation: number;
  daysSinceContact: number | null;
  daysSinceActivity: number | null;
  daysUntilEvent: number | null;
  reason: ReengagementReason;
  reasonLabel: string;
  reengagementPriority: ReengagementPriority;
  score: number;
  suggestedChannels: ReengagementChannel[];
  suggestedSubject: string;
  suggestedMessage: string;
  whatsappUrl: string | null;
  mailtoUrl: string;
};

export type ReengagementLeadInput = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  priority: string;
  eventType: string;
  eventDate: Date | null;
  eventLocation: string | null;
  budget: string | null;
  preferredLocale: string;
  createdAt: Date;
  updatedAt: Date;
  contactedAt: Date | null;
  lastActivityAt: Date | null;
};

export type ReengagementInput = {
  leads: ReengagementLeadInput[];
  now: Date;
};

// ───────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ───────────────────────────────────────────────────────────────────────────

const DAY_MS = 1000 * 60 * 60 * 24;
const EARLY_SILENCE_DAYS = 4;
const QUOTE_STALE_DAYS = 6;
const NEGOTIATION_STALE_DAYS = 5;
const HOT_STALE_DAYS = 3;
const LONG_DORMANT_DAYS = 21;
const EXCLUDE_STALE_DAYS = 90; // més vell que això, descartem
const UPCOMING_EVENT_DAYS = 45;

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

function daysBetween(a: Date, b: Date | null): number | null {
  if (!b) return null;
  return Math.floor((a.getTime() - b.getTime()) / DAY_MS);
}

function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  const clean = phone.replace(/[^\d]/g, '');
  if (!clean) return null;
  return clean;
}

function buildWhatsappUrl(phone: string | null, message: string): string | null {
  const clean = normalizePhone(phone);
  if (!clean) return null;
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

function buildMailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function mostRecent(a: Date | null, b: Date | null): Date | null {
  if (!a && !b) return null;
  if (!a) return b;
  if (!b) return a;
  return a.getTime() > b.getTime() ? a : b;
}

// ───────────────────────────────────────────────────────────────────────────
// MESSAGE TEMPLATES (per locale + reason)
// ───────────────────────────────────────────────────────────────────────────

type Template = { subject: string; body: (name: string, daysSince: number | null) => string };

const TEMPLATES: Record<string, Record<ReengagementReason, Template>> = {
  ca: {
    HOT_STALE: {
      subject: 'Ens hem creuat les dates?',
      body: (name) =>
        `Hola ${name}!\n\nVolíem assegurar-nos que la nostra proposta t'ha arribat i que podem seguir endavant amb el teu event. Si tens dubtes, et trucaré personalment per ajudar-te a decidir.\n\nQuin moment et va millor?\n\nÒrbita Events`,
    },
    QUOTE_NO_REPLY: {
      subject: 'Tens dubtes sobre el pressupost?',
      body: (name) =>
        `Hola ${name},\n\nFa uns dies que et vam enviar el pressupost i volíem saber si tens cap dubte o si hi ha alguna cosa que puguem ajustar perquè s'adapti millor al que busques.\n\nQuedem atents.\nÒrbita Events`,
    },
    NEGOTIATION_COLD: {
      subject: 'Tanquem els últims detalls?',
      body: (name) =>
        `Hola ${name}!\n\nFa uns dies que parlàvem de la teva festa i ens agradaria tancar els últims detalls. Si hi ha algun punt que no acaba d'encaixar, podem trobar una alternativa.\n\nQuan vulguis parlem.\nÒrbita Events`,
    },
    EARLY_SILENCE: {
      subject: 'Has rebut la nostra resposta?',
      body: (name) =>
        `Hola ${name},\n\nEt vam contestar fa uns dies i volíem assegurar-nos que has rebut la informació. Si t'ha arribat a spam o necessites que et reenviem res, digues-nos-ho.\n\nGràcies,\nÒrbita Events`,
    },
    UPCOMING_EVENT: {
      subject: 'La teva data s\'acosta 🎉',
      body: (name, daysSince) =>
        `Hola ${name}!\n\nLa data del teu event s'apropa i volíem assegurar-nos que tot està en marxa. Si encara no has decidit, aquest és el millor moment per reservar: les dates pròximes tenen molt de moviment.\n\nContacta'ns i tanquem-ho.\nÒrbita Events`,
    },
    LONG_DORMANT: {
      subject: 'Encara tens pensat l\'event?',
      body: (name) =>
        `Hola ${name},\n\nFa un temps que vam parlar de la teva festa i ens agradaria saber si segueix en peu. Si ha canviat res o necessites replantejar-ho, ens encantaria ajudar-te.\n\nSi ja no et cal, ens ho pots dir també i tanquem el fil amb tranquil·litat.\n\nÒrbita Events`,
    },
  },
  es: {
    HOT_STALE: {
      subject: '¿Se nos han cruzado las fechas?',
      body: (name) =>
        `¡Hola ${name}!\n\nQueríamos asegurarnos de que nuestra propuesta te ha llegado y que podemos seguir adelante con tu evento. Si tienes dudas, te llamo personalmente para ayudarte a decidir.\n\n¿Qué momento te viene mejor?\n\nÒrbita Events`,
    },
    QUOTE_NO_REPLY: {
      subject: '¿Tienes dudas sobre el presupuesto?',
      body: (name) =>
        `Hola ${name},\n\nHace unos días te enviamos el presupuesto y queríamos saber si tienes alguna duda o si hay algo que podamos ajustar para que encaje mejor con lo que buscas.\n\nQuedamos atentos.\nÒrbita Events`,
    },
    NEGOTIATION_COLD: {
      subject: '¿Cerramos los últimos detalles?',
      body: (name) =>
        `¡Hola ${name}!\n\nHace unos días que hablábamos de tu fiesta y nos gustaría cerrar los últimos detalles. Si hay algún punto que no acaba de encajar, podemos encontrar una alternativa.\n\nCuando quieras hablamos.\nÒrbita Events`,
    },
    EARLY_SILENCE: {
      subject: '¿Has recibido nuestra respuesta?',
      body: (name) =>
        `Hola ${name},\n\nTe contestamos hace unos días y queríamos asegurarnos de que has recibido la información. Si te ha llegado a spam o necesitas que te reenviemos algo, dínoslo.\n\nGracias,\nÒrbita Events`,
    },
    UPCOMING_EVENT: {
      subject: 'Tu fecha se acerca 🎉',
      body: (name) =>
        `¡Hola ${name}!\n\nLa fecha de tu evento se acerca y queríamos asegurarnos de que todo está en marcha. Si aún no has decidido, este es el mejor momento para reservar: las fechas próximas tienen mucho movimiento.\n\nContáctanos y lo cerramos.\nÒrbita Events`,
    },
    LONG_DORMANT: {
      subject: '¿Sigues pensando en el evento?',
      body: (name) =>
        `Hola ${name},\n\nHace un tiempo hablamos de tu fiesta y nos gustaría saber si sigue en pie. Si ha cambiado algo o necesitas replantearlo, nos encantaría ayudarte.\n\nSi ya no lo necesitas, también puedes decírnoslo y cerramos el hilo con tranquilidad.\n\nÒrbita Events`,
    },
  },
};

function pickTemplate(locale: string, reason: ReengagementReason): Template {
  const lang = locale === 'ca' || locale === 'es' ? locale : 'es';
  return TEMPLATES[lang][reason];
}

// ───────────────────────────────────────────────────────────────────────────
// REASON LABELS
// ───────────────────────────────────────────────────────────────────────────

const REASON_LABELS: Record<ReengagementReason, string> = {
  HOT_STALE: 'Calent refredant',
  QUOTE_NO_REPLY: 'Pressupost sense resposta',
  NEGOTIATION_COLD: 'Negociació refredada',
  EARLY_SILENCE: 'Silenci després de contacte',
  UPCOMING_EVENT: 'Event proper',
  LONG_DORMANT: 'Dormant de llarg',
};

// ───────────────────────────────────────────────────────────────────────────
// CLASSIFICATION
// ───────────────────────────────────────────────────────────────────────────

function classifyLead(
  lead: ReengagementLeadInput,
  now: Date
): { reason: ReengagementReason; priority: ReengagementPriority; score: number; daysSinceActivity: number | null; daysSinceContact: number | null } | null {
  // Exclou estats terminals
  if (lead.status === 'WON' || lead.status === 'LOST') return null;

  // Referència de "última acció" — la més recent entre contactedAt, updatedAt, lastActivityAt
  const lastTouch = mostRecent(mostRecent(lead.contactedAt, lead.lastActivityAt), lead.updatedAt);
  const daysSinceActivity = daysBetween(now, lastTouch);
  const daysSinceContact = daysBetween(now, lead.contactedAt);
  const daysUntilEvent = lead.eventDate ? daysBetween(lead.eventDate, now) : null;

  // Si fa més de EXCLUDE_STALE_DAYS, descartem — no val la pena reenganxar
  if (daysSinceActivity != null && daysSinceActivity > EXCLUDE_STALE_DAYS) return null;

  // UPCOMING_EVENT — event molt proper + lead no avança (prioritat absoluta)
  if (
    daysUntilEvent != null &&
    daysUntilEvent > 0 &&
    daysUntilEvent <= UPCOMING_EVENT_DAYS &&
    lead.status !== 'WON' &&
    (daysSinceActivity == null || daysSinceActivity >= 3)
  ) {
    return {
      reason: 'UPCOMING_EVENT',
      priority: 'ALTA',
      score: 100 - Math.min(daysUntilEvent, 45),
      daysSinceActivity,
      daysSinceContact,
    };
  }

  // HOT_STALE — prioritat alta/urgent + sense activitat recent
  if (
    (lead.priority === 'HIGH' || lead.priority === 'URGENT') &&
    daysSinceActivity != null &&
    daysSinceActivity >= HOT_STALE_DAYS
  ) {
    return {
      reason: 'HOT_STALE',
      priority: 'ALTA',
      score: 90 - Math.min(daysSinceActivity, 20),
      daysSinceActivity,
      daysSinceContact,
    };
  }

  // QUOTE_NO_REPLY — pressupost enviat i silenci
  if (
    lead.status === 'QUOTE_SENT' &&
    daysSinceActivity != null &&
    daysSinceActivity >= QUOTE_STALE_DAYS
  ) {
    return {
      reason: 'QUOTE_NO_REPLY',
      priority: 'ALTA',
      score: 80 - Math.min(daysSinceActivity, 30),
      daysSinceActivity,
      daysSinceContact,
    };
  }

  // NEGOTIATION_COLD — negociació refredada
  if (
    lead.status === 'NEGOTIATING' &&
    daysSinceActivity != null &&
    daysSinceActivity >= NEGOTIATION_STALE_DAYS
  ) {
    return {
      reason: 'NEGOTIATION_COLD',
      priority: 'MITJANA',
      score: 70 - Math.min(daysSinceActivity, 30),
      daysSinceActivity,
      daysSinceContact,
    };
  }

  // EARLY_SILENCE — lead contactat però silenci
  if (
    (lead.status === 'CONTACTED' || lead.status === 'NEW') &&
    lead.contactedAt != null &&
    daysSinceContact != null &&
    daysSinceContact >= EARLY_SILENCE_DAYS
  ) {
    return {
      reason: 'EARLY_SILENCE',
      priority: 'MITJANA',
      score: 60 - Math.min(daysSinceContact, 20),
      daysSinceActivity,
      daysSinceContact,
    };
  }

  // LONG_DORMANT — últim intent abans de descartar
  if (daysSinceActivity != null && daysSinceActivity >= LONG_DORMANT_DAYS) {
    return {
      reason: 'LONG_DORMANT',
      priority: 'BAIXA',
      score: 30,
      daysSinceActivity,
      daysSinceContact,
    };
  }

  return null;
}

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function generateReengagementCandidates(input: ReengagementInput): ReengagementCandidate[] {
  const candidates: ReengagementCandidate[] = [];

  for (const lead of input.leads) {
    const classification = classifyLead(lead, input.now);
    if (!classification) continue;

    const template = pickTemplate(lead.preferredLocale, classification.reason);
    const nameFirst = firstName(lead.name) || lead.name;
    const subject = template.subject;
    const message = template.body(nameFirst, classification.daysSinceActivity);

    const suggestedChannels: ReengagementChannel[] = [];
    if (normalizePhone(lead.phone)) suggestedChannels.push('whatsapp');
    if (lead.email) suggestedChannels.push('email');

    const daysSinceCreation = daysBetween(input.now, lead.createdAt) ?? 0;
    const daysUntilEvent = lead.eventDate ? daysBetween(lead.eventDate, input.now) : null;

    candidates.push({
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      priority: lead.priority,
      eventType: lead.eventType,
      eventDate: lead.eventDate,
      eventLocation: lead.eventLocation,
      budget: lead.budget,
      preferredLocale: lead.preferredLocale,
      daysSinceCreation,
      daysSinceContact: classification.daysSinceContact,
      daysSinceActivity: classification.daysSinceActivity,
      daysUntilEvent,
      reason: classification.reason,
      reasonLabel: REASON_LABELS[classification.reason],
      reengagementPriority: classification.priority,
      score: classification.score,
      suggestedChannels,
      suggestedSubject: subject,
      suggestedMessage: message,
      whatsappUrl: buildWhatsappUrl(lead.phone, message),
      mailtoUrl: buildMailtoUrl(lead.email, subject, message),
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadReengagementCandidates(
  now: Date = new Date(),
  limit = 50
): Promise<ReengagementCandidate[]> {
  const cutoff = new Date(now.getTime() - EXCLUDE_STALE_DAYS * DAY_MS);

  const rows = await prisma.lead.findMany({
    where: {
      status: { notIn: ['WON', 'LOST'] },
      updatedAt: { gte: cutoff },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      priority: true,
      eventType: true,
      eventDate: true,
      eventLocation: true,
      budget: true,
      preferredLocale: true,
      createdAt: true,
      updatedAt: true,
      contactedAt: true,
      activities: {
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 500,
  });

  const leads: ReengagementLeadInput[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    status: r.status as string,
    priority: r.priority as string,
    eventType: r.eventType as string,
    eventDate: r.eventDate,
    eventLocation: r.eventLocation,
    budget: r.budget,
    preferredLocale: r.preferredLocale,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    contactedAt: r.contactedAt,
    lastActivityAt: r.activities[0]?.createdAt ?? null,
  }));

  return generateReengagementCandidates({ leads, now }).slice(0, limit);
}
