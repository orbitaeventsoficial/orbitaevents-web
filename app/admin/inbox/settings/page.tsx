// app/admin/inbox/settings/page.tsx
// 100% canònic — AdminPage + .ap-*/.adm-input (eradicació classes pròpies d'òrgan)
import ImapSettingsClient from './ImapSettingsClient';
import { AdminPage } from '../../components/AdminPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Configurar safata d'entrada | Òrbita Admin",
};

export default function InboxSettingsPage() {
  return (
    <AdminPage
      eyebrow="Safata d'entrada"
      title="Configuració IMAP"
      subtitle="Connexió al servidor de correu DonDominio."
      back={{ href: '/admin/inbox', label: 'Safata' }}
    >
      <div className="flex max-w-[44rem] flex-col gap-5">
        <ImapSettingsClient />
      </div>
    </AdminPage>
  );
}
