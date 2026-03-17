import { AdminPage } from '@/app/admin/components/AdminPage';
import dynamic from 'next/dynamic';

const CanvasEditorClient = dynamic(() => import('./CanvasEditorClient'), { ssr: false });

export default function CanvasPage() {
  return (
    <AdminPage
      title="Canvas Editor"
      subtitle="Crea materials promocionals per xarxes socials"
      back={{ href: '/admin', label: 'Tauler' }}
    >
      <CanvasEditorClient />
    </AdminPage>
  );
}
