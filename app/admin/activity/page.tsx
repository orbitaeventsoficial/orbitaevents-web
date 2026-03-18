import { AdminPage } from '../components/AdminPage';
import ActivityClient from './ActivityClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Activitat del sistema — Òrbita Admin',
};

export default function ActivityPage() {
  return (
    <AdminPage
      title="Activitat del sistema"
      subtitle="Tot el que fa el sistema automàticament: emails, crons, sincronitzacions i accions."
    >
      <ActivityClient />
    </AdminPage>
  );
}
