import { AdminPage } from '../../components/AdminPage';
import TemplateEditorClient from './TemplateEditorClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Editor plantilla email — Òrbita Admin',
};

export default async function TemplateEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { slug } = await params;
  const { locale } = await searchParams;

  return (
    <AdminPage
      title="Editor de plantilla"
      back={{ href: '/admin/email-templates', label: 'Plantilles' }}
    >
      <TemplateEditorClient slug={slug} initialLocale={locale || 'ca'} />
    </AdminPage>
  );
}
