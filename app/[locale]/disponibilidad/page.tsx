/**
 * Availability Calendar Page
 * Shows available dates for bookings
 */

import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { AvailabilityCalendar } from '@/components/calendar/AvailabilityCalendar';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'availability' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
    },
  };
}

export default function AvailabilityPage() {
  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Calendario de Disponibilidad
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Consulta nuestras fechas disponibles para tu evento. Las fechas en verde están
            disponibles, en rojo ya están reservadas.
          </p>
        </div>

        {/* Calendar */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10">
          <AvailabilityCalendar locale="es" showLegend={true} />
        </div>

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ¿Cómo funciona?
            </h2>
            <ul className="space-y-2 text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Verde: Fecha disponible para reservar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">×</span>
                <span>Rojo: Fecha ya reservada</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>Gris: Fecha bloqueada (festivos, mantenimiento)</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-500/20">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              ¿Quieres reservar?
            </h2>
            <p className="text-white/70 mb-4">
              Si has encontrado una fecha disponible, no esperes más. Contáctanos para hacer tu
              reserva.
            </p>
            <a
              href="/contacto"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Reservar ahora
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            <details className="group bg-white/5 rounded-xl p-6 border border-white/10">
              <summary className="font-semibold cursor-pointer flex items-center justify-between">
                ¿Con cuánta antelación debo reservar?
                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-white/70">
                Recomendamos reservar con al menos 2-3 meses de antelación, especialmente para
                bodas y eventos importantes. Sin embargo, también aceptamos reservas de última hora
                si tenemos disponibilidad.
              </p>
            </details>

            <details className="group bg-white/5 rounded-xl p-6 border border-white/10">
              <summary className="font-semibold cursor-pointer flex items-center justify-between">
                ¿Qué pasa si mi fecha está reservada?
                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-white/70">
                Si la fecha que buscas está ocupada, podemos recomendarte fechas alternativas
                cercanas. También puedes contactarnos para consultar posibles cancelaciones o
                cambios.
              </p>
            </details>

            <details className="group bg-white/5 rounded-xl p-6 border border-white/10">
              <summary className="font-semibold cursor-pointer flex items-center justify-between">
                ¿Se actualiza en tiempo real?
                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-white/70">
                El calendario se actualiza cada 15 minutos. Si acabas de hacer una consulta y no
                ves tu reserva reflejada, es normal. Recibirás una confirmación por email.
              </p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
