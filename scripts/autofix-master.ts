import { spawnSync } from 'node:child_process';
import { prisma } from '../lib/prisma';

const SYSTEM_ALERT_KEY = 'alerts.system.autofixFailureCount';
const TASK_PREFIX = 'ALERTA AUTOFIX MASTER';

type Step = {
  id: string;
  cmd: string;
  args: string[];
};

const STEPS: Step[] = [
  { id: 'system-health', cmd: 'npx', args: ['tsx', 'scripts/autofix-system-health.ts'] },
  { id: 'finance-health', cmd: 'npx', args: ['tsx', 'scripts/autofix-finance-health.ts'] },
  { id: 'i18n-packs', cmd: 'npm', args: ['run', 'i18n:packs:fix-or-alert'] },
];

async function setSystemAlertCount(value: number) {
  await prisma.setting.upsert({
    where: { key: SYSTEM_ALERT_KEY },
    update: {
      value: String(value),
      type: 'NUMBER',
      category: 'alerts',
      label: 'System autofix failure count',
      description: 'Número d’incidències obertes detectades per autofix-master',
    },
    create: {
      key: SYSTEM_ALERT_KEY,
      value: String(value),
      type: 'NUMBER',
      category: 'alerts',
      label: 'System autofix failure count',
      description: 'Número d’incidències obertes detectades per autofix-master',
    },
  });
}

async function ensureTask(title: string, description: string) {
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

  for (const step of STEPS) {
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

