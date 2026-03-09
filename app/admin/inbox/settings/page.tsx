import { AdminPage } from '../../components/AdminPage';
import ImapSettingsClient from './ImapSettingsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Configurar safata d'entrada | Òrbita Admin",
};

export default function InboxSettingsPage() {
  return (
    <AdminPage
      title="Configurar safata d'entrada"
      subtitle="Connexió IMAP al servidor de correu DonDominio."
      back={{ href: '/admin/inbox', label: 'Safata' }}
    >
      <ImapSettingsClient />
    </AdminPage>
  );
}
