# Diario de trabajo — Òrbita Events

## 2026-02-23

### Contexto
- El repo fue copiado de C: a D:, se perdieron archivos a mitad de un cambio grande
- Se recuperaron 225 archivos desde GitHub para completar el repo
- Se habían hecho 2 auditorías previas de código muerto + inconsistencias
- Se estaba en la 3ª pasada de refactoring cuando crasheó la sesión
- Último commit: `refactor: fase 1 — eliminació codi duplicat i assets morts` (21:20)

### Análisis del repo (estado actual)
- ~19,000 LOC TypeScript
- 132 rutas API, 63 páginas admin, schema Prisma de 1,417 líneas
- Cobertura de tests: ~6%

### Problemas identificados
#### 🔴 Críticos
- `clientes` vs `contactes`: misma entidad, rutas cruzadas, 28+ referencias mezcladas
- Labels de idioma inconsistentes: "Castellà" / "Español" / "Spanish" para el mismo `es`

#### 🟠 Mayores
- `admin/layout.tsx`: 904 líneas (monolítico)
- `admin/page.tsx`: 1,186 líneas (monolítico)
- 326 usos de `any` en TypeScript
- Playwright corriendo contra producción (webServer comentado)
- Middleware de 321 líneas con demasiadas responsabilidades

#### 🟡 Menores
- `formatDate` hardcodeado a `ca-ES` sin i18n
- Constants hardcodeadas en catalán
- TODO sin resolver en `FiestasClient.tsx`

---

### Trabajo en curso
- [x] Unificar rutas `clientes` / `contactes` → todo bajo `/admin/clientes`
  - Contenido real movido de `contactes/[id]` a `clientes/[id]`
  - `contactes/[id]/page.tsx` convertido en redirect a `clientes/[id]`
  - 28 links actualizados a `clientes/[id]`
  - Label "Contactes" eliminado de `mapa/page.tsx` (duplicado)
  - `CustomerTabSelector.tsx` eliminado (dead code)
- [x] Unificar labels de idioma (`es`) → tot "Castellà" a l'admin
  - ClientPortalAccessPanel.tsx, PresupuestoPdfStudio.tsx, text-manager unificats
  - ServiceJsonLD.tsx manté "Spanish" (schema.org requereix anglès)
  - contactes/[id]/_components/ eliminat (codi mort)
- [x] Refactoritzar `admin/layout.tsx` (904 → 717 línies)
  - Nav items extrets a `app/admin/components/nav-items.ts`
  - Lògica d'alertes extreta a `hooks/useAdminAlerts.ts`
  - CSRF fetch wrapper extret a `hooks/useCsrfFetch.ts`
- [x] Refactoritzar `admin/page.tsx` (1,186 → 480 línies)
  - Fetching + processat extrets a `app/admin/lib/dashboard-data.ts`
  - Helpers timeAgo/formatEventDate també al lib
