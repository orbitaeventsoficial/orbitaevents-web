import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import FaqEditorForm from '../FaqEditorForm';

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
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Editar FAQ</h1>
          <p className="mt-1 text-sm text-slate-400">Modifica contingut, idioma i estat</p>
        </div>
        <Link
          href="/admin/faq"
          className="rounded-xl border border-slate-600/60 bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-200"
        >
          ← FAQ
        </Link>
      </header>

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
    </div>
  );
}

