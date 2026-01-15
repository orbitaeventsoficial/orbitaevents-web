// app/admin/inbox/settings/page.tsx
import InboxSettingsClient from './InboxSettingsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Configurar Correu | Òrbita Admin',
};

export default function InboxSettingsPage() {
  // Check which env vars are set (without exposing values)
  const envStatus = {
    IMAP_HOST: !!process.env.IMAP_HOST,
    IMAP_PORT: !!process.env.IMAP_PORT,
    IMAP_USER: !!process.env.IMAP_USER || !!process.env.SMTP_USER,
    IMAP_PASS: !!process.env.IMAP_PASS || !!process.env.SMTP_PASS,
  };

  const allConfigured = Object.values(envStatus).every(Boolean);

  return (
    <InboxSettingsClient
      envStatus={envStatus}
      allConfigured={allConfigured}
    />
  );
}
