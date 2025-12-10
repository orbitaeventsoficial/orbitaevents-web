/**
 * PÀGINA NOVA OPINIÓ - GAMIFICAT
 * ==============================
 * Formulari multi-step amb confetti i recompenses
 */

import type { Metadata } from 'next';
import TestimonialFormGamified from './TestimonialFormGamified';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Deixa la teva opinió | Òrbita Events',
  description:
    'Comparteix la teva experiència amb Òrbita Events i aconsegueix fins a un 25% de descompte per al teu pròxim event.',
  robots: { index: false, follow: false },
};

export default function NuevaOpinionPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-400/3 rounded-full blur-3xl" />
      </div>

      {/* Formulari gamificat */}
      <TestimonialFormGamified />
    </main>
  );
}
