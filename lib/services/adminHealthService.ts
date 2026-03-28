import { prisma } from '@/lib/prisma';
import { ADMIN_HEALTH_ACTIVE_BOOKING_STATUSES, ADMIN_HEALTH_ACTIVE_LEAD_STATUSES } from '@/lib/constants/admin';
import { isImapConfigured, isSmtpConfigured } from '@/lib/env';
import { getFinanceAlertsSummary } from '@/lib/services/financeAlertsService';
import { computePackPricingHealth, getPackPricingModelConfigEditable } from '@/lib/services/packPricingHealth';
import { calculateCostPerHour } from '@/lib/inventory-utils';

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

export async function getAdminHealthSnapshot(): Promise<AdminHealthSnapshot> {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - CRON_MAX_AGE_MS);
  const upcomingDateLimit = new Date(now.getTime() + UPCOMING_WINDOW_MS);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [
    settingsRows,
    financeAlerts,
    inventoryCriticalCount,
    inventoryZeroValueCount,
    inventoryBlockedCount,
    extrasWithoutCostCount,
    extraHealthRows,
    hotStaleLeadsCount,
    unpaidUpcomingBookingsCount,
    overdueTasksCount,
    customersWithoutEmailCount,
    bookingsTotalZeroCount,
    packPricingConfig,
    activePacks,
  ] = await Promise.all([
    prisma.setting.findMany({
      where: {
        key: {
          in: [
            'emails.cron.lastRun',
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
        OR: [{ purchasePrice: null }, { expectedLifeHours: null }],
        packItems: { some: {} },
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
          { bookingItems: { some: {} } },
        ],
      },
    }),
    prisma.extra.count({
      where: {
        isActive: true,
        costPerUnit: null,
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
    prisma.booking.count({
      where: {
        status: { in: [...ADMIN_HEALTH_ACTIVE_BOOKING_STATUSES] },
        eventDate: { gte: now, lte: upcomingDateLimit },
        depositPaid: false,
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
  ]);

  const settings = settingsRows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  const systemItems: AdminHealthItem[] = [];
  const financeItems: AdminHealthItem[] = [];
  const operationsItems: AdminHealthItem[] = [];
  const catalogItems: AdminHealthItem[] = [];
  const dataItems: AdminHealthItem[] = [];

  const emailCronLastRun = parseIsoDate(settings['emails.cron.lastRun']);
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

  const systemAutofixFailures = Number(settings['alerts.system.autofixFailureCount'] || '0') || 0;
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

  const financeAutofixFailures = Number(settings['alerts.finance.autofixFailureCount'] || '0') || 0;
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
      reason: `${unpaidUpcomingBookingsCount} reserva${unpaidUpcomingBookingsCount > 1 ? 's' : ''} propera${unpaidUpcomingBookingsCount > 1 ? 'es' : ''} encara no té${unpaidUpcomingBookingsCount > 1 ? 'nen' : ''} dipòsit.`,
      impact: 'Tens feina a calendari amb caixa encara sense protegir.',
      actionLabel: 'Revisar reserves',
      href: '/admin/bookings',
      count: unpaidUpcomingBookingsCount,
    });
  }

  if (overdueTasksCount > 0) {
    operationsItems.push({
      id: 'operations-overdue-tasks',
      scope: 'operations',
      status: 'warning',
      title: 'Tasques vençudes',
      reason: `Hi ha ${overdueTasksCount} tasca${overdueTasksCount > 1 ? 's' : ''} oberta${overdueTasksCount > 1 ? 'es' : ''} fora de termini.`,
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
      reason: `${inventoryCriticalCount} peça${inventoryCriticalCount > 1 ? 's' : ''} usada${inventoryCriticalCount > 1 ? 'es' : ''} a packs no té${inventoryCriticalCount > 1 ? 'nen' : ''} prou dades de cost.`,
      impact: 'Amortització, packs i marges poden quedar maquillats.',
      actionLabel: 'Revisar inventari',
      href: '/admin/inventory',
      count: inventoryCriticalCount,
    });
  }

  if (inventoryBlockedCount > 0) {
    catalogItems.push({
      id: 'catalog-inventory-blocked',
      scope: 'catalog',
      status: 'critical',
      title: 'Inventari tocat en ús real',
      reason: `${inventoryBlockedCount} peça${inventoryBlockedCount > 1 ? 's' : ''} està${inventoryBlockedCount > 1 ? 'n' : ''} avariada${inventoryBlockedCount > 1 ? 'es' : ''} o en manteniment i segueix${inventoryBlockedCount > 1 ? 'en' : ''} vinculada${inventoryBlockedCount > 1 ? 'es' : ''} a packs o reserves.`,
      impact: 'Pots prometre material que avui no està fi o directament no està disponible.',
      actionLabel: 'Obrir inventari',
      href: '/admin/inventory',
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
      href: '/admin/inventory',
      count: inventoryZeroValueCount,
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
      href: '/admin/pricing',
      count: extrasWithoutCostCount,
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
      href: '/admin/pricing',
      count: extrasThinMarginCount,
    });
  }

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
        href: '/admin/packs',
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
        href: '/admin/packs',
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
        href: '/admin/pricing',
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
        href: '/admin/packs',
        count: packPartialCount,
      });
    }
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
