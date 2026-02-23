import { AdminPage } from '../../components/AdminPage';
import ExtrasConfiguratorClient from './ExtrasConfiguratorClient';

export const metadata = {
  title: 'Extres Configurador | Òrbita Admin',
};

export default function PacksExtrasPage() {
  return (
    <AdminPage
      title="Extres"
      subtitle="Gestiona extres del configurador per família"
      back={{ href: '/admin/packs', label: 'Packs' }}
    >
      <ExtrasConfiguratorClient />
    </AdminPage>
  );
}
