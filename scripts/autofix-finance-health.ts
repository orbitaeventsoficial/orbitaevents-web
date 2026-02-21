import { prisma } from '../lib/prisma';
import {
  buildProfitabilityReport,
  DEFAULT_PROFITABILITY_CONFIG,
  upsertProfitabilityConfig,
} from '../lib/services/profitabilityService';
import {
  getPackPricingModelConfigEditable,
  upsertPackPricingModelConfig,
} from '../lib/services/packPricingHealth';

const ALERT_KEY = 'alerts.finance.autofixFailureCount';
const ALERT_TASK_TITLE = 'ALERTA: revisar configuración económica (autofix fallido)';

async function setAlertCount(value: number) {
  await prisma.setting.upsert({
    where: { key: ALERT_KEY },
    update: {
      value: String(value),
      type: 'NUMBER',
      category: 'alerts',
      label: 'Finance autofix failure count',
      description: 'Alerta para campana cuando falla autofix de economía',
    },
    create: {
      key: ALERT_KEY,
      value: String(value),
      type: 'NUMBER',
      category: 'alerts',
      label: 'Finance autofix failure count',
      description: 'Alerta para campana cuando falla autofix de economía',
    },
  });
}

async function ensureAlertTask(message: string) {
  const prismaAny = prisma as any;
  const existing = await prismaAny.task.findFirst({
    where: {
      title: ALERT_TASK_TITLE,
      status: { in: ['OPEN', 'IN_PROGRESS'] },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  if (!existing) {
    await prismaAny.task.create({
      data: {
        title: ALERT_TASK_TITLE,
        description: message,
        status: 'OPEN',
        priority: 'URGENT',
        createdBy: 'autofix-finance-health',
      },
    });
  }
}

async function logAlert(action: string, details: Record<string, unknown>) {
  await prisma.adminLog.create({
    data: {
      action,
      entity: 'finance',
      entityId: 'autofix',
      details: details as any,
      userId: 'autofix-finance-health',
    },
  });
}

async function checkReport() {
  await buildProfitabilityReport();
}

async function run() {
  const startedAt = new Date().toISOString();
  try {
    await checkReport();
    await setAlertCount(0);
    await logAlert('AUTOFIX_OK', { startedAt, mode: 'check-only' });
    console.log('[autofix-finance-health] OK: report generado sin incidencias.');
    return;
  } catch (initialError) {
    console.error('[autofix-finance-health] WARN: fallo inicial, intento de autofix...');

    try {
      await upsertProfitabilityConfig(DEFAULT_PROFITABILITY_CONFIG);
      const packConfig = await getPackPricingModelConfigEditable();
      await upsertPackPricingModelConfig(packConfig);
      await checkReport();

      await setAlertCount(0);
      await logAlert('AUTOFIX_RECOVERED', {
        startedAt,
        recoveredAt: new Date().toISOString(),
        reason: initialError instanceof Error ? initialError.message : 'unknown',
      });
      console.log('[autofix-finance-health] RECOVERED: autofix aplicado y reporte operativo.');
      return;
    } catch (repairError) {
      const reason = repairError instanceof Error ? repairError.message : 'unknown';
      await setAlertCount(1);
      await ensureAlertTask(
        `El script autofix-finance-health no pudo recuperar Economía. Error: ${reason}`
      );
      await logAlert('AUTOFIX_FAILED', {
        startedAt,
        failedAt: new Date().toISOString(),
        initialError: initialError instanceof Error ? initialError.message : 'unknown',
        repairError: reason,
      });
      console.error('[autofix-finance-health] FAILED:', reason);
      process.exitCode = 2;
    }
  }
}

run()
  .catch(async (error) => {
    const reason = error instanceof Error ? error.message : 'unknown';
    try {
      await setAlertCount(1);
      await ensureAlertTask(
        `Fallo no controlado en autofix-finance-health. Error: ${reason}`
      );
      await logAlert('AUTOFIX_CRASH', {
        failedAt: new Date().toISOString(),
        reason,
      });
    } catch {
      // noop: best-effort fallback
    }
    console.error('[autofix-finance-health] CRASH:', reason);
    process.exit(2);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
