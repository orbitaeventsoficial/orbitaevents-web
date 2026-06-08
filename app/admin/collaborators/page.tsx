import { AdminPage } from '../components/AdminPage';
import CollaboratorsClient from './CollaboratorsClient';

export const metadata = {
  title: 'Partners | Òrbita Admin',
};

export default function CollaboratorsPage() {
  return (
    <AdminPage
      title="Partners"
      subtitle="Base única de proveïdors, partners que porten bolos, lloguer de material i col·laboradors externs"
    >
      <CollaboratorsClient />
    </AdminPage>
  );
}
