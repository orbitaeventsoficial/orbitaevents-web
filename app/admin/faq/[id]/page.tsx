import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import FaqEditorForm from '../FaqEditorForm';
import { AdminPage } from '../../components/AdminPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Editar FAQ | Òrbita Admin',
};

export default async function EditFaqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const faq = await prisma.fAQ.findUnique({
    where: { id },
    include: { translations: true },
  });

  if (!faq) notFound();

  return (
    <AdminPage
      title="Editar FAQ"
      subtitle="Modifica contingut, idioma i estat"
      back={{ href: '/admin/faq', label: 'FAQ' }}
    >
      <FaqEditorForm
        mode="edit"
        initial={{
          id: faq.id,
          slug: faq.slug,
          category: faq.category,
          order: faq.order,
          isActive: faq.isActive,
          translations: faq.translations.map((t) => ({
            locale: t.locale as 'ca' | 'es' | 'en',
            question: t.question,
            answer: t.answer,
          })),
        }}
      />
    </AdminPage>
  );
}

