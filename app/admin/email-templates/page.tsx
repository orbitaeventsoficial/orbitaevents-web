import { AdminPage } from '../components/AdminPage';
import EmailTemplatesClient from './EmailTemplatesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Plantilles email — Òrbita Admin',
};

export default function EmailTemplatesPage() {
  return (
    <AdminPage title="Plantilles email" subtitle="Edita les plantilles de tots els correus automàtics.">
      <EmailTemplatesClient />
    </AdminPage>
  );
}
