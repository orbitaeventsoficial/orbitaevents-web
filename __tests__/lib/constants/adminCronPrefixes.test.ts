import { describe, expect, it } from 'vitest';
import { ADMIN_CRON_PREFIXES } from '@/lib/constants/admin';

describe('ADMIN_CRON_PREFIXES', () => {
  it('inclou els crons CRM i tasques al monitoratge admin', () => {
    expect(ADMIN_CRON_PREFIXES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'customerLifecycle',
          prefix: 'crm.customer-lifecycle',
          label: 'Lifecycle clients CRM',
          frequency: 'Diari',
        }),
      ])
    );
  });

  it('manté ids i prefixes únics', () => {
    const ids = ADMIN_CRON_PREFIXES.map((cron) => cron.id);
    const prefixes = ADMIN_CRON_PREFIXES.map((cron) => cron.prefix);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });
});
