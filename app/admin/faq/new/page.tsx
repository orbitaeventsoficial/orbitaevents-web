import FaqEditorForm from '../FaqEditorForm';
import { AdminPage } from '../../components/AdminPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Nova FAQ | Òrbita Admin',
};

export default function NewFaqPage() {
  return (
    <AdminPage
      title="Nova pregunta FAQ"
      subtitle="Crea una nova entrada i les seves traduccions"
      back={{ href: '/admin/faq', label: 'FAQ' }}
    >
      <FaqEditorForm mode="create" />
    </AdminPage>
  );
}

