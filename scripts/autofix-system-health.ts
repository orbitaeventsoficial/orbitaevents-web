import { prisma } from '../lib/prisma';
import { hasForbiddenAdminCss, sanitizeAdminCss } from '../lib/admin-css';
import { calculateCostPerHour } from '../lib/inventory-utils';
import {
  buildProfitabilityReport,
  DEFAULT_PROFITABILITY_CONFIG,
  upsertProfitabilityConfig,
} from '../lib/services/profitabilityService';
import {
  computePackPricingHealth,
  getPackPricingModelConfigEditable,
  upsertPackPricingModelConfig,
} from '../lib/services/packPricingHealth';

const ALERT_KEY = 'alerts.system.autofixFailureCount';
const TASK_PREFIX = 'ALERTA AUTOFIX';

type CheckResult = {
  id: string;
  ok: boolean;
  fixed: boolean;
  title: string;
  details: string;
};

function hasImapEnv() {
  return Boolean(process.env.IMAP_HOST && process.env.IMAP_PORT && process.env.IMAP_USER && process.env.IMAP_PASS);
}

function hasSmtpEnv() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
}

async function getSettingMap(keys: string[]) {
  const rows = await prisma.setting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  });
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

async function setSystemAlertCount(value: number) {
  await prisma.setting.upsert({
    where: { key: ALERT_KEY },
    update: {
      value: String(value),
      type: 'NUMBER',
      category: 'alerts',
      label: 'System autofix failure count',
      description: 'Número d’incidències obertes detectades per autofix-system-health',
    },
    create: {
      key: ALERT_KEY,
      value: String(value),
      type: 'NUMBER',
      category: 'alerts',
      label: 'System autofix failure count',
      description: 'Número d’incidències obertes detectades per autofix-system-health',
    },
  });
}

async function ensureTask(title: string, details: string) {
  const prismaAny = prisma as any;
  const existing = await prismaAny.task.findFirst({
    where: {
      title,
      status: { in: ['OPEN', 'IN_PROGRESS'] },
    },
    select: { id: true },
  });
  if (existing) return;
  await prismaAny.task.create({
    data: {
      title,
      description: details,
      status: 'OPEN',
      priority: 'URGENT',
      createdBy: 'autofix-system-health',
    },
  });
}

async function runChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // 1) DB ping
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.push({
      id: 'database',
      ok: true,
      fixed: false,
      title: 'Base de datos',
      details: 'OK',
    });
  } catch (error) {
    results.push({
      id: 'database',
      ok: false,
      fixed: false,
      title: 'Base de datos',
      details: error instanceof Error ? error.message : 'DB error',
    });
  }

  // 2) Profitability report + autofix
  try {
    await buildProfitabilityReport();
    results.push({
      id: 'profitability',
      ok: true,
      fixed: false,
      title: 'Informe de rendibilitat',
      details: 'OK',
    });
  } catch (error) {
    try {
      await upsertProfitabilityConfig(DEFAULT_PROFITABILITY_CONFIG);
      await buildProfitabilityReport();
      results.push({
        id: 'profitability',
        ok: true,
        fixed: true,
        title: 'Informe de rendibilitat',
        details: 'Autofix aplicado restaurando configuración por defecto',
      });
    } catch (repairError) {
      results.push({
        id: 'profitability',
        ok: false,
        fixed: false,
        title: 'Informe de rendibilitat',
        details: repairError instanceof Error ? repairError.message : String(error),
      });
    }
  }

  // 3) Pack pricing model + sanity autofix
  try {
    const cfg = await getPackPricingModelConfigEditable();
    const invalid = (
      cfg.marginTargetPct <= 0 ||
      cfg.operatorCostPerHour <= 0 ||
      cfg.specialistCostPerHour <= 0 ||
      cfg.alertDivergencePct <= 0
    );
    if (!invalid) {
      results.push({
        id: 'pack-pricing',
        ok: true,
        fixed: false,
        title: 'Model econòmic packs',
        details: 'OK',
      });
    } else {
      const repaired = await upsertPackPricingModelConfig({
        marginTargetPct: Math.max(0.1, cfg.marginTargetPct || 0.55),
        operatorCostPerHour: Math.max(1, cfg.operatorCostPerHour || 22),
        specialistCostPerHour: Math.max(1, cfg.specialistCostPerHour || 29.7),
        alertDivergencePct: Math.max(1, cfg.alertDivergencePct || 20),
      });
      results.push({
        id: 'pack-pricing',
        ok: true,
        fixed: true,
        title: 'Model econòmic packs',
        details: `Autofix aplicado (marge ${(repaired.marginTargetPct * 100).toFixed(1)}%)`,
      });
    }
  } catch (error) {
    results.push({
      id: 'pack-pricing',
      ok: false,
      fixed: false,
      title: 'Model econòmic packs',
      details: error instanceof Error ? error.message : 'Error de configuración de packs',
    });
  }

  // 3.1) Pack semáforos en rojo (margen real estimado)
  try {
    const cfg = await getPackPricingModelConfigEditable();
    const packs = await prisma.pack.findMany({
      where: { isActive: true },
      select: {
        id: true,
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
    });
    const pricingCfg = { ...cfg, specialistServices: new Set(cfg.specialistServices) };
    const target = cfg.marginTargetPct;
    const redCount = packs.reduce((sum, pack) => {
      const health = computePackPricingHealth(pack, pricingCfg);
      const inventoryCostPerHour = pack.inventory.reduce((acc, row) => {
        const perHour = calculateCostPerHour(row.item.purchasePrice, row.item.expectedLifeHours);
        return acc + perHour * Math.max(1, row.quantity);
      }, 0);
      const directCost = (inventoryCostPerHour * Math.max(1, pack.djHours))
        + (health.laborCostPerHourUsed * Math.max(1, pack.djHours))
        + cfg.fixedPackCost;
      const marginPct = health.publicPrice > 0 ? (health.publicPrice - directCost) / health.publicPrice : 0;
      return sum + (marginPct < (target - 0.08) ? 1 : 0);
    }, 0);

    results.push({
      id: 'pack-red-semaphore',
      ok: redCount === 0,
      fixed: false,
      title: 'Semàfors packs en vermell',
      details: redCount === 0 ? 'OK' : `${redCount} packs en zona crítica de marge`,
    });
  } catch (error) {
    results.push({
      id: 'pack-red-semaphore',
      ok: false,
      fixed: false,
      title: 'Semàfors packs en vermell',
      details: error instanceof Error ? error.message : 'Error calculando semáforos',
    });
  }

  // 4) Email integrations (SMTP + (Gmail OAuth o IMAP))
  const integrationMap = await getSettingMap([
    'integrations.gmail.refreshToken',
    'integrations.googleCalendar.refreshToken',
    'integrations.googleCalendar.calendarId',
    'integrations.calendar.feedToken',
  ]);

  const hasGmailToken = Boolean(integrationMap['integrations.gmail.refreshToken']);
  const hasMailIngress = hasGmailToken || hasImapEnv();
  const smtpConfigured = hasSmtpEnv();

  results.push({
    id: 'email-stack',
    ok: hasMailIngress && smtpConfigured,
    fixed: false,
    title: 'Email stack (SMTP + entrada)',
    details: hasMailIngress && smtpConfigured
      ? 'OK'
      : `Falta configuración: ${[
          !smtpConfigured ? 'SMTP' : null,
          !hasMailIngress ? 'Gmail OAuth o IMAP' : null,
        ].filter(Boolean).join(' + ')}`,
  });

  // 5) Calendar integrations
  const hasCalendarRefresh = Boolean(integrationMap['integrations.googleCalendar.refreshToken']);
  const hasCalendarId = Boolean(integrationMap['integrations.googleCalendar.calendarId'] || process.env.GOOGLE_CALENDAR_ID);
  const hasIcsFeed = Boolean(integrationMap['integrations.calendar.feedToken']);
  const calendarOk = (hasCalendarRefresh && hasCalendarId) || hasIcsFeed;

  results.push({
    id: 'calendar-stack',
    ok: calendarOk,
    fixed: false,
    title: 'Calendar stack',
    details: calendarOk
      ? 'OK'
      : 'Falta Google Calendar (refresh token + calendarId) o feed ICS',
  });

  // 6) Cron freshness (emails + commercial automation)
  try {
    const settings = await getSettingMap([
      'emails.cron.lastRun',
      'automation.commercial.lastRun',
    ]);
    const now = Date.now();
    const maxAgeMs = 48 * 60 * 60 * 1000; // 48h
    const emailCronTs = Date.parse(settings['emails.cron.lastRun'] || '');
    const commercialCronTs = Date.parse(settings['automation.commercial.lastRun'] || '');
    const emailCronStale = !Number.isFinite(emailCronTs) || (now - emailCronTs) > maxAgeMs;
    const commercialCronStale = !Number.isFinite(commercialCronTs) || (now - commercialCronTs) > maxAgeMs;
    const stale = Number(emailCronStale) + Number(commercialCronStale);

    results.push({
      id: 'cron-freshness',
      ok: stale === 0,
      fixed: false,
      title: 'Crones críticos',
      details: stale === 0
        ? 'OK'
        : `Stale: ${[
            emailCronStale ? 'emails.cron.lastRun' : null,
            commercialCronStale ? 'automation.commercial.lastRun' : null,
          ].filter(Boolean).join(', ')}`,
    });
  } catch (error) {
    results.push({
      id: 'cron-freshness',
      ok: false,
      fixed: false,
      title: 'Crones críticos',
      details: error instanceof Error ? error.message : 'Error leyendo cron freshness',
    });
  }

  // 7) Operational backlog health (lead/task backlog)
  try {
    const staleLeadSince = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [staleNewLeadsCount, overdueTasksCount] = await Promise.all([
      prisma.lead.count({
        where: {
          status: 'NEW',
          createdAt: { lte: staleLeadSince },
        },
      }),
      prisma.task.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          dueDate: { lt: startOfToday },
        },
      }),
    ]);
    const unhealthy = staleNewLeadsCount >= 10 || overdueTasksCount >= 20;
    results.push({
      id: 'operational-backlog',
      ok: !unhealthy,
      fixed: false,
      title: 'Backlog operatiu',
      details: `Leads NEW >48h: ${staleNewLeadsCount} · Tasques vençudes: ${overdueTasksCount}`,
    });
  } catch (error) {
    results.push({
      id: 'operational-backlog',
      ok: false,
      fixed: false,
      title: 'Backlog operatiu',
      details: error instanceof Error ? error.message : 'Error revisando backlog operativo',
    });
  }

  // 8) Admin custom CSS safety (no gradients in admin runtime CSS)
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'admin.css.custom' },
      select: { value: true },
    });

    const currentCss = String(setting?.value || '');
    const hasForbidden = hasForbiddenAdminCss(currentCss);

    if (!hasForbidden) {
      results.push({
        id: 'admin-css-safety',
        ok: true,
        fixed: false,
        title: 'Admin CSS runtime',
        details: 'OK',
      });
    } else {
      const sanitized = sanitizeAdminCss(currentCss);
      await prisma.setting.upsert({
        where: { key: 'admin.css.custom' },
        update: {
          value: sanitized,
          type: 'STRING',
          category: 'config',
          label: 'Custom CSS admin',
          description: 'CSS custom aplicat només al panell admin',
        },
        create: {
          key: 'admin.css.custom',
          value: sanitized,
          type: 'STRING',
          category: 'config',
          label: 'Custom CSS admin',
          description: 'CSS custom aplicat només al panell admin',
        },
      });
      results.push({
        id: 'admin-css-safety',
        ok: true,
        fixed: true,
        title: 'Admin CSS runtime',
        details: 'Autofix aplicat: eliminats gradients del CSS custom guardat',
      });
    }
  } catch (error) {
    results.push({
      id: 'admin-css-safety',
      ok: false,
      fixed: false,
      title: 'Admin CSS runtime',
      details: error instanceof Error ? error.message : 'Error revisant CSS custom d’admin',
    });
  }

  return results;
}

async function run() {
  const startedAt = new Date().toISOString();
  const results = await runChecks();
  const failures = results.filter((item) => !item.ok);

  await setSystemAlertCount(failures.length);

  if (failures.length > 0) {
    for (const failure of failures) {
      const title = `${TASK_PREFIX}: ${failure.title}`;
      await ensureTask(title, failure.details);
    }
  }

  await prisma.adminLog.create({
    data: {
      action: failures.length > 0 ? 'AUTOFIX_FAILED' : 'AUTOFIX_OK',
      entity: 'system',
      entityId: 'autofix',
      userId: 'autofix-system-health',
      details: {
        startedAt,
        finishedAt: new Date().toISOString(),
        failures: failures.length,
        fixed: results.filter((r) => r.fixed).length,
        results,
      },
    },
  });

  if (failures.length > 0) {
    console.error('[autofix-system-health] FAILURES:', failures.map((f) => `${f.id}: ${f.details}`).join(' | '));
    process.exitCode = 2;
    return;
  }
  console.log('[autofix-system-health] OK: sin incidencias abiertas.');
}

run()
  .catch(async (error) => {
    const reason = error instanceof Error ? error.message : 'unknown';
    try {
      await setSystemAlertCount(1);
      await ensureTask(`${TASK_PREFIX}: Script crash`, reason);
      await prisma.adminLog.create({
        data: {
          action: 'AUTOFIX_CRASH',
          entity: 'system',
          entityId: 'autofix',
          userId: 'autofix-system-health',
          details: { reason, at: new Date().toISOString() },
        },
      });
    } catch {
      // best effort
    }
    console.error('[autofix-system-health] CRASH:', reason);
    process.exit(2);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
