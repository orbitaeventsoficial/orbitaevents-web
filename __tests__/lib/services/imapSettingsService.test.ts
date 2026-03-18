import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: { upsert: vi.fn() },
  },
}));

const { mockImap } = vi.hoisted(() => ({
  mockImap: {
    getImapConfigSafe: vi.fn(),
    testConnection: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/imap', () => mockImap);
vi.mock('imapflow', () => ({
  ImapFlow: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { readInboxImapSettings, handleInboxImapSettings } from '@/lib/services/imapSettingsService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.upsert.mockResolvedValue({});
});

describe('readInboxImapSettings', () => {
  it('retorna config i connexió null si no configurat', async () => {
    mockImap.getImapConfigSafe.mockResolvedValue({ configured: false });

    const result = await readInboxImapSettings();

    expect(result.config.configured).toBe(false);
    expect(result.connection).toBeNull();
  });

  it('retorna config i testa connexió si configurat', async () => {
    mockImap.getImapConfigSafe.mockResolvedValue({ configured: true, host: 'imap.test.com' });
    mockImap.testConnection.mockResolvedValue({ ok: true });

    const result = await readInboxImapSettings();

    expect(result.config.configured).toBe(true);
    expect(result.connection).toEqual({ ok: true });
    expect(mockImap.testConnection).toHaveBeenCalled();
  });
});

describe('handleInboxImapSettings', () => {
  it('llança error sense host', async () => {
    await expect(
      handleInboxImapSettings({ host: '', user: 'u', pass: 'p' }),
    ).rejects.toThrow('Cal host, user i password');
  });

  it('llança error sense user', async () => {
    await expect(
      handleInboxImapSettings({ host: 'h', user: '', pass: 'p' }),
    ).rejects.toThrow('Cal host, user i password');
  });

  it('llança error sense pass', async () => {
    await expect(
      handleInboxImapSettings({ host: 'h', user: 'u', pass: '' }),
    ).rejects.toThrow('Cal host, user i password');
  });

  it('mode testOnly testa connexió sense guardar', async () => {
    const result = await handleInboxImapSettings({
      host: 'imap.test.com',
      user: 'user@test.com',
      pass: 'secret',
      testOnly: true,
    });

    // testImapCredentials returns ok:true or ok:false depending on mock
    expect(typeof result.ok).toBe('boolean');
    expect(mockPrisma.setting.upsert).not.toHaveBeenCalled();
  });

  it('guarda settings i testa connexió', async () => {
    mockImap.testConnection.mockResolvedValue({ ok: true });

    const result = await handleInboxImapSettings({
      host: 'imap.test.com',
      user: 'user@test.com',
      pass: 'secret',
    });

    expect(result.ok).toBe(true);
    expect((result as any).saved).toBe(true);
    expect(mockPrisma.setting.upsert).toHaveBeenCalledTimes(4);
    expect(mockImap.testConnection).toHaveBeenCalled();
  });

  it('usa port 993 per defecte', async () => {
    mockImap.testConnection.mockResolvedValue({ ok: true });

    await handleInboxImapSettings({
      host: 'imap.test.com',
      user: 'user@test.com',
      pass: 'secret',
    });

    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'imap.port' },
        update: { value: '993' },
      }),
    );
  });

  it('accepta port personalitzat', async () => {
    mockImap.testConnection.mockResolvedValue({ ok: true });

    await handleInboxImapSettings({
      host: 'imap.test.com',
      port: 143,
      user: 'user@test.com',
      pass: 'secret',
    });

    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'imap.port' },
        update: { value: '143' },
      }),
    );
  });
});
