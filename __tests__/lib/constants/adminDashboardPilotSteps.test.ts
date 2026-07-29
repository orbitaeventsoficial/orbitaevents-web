import { describe, expect, it } from 'vitest';
import { ADMIN_DASHBOARD_PILOT_STEPS } from '@/lib/constants/admin';

describe('ADMIN_DASHBOARD_PILOT_STEPS', () => {
  it('entra pel hub post-event abans de baixar a emails', () => {
    const postEventStep = ADMIN_DASHBOARD_PILOT_STEPS.find((step) => step.id === 'postevent');

    expect(postEventStep?.href).toBe('/admin/post-event');
    expect(postEventStep?.href).not.toBe('/admin/emails');
  });
});
