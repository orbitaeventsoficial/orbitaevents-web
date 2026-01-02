// app/admin/testimonios/page.tsx
import { log } from '@/lib/logger';
// Pàgina de gestió de testimonis
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Testimonis | Òrbita Admin',
};

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  WEDDING: { label: 'Boda', icon: '💍' },
  BIRTHDAY: { label: 'Aniversari', icon: '🎂' },
  CORPORATE: { label: 'Corporatiu', icon: '💼' },
  COMMUNION: { label: 'Comunió', icon: '⛪' },
  BAPTISM: { label: 'Bateig', icon: '👶' },
  GRADUATION: { label: 'Graduació', icon: '🎓' },
  ANNIVERSARY: { label: 'Aniversari', icon: '💑' },
  PRIVATE_PARTY: { label: 'Festa privada', icon: '🎉' },
  OTHER: { label: 'Altres', icon: '📅' },
};

async function getTestimonials() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
      include: {
        translations: true,
      },
    });

    return testimonials;
  } catch (error) {
    log.error('Error obtenint testimonis:', error);
    return [];
  }
}

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  // Calcular mitjana de valoració
  const avgRating =
    testimonials.length > 0
      ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Testimonis</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona les ressenyes i opinions dels clients
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/testimonios/new"
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Nou Testimoni
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Testimonis</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{testimonials.length}</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-yellow-600 uppercase">Valoració Mitjana</p>
          <p className="mt-2 text-3xl font-bold text-yellow-700">
            ⭐ {avgRating}
          </p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-orange-600 uppercase">Destacats</p>
          <p className="mt-2 text-3xl font-bold text-orange-700">
            {testimonials.filter((t) => t.isFeatured).length}
          </p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase">Verificats</p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {testimonials.filter((t) => t.isVerified).length}
          </p>
        </div>
      </section>

      {/* Rating Distribution */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Distribució de valoracions</h3>
        <div className="flex gap-4">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = testimonials.filter((t) => t.rating === rating).length;
            const percentage = testimonials.length > 0 ? (count / testimonials.length) * 100 : 0;
            return (
              <div key={rating} className="flex-1">
                <div className="flex items-center gap-1 text-sm text-slate-600 mb-1">
                  <span>{rating}</span>
                  <span className="text-yellow-500">★</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{count}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial) => {
          const translation =
            testimonial.translations.find((t) => t.locale === 'es') ||
            testimonial.translations[0];
          const eventConfig = testimonial.eventType
            ? EVENT_TYPE_CONFIG[testimonial.eventType] || { label: testimonial.eventType, icon: '📅' }
            : null;

          return (
            <div
              key={testimonial.id}
              className={`rounded-xl border bg-white shadow-sm overflow-hidden ${
                testimonial.isFeatured
                  ? 'border-orange-300 ring-2 ring-orange-100'
                  : 'border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold">
                        {testimonial.authorName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">
                          {testimonial.authorName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {testimonial.authorLabel || 'Client'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < testimonial.rating ? 'text-yellow-500' : 'text-slate-200'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {testimonial.isFeatured && (
                      <span className="text-xs text-orange-600">⭐ Destacat</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="p-4">
                <p className="text-slate-600 text-sm italic line-clamp-4">
                  &ldquo;{translation?.quote || 'Sense text'}&rdquo;
                </p>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {eventConfig && (
                    <span className="flex items-center gap-1">
                      <span>{eventConfig.icon}</span>
                      {eventConfig.label}
                    </span>
                  )}
                  {testimonial.isVerified && (
                    <span className="text-green-600">✓ Verificat</span>
                  )}
                </div>
                <Link
                  href={`/admin/testimonios/${testimonial.id}`}
                  className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50"
                >
                  Editar
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      {testimonials.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <span className="text-4xl">⭐</span>
          <p className="mt-4 text-slate-600">No hi ha testimonis</p>
          <p className="text-sm text-slate-400">
            Els testimonis es poden crear manualment o des de les enquestes post-event
          </p>
        </div>
      )}
    </div>
  );
}
