# 🎯 PLA DE SIMPLIFICACIÓ ADMIN - ORBITA EVENTS

## DIAGNÒSTIC: Problemes detectats

### ❌ Duplicacions
| Problema | Solució |
|----------|---------|
| `/clientes` i `/contactes` fan el mateix | Unificar en `/clients` |
| `/ressenyes` i `/google-reviews` | Unificar en `/reviews` |
| `/stats` i `/analytics` | Eliminar stats, quedar analytics |
| `/emails` i `/inbox` i `/mensajes` | Unificar en `/inbox` |
| `/translations` ja redirigeix | Eliminar (ja és redirect) |

### ❌ Excessiva fragmentació
**32 carpetes** quan n'haurien de ser **12 màxim**:
- analytics, blog, bookings, calendario, canvas, catalog, clientes, components, contactes, coverage, emails, faq, features, finanzas, google-reviews, inbox, inventory, leads, mensajes, packs, post-event, presupuestos, pricing, rentabilidad, ressenyes, sales-ops, settings, stats, styles, tasks, text-manager, theme, translations

### ❌ Navegació confusa
- Masses opcions al menú
- No està clar què és prioritari
- L'usuari es perd

---

## ✅ NOVA ESTRUCTURA PROPOSTA

```
app/admin/
├── page.tsx                    # Dashboard
├── layout.tsx                  # Layout simplificat
│
├── clients/                    # 👤 CLIENTS (unifica clientes + contactes)
│   ├── page.tsx               # Llista de clients
│   └── [id]/                  # Customer Hub (fitxa client)
│
├── leads/                      # 📥 ENTRADES
│   ├── page.tsx
│   └── [id]/
│
├── bookings/                   # 📅 RESERVES
│   ├── page.tsx
│   └── [id]/
│
├── quotes/                     # 📄 PRESSUPOSTOS (renombrar presupuestos)
│   └── page.tsx
│
├── tasks/                      # ✅ TASQUES
│   └── page.tsx
│
├── calendar/                   # 📆 CALENDARI (renombrar calendario)
│   └── page.tsx
│
├── inbox/                      # 📬 INBOX (absorbeix emails i mensajes)
│   ├── page.tsx
│   └── compose/
│
├── analytics/                  # 📊 ANALÍTICA
│   └── page.tsx
│
├── reviews/                    # ⭐ RESSENYES (unifica ressenyes + google-reviews)
│   └── page.tsx
│
├── post-event/                 # 🎉 POST-ESDEVENIMENT
│   └── page.tsx
│
├── content/                    # ✏️ CONTINGUT (unifica blog + faq + text-manager)
│   ├── blog/
│   ├── faq/
│   └── texts/
│
├── products/                   # 📦 PRODUCTES (unifica packs + pricing + catalog + inventory)
│   ├── packs/
│   ├── extras/
│   └── inventory/
│
├── tools/                      # 🔧 EINES (canvas, sales-ops)
│   ├── canvas/
│   └── automation/
│
└── settings/                   # ⚙️ CONFIGURACIÓ (tot el que és config)
    ├── general/
    ├── integrations/
    ├── coverage/
    ├── theme/
    └── features/
```

---

## NOVA NAVEGACIÓ

### Barra superior (sempre visible)
```
📥 Entrades (badge)  |  👤 Clients  |  📅 Reserves  |  📄 Pressupostos  |  ✅ Tasques
```

### Menú lateral (col·lapsable)
```
OPERATIVA
├── 📆 Calendari
├── 📬 Inbox
└── 📊 Analítica

GESTIÓ
├── ⭐ Ressenyes
├── 🎉 Post-Esdeveniment
└── 📦 Productes

CONTINGUT
├── 📝 Blog
├── ❓ FAQ
└── ✏️ Textos

EINES
├── 🎨 Canvas
└── 🤖 Automatitzacions

⚙️ Configuració
```

---

## SISTEMA D'AJUDA MILLORAT

### Comportament
1. Botó "?" a la capçalera que activa/desactiva mode ajuda
2. Quan està activat:
   - Tots els camps mostren tooltip al hover
   - Apareix llegenda flotant a la dreta
   - Els camps "clicables" tenen highlight

### Components
- `HelpProvider` - Context global
- `HelpTooltip` - Tooltip individual per camp
- `HelpLegend` - Llegenda flotant amb glossari
- `useFieldHelp(fieldKey)` - Hook per obtenir ajuda d'un camp

---

## ORDRE D'IMPLEMENTACIÓ

### Fase 1: Redirects i unificacions
1. Crear redirects de les pàgines antigues a les noves
2. `/clientes` → `/clients`
3. `/contactes` → `/clients`
4. `/mensajes` → `/inbox`
5. `/translations` → `/content/texts`

### Fase 2: Sistema d'ajuda
1. Crear `HelpProvider` amb glossari complet
2. Crear `HelpTooltip` millorat
3. Integrar a tots els formularis

### Fase 3: Simplificar navegació
1. Actualitzar layout.tsx amb nova estructura
2. Reduir opcions del menú

### Fase 4: Consolidar pàgines
1. Moure contingut a les noves ubicacions
2. Eliminar carpetes buides
