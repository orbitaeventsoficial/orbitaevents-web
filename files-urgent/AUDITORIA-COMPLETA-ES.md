# 🔴 AUDITORÍA COMPLETA - orbitaevents.com/es

## RESUMEN EJECUTIVO

| Categoría | Errores | Severidad |
|-----------|---------|-----------|
| Mezcla idiomas | 15+ | 🔴 CRÍTICO |
| Loader activo | 1 | 🔴 CRÍTICO |
| UX/UI | 3 | 🟡 MEDIO |
| SEO | 2 | 🟡 MEDIO |

---

# 🔴 ERRORES CRÍTICOS - ARREGLAR YA

## 1. HERO COMPLETO EN CATALÁN (debe ser español)

El hero está hardcodeado en catalán. Necesita usar las traducciones de `messages/es.json`.

### Textos a corregir:

| Actual (MAL) | Correcto (ES) |
|--------------|---------------|
| "A les 4am la teva sogra" | "A las 4am tu suegra" |
| "ballava descalça" | "bailaba descalza" |
| "Això fem." | "Eso hacemos." |
| "DJ · So · Llums · Màgia" | "DJ · Sonido · Luces · Magia" |
| "Resposta en 2h" | "Respuesta en 2h" |
| "Demana Pressupost Gratis" | "Pide Presupuesto Gratis" |
| "Gener 2025: queden 2 dissabtes" | "Enero 2025: quedan 2 sábados" |
| "Pressupost Gratis" (móvil) | "Presupuesto Gratis" |
| "Trucar" | "Llamar" |

---

## 2. SECCIÓN TESTIMONIO - Mezcla idiomas

```
ACTUAL:
"Lorena i Carles"
"Juliol 2025"
"✓ Verificat"
"Has celebrat un event amb nosaltres?"
"Comparteix la teva experiència"

CORRECTO:
"Lorena y Carles"
"Julio 2025"
"✓ Verificado"
"¿Has celebrado un evento con nosotros?"
"Comparte tu experiencia"
```

---

## 3. SECCIÓN CTA FINAL - Todo en catalán

```
ACTUAL:
"Parlem del teu event?"
"Explica'ns què tens al cap. Sense compromís."
"Trucar"
"Formulari"
"Resposta en menys de 2 hores"

CORRECTO:
"¿Hablamos de tu evento?"
"Cuéntanos qué tienes en mente. Sin compromiso."
"Llamar"
"Formulario"
"Respuesta en menos de 2 horas"
```

---

## 4. SECCIÓN "POR QUÉ NOSOTROS" - Error puntual

```
ACTUAL:
"I siempre llevamos equipo de backup"

CORRECTO:
"Y siempre llevamos equipo de backup"
```

---

## 5. FOOTER - Mezcla

```
ACTUAL:
"Des de 2023"

CORRECTO:
"Desde 2023"
```

---

## 6. BOTTOM NAV - Todo en catalán

```
ACTUAL:
"🏠Inici" | "🎵Serveis" | "💬Contacte"

CORRECTO:
"🏠Inicio" | "🎵Servicios" | "💬Contacto"
```

---

## 7. LOADER - ELIMINAR

```
"Lanzando Òrbita… ¡WOW en 3s!"
```

Este loader SIGUE APARECIENDO. Debe eliminarse completamente.

---

# 🟡 ERRORES MEDIOS

## 8. SKIP LINK en catalán
```
ACTUAL: "Saltar al contingut principal"
CORRECTO: "Saltar al contenido principal"
```

## 9. HEADER NAV inconsistente
El menú de navegación puede tener mezcla de idiomas.

## 10. ALT TEXT imágenes
Verificar que los alt text estén en español.

---

# SOLUCIÓN - PROMPT PARA CLAUDE CODE

Copia y pega esto en Claude Code:

```
Necesito arreglar la versión en ESPAÑOL de orbitaevents.com. Hay mezcla de catalán y español por toda la página.

## TAREA 1: Verificar que HeroCinematic.tsx usa traducciones

El hero debe usar `useTranslations` de next-intl, NO texto hardcodeado.

Si está hardcodeado en catalán, cámbialo para que use:
- t('hero.headline1') 
- t('hero.headline2')
- t('hero.punchline')
- etc.

## TAREA 2: Actualizar messages/es.json

Asegúrate de que messages/es.json tiene TODAS estas traducciones:

```json
{
  "hero": {
    "headline1": "A las 4am tu suegra",
    "headline2": "bailaba descalza",
    "punchline": "Eso hacemos.",
    "services": "DJ · Sonido · Luces · Magia",
    "location": "Barcelona + Girona",
    "response": "Respuesta en 2h",
    "cta": {
      "primary": "Pide Presupuesto Gratis",
      "whatsapp": "WhatsApp",
      "call": "Llamar"
    },
    "scarcity": "Enero 2025: quedan 2 sábados",
    "mobileCta": "Presupuesto Gratis"
  },
  "testimonials": {
    "author": "Lorena y Carles",
    "date": "Julio 2025",
    "verified": "Verificado",
    "cta": "¿Has celebrado un evento con nosotros?",
    "ctaButton": "Comparte tu experiencia"
  },
  "ctaSection": {
    "title": "¿Hablamos de tu evento?",
    "subtitle": "Cuéntanos qué tienes en mente. Sin compromiso.",
    "whatsapp": "WhatsApp",
    "call": "Llamar",
    "form": "Formulario",
    "response": "Respuesta en menos de 2 horas"
  },
  "whyUs": {
    "equipment": "Sonido EV 4000W, luces sincronizadas, efectos. Y siempre llevamos equipo de backup. Tu evento no se para nunca."
  },
  "footer": {
    "since": "Desde 2023"
  },
  "nav": {
    "home": "Inicio",
    "services": "Servicios", 
    "contact": "Contacto",
    "skip": "Saltar al contenido principal"
  }
}
```

## TAREA 3: Eliminar el loader

Busca el componente Loader que muestra "Lanzando Òrbita… ¡WOW en 3s!" y:
- Elimínalo completamente
- O pon su duración a 0

## TAREA 4: Verificar todos los componentes

Revisa estos archivos y asegúrate de que usan traducciones:
- app/components/home/HeroCinematic.tsx
- app/components/home/Testimonials.tsx
- app/components/home/CTASection.tsx
- app/components/home/WhyUs.tsx
- app/components/ui/footer.tsx
- app/components/ui/BottomNav.tsx

## TAREA 5: Commit y push

```bash
git add .
git commit -m "fix: Corregir mezcla idiomas ES/CA en toda la web

- Hero ahora usa traducciones correctamente
- Testimonios en español
- CTA final en español  
- Footer y nav en español
- Eliminado/reducido loader"
git push origin main
```
```

---

# VERIFICACIÓN POST-FIX

Después del deploy, verificar en https://orbitaevents.com/es:

| Elemento | Check |
|----------|-------|
| Hero headline | ☐ "A las 4am tu suegra bailaba descalza" |
| Hero punchline | ☐ "Eso hacemos." |
| Hero servicios | ☐ "DJ · Sonido · Luces · Magia" |
| Hero CTA | ☐ "Pide Presupuesto Gratis" |
| Hero escasez | ☐ "Enero 2025: quedan 2 sábados" |
| Testimonio autor | ☐ "Lorena y Carles" |
| Testimonio fecha | ☐ "Julio 2025" |
| Testimonio badge | ☐ "Verificado" |
| CTA final título | ☐ "¿Hablamos de tu evento?" |
| Footer | ☐ "Desde 2023" |
| Bottom nav | ☐ "Inicio / Servicios / Contacto" |
| Loader | ☐ NO aparece |

---

# TAMBIÉN VERIFICAR /ca (CATALÁN)

La versión catalana debe mantener:
- "A les 4am la teva sogra ballava descalça"
- "Això fem."
- etc.

No tocar el catalán, solo arreglar el español.
