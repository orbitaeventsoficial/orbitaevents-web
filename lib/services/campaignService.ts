// lib/services/campaignService.ts
// ═══════════════════════════════════════════════════════════════════════════
// CAMPAIGN SERVICE
// Genera campanyes de comunicació massiva basades en segments CRM.
// Part pura (generateCampaigns) + wrapper (loadCampaigns) que carrega dades.
// No requereix model DB — genera campanyes draft per executar manualment.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { CUSTOMER_SEGMENTS, CUSTOMER_DORMANT_MONTHS } from '@/lib/constants';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type CampaignType =
  | 'REACTIVATION'
  | 'UPSELL'
  | 'SEASONAL'
  | 'REVIEW_REQUEST'
  | 'REFERRAL'
  | 'LOYALTY';

export type CampaignChannel = 'email' | 'whatsapp';

export type Campaign = {
  id: string;
  type: CampaignType;
  name: string;
  description: string;
  segment: string;
  audienceSize: number;
  channel: CampaignChannel;
  subject: string;
  bodyTemplate: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedImpact: string;
};

export type CampaignInput = {
  segments: {
    dormant: number;
    atRisk: number;
    vip: number;
    highValue: number;
    firstTime: number;
    returning: number;
    withEvents: number;
    recentMonth: number;
    total: number;
  };
  now: Date;
};

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

function getMonthName(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: 'long' });
}

function getSeasonalHook(month: number): { event: string; hook: string } | null {
  // month és 0-indexed (0=gen, 3=abril, 11=des)
  if (month >= 3 && month <= 5) return { event: 'temporada de comunions i bodes', hook: 'primavera-estiu' };
  if (month >= 8 && month <= 9) return { event: 'temporada de tardor i festes corporatives', hook: 'tardor' };
  if (month === 10 || month === 11) return { event: 'festes de Nadal i Cap d\'Any', hook: 'nadal' };
  if (month === 0 || month === 1) return { event: 'temporada de Carnaval i Sant Valentí', hook: 'hivern' };
  return null;
}

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function generateCampaigns(input: CampaignInput): Campaign[] {
  const campaigns: Campaign[] = [];
  const month = input.now.getMonth();
  const monthName = getMonthName(input.now, 'ca-ES');
  const seasonal = getSeasonalHook(month);

  // ── 1. REACTIVATION — dormants ───────────────────────────────────────
  if (input.segments.dormant > 0) {
    campaigns.push({
      id: 'campaign:reactivation-dormant',
      type: 'REACTIVATION',
      name: `Reactivació clients dormants (${monthName})`,
      description: `Contacta ${input.segments.dormant} clients que fa +${CUSTOMER_DORMANT_MONTHS} mesos sense activitat.`,
      segment: 'Dormants',
      audienceSize: input.segments.dormant,
      channel: 'whatsapp',
      urgency: 'HIGH',
      subject: 'Et trobem a faltar!',
      bodyTemplate: `Hola {nom}!\n\nFa temps que no coincidim i volíem saludar-te. Si tens algun esdeveniment a la vista, ens encantaria tornar-te a acompanyar.\n\nContacta'ns quan vulguis.\n\nÒrbita Events`,
      estimatedImpact: `Recuperar ~${Math.max(1, Math.round(input.segments.dormant * 0.15))} clients`,
    });
  }

  // ── 2. REACTIVATION — at risk ────────────────────────────────────────
  if (input.segments.atRisk > 0) {
    campaigns.push({
      id: 'campaign:reactivation-at-risk',
      type: 'REACTIVATION',
      name: `Atenció clients en risc (${monthName})`,
      description: `${input.segments.atRisk} clients amb health score baix. Contacta'ls per prevenir la pèrdua.`,
      segment: 'En risc',
      audienceSize: input.segments.atRisk,
      channel: 'email',
      urgency: 'HIGH',
      subject: 'Volem assegurar-nos que tot va bé',
      bodyTemplate: `Hola {nom},\n\nFa un temps que no estem en contacte i volem saber com estàs. Si tens algun projecte o celebració propera, estarem encantats d'ajudar-te.\n\nGràcies per confiar en nosaltres,\nÒrbita Events`,
      estimatedImpact: `Prevenir la pèrdua de ~${Math.max(1, Math.round(input.segments.atRisk * 0.2))} clients`,
    });
  }

  // ── 3. UPSELL — first-time → returning ──────────────────────────────
  if (input.segments.firstTime > 0) {
    campaigns.push({
      id: 'campaign:upsell-first-time',
      type: 'UPSELL',
      name: `Upsell primera reserva → recurrent (${monthName})`,
      description: `${input.segments.firstTime} clients amb 1 sol event. Incentiva la repetició amb oferta exclusiva.`,
      segment: 'Primer event',
      audienceSize: input.segments.firstTime,
      channel: 'email',
      urgency: 'MEDIUM',
      subject: 'Fem una segona? Tenim quelcom especial per tu',
      bodyTemplate: `Hola {nom},\n\nGràcies per confiar en nosaltres pel teu primer event. Esperem que fos increïble!\n\nVolem premiar la teva confiança: si reserves el teu pròxim event dins dels pròxims 60 dies, tindràs un 10% de descompte directe.\n\nParlem?\nÒrbita Events`,
      estimatedImpact: `Convertir ~${Math.max(1, Math.round(input.segments.firstTime * 0.1))} en recurrents`,
    });
  }

  // ── 4. LOYALTY — VIP recognition ─────────────────────────────────────
  if (input.segments.vip > 0) {
    campaigns.push({
      id: 'campaign:loyalty-vip',
      type: 'LOYALTY',
      name: `Reconeixement VIP (${monthName})`,
      description: `${input.segments.vip} clients VIP mereixen atenció especial. Missatge de fidelització.`,
      segment: 'VIP',
      audienceSize: input.segments.vip,
      channel: 'whatsapp',
      urgency: 'LOW',
      subject: 'Gràcies per ser part especial d\'Òrbita',
      bodyTemplate: `Hola {nom} 💜\n\nEns fa molta il·lusió tenir-te com a client VIP. Gràcies per confiar en nosaltres en tants moments importants.\n\nCom a detall, tens prioritat absoluta en dates i un descompte del 15% en el teu pròxim event.\n\nParlem aviat!\nÒrbita Events`,
      estimatedImpact: `Reforçar fidelitat de ${input.segments.vip} VIPs`,
    });
  }

  // ── 5. REFERRAL — returning clients ──────────────────────────────────
  if (input.segments.returning > 0) {
    campaigns.push({
      id: 'campaign:referral-returning',
      type: 'REFERRAL',
      name: `Programa referits — clients recurrents (${monthName})`,
      description: `${input.segments.returning} clients recurrents: el millor canal de captació. Demana'ls que recomanin.`,
      segment: 'Recurrents',
      audienceSize: input.segments.returning,
      channel: 'email',
      urgency: 'MEDIUM',
      subject: 'Tens algú que vulgui una festa increïble?',
      bodyTemplate: `Hola {nom},\n\nSabem que has viscut bons moments amb nosaltres i ens encantaria arribar a més gent com tu.\n\nSi coneixes algú que busqui DJ, il·luminació o tematització per un event, passa'ns el seu contacte. Com a agraïment, tots dos tindreu un 10% de descompte.\n\nGràcies!\nÒrbita Events`,
      estimatedImpact: `Captar ~${Math.max(1, Math.round(input.segments.returning * 0.08))} leads nous via referral`,
    });
  }

  // ── 6. REVIEW_REQUEST — recent clients ───────────────────────────────
  if (input.segments.recentMonth > 0) {
    campaigns.push({
      id: 'campaign:review-recent',
      type: 'REVIEW_REQUEST',
      name: `Recol·lecció de ressenyes (${monthName})`,
      description: `${input.segments.recentMonth} clients nous aquest mes. Demana opinió per alimentar la prova social.`,
      segment: 'Nous darrer mes',
      audienceSize: input.segments.recentMonth,
      channel: 'email',
      urgency: 'MEDIUM',
      subject: 'Com va ser la teva experiència amb Òrbita Events?',
      bodyTemplate: `Hola {nom},\n\nGràcies per confiar en nosaltres recentment. La teva opinió ens ajuda a millorar i a arribar a més gent.\n\nPodries dedicar-nos 2 minuts per deixar la teva valoració? Ens faria moltíssima il·lusió.\n\n{link_ressenya}\n\nGràcies!\nÒrbita Events`,
      estimatedImpact: `Obtenir ~${Math.max(1, Math.round(input.segments.recentMonth * 0.25))} ressenyes noves`,
    });
  }

  // ── 7. SEASONAL — si és temporada rellevant ──────────────────────────
  if (seasonal && input.segments.total > 0) {
    campaigns.push({
      id: `campaign:seasonal-${seasonal.hook}`,
      type: 'SEASONAL',
      name: `Campanya de temporada: ${seasonal.event}`,
      description: `Aprofita la ${seasonal.event} per contactar tota la base de clients.`,
      segment: 'Tots els clients amb events',
      audienceSize: input.segments.withEvents,
      channel: 'email',
      urgency: 'MEDIUM',
      subject: `Prepara la teva festa per la ${seasonal.event}!`,
      bodyTemplate: `Hola {nom},\n\nS'acosta la ${seasonal.event} i volem assegurar-nos que tens la millor festa possible. Reserva aviat per garantir la teva data — les millors volen ràpid!\n\nMira els nostres packs: orbita.events/packs\n\nÒrbita Events`,
      estimatedImpact: `Impulsar reserves de temporada ${seasonal.hook}`,
    });
  }

  return campaigns;
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadCampaigns(now: Date = new Date()): Promise<Campaign[]> {
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const [total, withEvents, recentMonth, vip, dormant, atRisk, highValue, firstTime, returning] =
    await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { totalEvents: { gt: 0 } } }),
      prisma.customer.count({ where: { createdAt: { gt: oneMonthAgo } } }),
      prisma.customer.count({ where: { lifecycleStage: 'VIP' } }),
      prisma.customer.count({ where: { lifecycleStage: 'DORMANT' } }),
      prisma.customer.count({ where: { healthScore: { lte: 40 } } }),
      prisma.customer.count({ where: { totalSpent: { gte: 2000 } } }),
      prisma.customer.count({ where: { lifecycleStage: 'FIRST_TIME' } }),
      prisma.customer.count({ where: { lifecycleStage: 'RETURNING' } }),
    ]);

  return generateCampaigns({
    segments: {
      dormant,
      atRisk,
      vip,
      highValue,
      firstTime,
      returning,
      withEvents,
      recentMonth,
      total,
    },
    now,
  });
}
