"use client";

import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { motion } from 'framer-motion';
import { Mic, Users, Clock, Check, ArrowRight, Star, ChevronDown } from 'lucide-react';
import { ANIMACIO_PRODUCTS } from '@/lib/constants/animacio-products';

export default function AnimacioClient() {
  return (
    <div className="space-y-8 pb-20">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-start overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <Image
            src="/img/animacion/bingo-musical.jpg"
            alt="Animació musical — Bingo Musical en acció"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,146,60,0.15)_0%,_transparent_60%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-10 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/15 rounded-full border border-orange-500/30 mb-6">
              <Mic className="w-4 h-4 text-orange-400" />
              <span className="text-orange-300 text-sm font-medium">Animació Musical per a Adults</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Festes que la gent
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                recorda
              </span>
            </h1>

            <p className="text-xl text-white/75 max-w-2xl mx-auto mb-8">
              DJ, animació musical i il·luminació per als moments més especials.
              Barcelona i Girona. Pressupost en 2h.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contacto?servicio=animacion"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-full shadow-lg hover:shadow-orange-500/30 transition-all hover:scale-105"
              >
                Demanar pressupost
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/configurador?type=animacion"
                className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-medium rounded-full hover:bg-white/5 transition-all"
              >
                Configurar la meva festa
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <span className="text-xs uppercase tracking-widest">Veure propostes</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* Productes */}
      <section className="container mx-auto px-4 pt-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Escull la teva proposta
          </h2>
          <p className="text-white/60 max-w-xl mx-auto">
            Dues propostes d&apos;animació musical úniques, adaptades a tots els públics i espais.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {ANIMACIO_PRODUCTS.filter(p => p.id !== 'dj').map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden hover:border-orange-500/30 transition-all"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">{product.nom}</h3>
                  {product.durada && (
                    <span className="flex items-center gap-1 text-sm text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1">
                      <Clock className="w-3 h-3" />
                      {product.durada}
                    </span>
                  )}
                </div>

                {product.descripcio.map((parag, j) => (
                  <p key={j} className="text-white/70 text-sm mb-3 leading-relaxed">
                    {parag}
                  </p>
                ))}

                <ul className="space-y-2 my-6">
                  {product.inclou.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-white/80">
                      <Check className="w-4 h-4 text-orange-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                {product.noInclou && (
                  <p className="text-xs text-white/40 mb-6">{product.noInclou}</p>
                )}

                {product.trams && (
                  <div className="space-y-2 border-t border-white/10 pt-6">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Preus</p>
                    {product.trams.map((tram) => (
                      <div key={tram.participants} className="flex items-center justify-between py-2 border-b border-white/5">
                        <div>
                          <p className="text-sm text-white/80">{tram.participants}</p>
                          <p className="text-xs text-white/50">{tram.team}</p>
                        </div>
                        <span className="text-base font-bold text-orange-400">
                          {tram.price !== null ? `${tram.price}€` : 'A mida'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-8 pb-8">
                <Link
                  href={`/contacto?servicio=animacion&pack=${product.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500/15 border border-orange-500/30 text-orange-300 font-semibold rounded-xl hover:bg-orange-500/25 transition-all"
                >
                  Demanar pressupost per a {product.nom}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* DJ complement */}
      <section className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Complement opcional</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Servei de DJ</h3>
            <p className="text-white/60 mb-4">
              DJ professional amb equip complet inclòs. Música en directe adaptada al vostre event.
              Ideal com a complement o per tancar la nit.
            </p>
            <div className="flex flex-wrap gap-3">
              {ANIMACIO_PRODUCTS.find(p => p.id === 'dj')?.djOptions?.map((opt) => (
                <div key={opt.label} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5">
                  <p className="text-sm font-semibold text-white">{opt.label}</p>
                  <p className="text-base font-bold text-amber-400">{opt.price !== null ? `${opt.price}€` : 'A mida'}</p>
                  <p className="text-xs text-white/50">{opt.sublabel}</p>
                  {opt.standalonePrice != null && (
                    <p className="text-xs text-white/35 line-through">{opt.standalonePrice}€ sense pack</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <Link
            href="/contacto?servicio=animacion&pack=dj"
            className="shrink-0 px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all"
          >
            Demanar DJ
          </Link>
        </div>
      </section>

      {/* Info / confiança */}
      <section className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: <Users className="w-6 h-6 text-orange-400" />, title: 'Per a 15–160 persones', desc: 'Adaptem el nostre equip al mida del vostre grup.' },
            { icon: <Clock className="w-6 h-6 text-orange-400" />, title: 'Pressupost en 2h', desc: 'Resposta ràpida i sense compromisos.' },
            { icon: <Star className="w-6 h-6 text-orange-400" />, title: '+500 events', desc: 'Experiència real a Barcelona, Girona i tota Catalunya.' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              {item.icon}
              <h4 className="text-lg font-bold text-white mt-3 mb-1">{item.title}</h4>
              <p className="text-white/60 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Preparat per a una festa inoblidable?
          </h2>
          <p className="text-white/60 mb-8">
            Contacta&apos;ns avui i rep el teu pressupost personalitzat en menys de 2 hores.
          </p>
          <Link
            href="/contacto?servicio=animacion"
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-full shadow-lg hover:shadow-orange-500/30 transition-all hover:scale-105"
          >
            Demanar pressupost
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
