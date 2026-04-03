# TANCAT — Executat 2026-03-31

# Guia de Construcció — Upgrade Visual Global "Premium-Minimal"

## Context

Pàgines públiques del projecte. Algunes SSR (no framer-motion), algunes 'use client'. Totes segueixen l'estètica premium-minimal: fons fosc, accent ambre/or, hover elevation, glows subtils, ZERO partícules.

**Estètica**: Premium-minimal — fons fosc, accent ambre/or, hover elevation, glows subtils. ZERO partícules.

## Estat actual (canvis ja fets)

### Portfolio (`app/[locale]/portfolio/page.tsx`)
- ✅ Hero: gradient title `from-white via-amber-100 to-oe-gold`, text més gran (md:text-7xl), ambient glow subtil
- ✅ Featured cards: hover shadow dramàtic amb glow ambre
- ✅ Grid cards: hover shadow
- ✅ Spacing millorat (py-28, mb-20)

### Portfolio Slug (`app/[locale]/portfolio/[slug]/page.tsx`)
- ✅ Hero title: drop-shadow cinematogràfic
- ✅ Event cards: hover shadow amb glow ambre

### Portfolio Event (`app/[locale]/portfolio/[slug]/[eventSlug]/page.tsx`)
- ✅ Hero title: drop-shadow cinematogràfic
- ✅ CTA primari: hover glow ambre + scale

### Blog (`app/[locale]/blog/page.tsx`)
- ✅ Title: text-7xl, gradient amb via-amber-300
- ✅ PostCard: hover translate-y -1 + shadow 40px
- ✅ CTA botó: scale + glow hover

### GalleryPro (`app/components/GalleryPro.tsx`)
- ✅ MediaCell: hover shadow 32px
- ✅ Lightbox: backdrop-blur, fadeIn animation al overlay
- ✅ Lightbox: scaleIn animation al contingut (scale 0.95→1)
- ✅ Lightbox botons: rounded-full amb bg-white/10, hover amber
- ✅ Lightbox comptador: badge amb bg-white/10 + backdrop-blur

### globals.css
- ✅ Nous keyframes: `fadeIn`, `scaleIn` per al lightbox

### Packs (`app/[locale]/packs/PacksClient.tsx`)
- ✅ Title: tracking-tight, gradient via-amber-300
- ✅ Pack cards: hover translate-y -1 + shadow dramàtic, duration-500
- ✅ CTA botó popular: glow hover
- ✅ Bottom CTA: scale + glow

### Contacte (`app/[locale]/contacto/client.tsx`)
- ✅ Title: text-6xl, tracking-tight, gradient via-amber-300

## Completat — Sessió 2026-03-31 (Claude Code)

### GalleryPro
- ✅ Gestos swipe al lightbox per mòbil (touch start/end → canvi d'imatge)

### PortfolioShowcase (Home)
- ✅ StoryCard hover: shadow glow subtil ambre (60px)
- ✅ Photo transition: blur crossfade (blur 4px al sortir)
- ✅ Dots indicadors: w-5 actiu amb glow, w-1.5 inactiu
- ✅ Title: lg:text-6xl tracking-tight
- ✅ Botó "View all": hover shadow

### Portfolio — Pàgina principal
- ✅ Vinyeta al fons (`oe-vignette`)
- ✅ `oe-grid-pattern` al fons
- ✅ Featured cards: gradient overlay animat al hover (from-amber-900/20)
- ✅ Badge "★ Featured" ambre als 2 primers items

### Portfolio — Detall categoria
- ✅ Hero: vignette overlay (`oe-vignette`)
- ✅ Hero: film grain subtil (`oe-film-grain`)

### Blog — PostCard
- ✅ Featured image: gradient overlay animat al hover
- ✅ Category badge: hover amb bg-white/10
- ✅ Fletxa: translate-x al hover

### Blog — Detall article
- ✅ Hero: vignette overlay, opacity 25%
- ✅ Títol: lg:text-6xl tracking-tight
- ✅ CTA: scale + glow ambre

### About (Nosaltres)
- ✅ Hero: text-8xl, gradient ambre, vignette, ambient glow
- ✅ Stats cards: hover shadow + border glow + icon scale
- ✅ History card: hover shadow + border
- ✅ Services cards: hover -translate-y-1 + shadow + icon scale
- ✅ Guarantees cards: hover -translate-y-1 + shadow + icon glow
- ✅ Tots els h2: md:text-4xl tracking-tight
- ✅ CTA: scale + glow ambre
- ✅ TeamMembersGrid: hover -translate-y-1 + shadow + avatar glow

### Header
- ✅ Dropdown: shadow-black/60
- ✅ Dropdown items: transition-all duration-200

### Footer
- ✅ CTA Configurador: glow ambre hover
- ✅ CTA WhatsApp: glow verd hover

## Què falta (opcional/futur)

- Blog PostCard: featured post (primer) com a col-span-2 horitzontal
- Blog PostCard: dates relatives amb `Intl.RelativeTimeFormat`
- Portfolio empty state millorat
- Portfolio detall: separadors verticals + scroll indicator
- Blog detall: TOC sticky, related posts, share buttons, reading progress bar
- Reading progress bar al top de la pàgina

## Regles a seguir (CRÍTIQUES)

1. **Server components** no poden usar hooks React ni framer-motion directament
2. **ZERO hex hardcoded** — Usar tokens Tailwind
3. **ZERO partícules** — Premium-minimal, no atmosfèric
4. **MONOCAPA** — Cada efecte a un sol lloc
5. **NO tocar lògica** de fetching de dades, serveis, API
6. **NO tocar textos** — Tot ve de `t('key')` via next-intl
7. **Responsive** — Verificar 375px, 768px, 1280px+
8. **Imatges** — Usar `next/image` amb `sizes` correctes, qualitat 65-85
9. **Classes CSS existents** — Reutilitzar `oe-grid-pattern`, `oe-vignette`, `oe-film-grain`, `oe-shimmer` de `globals.css`
10. **Validació**: `npx tsc --noEmit` + captures Playwright

## Fitxers involucrats

| Fitxer | Tipus | Què conté |
|--------|-------|-----------|
| `app/[locale]/portfolio/page.tsx` | Server | Index portfolio — categories grid |
| `app/[locale]/portfolio/[slug]/page.tsx` | Server | Categoria — hero + events + gallery |
| `app/[locale]/portfolio/[slug]/[eventSlug]/page.tsx` | Server | Event — hero + details + gallery + CTA |
| `app/components/GalleryPro.tsx` | Client | Mosaic gallery + lightbox |
| `app/components/marketing/PortfolioShowcase.tsx` | Client | Home showcase horitzontal |
| `app/[locale]/blog/page.tsx` | Server | Index blog — grid de posts |
| `app/[locale]/blog/[slug]/page.tsx` | Server? | Detall article (si existeix) |
| `app/globals.css` | CSS | Classes compartides (`oe-*`) |
| `config/portfolio-images.ts` | Config | Categories + imatges — NO TOCAR |

## Comandes de validació

```bash
pnpm run validate:core
npx tsc --noEmit
pnpm build
```

## Ordre d'execució recomanat

1. GalleryPro lightbox (component client, més impacte visual)
2. Portfolio index (grid pattern, vignette, badges)
3. Portfolio detall (hero polish, strips)
4. Blog PostCard (hover, featured post)
5. Blog detall (si existeix)
6. PortfolioShowcase home

Cada bloc: fer canvis → `npx tsc --noEmit` → captura visual → next bloc.
