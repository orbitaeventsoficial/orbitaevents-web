# 🎯 MEJORAS ADICIONALES - OTRAS SECCIONES

Usa esto como segunda fase después del Hero.

---

# SECCIÓN SERVICIOS - Más punch

## Problema actual:
```
"Aniversaris, festes a casa, comunions, festes majors. 
Discomòbil completa on vulguis."
```
Descripción. Aburrido. No vende.

## Solución:
```
"La disco va a tu casa.
Tú solo disfruta."
```
Beneficio. Emoción. Venta.

---

## NUEVO COPY SERVICIOS (para Claude Code):

Busca el componente de servicios y actualiza los textos:

### BODES:
```
Abans: "Des de la cerimònia fins a l'últim ball. So, llums i coordinació perfecta."
Després: "Que el teu primer ball faci plorar a la teva mare."
```

### FESTES:
```
Abans: "Aniversaris, festes a casa, comunions, festes majors. Discomòbil completa on vulguis."
Després: "La disco va a tu casa. Tu només gaudeix."
```

### EMPRESES:
```
Abans: "Dinars d'empresa, inauguracions, convencions. Professionalitat garantida."
Després: "Que recordin la teva empresa, no el DJ."
```

---

# SECCIÓN "PER QUÈ NOSALTRES" - Más directo

## Problema actual:
Demasiado texto explicativo.

## Solución - 3 bullets potentes:

```tsx
// Nuevo componente WhyUs simplificado
<section className="py-20 bg-black">
  <div className="container mx-auto px-4 max-w-4xl">
    <h2 className="text-3xl font-bold text-white text-center mb-12">
      Per què nosaltres?
    </h2>
    
    <div className="grid md:grid-cols-3 gap-8 text-center">
      <div>
        <span className="text-4xl mb-4 block">🎯</span>
        <h3 className="text-xl font-bold text-white mb-2">
          Venim del sector
        </h3>
        <p className="text-white/60">
          Hem treballat en bodes des de dins. Sabem quan va el primer ball.
        </p>
      </div>
      
      <div>
        <span className="text-4xl mb-4 block">🔧</span>
        <h3 className="text-xl font-bold text-white mb-2">
          Sempre amb backup
        </h3>
        <p className="text-white/60">
          Portem equip de reserva. El teu event no s'atura mai.
        </p>
      </div>
      
      <div>
        <span className="text-4xl mb-4 block">🤝</span>
        <h3 className="text-xl font-bold text-white mb-2">
          Parlem amb el venue
        </h3>
        <p className="text-white/60">
          Ens coordinem amb catering, fotògraf i lloc. Tu només gaudeix.
        </p>
      </div>
    </div>
  </div>
</section>
```

---

# SECCIÓN TESTIMONIOS - Más credibilidad

## Problema actual:
Solo 1 testimonio (tu boda). Puede parecer fake.

## Solución:
Ser transparente + añadir contexto

```tsx
// Nuevo enfoque testimonio
<div className="bg-white/5 rounded-3xl p-8 border border-white/10">
  <div className="flex items-start gap-4 mb-6">
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
      👰🤵
    </div>
    <div>
      <p className="text-white font-bold">Lorena i Carles</p>
      <p className="text-white/50 text-sm">La nostra pròpia boda · 2025</p>
      <span className="inline-flex items-center gap-1 text-xs text-green-400 mt-1">
        <span>✓</span> Sí, és la nostra. I per això sabem el que fem.
      </span>
    </div>
  </div>
  
  <blockquote className="text-lg text-white/90 italic">
    "Vam transformar el casament en màgia pura. Veles flotants, sobres amb lacre, 
    l'ambient perfecte. Els convidats encara en parlen."
  </blockquote>
</div>

{/* Añadir nota de transparencia */}
<p className="text-center text-white/40 text-sm mt-6">
  💡 Més testimonis properament. De moment, la nostra experiència parla.
</p>
```

---

# SECCIÓN CTA FINAL - Más foco

## Problema actual:
3 opciones iguales (WhatsApp, Trucada, Formulari)

## Solución:
Formulario destacado, resto secundario

```tsx
<section className="py-20 bg-gradient-to-b from-purple-950/20 to-black">
  <div className="container mx-auto px-4 text-center max-w-2xl">
    <span className="text-5xl mb-4 block">💬</span>
    <h2 className="text-3xl font-bold text-white mb-4">
      Parlem del teu event?
    </h2>
    <p className="text-white/60 mb-8">
      Explica'ns què tens al cap. Sense compromís.
    </p>
    
    {/* CTA PRINCIPAL */}
    <Link
      href="/contacto"
      className="inline-flex items-center gap-2 px-10 py-5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xl rounded-full transition-all hover:scale-105 shadow-lg shadow-amber-500/25"
    >
      <span>📝</span>
      <span>Demana Pressupost</span>
    </Link>
    
    {/* Secundarios - pequeños */}
    <div className="mt-6 flex justify-center items-center gap-4 text-sm text-white/50">
      <Link href="https://wa.me/34699121023" className="hover:text-green-400 transition-colors">
        WhatsApp
      </Link>
      <span>·</span>
      <Link href="tel:+34699121023" className="hover:text-white transition-colors">
        699 121 023
      </Link>
    </div>
    
    <p className="mt-6 text-white/40 text-sm">
      ⚡ Resposta en menys de 2 hores
    </p>
  </div>
</section>
```

---

# FOOTER - Más limpio

## Simplificar a lo esencial:

```tsx
<footer className="py-12 bg-black border-t border-white/10">
  <div className="container mx-auto px-4">
    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Image src="/img/logoplanetatextdreta.svg" alt="Òrbita Events" width={150} height={40} />
      </Link>
      
      {/* Contact */}
      <div className="text-center md:text-right">
        <p className="text-white/80 font-medium">699 121 023</p>
        <p className="text-white/50 text-sm">info@orbitaevents.com</p>
        <p className="text-white/40 text-sm mt-1">Barcelona · Girona · Catalunya</p>
      </div>
    </div>
    
    {/* Legal - muy pequeño */}
    <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-4 text-xs text-white/30">
      <span>© 2025 Òrbita Events</span>
      <Link href="/legal/privacidad" className="hover:text-white/50">Privadesa</Link>
      <Link href="/legal/cookies" className="hover:text-white/50">Cookies</Link>
      <Link href="/legal/terminos" className="hover:text-white/50">Termes</Link>
    </div>
  </div>
</footer>
```

---

# PRIORIDAD DE IMPLEMENTACIÓN

| Orden | Cambio | Impacto | Esfuerzo |
|-------|--------|---------|----------|
| 1 | Hero BRUTAL | 🔥🔥🔥🔥🔥 | Medio |
| 2 | Eliminar loader | 🔥🔥🔥🔥 | Fácil |
| 3 | CSS mejoras | 🔥🔥🔥 | Fácil |
| 4 | Copy servicios | 🔥🔥🔥 | Fácil |
| 5 | CTA final simplificado | 🔥🔥 | Fácil |
| 6 | Footer limpio | 🔥 | Fácil |

---

# COMANDO PARA CLAUDE CODE (TODO JUNTO):

```
Aplica las siguientes mejoras al proyecto orbitaevents-web:

1. HERO: Reemplaza HeroCinematic.tsx con la versión brutal (headline: "A les 4am la teva sogra ballava descalça")

2. LOADER: Elimina completamente el loader de 3 segundos

3. CSS: Añade las mejoras de hover, animaciones y transitions a globals.css

4. SERVICIOS: Actualiza el copy de cada servicio para que sea más emocional y directo

5. CTA FINAL: Simplifica para que el formulario sea el protagonista

6. Haz commit con mensaje descriptivo y push a main

Prioriza Hero y Loader primero. El resto es secundario.
```
