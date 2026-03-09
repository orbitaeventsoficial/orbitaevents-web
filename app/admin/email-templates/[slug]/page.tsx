import { AdminPage } from '../../components/AdminPage';
import TemplateEditorClient from './TemplateEditorClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Editor plantilla email — Òrbita Admin',
};

export default function TemplateEditorPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { locale?: string };
}) {
  const locale = searchParams.locale || 'ca';

  return (
    <AdminPage
      title="Editor de plantilla"
      back={{ href: '/admin/email-templates', label: 'Plantilles' }}
    >
      <TemplateEditorClient slug={params.slug} initialLocale={locale} />
    </AdminPage>
  );
}
