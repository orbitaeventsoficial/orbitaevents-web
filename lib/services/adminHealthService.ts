import { prisma } from '@/lib/prisma';
import {
  ADMIN_HEALTH_ACTIVE_BOOKING_STATUSES,
  ADMIN_HEALTH_ACTIVE_LEAD_STATUSES,
  getAdminPostEventCronSettingKeys,
  readAdminPostEventCronSetting,
} from '@/lib/constants/admin';
import { isImapConfigured, isSmtpConfigured } from '@/lib/env';
import { getFinanceAlertsSummary } from '@/lib/services/financeAlertsService';
import { computePackPricingHealth, getPackPricingModelConfigEditable } from '@/lib/services/packPricingHealth';
import { calculateCostPerHour } from '@/lib/inventory-utils';
import { bookingOutstandingBreakdown } from '@/lib/payment-status';

export type AdminHealthScope = 'system' | 'finances' | 'operations' | 'catalog' | 'data';
export type AdminHealthStatus = 'critical' | 'warning' | 'ok';

export interface AdminHealthItem {
  id: string;
  scope: AdminHealthScope;
  status: AdminHealthStatus;
  title: string;
  reason: string;
  impact: string;
  actionLabel: string;
  href: string;
  count?: number;
}

export interface AdminHealthSection {
  scope: AdminHealthScope;
  label: string;
  description: string;
  items: AdminHealthItem[];
  counts: {
    critical: number;
    warning: number;
    ok: number;
  };
}

export interface AdminHealthSnapshot {
  summary: {
    critical: number;
    warning: number;
    ok: number;
    total: number;
  };
  sections: AdminHealthSection[];
  generatedAt: string;
}

const SECTION_META: Record<AdminHealthScope, { label: string; description: string }> = {
  system: {
    label: 'Sistema',
    description: 'Integracions, crons i automatitzacions que mantenen viu el CRM.',
  },
  finances: {
    label: 'Finances',
    description: 'Marge, configuració econòmica i avisos que poden tocar caixa o rendibilitat.',
  },
  operations: {
    label: 'Operacions',
    description: 'Leads, reserves i tasques que convé moure abans que es refredin o vencin.',
  },
  catalog: {
    label: 'Catàleg',
    description: 'Inventari, packs i extres que alimenten costos, preus i semàfors.',
  },
  data: {
    label: 'Dades',
    description: 'Qualitat de les dades perquè el sistema no calculi sobre informació coixa.',
  },
};

const CRON_MAX_AGE_MS = 48 * 60 * 60 * 1000;
const UPCOMING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const EXTRA_HEALTH_MARGIN_WARNING_PCT = 0.35;
const PAYMENT_DUE_SOON_DAYS = 7;
const INVENTORY_LIFE_WARNING_PCT = 0.80;
const INVENTORY_LIFE_CRITICAL_PCT = 0.95;

function countStatuses(items: AdminHealthItem[]) {
  return {
    critical: items.filter((item) => item.status === 'critical').length,
    warning: items.filter((item) => item.status === 'warning').length,
    ok: items.filter((item) => item.status === 'ok').length,
  };
}

function createOkItem(scope: AdminHealthScope): AdminHealthItem {
  const okCopy: Record<AdminHealthScope, Omit<AdminHealthItem, 'id' | 'scope' | 'status'>> = {
    system: {
      title: 'Sistema estable',
      reason: 'No hi ha incidències obertes de crons, correu o integracions bàsiques.',
      impact: 'La base tècnica del dia a dia està sota control.',
      actionLabel: 'Veure crons',
      href: '/admin/crons',
    },
    finances: {
      title: 'Finances sota control',
      reason: 'No hi ha alertes econòmiques obertes que demanin acció urgent.',
      impact: 'La lectura financera principal és prou sana.',
      actionLabel: 'Obrir economia',
      href: '/admin/economia',
    },
    operations: {
      title: 'Operativa al dia',
      reason: 'No hi ha focus urgents en leads, reserves o tasques vençudes.',
      impact: 'La feina diària no mostra colls d’ampolla greus.',
      actionLabel: 'Obrir operacions',
      href: '/admin/bookings',
    },
    catalog: {
      title: 'Catàleg prou sa',
      reason: 'Inventari, packs i extres no mostren incidències greus obertes.',
      impact: 'El sistema pot calcular millor costos i preus.',
      actionLabel: 'Revisar catàleg',
      href: '/admin/pricing',
    },
    data: {
      title: 'Dades consistents',
      reason: 'No s’han detectat buits greus en les dades que governen el sistema.',
      impact: 'Els indicadors principals parteixen d’una base fiable.',
      actionLabel: 'Revisar dades',
      href: '/admin/clientes',
    },
  };

  return {
    id: `${scope}-ok`,
    scope,
    status: 'ok',
    ...okCopy[scope],
  };
}

function parseIsoDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sanitizeAlertCount(value?: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Retorna la forma singular o plural catalana segons el comptador. Úsa-ho
 * amb frases completes: `${n} ${plural(n, 'tasca oberta', 'tasques obertes')}`.
 */
function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

function formatDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}


export async function getAdminHealthSnapshot(): Promise<AdminHealthSnapshot> {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - CRON_MAX_AGE_MS);
  const upcomingDateLimit = new Date(now.getTime() + UPCOMING_WINDOW_MS);
  const paymentDueSoonLimit = addDays(now, PAYMENT_DUE_SOON_DAYS);
  const upcomingBookingsHref = `/admin/bookings?status=CONFIRMED&fromDate=${formatDateParam(now)}&toDate=${formatDateParam(upcomingDateLimit)}`;
  const overduePaymentsHref = '/admin/bookings?payment=overdue';
  const dueSoonPaymentsHref = '/admin/bookings?payment=due-soon';
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [
    settingsRows,
    financeAlerts,
    inventoryCriticalCount,
    inventoryZeroValueCount,
    inventoryBlockedCount,
    inventoryLowStockRows,
    extrasWithoutCostCount,
    extrasZeroPriceCount,
    extraHealthRows,
    hotStaleLeadsCount,
    overdueTasksCount,
    customersWithoutEmailCount,
    bookingsTotalZeroCount,
    activeBookings,
    packPricingConfig,
    activePacks,
    inventoryLifecycleRows,
    inventoryUnusedCount,
  ] = await Promise.all([
    prisma.setting.findMany({
      where: {
        key: {
          in: [
            ...getAdminPostEventCronSettingKeys(),
            'automation.commercial.lastRun',
            'alerts.finance.autofixFailureCount',
            'alerts.system.autofixFailureCount',
          ],
        },
      },
      select: { key: true, value: true },
    }),
    getFinanceAlertsSummary().catch(() => null),
    prisma.inventoryItem.count({
      where: {
        status: { not: 'RETIRED' },
        AND: [
          {
            OR: [{ purchasePrice: null }, { expectedLifeHours: null }],
          },
          {
            OR: [
              { packItems: { some: {} } },
              { extraItems: { some: {} } },
            ],
          },
        ],
      },
    }),
    prisma.inventoryItem.count({
      where: {
        status: { not: 'RETIRED' },
        value: 0,
      },
    }),
    prisma.inventoryItem.count({
      where: {
        status: { in: ['BROKEN', 'MAINTENANCE'] },
        OR: [
          { packItems: { some: {} } },
          { extraItems: { some: {} } },
          { bookingItems: { some: {} } },
        ],
      },
    }),
    prisma.inventoryItem.findMany({
      where: {
        status: { not: 'RETIRED' },
        minStock: { not: null },
        stockQuantity: { not: null },
      },
      select: {
        id: true,
        stockQuantity: true,
        minStock: true,
      },
    }),
    prisma.extra.count({
      where: {
        isActive: true,
        costPerUnit: null,
        bookingExtras: { some: {} },
      },
    }),
    prisma.extra.count({
      where: {
        isActive: true,
        priceType: { not: 'ON_REQUEST' },
        price: { lte: 0 },
        bookingExtras: { some: {} },
      },
    }),
    prisma.extra.findMany({
      where: {
        isActive: true,
        costPerUnit: { not: null },
        priceType: { not: 'ON_REQUEST' },
        bookingExtras: { some: {} },
      },
      select: {
        id: true,
        slug: true,
        price: true,
        costPerUnit: true,
      },
    }),
    prisma.lead.count({
      where: {
        status: { in: [...ADMIN_HEALTH_ACTIVE_LEAD_STATUSES] },
        priority: { in: ['HIGH', 'URGENT'] },
        createdAt: { lt: twoDaysAgo },
      },
    }),
    prisma.task.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        dueDate: { lt: startOfToday },
      },
    }),
    prisma.customer.count({ where: { email: '' } }),
    prisma.booking.count({
      where: {
        total: 0,
        status: { not: 'CANCELLED' },
      },
    }),
    prisma.booking.findMany({
      where: {
        status: { in: [...ADMIN_HEALTH_ACTIVE_BOOKING_STATUSES] },
        eventDate: { gte: now },
      },
      select: {
        id: true,
        eventDate: true,
        total: true,
        depositAmount: true,
        remainingAmount: true,
        depositPaid: true,
        remainingPaid: true,
        cashAmount: true,
      },
    }),
    getPackPricingModelConfigEditable().catch(() => null),
    prisma.pack.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        service: true,
        price: true,
        extraHourPrice: true,
        djHours: true,
        minGuests: true,
        maxGuests: true,
        soundWatts: true,
        inventory: {
          select: {
            quantity: true,
            item: {
              select: {
                purchasePrice: true,
                expectedLifeHours: true,
              },
            },
          },
        },
      },
    }),
    prisma.inventoryItem.findMany({
      where: {
        status: { not: 'RETIRED' },
        expectedLifeHours: { not: null, gt: 0 },
      },
      select: {
        id: true,
        expectedLifeHours: true,
        usageHistory: { select: { hoursUsed: true } },
      },
    }),
    prisma.inventoryItem.count({
      where: {
        status: { not: 'RETIRED' },
        purchasePrice: { gt: 0 },
        packItems: { none: {} },
        extraItems: { none: {} },
        bookingItems: { none: {} },
      },
    }),
  ]);

  const settings = settingsRows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  const inventoryLowStockCount = inventoryLowStockRows.filter((item) => {
    const stock = typeof item.stockQuantity === 'number' ? item.stockQuantity : null;
    const min = typeof item.minStock === 'number' ? item.minStock : null;
    return stock !== null && min !== null && stock <= min;
  }).length;

  let overdueDepositCount = 0;
  let overdueRemainingCount = 0;
  let dueSoonDepositCount = 0;
  let dueSoonRemainingCount = 0;
  let unpaidUpcomingBookingsCount = 0;

  for (const booking of activeBookings) {
    const paymentBreakdown = bookingOutstandingBreakdown(booking);
    const depositDueAt = addDays(new Date(booking.eventDate), -30);
    const remainingDueAt = addDays(new Date(booking.eventDate), -7);

    if (new Date(booking.eventDate) <= upcomingDateLimit && paymentBreakdown.depositAmount > 0) {
      unpaidUpcomingBookingsCount += 1;
    }

    if (paymentBreakdown.depositAmount > 0) {
      if (depositDueAt < now) {
        overdueDepositCount += 1;
      } else if (depositDueAt <= paymentDueSoonLimit) {
        dueSoonDepositCount += 1;
      }
    }

    if (paymentBreakdown.remainingAmount > 0) {
      if (remainingDueAt < now) {
        overdueRemainingCount += 1;
      } else if (remainingDueAt <= paymentDueSoonLimit) {
        dueSoonRemainingCount += 1;
      }
    }
  }

  const systemItems: AdminHealthItem[] = [];
  const financeItems: AdminHealthItem[] = [];
  const operationsItems: AdminHealthItem[] = [];
  const catalogItems: AdminHealthItem[] = [];
  const dataItems: AdminHealthItem[] = [];

  const emailCronLastRun = parseIsoDate(readAdminPostEventCronSetting(settings, 'lastRun'));
  if (!emailCronLastRun || emailCronLastRun.getTime() < twoDaysAgo.getTime()) {
    systemItems.push({
      id: 'system-email-cron-stale',
      scope: 'system',
      status: 'warning',
      title: 'Cron de correu retardat',
      reason: 'Fa massa temps que no corre el cron principal de correus.',
      impact: 'Automatitzacions i recordatoris poden quedar-se enrere.',
      actionLabel: 'Revisar crons',
      href: '/admin/crons',
    });
  }

  const automationCronLastRun = parseIsoDate(settings['automation.commercial.lastRun']);
  if (!automationCronLastRun || automationCronLastRun.getTime() < twoDaysAgo.getTime()) {
    systemItems.push({
      id: 'system-commercial-cron-stale',
      scope: 'system',
      status: 'warning',
      title: 'Automatització comercial retardada',
      reason: 'El cron comercial no sembla fresc.',
      impact: 'Scoring, seguiments i avisos comercials poden quedar desfasats.',
      actionLabel: 'Obrir crons',
      href: '/admin/crons',
    });
  }

  if (!isSmtpConfigured()) {
    systemItems.push({
      id: 'system-smtp-missing',
      scope: 'system',
      status: 'warning',
      title: 'SMTP pendent',
      reason: 'La sortida de correu no està completament configurada.',
      impact: 'Correus manuals o automàtics poden no sortir.',
      actionLabel: 'Configurar correu',
      href: '/admin/settings/integrations',
    });
  }

  if (!isImapConfigured()) {
    systemItems.push({
      id: 'system-imap-missing',
      scope: 'system',
      status: 'warning',
      title: 'Safata IMAP pendent',
      reason: 'La recepció de correu no està connectada.',
      impact: 'La safata d’entrades no tindrà visió completa del que entra.',
      actionLabel: 'Connectar safata',
      href: '/admin/inbox/settings',
    });
  }

  const systemAutofixFailures = sanitizeAlertCount(settings['alerts.system.autofixFailureCount']);
  if (systemAutofixFailures > 0) {
    systemItems.push({
      id: 'system-autofix-open',
      scope: 'system',
      status: 'critical',
      title: 'Autofix del sistema amb incidències',
      reason: `Hi ha ${systemAutofixFailures} incidència${systemAutofixFailures > 1 ? 's' : ''} oberta${systemAutofixFailures > 1 ? 's' : ''} detectada${systemAutofixFailures > 1 ? 'es' : ''} per l’autofix.`,
      impact: 'El sistema ja s’ha intentat protegir i encara queden problemes oberts.',
      actionLabel: 'Veure scripts',
      href: '/admin/scripts',
      count: systemAutofixFailures,
    });
  }

  const financeAutofixFailures = sanitizeAlertCount(settings['alerts.finance.autofixFailureCount']);
  if (financeAutofixFailures > 0) {
    financeItems.push({
      id: 'finance-autofix-open',
      scope: 'finances',
      status: 'critical',
      title: 'Autofix financer amb incidències',
      reason: `Hi ha ${financeAutofixFailures} error${financeAutofixFailures > 1 ? 's' : ''} financer${financeAutofixFailures > 1 ? 's' : ''} oberts.`,
      impact: 'El model econòmic pot estar mostrant dades menys fiables del que toca.',
      actionLabel: 'Obrir economia',
      href: '/admin/economia',
      count: financeAutofixFailures,
    });
  }

  if (financeAlerts?.breakdown) {
    const criticalFinanceCount = financeAlerts.breakdown.criticalCount + financeAlerts.breakdown.autofixFailureCount + financeAlerts.breakdown.systemAutofixFailureCount;
    const warningFinanceCount = financeAlerts.breakdown.lowMarginRiskCount + financeAlerts.breakdown.packPricingAlertsCount;

    if (criticalFinanceCount > 0) {
      financeItems.push({
        id: 'finance-critical-summary',
        scope: 'finances',
        status: 'critical',
        title: 'Configuració econòmica delicada',
        reason: `S’han detectat ${criticalFinanceCount} punts crítics en configuració o salut econòmica.`,
        impact: 'Marge, preu recomanat o lectura financera poden quedar tocats.',
        actionLabel: 'Revisar economia',
        href: '/admin/economia',
        count: criticalFinanceCount,
      });
    }

    if (warningFinanceCount > 0) {
      financeItems.push({
        id: 'finance-warning-summary',
        scope: 'finances',
        status: 'warning',
        title: 'Hi ha marges que convé revisar',
        reason: `${warningFinanceCount} avisos oberts entre marges baixos i packs amb preu divergent.`,
        impact: 'Pots estar venent bé de cara fora però curt de marge per dins.',
        actionLabel: 'Obrir preus',
        href: '/admin/pricing',
        count: warningFinanceCount,
      });
    }
  }

  if (hotStaleLeadsCount > 0) {
    operationsItems.push({
      id: 'operations-hot-leads-stale',
      scope: 'operations',
      status: 'critical',
      title: 'Leads calents sense avançar',
      reason: `${hotStaleLeadsCount} lead${hotStaleLeadsCount > 1 ? 's' : ''} d’alta prioritat porta${hotStaleLeadsCount > 1 ? 'en' : ''} massa temps sense resposta clara.`,
      impact: 'És negoci calent que es pot refredar.',
      actionLabel: 'Obrir entrades',
      href: '/admin/leads',
      count: hotStaleLeadsCount,
    });
  }

  if (unpaidUpcomingBookingsCount > 0) {
    operationsItems.push({
      id: 'operations-upcoming-unpaid',
      scope: 'operations',
      status: 'warning',
      title: 'Reserves properes sense paga i senyal',
      reason: `${unpaidUpcomingBookingsCount} ${plural(unpaidUpcomingBookingsCount, 'reserva propera encara no té', 'reserves properes encara no tenen')} dipòsit.`,
      impact: 'Tens feina a calendari amb caixa encara sense protegir.',
      actionLabel: 'Revisar reserves',
      href: upcomingBookingsHref,
      count: unpaidUpcomingBookingsCount,
    });
  }

  const overduePaymentsCount = overdueDepositCount + overdueRemainingCount;
  if (overduePaymentsCount > 0) {
    operationsItems.push({
      id: 'operations-bookings-payments-overdue',
      scope: 'operations',
      status: 'critical',
      title: 'Cobraments de reserves vençuts',
      reason: `${overdueDepositCount} ${plural(overdueDepositCount, 'bestreta', 'bestretes')} i ${overdueRemainingCount} ${plural(overdueRemainingCount, 'saldo', 'saldos')} ja haurien d’estar cobrats.`,
      impact: 'No és només caixa pendent: és reserva activa treballant sense el cobrament que tocava.',
      actionLabel: 'Obrir reserves',
      href: overduePaymentsHref,
      count: overduePaymentsCount,
    });
  }

  const dueSoonPaymentsCount = dueSoonDepositCount + dueSoonRemainingCount;
  if (dueSoonPaymentsCount > 0) {
    operationsItems.push({
      id: 'operations-bookings-payments-due-soon',
      scope: 'operations',
      status: 'warning',
      title: 'Cobraments a punt de vèncer',
      reason: `${dueSoonDepositCount} ${plural(dueSoonDepositCount, 'bestreta', 'bestretes')} i ${dueSoonRemainingCount} ${plural(dueSoonRemainingCount, 'saldo', 'saldos')} vencen en els pròxims 7 dies.`,
      impact: 'Si no es mou ara, el problema financer passarà a ser urgent molt aviat.',
      actionLabel: 'Preparar seguiment',
      href: dueSoonPaymentsHref,
      count: dueSoonPaymentsCount,
    });
  }

  if (overdueTasksCount > 0) {
    operationsItems.push({
      id: 'operations-overdue-tasks',
      scope: 'operations',
      status: 'warning',
      title: 'Tasques vençudes',
      reason: `Hi ha ${overdueTasksCount} ${plural(overdueTasksCount, 'tasca oberta', 'tasques obertes')} fora de termini.`,
      impact: 'La feina diària perd ritme i es poden encadenar petits colls d’ampolla.',
      actionLabel: 'Obrir tasques',
      href: '/admin/tasks',
      count: overdueTasksCount,
    });
  }

  if (inventoryCriticalCount > 0) {
    catalogItems.push({
      id: 'catalog-inventory-critical',
      scope: 'catalog',
      status: 'critical',
      title: 'Inventari amb dades econòmiques incompletes',
      reason: `${inventoryCriticalCount} peça${inventoryCriticalCount > 1 ? 's' : ''} usada${inventoryCriticalCount > 1 ? 'es' : ''} a packs o extres no té${inventoryCriticalCount > 1 ? 'nen' : ''} prou dades de cost.`,
      impact: 'Amortització, packs, extres i marges poden quedar maquillats.',
      actionLabel: 'Revisar inventari',
      href: '/admin/inventory?health=missing-cost',
      count: inventoryCriticalCount,
    });
  }

  if (inventoryBlockedCount > 0) {
    catalogItems.push({
      id: 'catalog-inventory-blocked',
      scope: 'catalog',
      status: 'critical',
      title: 'Inventari tocat en ús real',
      reason: `${inventoryBlockedCount} peça${inventoryBlockedCount > 1 ? 's' : ''} està${inventoryBlockedCount > 1 ? 'n' : ''} avariada${inventoryBlockedCount > 1 ? 'es' : ''} o en manteniment i segueix${inventoryBlockedCount > 1 ? 'en' : ''} vinculada${inventoryBlockedCount > 1 ? 'es' : ''} a packs, extres o reserves.`,
      impact: 'Pots prometre material que avui no està fi o directament no està disponible.',
      actionLabel: 'Obrir inventari',
      href: '/admin/inventory?health=blocked',
      count: inventoryBlockedCount,
    });
  }

  if (inventoryZeroValueCount > 0) {
    catalogItems.push({
      id: 'catalog-inventory-zero-value',
      scope: 'catalog',
      status: 'warning',
      title: 'Inventari sense valor',
      reason: `${inventoryZeroValueCount} ítem${inventoryZeroValueCount > 1 ? 's' : ''} continua${inventoryZeroValueCount > 1 ? 'n' : ''} amb valor 0.`,
      impact: 'És més difícil entendre què tens invertit i què s’amortitza.',
      actionLabel: 'Valorar inventari',
      href: '/admin/inventory?health=zero-value',
      count: inventoryZeroValueCount,
    });
  }

  if (inventoryLowStockCount > 0) {
    catalogItems.push({
      id: 'catalog-inventory-low-stock',
      scope: 'catalog',
      status: 'warning',
      title: 'Inventari amb stock crític',
      reason: `${inventoryLowStockCount} consumible${inventoryLowStockCount > 1 ? 's' : ''} o ítem${inventoryLowStockCount > 1 ? 's' : ''} controlat${inventoryLowStockCount > 1 ? 's' : ''} està${inventoryLowStockCount > 1 ? 'n' : ''} al mínim o per sota.`,
      impact: 'Pots arribar a una reserva amb el material just o haver de córrer a última hora.',
      actionLabel: 'Obrir inventari',
      href: '/admin/inventory?health=blocked',
      count: inventoryLowStockCount,
    });
  }

  if (extrasWithoutCostCount > 0) {
    catalogItems.push({
      id: 'catalog-extras-without-cost',
      scope: 'catalog',
      status: 'critical',
      title: 'Extres venuts sense cost intern',
      reason: `${extrasWithoutCostCount} extra${extrasWithoutCostCount > 1 ? 's' : ''} s’està${extrasWithoutCostCount > 1 ? 'n' : ''} venent sense cost per unitat definit.`,
      impact: 'Factures, però no saps bé què guanyes.',
      actionLabel: 'Revisar extres',
      href: '/admin/packs/extras',
      count: extrasWithoutCostCount,
    });
  }

  if (extrasZeroPriceCount > 0) {
    catalogItems.push({
      id: 'catalog-extras-zero-price',
      scope: 'catalog',
      status: 'warning',
      title: 'Extres venuts a preu 0',
      reason: `${extrasZeroPriceCount} extra${extrasZeroPriceCount > 1 ? 's' : ''} no és${extrasZeroPriceCount > 1 ? 'n' : ''} "a consultar" però surt${extrasZeroPriceCount > 1 ? 'en' : ''} amb preu 0 en reserves reals.`,
      impact: 'Pots estar regalant servei sense haver-ho decidit de manera explícita.',
      actionLabel: 'Obrir extres',
      href: '/admin/packs/extras',
      count: extrasZeroPriceCount,
    });
  }

  const extrasThinMarginCount = extraHealthRows.filter((extra) => {
    const publicPrice = Number(extra.price || 0);
    const cost = Number(extra.costPerUnit || 0);
    if (publicPrice <= 0) return true;
    const marginPct = (publicPrice - cost) / publicPrice;
    return marginPct < EXTRA_HEALTH_MARGIN_WARNING_PCT;
  }).length;

  if (extrasThinMarginCount > 0) {
    catalogItems.push({
      id: 'catalog-extras-thin-margin',
      scope: 'catalog',
      status: 'warning',
      title: 'Extres amb marge massa just',
      reason: `${extrasThinMarginCount} extra${extrasThinMarginCount > 1 ? 's' : ''} venut${extrasThinMarginCount > 1 ? 's' : ''} deixa${extrasThinMarginCount > 1 ? 'en' : ''} molt poc coixí sobre el seu cost.`,
      impact: 'Sembla que ajuda a facturar, però pot aportar menys marge del que et convé.',
      actionLabel: 'Obrir preus',
      href: '/admin/pricing?tab=extras',
      count: extrasThinMarginCount,
    });
  }

  const packsWithoutCapacityCount = activePacks.filter((pack) => !pack.maxGuests || pack.maxGuests <= 0).length;

  if (packPricingConfig) {
    const pricingConfig = {
      ...packPricingConfig,
      specialistServices: new Set(packPricingConfig.specialistServices),
    };
    let packCriticalCount = 0;
    let packPartialCount = 0;
    let packAlertCount = 0;
    const packWithoutInventoryCount = activePacks.filter((pack) => pack.inventory.length === 0).length;

    for (const pack of activePacks) {
      const hasPartialInventory = pack.inventory.some((row) => !row.item.purchasePrice || !row.item.expectedLifeHours);
      if (hasPartialInventory) {
        packPartialCount += 1;
      }

      const health = computePackPricingHealth(pack, pricingConfig);
      if (health.hasAlert) {
        packAlertCount += 1;
      }
      const inventoryCostPerHour = pack.inventory.reduce((sum, row) => {
        const itemPerHour = calculateCostPerHour(row.item.purchasePrice, row.item.expectedLifeHours);
        return sum + (itemPerHour * Math.max(1, row.quantity));
      }, 0);
      const directCost = (inventoryCostPerHour * Math.max(1, pack.djHours)) + (health.laborCostPerHourUsed * Math.max(1, pack.djHours)) + packPricingConfig.fixedPackCost;
      const marginPct = health.publicPrice > 0 ? (health.publicPrice - directCost) / health.publicPrice : 0;
      if (marginPct < (packPricingConfig.marginTargetPct - 0.08)) {
        packCriticalCount += 1;
      }
    }

    if (packWithoutInventoryCount > 0) {
      catalogItems.push({
        id: 'catalog-pack-without-inventory',
        scope: 'catalog',
        status: 'critical',
        title: 'Packs sense equip base',
        reason: `${packWithoutInventoryCount} pack${packWithoutInventoryCount > 1 ? 's' : ''} actiu${packWithoutInventoryCount > 1 ? 's' : ''} no té${packWithoutInventoryCount > 1 ? 'nen' : ''} equip vinculat.`,
        impact: 'El cost base i la promesa operativa del pack queden massa a l’aire.',
        actionLabel: 'Obrir packs',
        href: '/admin/packs?focus=without-inventory',
        count: packWithoutInventoryCount,
      });
    }

    if (packCriticalCount > 0) {
      catalogItems.push({
        id: 'catalog-pack-red',
        scope: 'catalog',
        status: 'critical',
        title: 'Packs en zona crítica',
        reason: `${packCriticalCount} pack${packCriticalCount > 1 ? 's' : ''} queda${packCriticalCount > 1 ? 'en' : ''} clarament per sota del marge objectiu.`,
        impact: 'Hi pot haver vendes que semblen bones però deixen massa poc coixí.',
        actionLabel: 'Obrir packs',
        href: '/admin/packs?focus=critical-margin',
        count: packCriticalCount,
      });
    }

    if (packAlertCount > 0) {
      catalogItems.push({
        id: 'catalog-pack-alert',
        scope: 'catalog',
        status: 'warning',
        title: 'Packs amb preu desalineat',
        reason: `${packAlertCount} pack${packAlertCount > 1 ? 's' : ''} mostra${packAlertCount > 1 ? 'n' : ''} una diferència clara entre el preu públic i el recomanat.`,
        impact: 'El catàleg pot estar anant massa per davant o massa per darrere del cost real.',
        actionLabel: 'Revisar preus',
        href: '/admin/packs?focus=alert',
        count: packAlertCount,
      });
    }

    if (packPartialCount > 0) {
      catalogItems.push({
        id: 'catalog-pack-partial',
        scope: 'catalog',
        status: 'warning',
        title: 'Packs amb càlcul parcial',
        reason: `${packPartialCount} pack${packPartialCount > 1 ? 's' : ''} depèn${packPartialCount > 1 ? 'en' : ''} d’inventari incomplet.`,
        impact: 'El semàfor del pack pot semblar precís i no ser-ho del tot.',
        actionLabel: 'Revisar packs',
        href: '/admin/packs?focus=partial-cost',
        count: packPartialCount,
      });
    }
  }

  if (packsWithoutCapacityCount > 0) {
    catalogItems.push({
      id: 'catalog-pack-without-capacity',
      scope: 'catalog',
      status: 'warning',
      title: 'Packs sense rang clar de convidats',
      reason: `${packsWithoutCapacityCount} pack${packsWithoutCapacityCount > 1 ? 's' : ''} actiu${packsWithoutCapacityCount > 1 ? 's' : ''} no marca${packsWithoutCapacityCount > 1 ? 'n' : ''} aforament màxim.`,
      impact: 'Costa vendre bé el pack i també decidir si realment encaixa amb cada reserva.',
      actionLabel: 'Revisar packs',
      href: '/admin/packs?focus=missing-capacity',
      count: packsWithoutCapacityCount,
    });
  }

  // --- Cicle de vida inventari ---
  let inventoryLifeWarningCount = 0;
  let inventoryLifeCriticalCount = 0;
  for (const row of inventoryLifecycleRows) {
    const totalHours = row.usageHistory.reduce((sum: number, u: { hoursUsed: number | null }) => sum + (u.hoursUsed || 0), 0);
    const lifeHours = row.expectedLifeHours || 2000;
    const ratio = totalHours / lifeHours;
    if (ratio >= INVENTORY_LIFE_CRITICAL_PCT) {
      inventoryLifeCriticalCount += 1;
    } else if (ratio >= INVENTORY_LIFE_WARNING_PCT) {
      inventoryLifeWarningCount += 1;
    }
  }

  if (inventoryLifeCriticalCount > 0) {
    catalogItems.push({
      id: 'catalog-inventory-end-of-life',
      scope: 'catalog',
      status: 'critical',
      title: 'Inventari a fi de vida útil',
      reason: `${inventoryLifeCriticalCount} peça${inventoryLifeCriticalCount > 1 ? 'es' : ''} ha${inventoryLifeCriticalCount > 1 ? 'n' : ''} superat el 95% de les hores de vida previstes.`,
      impact: "El risc d'avaria en un event és alt. Convé planificar substitució o retirada.",
      actionLabel: 'Revisar inventari',
      href: '/admin/inventory?health=end-of-life',
      count: inventoryLifeCriticalCount,
    });
  }

  if (inventoryLifeWarningCount > 0) {
    catalogItems.push({
      id: 'catalog-inventory-aging',
      scope: 'catalog',
      status: 'warning',
      title: 'Inventari envellint',
      reason: `${inventoryLifeWarningCount} peça${inventoryLifeWarningCount > 1 ? 'es' : ''} ja supera${inventoryLifeWarningCount > 1 ? 'n' : ''} el 80% de la vida útil prevista.`,
      impact: 'Encara serveixen, però convé tenir-ho al radar per planificar reposició.',
      actionLabel: 'Revisar inventari',
      href: '/admin/inventory?health=aging',
      count: inventoryLifeWarningCount,
    });
  }

  // --- Capital mort inventari ---
  if (inventoryUnusedCount > 0) {
    catalogItems.push({
      id: 'catalog-inventory-unused',
      scope: 'catalog',
      status: 'warning',
      title: 'Inventari sense cap ús',
      reason: `${inventoryUnusedCount} peça${inventoryUnusedCount > 1 ? 'es' : ''} amb valor econòmic no està${inventoryUnusedCount > 1 ? 'n' : ''} vinculada${inventoryUnusedCount > 1 ? 'es' : ''} a cap pack, extra ni reserva.`,
      impact: 'Capital invertit que no genera retorn. Pot ser que falti vincular o que sobri.',
      actionLabel: 'Revisar inventari',
      href: '/admin/inventory?health=unused',
      count: inventoryUnusedCount,
    });
  }

  if (customersWithoutEmailCount > 0) {
    dataItems.push({
      id: 'data-customers-no-email',
      scope: 'data',
      status: 'warning',
      title: 'Clients sense email',
      reason: `${customersWithoutEmailCount} client${customersWithoutEmailCount > 1 ? 's' : ''} no té${customersWithoutEmailCount > 1 ? 'nen' : ''} email informat.`,
      impact: 'Comunicacions, seguiments i documents poden quedar tallats.',
      actionLabel: 'Revisar clients',
      href: '/admin/clientes',
      count: customersWithoutEmailCount,
    });
  }

  if (bookingsTotalZeroCount > 0) {
    dataItems.push({
      id: 'data-bookings-zero-total',
      scope: 'data',
      status: 'warning',
      title: 'Reserves amb total 0',
      reason: `${bookingsTotalZeroCount} reserva${bookingsTotalZeroCount > 1 ? 's' : ''} activa${bookingsTotalZeroCount > 1 ? 'es' : ''} té${bookingsTotalZeroCount > 1 ? 'nen' : ''} total 0.`,
      impact: 'Pot ser un símptoma de càlculs o dades comercials incompletes.',
      actionLabel: 'Obrir reserves',
      href: '/admin/bookings',
      count: bookingsTotalZeroCount,
    });
  }

  const sectionItemsMap: Record<AdminHealthScope, AdminHealthItem[]> = {
    system: systemItems.length > 0 ? systemItems : [createOkItem('system')],
    finances: financeItems.length > 0 ? financeItems : [createOkItem('finances')],
    operations: operationsItems.length > 0 ? operationsItems : [createOkItem('operations')],
    catalog: catalogItems.length > 0 ? catalogItems : [createOkItem('catalog')],
    data: dataItems.length > 0 ? dataItems : [createOkItem('data')],
  };

  const sections = (Object.keys(SECTION_META) as AdminHealthScope[]).map((scope) => ({
    scope,
    label: SECTION_META[scope].label,
    description: SECTION_META[scope].description,
    items: sectionItemsMap[scope],
    counts: countStatuses(sectionItemsMap[scope]),
  }));

  const allItems = sections.flatMap((section) => section.items);
  const summary = countStatuses(allItems);

  return {
    summary: {
      ...summary,
      total: allItems.length,
    },
    sections,
    generatedAt: new Date().toISOString(),
  };
}




