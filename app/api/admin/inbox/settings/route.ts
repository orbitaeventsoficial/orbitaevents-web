import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getImapConfigSafe, testConnection } from '@/lib/imap';

export const dynamic = 'force-dynamic';

// GET - Obtenir configuració IMAP actual
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const config = await getImapConfigSafe();
  const connectionTest = config.configured ? await testConnection() : null;

  return NextResponse.json({
    ok: true,
    config,
    connection: connectionTest,
  });
}

// POST - Guardar configuració IMAP
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json();
  const { host, port, user, pass, testOnly } = body;

  if (!host || !user || !pass) {
    return NextResponse.json({ error: 'Cal host, user i password' }, { status: 400 });
  }

  const portNum = parseInt(port || '993', 10);

  // Si testOnly, provar sense guardar
  if (testOnly) {
    try {
      const { ImapFlow } = await import('imapflow');
      const client = new ImapFlow({
        host,
        port: portNum,
        secure: portNum === 993,
        auth: { user, pass },
        logger: false,
        tls: { rejectUnauthorized: true },
      });
      await client.connect();
      await client.logout();
      return NextResponse.json({ ok: true, message: 'Connexió exitosa' });
    } catch (error) {
      return NextResponse.json({
        ok: false,
        error: error instanceof Error ? error.message : 'Error de connexió',
      });
    }
  }

  // Guardar a Settings
  const settings = [
    { key: 'imap.host', value: host.trim() },
    { key: 'imap.port', value: String(portNum) },
    { key: 'imap.user', value: user.trim() },
    { key: 'imap.pass', value: pass.trim() },
  ];

  await Promise.all(
    settings.map((s) =>
      prisma.setting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value, type: 'STRING', category: 'imap' },
      })
    )
  );

  // Provar connexió amb les noves credencials
  const testResult = await testConnection();

  return NextResponse.json({
    ok: true,
    saved: true,
    connection: testResult,
  });
}
