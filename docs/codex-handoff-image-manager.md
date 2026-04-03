# Image Manager — Handoff per Codex

**Data**: 2026-04-02
**Estat**: Frontend complet, falta API backend + model Prisma

---

## Què ja existeix (NO tocar)

### 1. Config — `app/admin/image-manager/image-manager-config.ts`

Tipus i dades estàtiques:

```ts
type ImageManagerSectionId = 'home' | 'services' | 'themes' | 'portfolio' | 'seo' | 'layout';

interface ImageManagerSection { id, name, icon, description }
interface ImagePlacementDefinition { key, section, label, description, target }

export const IMAGE_MANAGER_SECTIONS   // 6 seccions
export const IMAGE_MANAGER_PLACEMENTS // 40 placements reals auditats
```

**Claus de placement** (el camp `key` és l'identificador estable):

| Secció | Claus |
|--------|-------|
| home | `home.hero.slides`, `home.servicesCards.{bodas,halloween,monmagic,fiestas,empresas}`, `home.portfolioShowcase`, `home.clientLogos` |
| services | `services.{bodas,fiestas,empresas,discomovil}.hero`, `services.{bodas,discomovil,fiestas}.gallery` |
| themes | `themes.halloween.{hero,gallery}`, `themes.monmagic.{hero,featured,cartell,gallery}` |
| portfolio | `portfolio.category.{bodas,discomovil,fiestas-privadas,eventos-empresa,fiestas-infantiles,produccion-tecnica,alquiler-equipo,halloween,monmagic}.cover` |
| seo | `seo.og.{default,halloween,monmagic}` |
| layout | `layout.logo.{header,admin}`, `layout.favicon.{main,halloween,monmagic}`, `layout.appleTouchIcon` |

### 2. UI — `app/admin/image-manager/page.tsx`

Pàgina `'use client'` completa. Funcionalitat:
- Filtre per secció (sidebar amb pills)
- Cerca per text (key, label, description, target)
- Per cada placement: mode `auto`/`manual`, URL manual, alt text manual
- Preview de la imatge si hi ha URL
- Comptador de canvis pendents + botó "Desar canvis"
- Botó "Revertir" per placement individual

### 3. Navegació
- Registrada a `app/admin/components/nav-items.ts` (secció "Avançat", icona 🖼️)
- Label a `lib/constants/admin.ts` → `ADMIN_PAGE_LABELS['image-manager']`
- Loading skeleton a `app/admin/image-manager/loading.tsx`

---

## Què ha de construir Codex

### A. API Route — `app/api/admin/image-manager/route.ts`

El frontend ja crida:

**GET** `/api/admin/image-manager`
```json
{
  "ok": true,
  "sections": ImageManagerSection[],       // de IMAGE_MANAGER_SECTIONS
  "placements": PlacementRow[]             // IMAGE_MANAGER_PLACEMENTS + override de DB
}
```

Cada `PlacementRow` és:
```ts
ImagePlacementDefinition & {
  override: {
    src?: string;    // URL manual (null si auto)
    alt?: string;    // alt text manual (null si auto)
    mode?: 'auto' | 'manual';
    updatedAt?: string;  // ISO timestamp
  }
}
```

**PUT** `/api/admin/image-manager`
```json
// Request body:
{
  "modifications": {
    "home.servicesCards.bodas": { "mode": "manual", "src": "/img/custom.avif", "alt": "Boda" },
    "seo.og.default": { "mode": "auto" }
  }
}

// Response:
{ "ok": true }
```

### B. Model Prisma

Proposta (adaptar al vostre criteri):

```prisma
model ImageOverride {
  id        String   @id @default(cuid())
  key       String   @unique           // "home.servicesCards.bodas"
  mode      String   @default("auto")  // "auto" | "manual"
  src       String?                    // URL quan mode = manual
  alt       String?                    // alt text quan mode = manual
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  @@index([key])
}
```

### C. Lògica GET

```
1. Importar IMAGE_MANAGER_SECTIONS i IMAGE_MANAGER_PLACEMENTS del config
2. Llegir tots els ImageOverride de la DB
3. Fer merge: per cada placement, afegir el camp `override` (de DB o { mode: 'auto' } per defecte)
4. Retornar { ok: true, sections, placements }
```

### D. Lògica PUT

```
1. Validar que cada key del body existeixi a IMAGE_MANAGER_PLACEMENTS
2. Upsert cada override (key com a unique constraint)
3. Si mode = 'auto', opcionalment esborrar el registre o posar src/alt a null
4. Retornar { ok: true }
```

### E. Consum dels overrides als components (futur)

Quan el backend estigui llest, els components que consumeixen imatges hauran de:
1. Cridar un helper `getImageOverride(key)` server-side
2. Si `mode === 'manual'` i hi ha `src`, usar-la en lloc del fallback
3. Si `mode === 'auto'`, mantenir la jerarquia actual (DB portfolio → constants → fallback)

Exemples de components afectats (camp `target` del config):
- `MobileServicesCards` → `FALLBACK_SERVICE_IMAGES`
- `HeroElegant` / `MobileHeroUltimate` → `HERO_MEDIA_DEFAULT_ITEMS`
- `publicServiceMediaService.ts` → `getPublicServiceHeroImage()`, `getPublicServiceGalleryImages()`
- `portfolio-images.ts` → `PORTFOLIO_CATEGORIES[].cover`

---

## Regles

- **NO tocar** `image-manager-config.ts` ni `page.tsx` — ja estan testejats i integrats
- La clau `key` és l'identificador estable entre frontend i backend — no canviar-la
- Protegir l'API amb el middleware admin auth existent (`requireAdminAuth`)
- CSRF: el frontend ja usa `fetchWithCsrf` — l'API ha de validar el token CSRF com la resta d'APIs admin
- Les respostes sempre han de tenir `{ ok: boolean, error?: string }`
