import { describe, expect, it } from 'vitest';
import {
  ADMIN_CRON_PREFIXES,
  ADMIN_POST_EVENT_CRON_STATUS_PREFIX,
  readAdminPostEventCronSetting,
} from '@/lib/constants/admin';

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

  it('usa una sola clau canònica per al cron post-event amb fallback legacy', () => {
    expect(ADMIN_CRON_PREFIXES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'postEvent', prefix: ADMIN_POST_EVENT_CRON_STATUS_PREFIX }),
      ])
    );
    expect(readAdminPostEventCronSetting({
      'emails.cron.lastStatus': 'ok-legacy',
      [`${ADMIN_POST_EVENT_CRON_STATUS_PREFIX}.lastStatus`]: 'ok-canonical',
    }, 'lastStatus')).toBe('ok-canonical');
    expect(readAdminPostEventCronSetting({ 'emails.cron.lastStatus': 'ok-legacy' }, 'lastStatus')).toBe('ok-legacy');
  });

  it('defineix llindar de health per freqüència real', () => {
    expect(ADMIN_CRON_PREFIXES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'calendarSync', frequency: 'Cada 15 min', maxAgeHours: 2 }),
        expect.objectContaining({ id: 'urgentFollowUpAlerts', frequency: '4x diari', maxAgeHours: 8 }),
        expect.objectContaining({ id: 'weeklyBenchmark', frequency: 'Setmanal (dl)', maxAgeHours: 192 }),
      ])
    );

    expect(ADMIN_CRON_PREFIXES.every((cron) => Number.isFinite(cron.maxAgeHours) && cron.maxAgeHours > 0)).toBe(true);
  });
});
