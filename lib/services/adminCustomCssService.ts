import { prisma } from '@/lib/prisma';
import { hasForbiddenAdminCss, sanitizeAdminCss } from '@/lib/admin-css';

const CSS_KEY = 'admin.css.custom';

export async function getAdminCustomCss(): Promise<string> {
  const setting = await prisma.setting.findUnique({
    where: { key: CSS_KEY },
    select: { value: true },
  });

  return setting?.value || '';
}

export async function saveAdminCustomCss(input: string): Promise<{ css: string; hadForbiddenRules: boolean }> {
  const rawCss = typeof input === 'string' ? input : '';
  const css = sanitizeAdminCss(rawCss);
  const hadForbiddenRules = hasForbiddenAdminCss(rawCss);

  await prisma.setting.upsert({
    where: { key: CSS_KEY },
    update: {
      value: css,
      type: 'STRING',
      category: 'config',
      label: 'Custom CSS admin',
      description: 'CSS custom aplicat només al panell admin',
    },
    create: {
      key: CSS_KEY,
      value: css,
      type: 'STRING',
      category: 'config',
      label: 'Custom CSS admin',
      description: 'CSS custom aplicat només al panell admin',
    },
  });

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'setting',
      entityId: CSS_KEY,
      details: { key: CSS_KEY, size: css.length, hadForbiddenRules },
    },
  });

  return { css, hadForbiddenRules };
}
