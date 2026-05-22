import { ImapFlow } from 'imapflow';
import { prisma } from '@/lib/prisma';
import { getImapConfigSafe, testConnection } from '@/lib/imap';

type ImapSettingsInput = {
  host: string;
  port?: string | number | null;
  user: string;
  pass: string;
  testOnly?: boolean;
};

function normalizeImapSettings(input: ImapSettingsInput) {
  const host = String(input.host || '').trim();
  const user = String(input.user || '').trim();
  const pass = String(input.pass || '').trim();
  const portNum = parseInt(String(input.port || '993'), 10);

  if (!host || !user || !pass) {
    throw new Error('Cal host, user i password');
  }

  return {
    host,
    user,
    pass,
    port: Number.isFinite(portNum) ? portNum : 993,
    testOnly: input.testOnly === true,
  };
}

async function testImapCredentials(config: { host: string; port: number; user: string; pass: string }) {
  try {
    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.port === 993,
      auth: { user: config.user, pass: config.pass },
      logger: false,
      tls: { rejectUnauthorized: true },
    });
    await client.connect();
    await client.logout();
    return { ok: true as const, message: 'Connexió correcta' };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'Error de connexió',
    };
  }
}

async function saveImapSettings(config: { host: string; port: number; user: string; pass: string }) {
  const settings = [
    { key: 'imap.host', value: config.host },
    { key: 'imap.port', value: String(config.port) },
    { key: 'imap.user', value: config.user },
    { key: 'imap.pass', value: config.pass },
  ];

  await Promise.all(
    settings.map((setting) =>
      prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value, type: 'STRING', category: 'imap' },
      })
    )
  );
}

export async function deleteImapSettings() {
  await prisma.setting.deleteMany({
    where: { key: { startsWith: 'imap.' } },
  });
}

export async function readInboxImapSettings() {
  const config = await getImapConfigSafe();
  const connection = config.configured ? await testConnection() : null;

  return {
    config,
    connection,
  };
}

export async function handleInboxImapSettings(input: ImapSettingsInput) {
  const normalized = normalizeImapSettings(input);

  if (normalized.testOnly) {
    return testImapCredentials(normalized);
  }

  await saveImapSettings(normalized);
  const connection = await testConnection();

  return {
    ok: true as const,
    saved: true,
    connection,
  };
}
