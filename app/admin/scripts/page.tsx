import { AdminPage } from '../components/AdminPage';
import ScriptsClient from './ScriptsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Scripts i eines — Òrbita Admin',
};

export default function ScriptsPage() {
  return (
    <AdminPage
      title="Scripts i eines"
      subtitle="Comandes d'automatització, manteniment i informes. Executa des del terminal."
    >
      <ScriptsClient />
    </AdminPage>
  );
}
