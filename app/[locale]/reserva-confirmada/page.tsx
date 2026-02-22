/**
 * Booking Confirmation Page
 * Shown after successful booking
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/app/config/site-config';

export const metadata: Metadata = {
  title: 'Reserva Confirmada | Òrbita Events',
  description: 'Tu reserva ha sido confirmada',
  robots: { index: false, follow: false },
};

export default function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  const reference = searchParams.ref;

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-bounce">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          ¡Reserva Confirmada!
        </h1>

        {reference && (
          <p className="text-xl text-white/70 mb-6">
            Referencia: <span className="font-mono font-bold text-white">{reference}</span>
          </p>
        )}

        {/* Success Message */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-8">
          <p className="text-lg text-white/80 mb-6">
            Hemos recibido tu reserva y te hemos enviado un email de confirmación con todos los
            detalles.
          </p>

          <div className="space-y-4 text-left">
            <h2 className="text-xl font-semibold text-white mb-4">Próximos pasos:</h2>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Revisión de tu reserva</h3>
                <p className="text-white/60">
                  Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo en las
                  próximas 24 horas.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Confirmación final</h3>
                <p className="text-white/60">
                  Te enviaremos un contrato con todos los detalles del servicio para que lo
                  revises y confirmes.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Información de pago</h3>
                <p className="text-white/60">
                  Recibirás las instrucciones sobre las modalidades de pago disponibles.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold text-white transition-all"
          >
            Volver al Inicio
          </Link>
          <Link
            href="/portfolio"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white transition-all"
          >
            Ver Portfolio
          </Link>
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-white/60 mb-4">¿Tienes alguna pregunta?</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href={`mailto:${SITE_CONFIG.business.email}`} className="text-purple-400 hover:underline flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {SITE_CONFIG.business.email}
            </a>
            <a href={`tel:${SITE_CONFIG.business.phone}`} className="text-purple-400 hover:underline flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {SITE_CONFIG.business.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
