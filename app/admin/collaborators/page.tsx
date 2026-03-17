import { AdminPage } from '../components/AdminPage';
import CollaboratorsClient from './CollaboratorsClient';

export const metadata = {
  title: 'Col·laboradors | Òrbita Admin',
};

export default function CollaboratorsPage() {
  return (
    <AdminPage
      title="Col·laboradors"
      subtitle="Gestiona col·laboradors que revenen els teus serveis"
    >
      <CollaboratorsClient />
    </AdminPage>
  );
}
