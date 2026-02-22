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
          <h1 className="text-2xl font-semibold tracking-tight">FAQ</h1>
          <p className="mt-1 text-sm">
            Gestiona les preguntes freqüents del web
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/faq/new"
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
          >
            + Nova Pregunta
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border backdrop-blur-sm p-4">
          <p className="text-xs font-medium uppercase">Total Preguntes</p>
          <p className="mt-2 text-3xl font-bold">{faqs.length}</p>
        </div>
        <div className="rounded-2xl border backdrop-blur-sm p-4">
          <p className="text-xs font-medium uppercase">Actives</p>
          <p className="mt-2 text-3xl font-bold">
            {faqs.filter((f) => f.isActive).length}
          </p>
        </div>
        <div className="rounded-2xl border backdrop-blur-sm p-4">
          <p className="text-xs font-medium uppercase">Categories</p>
          <p className="mt-2 text-3xl font-bold">
            {Object.keys(faqsByCategory).length}
          </p>
        </div>
        <div className="rounded-2xl border backdrop-blur-sm p-4">
          <p className="text-xs font-medium uppercase">Idiomes</p>
          <p className="mt-2 text-3xl font-bold">
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
                  ? 'bg-slate-700/50 text-slate-200'
                  : 'bg-slate-800/40 text-slate-500'
              }`}
            >
              <span>{config.icon}</span>
              {config.label}
              <span className="text-xs px-1.5 py-0.5 rounded-full">
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
            className="rounded-2xl border backdrop-blur-sm overflow-hidden"
          >
            <div className="border-b p-4">
              <h2 className="font-semibold flex items-center gap-2">
                <span>{config.icon}</span>
                {config.label}
                <span className="text-sm font-normal">
                  ({categoryFaqs.length} preguntes)
                </span>
              </h2>
            </div>
            <div className="divide-y divide-slate-700/30">
              {categoryFaqs.map((faq) => {
                const translation = faq.translations.find((t) => t.locale === 'es') || faq.translations[0];
                return (
                  <div
                    key={faq.id}
                    className="p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{faq.order}</span>
                          <h3 className="font-medium truncate">
                            {translation?.question || faq.slug}
                          </h3>
                          {!faq.isActive && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                              Inactiva
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm line-clamp-2">
                          {translation?.answer}
                        </p>
                        <div className="mt-2 flex gap-2">
                          {faq.translations.map((t) => (
                            <span
                              key={t.locale}
                              className="inline-flex items-center rounded px-1.5 py-0.5 text-xs"
                            >
                              {t.locale.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/admin/faq/${faq.id}`}
                          className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
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
        <div className="rounded-2xl border backdrop-blur-sm p-12 text-center">
          <span className="text-4xl">❓</span>
          <p className="mt-4">No hi ha preguntes freqüents</p>
          <p className="text-sm">Crea la primera pregunta per començar</p>
        </div>
      )}
    </div>
  );
}
