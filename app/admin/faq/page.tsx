// app/admin/faq/page.tsx
import { log } from '@/lib/logger';
// Pàgina de gestió de FAQs
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'FAQ | Òrbita Admin',
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  general: { label: 'General', icon: '📋', color: 'blue' },
  sound: { label: 'So', icon: '🔊', color: 'purple' },
  lighting: { label: 'Il·luminació', icon: '💡', color: 'yellow' },
  pricing: { label: 'Preus', icon: '💰', color: 'green' },
  booking: { label: 'Reserves', icon: '📅', color: 'orange' },
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

  // Agrupar per categoria
  const faqsByCategory = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, typeof faqs>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">FAQ</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona les preguntes freqüents del web
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/faq/new"
            className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-100"
          >
            + Nova Pregunta
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Preguntes</p>
          <p className="mt-2 text-3xl font-bold text-black">{faqs.length}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase">Actives</p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {faqs.filter((f) => f.isActive).length}
          </p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-orange-600 uppercase">Categories</p>
          <p className="mt-2 text-3xl font-bold text-orange-700">
            {Object.keys(faqsByCategory).length}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-blue-600 uppercase">Idiomes</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">
            {new Set(faqs.flatMap(f => f.translations.map(t => t.locale))).size}
          </p>
        </div>
      </section>

      {/* Categories Pills */}
      <section className="flex flex-wrap gap-2">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const count = faqsByCategory[key]?.length || 0;
          return (
            <span
              key={key}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                count > 0
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-slate-50 text-slate-400'
              }`}
            >
              <span>{config.icon}</span>
              {config.label}
              <span className="text-xs bg-white px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            </span>
          );
        })}
      </section>

      {/* FAQs by Category */}
      {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => {
        const config = CATEGORY_CONFIG[category] || {
          label: category,
          icon: '❓',
          color: 'gray',
        };
        return (
          <section
            key={category}
            className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="bg-slate-50 border-b border-slate-200 p-4">
              <h2 className="font-semibold text-black flex items-center gap-2">
                <span>{config.icon}</span>
                {config.label}
                <span className="text-sm font-normal text-slate-500">
                  ({categoryFaqs.length} preguntes)
                </span>
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {categoryFaqs.map((faq) => {
                const translation = faq.translations.find((t) => t.locale === 'es') || faq.translations[0];
                return (
                  <div
                    key={faq.id}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-400">#{faq.order}</span>
                          <h3 className="font-medium text-black truncate">
                            {translation?.question || faq.slug}
                          </h3>
                          {!faq.isActive && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                              Inactiva
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                          {translation?.answer}
                        </p>
                        <div className="mt-2 flex gap-2">
                          {faq.translations.map((t) => (
                            <span
                              key={t.locale}
                              className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                            >
                              {t.locale.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/admin/faq/${faq.id}`}
                          className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
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
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <span className="text-4xl">❓</span>
          <p className="mt-4 text-slate-600">No hi ha preguntes freqüents</p>
          <p className="text-sm text-slate-400">Crea la primera pregunta per començar</p>
        </div>
      )}
    </div>
  );
}
