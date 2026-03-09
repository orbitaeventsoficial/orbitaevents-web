import { AdminPage } from '../components/AdminPage';
import CronsClient from './CronsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Crons — Òrbita Admin',
};

export default function CronsPage() {
  return (
    <AdminPage title="Estat dels crons" subtitle="Monitoratge de tasques automàtiques diàries.">
      <CronsClient />
    </AdminPage>
  );
}
