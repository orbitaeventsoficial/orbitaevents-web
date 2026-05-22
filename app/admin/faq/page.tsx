// app/admin/faq/page.tsx
import { FAQ_CATEGORY_CONFIG, getFaqCategoryDisplay } from '@/lib/constants';
import { log } from '@/lib/logger';
// Pàgina de gestió de FAQs
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { EditorControlStrip } from '../components/EditorControlStrip';
import { AdminEmptyState, AdminPage } from '../components/AdminPage';
import { buildFaqHref } from '@/lib/admin/faqWorkspaceHref';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'FAQ | Òrbita Admin',
};

async function getFaqs() {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
      include: {
        translations: true,
      },
    });

    return faqs;
  } catch (error) {
    log.error('Error obtenint FAQs:', error);
    return [];
  }
}

export default async function FAQPage() {
  const faqs = await getFaqs();
  const activeFaqs = faqs.filter((f) => f.isActive);
  const inactiveFaqs = faqs.filter((f) => !f.isActive);
  const locales = new Set(faqs.flatMap((f) => f.translations.map((t) => t.locale)));

  const faqsByCategory = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, typeof faqs>);
  const topCategory = Object.entries(faqsByCategory)
    .sort((a, b) => b[1].length - a[1].length)[0];
  const topCategoryConfig = topCategory ? getFaqCategoryDisplay(topCategory[0]) : null;

  return (
    <AdminPage
      title="FAQ"
      subtitle="Gestiona les preguntes freqüents del web"
      actions={
        <Link href="/admin/faq/new" className="ap-btn ap-btn--primary">
          + Nova Pregunta
        </Link>
      }
    >
      <EditorControlStrip
        overview={{
          eyebrow: 'Cobertura editorial',
          title: 'Què tens publicat ara mateix',
          stats: [
            { label: 'Preguntes', value: faqs.length },
            { label: 'Actives', value: activeFaqs.length, tone: 'success' },
            { label: 'Idiomes', value: locales.size },
          ],
        }}
        status={{
          eyebrow: 'Estat',
          title: 'Què convé revisar abans d’editar',
          items: [
            inactiveFaqs.length > 0 ? `${inactiveFaqs.length} preguntes estan inactives i poden deixar buits visibles.` : 'No hi ha preguntes inactives ara mateix.',
            topCategoryConfig ? `${topCategoryConfig.icon} ${topCategoryConfig.label} és la categoria amb més volum ara mateix.` : 'Encara no hi ha una categoria dominant.',
            locales.size < 3 ? 'No tots els idiomes tenen cobertura completa; convé revisar traduccions abans de publicar.' : 'La cobertura d’idiomes sembla completa a nivell de presència.',
          ],
        }}
        action={{
          eyebrow: 'Acció principal',
          title: inactiveFaqs.length > 0 ? 'Regularitzar les preguntes que no estan publicades' : 'Ampliar o polir la cobertura visible',
          description: inactiveFaqs.length > 0
            ? 'Abans de crear més contingut, comprova si les preguntes inactives s’han de recuperar, reescriure o eliminar.'
            : 'Si no hi ha incidències evidents, el millor retorn és reforçar categories clau i mantenir coherència entre idiomes.',
          primaryAction: { href: inactiveFaqs[0] ? buildFaqHref(inactiveFaqs[0].id) : '/admin/faq/new', label: inactiveFaqs[0] ? 'Editar una inactiva' : 'Crear nova pregunta' },
          secondaryPills: topCategory ? [`Focus actual: ${topCategoryConfig?.label}`] : undefined,
        }}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border admin-card-glass p-4">
          <p className="text-xs font-medium uppercase">Total Preguntes</p>
          <p className="mt-2 text-3xl font-bold">{faqs.length}</p>
        </div>
        <div className="rounded-2xl border admin-card-glass p-4">
          <p className="text-xs font-medium uppercase">Actives</p>
          <p className="mt-2 text-3xl font-bold">{faqs.filter((f) => f.isActive).length}</p>
        </div>
        <div className="rounded-2xl border admin-card-glass p-4">
          <p className="text-xs font-medium uppercase">Categories</p>
          <p className="mt-2 text-3xl font-bold">{Object.keys(faqsByCategory).length}</p>
        </div>
        <div className="rounded-2xl border admin-card-glass p-4">
          <p className="text-xs font-medium uppercase">Idiomes</p>
          <p className="mt-2 text-3xl font-bold">{locales.size}</p>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {Object.entries(FAQ_CATEGORY_CONFIG).map(([key, config]) => {
          const count = faqsByCategory[key]?.length || 0;
          return (
            <span
              key={key}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                count > 0 ? 'admin-tone-soft-info admin-tone-text-info' : 'admin-tone-idle opacity-60'
              }`}
            >
              <span>{config.icon}</span>
              {config.label}
              <span className="rounded-full px-1.5 py-0.5 text-xs">{count}</span>
            </span>
          );
        })}
      </section>

      {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => {
        const config = getFaqCategoryDisplay(category);

        return (
          <section key={category} className="overflow-hidden rounded-2xl border admin-card-glass">
            <div className="border-b p-4">
              <h2 className="flex items-center gap-2 font-semibold">
                <span>{config.icon}</span>
                {config.label}
                <span className="text-sm font-normal">({categoryFaqs.length} preguntes)</span>
              </h2>
            </div>
            <div className="divide-y admin-tone-border-subtle">
              {categoryFaqs.map((faq) => {
                const translation = faq.translations.find((t) => t.locale === 'es') || faq.translations[0];
                return (
                  <div key={faq.id} className="p-4 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{faq.order}</span>
                          <h3 className="truncate font-medium">{translation?.question || faq.slug}</h3>
                          {!faq.isActive && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                              Inactiva
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm line-clamp-2">{translation?.answer}</p>
                        <div className="mt-2 flex gap-2">
                          {faq.translations.map((t) => (
                            <span key={t.locale} className="inline-flex items-center rounded px-1.5 py-0.5 text-xs">
                              {t.locale.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          href={buildFaqHref(faq.id)}
                          className="inline-flex items-center rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors"
                        >
                          Editar
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {faqs.length === 0 && (
        <AdminEmptyState
          icon="❓"
          title="No hi ha preguntes freqüents"
          description="Crea la primera pregunta per començar"
        />
      )}
    </AdminPage>
  );
}


