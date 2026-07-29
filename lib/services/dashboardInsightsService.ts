/**
 * dashboardInsightsService.ts — Insights narratius per al dashboard
 *
 * Analitza les dades del dashboard i genera missatges intel·ligents en català.
 */
import { formatCurrency } from '@/lib/constants';

export interface DashboardInsight {
  id: string;
  icon: string;
  text: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  priority: number; // 1 = highest
}

interface InsightInput {
  leadsThisMonth: number;
  staleLeadsCount: number;
  hotLeadsCount: number;
  conversionRate: number;
  bookingsConfirmed: number;
  bookingsThisMonth: number;
  avgMarginPct: number;
  cashFlowNet30: number;
  pipelineWeighted30: number;
  pendingPayments: number;
  revenueThisMonth: number;
  revenueTarget: number;
  nextEvent: {
    daysUntil: number;
    clientName: string;
    depositPaid: boolean;
    remainingPaid: boolean;
    outstandingAmount?: number;
  } | null;
  inventoryMaintenance: number;
  inventoryBroken: number;
  // Week-over-week comparison
  leadsLastWeek?: number;
  leadsThisWeek?: number;
}

export function generateDashboardInsights(input: InsightInput, now: Date = new Date()): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  // Leads calents sense resposta
  if (input.staleLeadsCount > 0) {
    insights.push({
      id: 'stale-leads',
      icon: '🔥',
      text: `Tens ${input.staleLeadsCount} lead${input.staleLeadsCount > 1 ? 's' : ''} sense resposta des de fa >48h. Respon aviat!`,
      type: 'danger',
      priority: 1,
    });
  }

  // Leads calents
  if (input.hotLeadsCount > 0) {
    insights.push({
      id: 'hot-leads',
      icon: '⚡',
      text: `${input.hotLeadsCount} lead${input.hotLeadsCount > 1 ? 's' : ''} calent${input.hotLeadsCount > 1 ? 's' : ''} — alta probabilitat de tancar!`,
      type: 'success',
      priority: 2,
    });
  }

  // Comparativa setmanal
  if (input.leadsThisWeek !== undefined && input.leadsLastWeek !== undefined && input.leadsLastWeek > 0) {
    const pctChange = Math.round(((input.leadsThisWeek - input.leadsLastWeek) / input.leadsLastWeek) * 100);
    if (pctChange > 15) {
      insights.push({
        id: 'leads-up',
        icon: '📈',
        text: `+${pctChange}% leads vs la setmana passada. Bon ritme!`,
        type: 'success',
        priority: 3,
      });
    } else if (pctChange < -20) {
      insights.push({
        id: 'leads-down',
        icon: '📉',
        text: `${pctChange}% leads vs la setmana passada. Revisa els canals.`,
        type: 'warning',
        priority: 3,
      });
    }
  }

  // Conversió
  if (input.conversionRate > 0 && input.conversionRate < 15) {
    insights.push({
      id: 'low-conversion',
      icon: '🎯',
      text: `Conversió al ${Math.round(input.conversionRate)}% — per sota de l'objectiu (15%). Revisa els pressupostos.`,
      type: 'warning',
      priority: 4,
    });
  } else if (input.conversionRate >= 25) {
    insights.push({
      id: 'high-conversion',
      icon: '🏆',
      text: `Conversió al ${Math.round(input.conversionRate)}% — excel·lent!`,
      type: 'success',
      priority: 5,
    });
  }

  // Pagaments pendents
  if (input.pendingPayments > 500) {
    insights.push({
      id: 'pending-payments',
      icon: '💰',
      text: `${formatCurrency(input.pendingPayments)} pendents de cobrar. Envia recordatoris!`,
      type: 'warning',
      priority: 2,
    });
  }

  // Marge baix
  if (input.avgMarginPct > 0 && input.avgMarginPct < 25) {
    insights.push({
      id: 'low-margin',
      icon: '⚠️',
      text: `Marge mitjà al ${Math.round(input.avgMarginPct)}% — revisa els costos o puja preus.`,
      type: 'warning',
      priority: 3,
    });
  }

  // Pròxim event
  if (input.nextEvent) {
    const hasPendingPayment = typeof input.nextEvent.outstandingAmount === 'number'
      ? input.nextEvent.outstandingAmount > 0
      : !input.nextEvent.remainingPaid;

    if (input.nextEvent.daysUntil <= 3 && hasPendingPayment) {
      insights.push({
        id: 'next-event-payment',
        icon: '🚨',
        text: `Event de ${input.nextEvent.clientName} en ${input.nextEvent.daysUntil} dies — falta cobrar!`,
        type: 'danger',
        priority: 1,
      });
    } else if (input.nextEvent.daysUntil <= 7) {
      insights.push({
        id: 'next-event-soon',
        icon: '📅',
        text: `Pròxim event: ${input.nextEvent.clientName} en ${input.nextEvent.daysUntil} dies.`,
        type: 'info',
        priority: 4,
      });
    }
  }

  // Objectiu mensual
  if (input.revenueTarget > 0) {
    const pct = Math.round((input.revenueThisMonth / input.revenueTarget) * 100);
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const expectedPct = Math.round((dayOfMonth / daysInMonth) * 100);

    if (pct >= expectedPct + 10) {
      insights.push({
        id: 'revenue-ahead',
        icon: '🚀',
        text: `Facturació al ${pct}% de l'objectiu — per sobre del ritme esperat!`,
        type: 'success',
        priority: 4,
      });
    } else if (pct < expectedPct - 15 && dayOfMonth > 10) {
      insights.push({
        id: 'revenue-behind',
        icon: '📊',
        text: `Facturació al ${pct}% de l'objectiu (esperit: ${expectedPct}%). Cal accelerar.`,
        type: 'warning',
        priority: 3,
      });
    }
  }

  // Inventari amb problemes
  if (input.inventoryBroken > 0) {
    insights.push({
      id: 'inventory-broken',
      icon: '🔧',
      text: `${input.inventoryBroken} equip${input.inventoryBroken > 1 ? 's' : ''} avariat${input.inventoryBroken > 1 ? 's' : ''} — repara'ls abans del pròxim event.`,
      type: 'danger',
      priority: 2,
    });
  }

  // Cash flow negatiu
  if (input.cashFlowNet30 < 0) {
    insights.push({
      id: 'cash-flow-negative',
      icon: '💸',
      text: `Flux de caixa projectat negatiu (${formatCurrency(input.cashFlowNet30)}). Revisa despeses.`,
      type: 'danger',
      priority: 1,
    });
  }

  // Sort by priority
  return insights.sort((a, b) => a.priority - b.priority).slice(0, 5);
}
