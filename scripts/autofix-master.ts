import { spawnSync } from 'node:child_process';
import { prisma } from '../lib/prisma';

const SYSTEM_ALERT_KEY = 'alerts.system.autofixFailureCount';
const TASK_PREFIX = 'ALERTA AUTOFIX MASTER';

type Step = {
  id: string;
  cmd: string;
  args: string[];
};

function envEnabled(name: string): boolean {
  const raw = (process.env[name] || '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

const STEPS_BASE: Step[] = [
  { id: 'system-health', cmd: 'npx', args: ['tsx', 'scripts/autofix-system-health.ts'] },
  { id: 'finance-health', cmd: 'npx', args: ['tsx', 'scripts/autofix-finance-health.ts'] },
  { id: 'i18n-packs', cmd: 'npm', args: ['run', 'i18n:packs:fix-or-alert'] },
  { id: 'admin-theme-autofix', cmd: 'npm', args: ['run', 'theme:admin:fix'] },
  { id: 'admin-theme-hardcode', cmd: 'npm', args: ['run', 'theme:admin:check'] },
];

function buildSteps(): Step[] {
  const steps: Step[] = [...STEPS_BASE];

  if (envEnabled('AUTOFIX_INVENTORY_IMAGES')) {
    steps.push({
      id: 'inventory-images',
      cmd: 'node',
      args: ['scripts/sync-inventory-images.mjs', '--apply', '--only-missing'],
    });
  }

  if (envEnabled('AUTOFIX_I18N_SMOKE')) {
    steps.push({
      id: 'i18n-smoke-web',
      cmd: 'npm',
      args: ['run', 'qa:smoke:i18n'],
    });
  }

  return steps;
}

async function setSystemAlertCount(value: number) {
  await prisma.setting.upsert({
    where: { key: SYSTEM_ALERT_KEY },
    update: {
      value: String(value),
      type: 'NUMBER',
      category: 'alerts',
      label: 'System autofix failure count',
      description: "Número d'incidències obertes detectades per autofix-master",
    },
    create: {
      key: SYSTEM_ALERT_KEY,
      value: String(value),
      type: 'NUMBER',
      category: 'alerts',
      label: 'System autofix failure count',
      description: "Número d'incidències obertes detectades per autofix-master",
    },
  });
}

/**
 * Crea una tasca d'alerta si no n'existeix cap d'oberta amb el mateix títol.
 * Usa un cast explícit perquè el model Task pot no estar tipat al client
 * generat si el schema no ha estat regenerat (executa `prisma generate`).
 */
async function ensureTask(title: string, description: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as unknown as Record<string, any>;
  if (!db['task']) {
    console.warn('[autofix-master] Model Task no disponible. Regenera el client: npx prisma generate');
    return;
  }
  const existing = await db['task'].findFirst({
    where: {
      title,
      status: { in: ['OPEN', 'IN_PROGRESS'] },
    },
    select: { id: true },
  });
  if (existing) return;
  await db['task'].create({
    data: {
      title,
      description,
      status: 'OPEN',
      priority: 'URGENT',
      createdBy: 'autofix-master',
    },
  });
}

function runStep(step: Step) {
  console.log(`[autofix-master] running: ${step.id}`);
  const result = spawnSync(step.cmd, step.args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  return (result.status ?? 1) === 0;
}

async function main() {
  const startedAt = new Date().toISOString();
  const failed: string[] = [];
  const steps = buildSteps();

  console.log(
    `[autofix-master] steps: ${steps.map((s) => s.id).join(', ')}`
  );

  for (const step of steps) {
    const ok = runStep(step);
    if (!ok) failed.push(step.id);
  }

  await setSystemAlertCount(failed.length);

  if (failed.length > 0) {
    for (const id of failed) {
      await ensureTask(
        `${TASK_PREFIX}: ${id}`,
        `El paso ${id} falló dentro de autofix-master. Revisar logs del servidor y script.`
      );
    }
  }

  await prisma.adminLog.create({
    data: {
      action: failed.length > 0 ? 'AUTOFIX_MASTER_FAILED' : 'AUTOFIX_MASTER_OK',
      entity: 'system',
      entityId: 'autofix-master',
      userId: 'autofix-master',
      details: {
        startedAt,
        finishedAt: new Date().toISOString(),
        failed,
      },
    },
  });

  if (failed.length > 0) {
    console.error('[autofix-master] failed steps:', failed.join(', '));
    process.exit(2);
  }
  console.log('[autofix-master] all steps ok');
}

main()
  .catch(async (error) => {
    const reason = error instanceof Error ? error.message : 'unknown';
    try {
      await setSystemAlertCount(1);
      await ensureTask(`${TASK_PREFIX}: crash`, reason);
    } catch {
      // best effort
    }
    console.error('[autofix-master] crash:', reason);
    process.exit(2);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
