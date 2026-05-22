import { describe, expect, it } from 'vitest';
import {
  TASK_AUTOMATION_THRESHOLDS,
  CAPACITY_FORECAST_THRESHOLDS,
} from '@/lib/constants/automationThresholds';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('TASK_AUTOMATION_THRESHOLDS', () => {
  it('reprodueix els valors històrics hardcodejats de taskAutomationService', () => {
    // Aquests valors han de coincidir amb els que el servei usava inline abans
    // de la centralització (#752). Si es canvien, és un canvi de comportament
    // deliberat i cal documentar-lo.
    expect(TASK_AUTOMATION_THRESHOLDS.slaBrokenMs).toBe(1 * DAY_MS);
    expect(TASK_AUTOMATION_THRESHOLDS.staleLeadMs).toBe(7 * DAY_MS);
    expect(TASK_AUTOMATION_THRESHOLDS.quoteFollowupMs).toBe(3 * DAY_MS);
    expect(TASK_AUTOMATION_THRESHOLDS.bookingPrepDaysAhead).toBe(3);
    expect(TASK_AUTOMATION_THRESHOLDS.atRiskHealthScoreMax).toBe(40);
  });
});

describe('CAPACITY_FORECAST_THRESHOLDS', () => {
  it('reprodueix els defaults històrics d\'operationalForecastService', () => {
    expect(CAPACITY_FORECAST_THRESHOLDS.maxBookingsPerDay).toBe(2);
    expect(CAPACITY_FORECAST_THRESHOLDS.weekWarningBookings).toBe(5);
    expect(CAPACITY_FORECAST_THRESHOLDS.weekCriticalBookings).toBe(7);
    expect(CAPACITY_FORECAST_THRESHOLDS.defaultWeeksAhead).toBe(4);
  });

  it('manté warning per sota de critical (ordre lògic d\'escalat)', () => {
    expect(CAPACITY_FORECAST_THRESHOLDS.weekWarningBookings).toBeLessThan(
      CAPACITY_FORECAST_THRESHOLDS.weekCriticalBookings,
    );
  });
});
