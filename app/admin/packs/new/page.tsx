import NewPackForm from './NewPackForm';
import { AdminPage } from '../../components/AdminPage';

export const dynamic = 'force-dynamic';

export default function NewPackPage() {
  return (
    <AdminPage
      title="Nou pack"
      subtitle="Crea un pack base i després edita inventari, textos i economia."
      back={{ href: '/admin/packs', label: 'Packs' }}
    >
      <NewPackForm />
    </AdminPage>
  );
}

