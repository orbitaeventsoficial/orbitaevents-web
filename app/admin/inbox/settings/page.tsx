// app/admin/inbox/settings/page.tsx
import { prisma } from '@/lib/prisma';
import InboxSettingsClient from './InboxSettingsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Configurar Inbox | Òrbita Admin',
};

export default async function InboxSettingsPage() {
  // Check Gmail connection status
  const [gmailToken, gmailEmail, gmailConnectedAt] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'integrations.gmail.refreshToken' } }),
    prisma.setting.findUnique({ where: { key: 'integrations.gmail.email' } }),
    prisma.setting.findUnique({ where: { key: 'integrations.gmail.connectedAt' } }),
  ]);

  const isConnected = !!gmailToken?.value;
  const connectedEmail = gmailEmail?.value || null;
  const connectedAt = gmailConnectedAt?.value || null;

  return (
    <InboxSettingsClient
      isConnected={isConnected}
      connectedEmail={connectedEmail}
      connectedAt={connectedAt}
    />
  );
}
