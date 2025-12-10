/**
 * Pàgina Halloween - EXPERIÈNCIA COMPLETA DE TERROR
 * =================================================
 *
 * - Hero amb imatge impactant
 * - Galeria de fotos reals (12 fotos)
 * - Packs específics Halloween
 * - Què inclou
 * - Testimoni
 * - CTA final
 */

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PORTFOLIO_IMAGES } from '@/config/portfolio-images';

export const metadata: Metadata = {
  title: 'Festa Halloween Barcelona | Decoració + DJ + Efectes | Òrbita Events',
  description: 'Transforma el teu event en una nit de terror. Decoració temàtica, DJ especialitzat, fum, llums sincronitzades i efectes especials. Des de 600€.',
  keywords: 'festa halloween barcelona, decoració halloween, dj halloween, festa terror, efectes especials halloween, fum baix, llums halloween',
  alternates: { canonical: '/tematica-halloween' },
  openGraph: {
    title: 'Festa Halloween Barcelona | Des de 600€ | Òrbita Events',
    description: 'DJ + Decoració + Fum + Llums. Transforma el teu event en una nit de terror.',
    images: [{ url: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg', alt: 'Festa Halloween Barcelona' }],
  },
};

// Obtenir galeria de Halloween del portfolio
const halloweenGallery = PORTFOLIO_IMAGES['fiestas-tematicas-halloween'] || [];

// Packs específics Halloween
const halloweenPacks = [
  {
    name: 'Terror Bàsic',
    price: '600',
    hours: '4',
    includes: [
      'DJ temàtic 4 hores',
      'So 4000W',
      'Il·luminació vermella/verda',
      'Màquina de fum',
      'Playlist Halloween curada',
    ],
  },
  {
    name: 'Nit de Por',
    price: '900',
    hours: '5',
    popular: true,
    includes: [
      'DJ temàtic 5 hores',
      'So 4000W + subwoofer',
      '4 caps mòbils sincronitzats',
      'Fum baix (terra)',
      'Decoració bàsica (teranyines, carabasses LED)',
      'Efectes de so terrorífics',
    ],
  },
  {
    name: 'Apocalipsi Zombie',
    price: '1400',
    hours: '6',
    includes: [
      'DJ + Tècnic de llums 6 hores',
      'So club 4000W',
      'Show de llums complet',
      'Fum baix + màquina de boira',
      'Decoració completa (200+ elements)',
      'Chispas frías per moments clau',
      'CO2 criogènic',
      'Actor/animador zombie opcional',
    ],
  },
];

export default function HalloweenPage() {
  return (
    <main className="bg-black text-white">
      {/* ========================================
          HERO AMB IMATGE HALLOWEEN
          ======================================== */}
      <section className="relative h-[80vh] overflow-hidden">
        <Image
          src="/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg"
          alt="Festa Halloween Òrbita Events"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-950/30 via-transparent to-orange-950/30" />

        <div className="relative z-10 h-full flex flex-col justify-end pb-16 px-4 max-w-6xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/50 rounded-full text-orange-400 text-sm w-fit mb-4">
            <span className="text-lg">🎃</span> Temporada Halloween 2025
          </span>

          <h1 className="text-5xl md:text-7xl font-black">
            <span className="text-white">NITS DE</span>
            <br />
            <span className="text-orange-500">TERROR</span>
          </h1>

          <p className="mt-4 text-xl text-white/70 max-w-xl">
            Transforma el teu event en una experiència terroríficament memorable.
            Decoració, DJ, efectes especials i tot el que necessites.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/contacto?tema=halloween"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-full transition-colors inline-flex items-center gap-2"
            >
              <span>👻</span> Reserva la teva nit de terror
            </Link>
            <Link
              href="https://wa.me/34699121023?text=Hola!%20Vull%20info%20sobre%20festes%20Halloween"
              className="px-6 py-3 border border-white/30 hover:border-white/60 text-white font-medium rounded-full transition-colors inline-flex items-center gap-2"
            >
              <span>💬</span> WhatsApp directe
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================
          GALERIA IMMERSIVA
          ======================================== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Events Halloween <span className="text-orange-500">reals</span>
          </h2>
          <p className="text-white/60 text-center mb-12">
            No són mockups. Són festes que hem creat.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {halloweenGallery.slice(0, 12).map((img, i) => (
              <div
                key={i}
                className={`relative rounded-2xl overflow-hidden group ${
                  i === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          QUÈ INCLOU
          ======================================== */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-orange-950/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Què inclou una nit <span className="text-orange-500">Halloween?</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors">
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="text-xl font-bold mb-2">DJ Temàtic</h3>
              <p className="text-white/60">
                Playlist curada de Halloween: des de clàssics (Thriller, Ghostbusters)
                fins a remixes actuals. El DJ pot anar caracteritzat.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors">
              <div className="text-4xl mb-4">💀</div>
              <h3 className="text-xl font-bold mb-2">Decoració Completa</h3>
              <p className="text-white/60">
                Teranyines, carabasses LED, esquelets, calaveres, teles de sac,
                veles falses, cartells vintage de terror...
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors">
              <div className="text-4xl mb-4">🌫️</div>
              <h3 className="text-xl font-bold mb-2">Efectes Especials</h3>
              <p className="text-white/60">
                Fum baix que recorre el terra, llums vermelles i verdes
                sincronitzades, efectes de so terrorífics, chispas frías.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          PACKS
          ======================================== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Packs <span className="text-orange-500">Halloween</span>
          </h2>
          <p className="text-white/60 text-center mb-12">
            Tria el nivell de terror que vols
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {halloweenPacks.map((pack) => (
              <div
                key={pack.name}
                className={`relative p-6 rounded-2xl border ${
                  pack.popular
                    ? 'border-orange-500/50 bg-orange-500/5 shadow-lg shadow-orange-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-black text-xs font-bold rounded-full">
                    MÉS DEMANAT
                  </span>
                )}

                <h3 className="text-xl font-bold">{pack.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-orange-400">{pack.price}€</span>
                </div>
                <p className="text-sm text-white/50 mt-1">{pack.hours} hores</p>

                <ul className="mt-6 space-y-2">
                  {pack.includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="text-orange-500 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/contacto?tema=halloween&pack=${encodeURIComponent(pack.name)}`}
                  className={`mt-6 block w-full text-center py-3 rounded-full font-medium transition-all ${
                    pack.popular
                      ? 'bg-orange-500 hover:bg-orange-400 text-black'
                      : 'border border-white/20 hover:border-white/40 text-white'
                  }`}
                >
                  Sol·licitar info
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          TESTIMONI
          ======================================== */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-orange-950/10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6">🎃</div>
          <blockquote className="text-2xl md:text-3xl font-medium italic text-white/90">
            "La millor festa de Halloween que hem fet mai. Els nens no paraven de cridar
            d'emoció (i una mica de por!). Repetirem segur."
          </blockquote>
          <p className="mt-6 text-white/50">
            — Família Martínez, Halloween 2024
          </p>
        </div>
      </section>

      {/* ========================================
          CTA FINAL
          ======================================== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Preparat per una nit<br />
            <span className="text-orange-500">terroríficament bona?</span>
          </h2>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link
              href="/contacto?tema=halloween"
              className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-black font-bold text-lg rounded-full transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>👻</span> Reserva Halloween 2025
            </Link>
            <Link
              href="https://wa.me/34699121023?text=Hola!%20Vull%20info%20sobre%20festes%20Halloween"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-white/30 hover:border-white/60 text-white font-semibold rounded-full transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>💬</span> WhatsApp directe
            </Link>
          </div>

          <p className="mt-8 text-white/50 text-sm">
            📍 Barcelona i Girona · ⚡ Resposta en 2 hores · ✓ Sense compromís
          </p>
        </div>
      </section>
    </main>
  );
}
