'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// HERO ELEGANT - Sofisticat, màgic, però subtil
// ═══════════════════════════════════════════════════════════════════════════

export default function HeroElegant() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      
      {/* Background Video/Image */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/img/hero-poster.webp"
          className="w-full h-full object-cover"
        >
          <source src="/videos/hero-orbita.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay elegant - Gradient suau */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/70 via-[#0A0A0A]/40 to-[#0A0A0A]" />
        
        {/* Vignette subtil */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10,10,10,0.4) 100%)'
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Badge superior - Molt subtil */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 mb-8"
          >
            <span className="w-2 h-2 bg-[#C9A962] rounded-full animate-pulse" />
            <span className="text-[#A0A0A0] text-sm tracking-wide">
              Més de 195 events a Catalunya
            </span>
          </motion.div>
          
          {/* Títol principal - Elegant */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-white mb-6 leading-[1.1] tracking-tight">
            No posem música.
            <br />
            <span className="bg-gradient-to-r from-[#D4B978] via-[#C9A962] to-[#A68B4B] bg-clip-text text-transparent">
              Creem experiències.
            </span>
          </h1>
          
          {/* Subtítol - Clean */}
          <p className="text-lg md:text-xl text-[#A0A0A0] max-w-2xl mx-auto mb-10 leading-relaxed">
            DJ professional, tematització i efectes especials per casaments, 
            festes i events corporatius a Barcelona i Girona.
          </p>
          
          {/* CTAs - Elegants */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/configurador"
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A962] to-[#A68B4B] text-[#0A0A0A] font-semibold px-8 py-4 rounded-xl overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(201,169,98,0.3)]"
            >
              {/* Shine effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">Demana Pressupost</span>
              <svg className="w-4 h-4 relative group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            
            <Link
              href="https://wa.me/34699121023"
              target="_blank"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium px-6 py-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
            >
              <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp Directe
            </Link>
          </div>
          
          {/* Trust badges - Subtils */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#666666]"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#C9A962]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Resposta en &lt;2h</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#C9A962]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Equip backup 100%</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#C9A962]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Garantia satisfacció</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Scroll indicator - Subtil */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border border-white/20 rounded-full flex justify-center pt-2"
        >
          <div className="w-1 h-2 bg-[#C9A962] rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
