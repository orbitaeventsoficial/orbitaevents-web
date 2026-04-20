import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    adminLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: {
    business: { email: 'info@orbitaevents.com' },
  },
}));

import {
  listNotificationRecipients,
  getRecipientsFor,
  getRecipientsAsString,
  saveNotificationRecipients,
  NOTIFICATION_CATEGORIES,
} from '@/lib/services/notificationRecipientsService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.findUnique.mockResolvedValue(null);
  mockPrisma.setting.upsert.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
  vi.unstubAllEnvs();
});

describe('listNotificationRecipients', () => {
  it('retorna els destinataris desats al Setting quan existeixen', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: JSON.stringify({
        recipients: [
          { email: 'foo@a.com', label: 'Foo', categories: ['leads'], active: true },
          { email: 'bar@b.com', label: '', categories: ['reports', 'urgent'], active: false },
        ],
      }),
    });

    const result = await listNotificationRecipients();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ email: 'foo@a.com', label: 'Foo', categories: ['leads'], active: true });
    expect(result[1]).toEqual({ email: 'bar@b.com', label: '', categories: ['reports', 'urgent'], active: false });
  });

  it('filtra emails invàlids i categories desconegudes del Setting', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: JSON.stringify({
        recipients: [
          { email: 'valid@a.com', categories: ['leads', 'invalid'] },
          { email: 'no-arroba', categories: ['reports'] },
          { email: '', categories: [] },
        ],
      }),
    });

    const result = await listNotificationRecipients();
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('valid@a.com');
    expect(result[0].categories).toEqual(['leads']);
  });

  it('fallback a CONTACT_TO quan no hi ha Setting', async () => {
    vi.stubEnv('CONTACT_TO', 'a@test.com, b@test.com');
    const result = await listNotificationRecipients();
    expect(result.map((r) => r.email)).toEqual(['a@test.com', 'b@test.com']);
    expect(result.every((r) => r.active && r.categories.length === NOTIFICATION_CATEGORIES.length)).toBe(true);
  });

  it('fallback final a SITE_CONFIG.business.email quan res més', async () => {
    vi.stubEnv('CONTACT_TO', '');
    const result = await listNotificationRecipients();
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('info@orbitaevents.com');
    expect(result[0].categories).toEqual([...NOTIFICATION_CATEGORIES]);
  });

  it('retorna array buit quan JSON és corrupte', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: 'not valid json {' });
    vi.stubEnv('CONTACT_TO', '');
    const result = await listNotificationRecipients();
    expect(result[0].email).toBe('info@orbitaevents.com');
  });
});

describe('getRecipientsFor', () => {
  it('filtra per categoria activa', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: JSON.stringify({
        recipients: [
          { email: 'leads-only@a.com', categories: ['leads'], active: true },
          { email: 'reports-only@b.com', categories: ['reports'], active: true },
          { email: 'disabled@c.com', categories: ['leads', 'reports'], active: false },
        ],
      }),
    });

    expect(await getRecipientsFor('leads')).toEqual(['leads-only@a.com']);
    expect(await getRecipientsFor('reports')).toEqual(['reports-only@b.com']);
    expect(await getRecipientsFor('urgent')).toEqual(['info@orbitaevents.com']);
  });

  it('dedupe emails repetits', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: JSON.stringify({
        recipients: [
          { email: 'same@a.com', categories: ['leads'], active: true },
          { email: 'SAME@a.com', categories: ['leads'], active: true },
        ],
      }),
    });

    const result = await getRecipientsFor('leads');
    expect(result).toEqual(['same@a.com']);
  });

  it('fallback a env quan cap destinatari actiu per la categoria', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: JSON.stringify({
        recipients: [{ email: 'x@a.com', categories: ['leads'], active: true }],
      }),
    });
    vi.stubEnv('CONTACT_TO', 'fallback@z.com');

    const result = await getRecipientsFor('urgent');
    expect(result).toEqual(['fallback@z.com']);
  });
});

describe('getRecipientsAsString', () => {
  it('retorna string separat per comes', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: JSON.stringify({
        recipients: [
          { email: 'a@test.com', categories: ['leads'], active: true },
          { email: 'b@test.com', categories: ['leads'], active: true },
        ],
      }),
    });

    expect(await getRecipientsAsString('leads')).toBe('a@test.com, b@test.com');
  });

  it('retorna string buit quan cap destinatari i cap fallback vàlid', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: JSON.stringify({ recipients: [] }) });
    vi.stubEnv('CONTACT_TO', '');
    const result = await getRecipientsAsString('leads');
    expect(result).toBe('info@orbitaevents.com');
  });
});

describe('saveNotificationRecipients', () => {
  it('normalitza emails a minúscules i trim', async () => {
    await saveNotificationRecipients([
      { email: '  UPPER@Test.COM  ', label: ' admin ', categories: ['leads'], active: true },
    ]);

    const call = mockPrisma.setting.upsert.mock.calls[0][0];
    const stored = JSON.parse(call.create.value);
    expect(stored.recipients[0].email).toBe('upper@test.com');
    expect(stored.recipients[0].label).toBe('admin');
  });

  it('descarta emails invàlids', async () => {
    await saveNotificationRecipients([
      { email: 'ok@a.com', label: '', categories: ['leads'], active: true },
      { email: 'no-arroba', label: '', categories: ['leads'], active: true },
      { email: '', label: '', categories: [], active: true },
    ]);

    const call = mockPrisma.setting.upsert.mock.calls[0][0];
    const stored = JSON.parse(call.create.value);
    expect(stored.recipients).toHaveLength(1);
    expect(stored.recipients[0].email).toBe('ok@a.com');
  });

  it('dedupe emails repetits (case-insensitive)', async () => {
    await saveNotificationRecipients([
      { email: 'dup@a.com', label: '', categories: ['leads'], active: true },
      { email: 'DUP@a.com', label: '', categories: ['reports'], active: true },
    ]);

    const call = mockPrisma.setting.upsert.mock.calls[0][0];
    const stored = JSON.parse(call.create.value);
    expect(stored.recipients).toHaveLength(1);
  });

  it('escriu entrada a AdminLog amb el recompte', async () => {
    await saveNotificationRecipients(
      [
        { email: 'a@a.com', label: '', categories: ['leads'], active: true },
        { email: 'b@b.com', label: '', categories: ['reports'], active: true },
      ],
      'user-123'
    );

    expect(mockPrisma.adminLog.create).toHaveBeenCalledOnce();
    const call = mockPrisma.adminLog.create.mock.calls[0][0];
    expect(call.data.action).toBe('UPDATE');
    expect(call.data.entity).toBe('setting');
    expect(call.data.userId).toBe('user-123');
    expect(call.data.details).toEqual({ count: 2 });
  });

  it('filtra categories desconegudes abans de desar', async () => {
    await saveNotificationRecipients([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { email: 'ok@a.com', label: '', categories: ['leads', 'bogus' as any], active: true },
    ]);

    const call = mockPrisma.setting.upsert.mock.calls[0][0];
    const stored = JSON.parse(call.create.value);
    expect(stored.recipients[0].categories).toEqual(['leads']);
  });
});
