# Runbook de portabilitat — Òrbita Events

> Com aixecar el projecte en una màquina nova i què depèn de fora de la carpeta.
> **La carpeta és autosuficient** (#1374): cap ruta absoluta al codi; tot relatiu o via `.env.local`.

## 1. Posar en marxa en una màquina nova

```bash
# 1. Copiar/clonar la carpeta orbitaevents (pot anar a qualsevol disc/ubicació)
# 2. Instal·lar dependències
pnpm install
# 3. Configurar variables d'entorn (secrets)
cp .env.example .env.local        # i omplir els valors reals
# 4. Generar el client de Prisma
npx prisma generate
# 5. Arrencar
pnpm dev                          # http://localhost:3000
```

- **`node_modules`** i **`.next`** es recreen sols (no cal moure'ls).
- **`.env.local`** (secrets) es mou AMB la carpeta si la copies sencera; a màquina nova es recrea des de `.env.example`. **MAI va a git** (gitignorat).
- **`uploads/`** (fitxers pujats) és local i relatiu → es mou amb la carpeta.

## 2. Dependències externes (viuen fora de la carpeta)

Els valors reals viuen a `.env.local` (mai al git). Aquí, el **mapa**: quin servei, per a què, i si és crític.

### Crítics (l'app no arrenca / falla el core sense això)
| Servei | Variable(s) | Per a què | Proveïdor actual |
|---|---|---|---|
| **Base de dades** | `DATABASE_URL` | Tot (Prisma + PostgreSQL) | **Railway** (connexió directa, sense pooler) |
| **Auth admin** | `ADMIN_USER`, `ADMIN_PASS` | Accés a `/admin` | — (credencials pròpies) |
| **CSRF** | `CSRF_SECRET` | Seguretat de mutacions | — (`openssl rand -base64 32`) |
| **Correu SMTP** | `SMTP_HOST/PORT/USER/PASS/FROM` | Enviar emails (confirmacions, contacte) | Servidor IMAP/SMTP propi |
| **Correu IMAP** | `IMAP_HOST/PORT/USER/PASS` | Safata (llegir correu entrant) | Mateix servidor |
| **Google Maps** | `GOOGLE_MAPS_API_KEY` | Distància de transport | **Google Cloud** projecte `sonic-anagram-302412` (clau restringida a Distance Matrix + Routes) |

### Importants (funcions clau, degraden si falten)
| Servei | Variable(s) | Per a què |
|---|---|---|
| **Stripe** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Pagaments (senyal/resta) |
| **Google OAuth + Calendar** | `GOOGLE_OAUTH_*`, `GOOGLE_CALENDAR_*` | Sincronització de calendari |
| **Google Places** | `GOOGLE_PLACES_API_KEY`, `NEXT_PUBLIC_GOOGLE_PLACE_ID` | Ressenyes de Google (clau separada de Maps) |
| **Holded** | `HOLDED_API_KEY` | Facturació |
| **IA** | `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` | Intake (extracció), Next Best Action |
| **SerpApi** | `SERPAPI_KEY` | Cerca inventari/ressenyes (tier 100/mes) |
| **DeepL** | `DEEPL_API_KEY` | Traduccions |
| **OpenWeatherMap** | `OPENWEATHERMAP_API_KEY` | Widget del temps |
| **Upstash Redis** | `UPSTASH_REDIS_REST_URL/TOKEN` | Rate limiting / cache |
| **Turnstile** | `TURNSTILE_SECRET_KEY` | Anti-bot als formularis públics |

### Opcionals (analytics / màrqueting)
`SENTRY_DSN` (errors) · `NEXT_PUBLIC_GTM_ID`/`GA` (analytics) · `GOOGLE_ADS_*` (ads) · `WHATSAPP_API_*` (WhatsApp) · `NEXT_PUBLIC_TAWK_*` (xat).

### Config no-secreta (dades de l'empresa)
`COMPANY_NIF`, `COMPANY_IBAN`, `COMPANY_LEGAL_NAME`, `ORBITA_BASE_ADDRESS` (origen de rutes = Granollers), `SMTP_DOMAIN`, `NEXT_PUBLIC_SITE_URL`.

## 3. Google Cloud (detall)

Projecte `sonic-anagram-302412` (compte `ctreball20@gmail.com`). gcloud CLI a `AppData\Local\Google\Cloud SDK`. La clau de Maps està **restringida** a Distance Matrix + Routes (higiene de seguretat). ⚠️ La **Routes API funciona però Google NO dona peatges** de les rutes d'Òrbita (Túnel del Cadí sense dades; autopistes catalanes gratuïtes des del 2021) → els **peatges es posen a mà**.

## 4. Regla d'or de seguretat

**Els secrets viuen NOMÉS a `.env.local`** (gitignorat). MAI al git: si es publiquessin, quedarien exposats per sempre a l'historial. Per moure a màquina nova, es copien a mà o via un gestor de secrets, mai per commit.
