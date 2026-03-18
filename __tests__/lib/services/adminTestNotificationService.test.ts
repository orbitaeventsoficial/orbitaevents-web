import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockSendEmail, mockReadCronStatus } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
  mockReadCronStatus: vi.fn(),
}));

vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  readCronRunStatus: mockReadCronStatus,
}));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: { business: { email: 'info@test.com', phone: '+34600000000' } },
}));

import {
  getAdminNotificationDiagnostics,
  sendAdminTestEmail,
} from '@/lib/services/adminTestNotificationService';

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  mockSendEmail.mockResolvedValue({});
  mockReadCronStatus.mockResolvedValue({
    lastRun: null,
    lastStatus: null,
    lastSummary: null,
    lastMessage: null,
    health: 'unknown',
  });
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('getAdminNotificationDiagnostics', () => {
  it('retorna diagnòstics amb instruccions', async () => {
    delete process.env.SMTP_HOST;

    const result = await getAdminNotificationDiagnostics();

    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('instructions');
    expect(result.canSendEmail).toBe(false);
  });

  it('detecta SMTP configurat', async () => {
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'user@test.com';
    process.env.SMTP_PASS = 'secret';

    const result = await getAdminNotificationDiagnostics();

    expect(result.canSendEmail).toBe(true);
  });
});

describe('sendAdminTestEmail', () => {
  it('retorna error sense SMTP configurat', async () => {
    delete process.env.SMTP_HOST;

    const result = await sendAdminTestEmail();

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it('envia email de test', async () => {
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'user@test.com';
    process.env.SMTP_PASS = 'secret';
    process.env.CONTACT_TO = 'admin@test.com';

    const result = await sendAdminTestEmail();

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'admin@test.com' })
    );
  });

  it('usa email personalitzat', async () => {
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'user@test.com';
    process.env.SMTP_PASS = 'secret';

    await sendAdminTestEmail('custom@test.com');

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'custom@test.com' })
    );
  });
});
