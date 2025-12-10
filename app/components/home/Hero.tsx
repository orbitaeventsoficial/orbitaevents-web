'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Stats } from './Stats';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black" />
      
      {/* Partícules decoratives (opcional) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      
      {/* Contingut */}
      <div className="container mx-auto px-4 text-center relative z-10">
        
        {/* Badge diferenciador */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur rounded-full mb-6 border border-amber-500/30"
        >
          <span className="text-amber-400">🎯</span>
          <span className="text-amber-300 text-sm font-medium">
            Venim del sector d'esdeveniments
          </span>
        </motion.div>
        
        {/* Títol principal - SEO optimitzat */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
        >
          DJ y Discomóvil para{' '}
          <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            Bodas y Eventos Barcelona
          </span>
        </motion.h1>
        
        {/* Subtítol - La narrativa REAL */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-8"
        >
          No som un DJ qualsevol. Venim del món dels esdeveniments – 
          hem viscut milers de bodes des de dins. 
          <span className="text-white font-medium"> Sabem exactament què fa que el teu event funcioni.</span>
        </motion.p>
        
        {/* Serveis en pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {[
            { icon: '🎵', text: 'DJ Professional' },
            { icon: '💡', text: 'Il·luminació PRO' },
            { icon: '✨', text: 'Efectes Especials' },
            { icon: '🎭', text: 'Tematització' },
          ].map((service) => (
            <span 
              key={service.text}
              className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white text-sm border border-white/10"
            >
              {service.icon} {service.text}
            </span>
          ))}
        </motion.div>
        
        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Link 
            href="/contacto"
            className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-full hover:scale-105 transition-all duration-300 shadow-lg shadow-amber-500/25"
          >
            Demana pressupost 
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">🚀</span>
          </Link>
          <Link 
            href="https://wa.me/34699121023"
            target="_blank"
            className="px-8 py-4 bg-white/10 backdrop-blur text-white font-bold rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            WhatsApp directe 💬
          </Link>
        </motion.div>
        
        {/* Stats honestos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Stats />
        </motion.div>
        
        {/* Indicador scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </motion.div>
        </motion.div>
        
      </div>
    </section>
  );
}
