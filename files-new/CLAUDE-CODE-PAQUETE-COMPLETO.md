# 🚀 ÒRBITA EVENTS - PAQUETE DEFINITIVO PARA CLAUDE CODE

## INSTRUCCIONES

Copia TODO este documento y pégalo en Claude Code. Él ejecutará cada tarea.

---

# TAREA 1: NUEVO HERO BRUTAL (CATALÁN)

Reemplaza el archivo `app/components/home/HeroCinematic.tsx` con este código.
Primero haz backup como `HeroCinematic-backup.tsx`.

```tsx
'use client';

/**
 * HeroCinematic.tsx - VERSIÓ BRUTAL
 * 
 * Canvis clau:
 * - "A les 4am la teva sogra ballava descalça" → Imatge mental
 * - "Això fem." → Confiança brutal (2 paraules)
 * - Formulari com a CTA principal (no WhatsApp)
 * - Escassetat real: "Gener: queden 2 dissabtes"
 * - Botó fix a mòbil sempre visible
 * - SENSE loader
 */

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function HeroCinematic() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Apareix immediatament, sense loader
    setIsVisible(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-black">
      {/* VIDEO BACKGROUND - Sense espera */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setIsVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          isVideoLoaded ? 'opacity-40' : 'opacity-0'
        }`}
        poster="/img/hero-home-visual.jpg"
      >
        <source src="/video/hero.mp4" type="video/mp4" />
      </video>

      {/* Gradient mentre carrega - ja visible */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-black transition-opacity duration-700 ${
          isVideoLoaded ? 'opacity-60' : 'opacity-100'
        }`}
      />

      {/* Overlays per llegibilitat */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* CONTINGUT */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        className="relative z-10 min-h-[100svh] flex flex-col justify-center items-center text-center px-4 sm:px-6 pt-24 pb-36 sm:pb-24"
      >
        {/* HEADLINE BRUTAL - Imatge mental */}
        <motion.h1 variants={itemVariants} className="max-w-4xl">
          <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white/90 leading-tight">
            A les 4am la teva sogra
          </span>
          <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight mt-2">
            ballava descalça
          </span>
        </motion.h1>

        {/* PUNCH LINE - 2 paraules */}
        <motion.p
          variants={itemVariants}
          className="mt-6 sm:mt-8 text-xl sm:text-2xl md:text-3xl font-bold text-amber-400"
        >
          Això fem.
        </motion.p>

        {/* SERVEIS - Icones minimalistes */}
        <motion.p
          variants={itemVariants}
          className="mt-5 text-base sm:text-lg text-white/70 tracking-wide"
        >
          DJ · So · Llums · Màgia
        </motion.p>

        {/* UBICACIÓ + RESPOSTA - Una línia */}
        <motion.div
          variants={itemVariants}
          className="mt-4 flex items-center gap-2 text-sm text-white/50"
        >
          <span>📍 Barcelona + Girona</span>
          <span className="text-white/30">·</span>
          <span>⚡ Resposta en 2h</span>
        </motion.div>

        {/* CTA PRINCIPAL - FORMULARI */}
        <motion.div variants={itemVariants} className="mt-8 sm:mt-10 w-full sm:w-auto">
          <Link
            href="/contacto"
            className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg rounded-full transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-amber-400/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>📝</span>
            <span>Demana Pressupost Gratis</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>

        {/* CTAs SECUNDARIS - Petits, discrets */}
        <motion.div
          variants={itemVariants}
          className="mt-4 flex items-center gap-4 text-sm"
        >
          <Link
            href="https://wa.me/34699121023?text=Hola!%20Vull%20info%20sobre%20un%20event"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-green-400 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>WhatsApp</span>
          </Link>
          <span className="text-white/20">·</span>
          <Link
            href="tel:+34699121023"
            className="text-white/50 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>📞</span>
            <span>Trucar</span>
          </Link>
        </motion.div>

        {/* ESCASSETAT - Badge vermell */}
        <motion.div variants={itemVariants} className="mt-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-sm font-medium backdrop-blur-sm">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            Gener 2025: queden 2 dissabtes
          </span>
        </motion.div>
      </motion.div>

      {/* SCROLL INDICATOR - Només desktop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2"
        >
          <div className="w-1 h-2 bg-white/40 rounded-full" />
        </motion.div>
      </motion.div>

      {/* CTA FIX MÒBIL - Sempre visible */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black via-black/95 to-transparent sm:hidden">
        <Link
          href="/contacto"
          className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-amber-500 active:bg-amber-600 text-black font-bold text-base rounded-full shadow-lg shadow-amber-500/30"
        >
          <span>📝</span>
          <span>Pressupost Gratis</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

export default HeroCinematic;
```

---

# TAREA 2: ELIMINAR EL LOADER MOLESTO

Busca el archivo que contiene el loader "Lanzando Òrbita… ¡WOW en 3s!" y:
1. Elimina el componente de loader completamente
2. O reduce su tiempo a 0ms
3. El archivo probablemente está en `app/components/ui/Loader.tsx` o en el layout

Si está en el layout (`app/[locale]/layout.tsx`), busca y elimina cualquier:
- `<Loader />`
- `useState` relacionado con loading
- `setTimeout` de 3 segundos

El contenido debe aparecer INMEDIATAMENTE.

---

# TAREA 3: ARREGLAR EL METADATA (SEO)

En `app/[locale]/page.tsx`, actualiza el metadata:

```tsx
export const metadata: Metadata = {
  title: 'DJ Bodes i Events Barcelona | Des de 400€ | Òrbita Events',
  description: 'DJ professional per bodes, festes i esdeveniments a Barcelona i Girona. Discomòbil amb so 4000W, llums LED, efectes especials i tematització única. Pressupost en 2h.',
  keywords: ['dj bodes barcelona', 'discomòbil barcelona', 'dj esdeveniments', 'festes tematitzades', 'halloween barcelona', 'bodes harry potter'],
  openGraph: {
    title: 'DJ Bodes i Events Barcelona | Des de 400€ | Òrbita Events',
    description: 'DJ + So + Llums + Efectes + Tematització. Barcelona i Girona. Pressupost gratis.',
    images: [{ url: '/og-home.jpg', width: 1200, height: 630, alt: 'Òrbita Events - DJ Bodes Barcelona' }],
  },
};
```

---

# TAREA 4: CSS MILLORES GLOBALS

Añade esto al final de `app/globals.css`:

```css
/* ================================
   ÒRBITA EVENTS - MILLORES UI
   ================================ */

/* Transicions suaus globals */
* {
  scroll-behavior: smooth;
}

/* Hover cards serveis */
.service-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

/* Animació fade-in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

/* Animació per elements que entren */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-slide-up {
  animation: slideUp 0.6s ease-out forwards;
}

/* Delays per stagger */
.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
.delay-400 { animation-delay: 400ms; }
.delay-500 { animation-delay: 500ms; }

/* Millora focus states per accessibilitat */
a:focus-visible,
button:focus-visible {
  outline: 2px solid #f59e0b;
  outline-offset: 2px;
}

/* Smooth hover per links */
a {
  transition: color 0.2s ease, opacity 0.2s ease;
}

/* Fix per iOS safe areas */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 1rem);
}

/* Gradient text millor */
.text-gradient {
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Glow effect per CTAs */
.glow-amber {
  box-shadow: 0 0 30px rgba(245, 158, 11, 0.4);
}

.glow-amber:hover {
  box-shadow: 0 0 40px rgba(245, 158, 11, 0.6);
}

/* Video background millor rendiment */
video {
  will-change: opacity;
}

/* Skeleton loading */
.skeleton {
  background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Mobile tap highlight */
@media (hover: none) {
  button, a {
    -webkit-tap-highlight-color: rgba(245, 158, 11, 0.2);
  }
}
```

---

# TAREA 5: ARREGLAR SERVICIOS GRID

Busca el componente de servicios (probablemente `app/components/home/ServicesGrid.tsx`) y:

1. Cambia el badge "El més demanat" de Festes a Bodes
2. O elimina el badge completamente (más limpio)
3. Añade la clase `service-card` a cada card para el hover effect

```tsx
// Ejemplo de cómo debería quedar cada card:
<Link
  href="/servicios/bodas"
  className="service-card group block bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/50 transition-colors"
>
  {/* ... resto del contenido */}
</Link>
```

---

# TAREA 6: SIMPLIFICAR STATS DEL HERO

Si hay stats separadas en el hero actual como:
```
2+ anys | dedicació | BCN + Girona | 2h Resposta
```

Elimínalas. El nuevo hero ya tiene "📍 Barcelona + Girona · ⚡ Resposta en 2h" integrado de forma más limpia.

---

# TAREA 7: COMMIT Y PUSH

Cuando hayas hecho todos los cambios:

```bash
git add .
git commit -m "feat: Hero BRUTAL amb copy que converteix + eliminat loader + CSS millores

- Nou headline: 'A les 4am la teva sogra ballava descalça'
- Formulari com a CTA principal
- Eliminat loader de 3 segons
- Afegit botó fix a mòbil
- Badge escassetat: 'Gener: queden 2 dissabtes'
- Millores CSS globals per hover i animacions
- SEO metadata actualitzat"

git push origin main
```

---

# RESUMEN DE CAMBIOS

| Antes | Después |
|-------|---------|
| "DJ y Discomóvil para Bodas..." | "A les 4am la teva sogra ballava descalça" |
| Loader 3 segundos | Carga instantánea |
| WhatsApp = CTA principal | Formulario = CTA principal |
| Stats confusas | Una línea limpia |
| Sin urgencia | "Gener: queden 2 dissabtes" |
| Sin CTA fijo móvil | Botón siempre visible |
| Hover básico | Hover con elevación y sombra |

---

# VERIFICACIÓN FINAL

Después del deploy, verifica en https://orbitaevents.com:

1. ✅ Hero carga instantáneamente (sin loader)
2. ✅ Headline "A les 4am la teva sogra ballava descalça"
3. ✅ Botón principal va a /contacto
4. ✅ En móvil: botón fijo abajo siempre visible
5. ✅ Badge rojo de escasez visible
6. ✅ Hover en cards de servicios funciona

¡Dale caña! 🔥
