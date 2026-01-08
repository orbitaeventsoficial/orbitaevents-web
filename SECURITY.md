# 🔐 SECURITY - Òrbita Events

## Resumen de Seguridad

Este documento describe las medidas de seguridad implementadas en la aplicación Òrbita Events.

**Nivel de Seguridad: PROFESIONAL/EMPRESARIAL** ⭐⭐⭐⭐⭐

---

## 🛡️ Capas de Protección

### 1. CSRF Protection (Cross-Site Request Forgery)

**Archivo:** `lib/csrf.ts`

- ✅ Patrón double-submit cookie
- ✅ Firma HMAC con secret seguro
- ✅ Tokens con expiración (1 hora)
- ✅ Validación de entropía del secret (mínimo 32 caracteres)
- ✅ Aplicado en endpoints admin y mutaciones

**Configuración requerida:**
```env
CSRF_SECRET=<32+ caracteres aleatorios>
# Generar: openssl rand -hex 32
```

**Uso en cliente:**
```typescript
import { fetchWithCsrf } from '@/lib/csrf';

const response = await fetchWithCsrf('/api/contact', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

---

### 2. Cloudflare Turnstile (CAPTCHA)

**Archivos:**
- `components/security/TurnstileWidget.tsx` - Componente React
- `lib/turnstile.ts` - Validación server-side

**¿Qué protege?**
- ✅ Spam automatizado
- ✅ Bots maliciosos
- ✅ Ataques de fuerza bruta

**Dónde está implementado:**
- Formulario de contacto (`ContactFormComplete.tsx`)
- Formulario de testimonios (próximamente)

**Configuración requerida:**
```env
# Obtener en: https://dash.cloudflare.com/?to=/:account/turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site-key>
TURNSTILE_SECRET_KEY=<secret-key>
```

**Características:**
- Modo claro/oscuro automático
- Fallback para desarrollo sin configuración
- Validación server-side obligatoria
- Logging de intentos fallidos

---

### 3. Rate Limiting

**Archivo:** `lib/rate-limit.ts`

Protección contra abuso por endpoint:

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `/api/contact` | 5 requests | 5 min |
| `/api/privacy` | 3 requests | 30 min |
| `/api/testimonials` | 3 requests | 1 hora |
| `/api/upload` | 10 requests | 1 hora |
| API General | 100 requests | 1 min |
| Admin Auth | 5 intentos | 15 min |

**Tecnología:**
- Upstash Redis (producción - distribuido)
- In-memory (desarrollo - fallback)

**Configuración:**
```env
# Opcional - usa fallback in-memory si no está configurado
UPSTASH_REDIS_REST_URL=<url>
UPSTASH_REDIS_REST_TOKEN=<token>
```

---

### 4. Validación de Inputs

**Biblioteca:** Zod v3

Todos los endpoints validan:
- ✅ Tipos de datos
- ✅ Longitudes mínimas/máximas
- ✅ Formatos (email, teléfono, URL)
- ✅ Valores requeridos vs opcionales

**Sanitización adicional:**
- `escapeHtml()` - Previene XSS
- `sanitizeEmail()` - Normaliza emails
- `sanitizePhone()` - Limpia teléfonos

---

### 5. Autenticación Admin

**Archivos:**
- `middleware.ts` - Verificación en edge
- `lib/auth.ts` - Helpers de autenticación

**Protección:**
- ✅ Basic HTTP Authentication
- ✅ Credenciales desde variables de entorno
- ✅ Rate limiting anti fuerza bruta (5 intentos / 15 min)
- ✅ CSRF adicional en mutaciones

**Configuración requerida:**
```env
ADMIN_USER=<usuario>
ADMIN_PASS=<contraseña-segura-16+caracteres>
```

**Rutas protegidas:**
- `/admin/*` - Panel de administración
- `/api/admin/*` - API de administración

---

### 6. Security Headers (HTTP)

**Archivo:** `next.config.mjs`

Headers implementados:
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Content-Security-Policy` (CSP estricto)
- ✅ `Permissions-Policy` (deshabilita permisos sensibles)

**CSP (Content Security Policy):**
- Scripts: Solo de dominios autorizados + inline necesario
- Estilos: Solo de dominios autorizados + inline
- Imágenes: Self + CDNs autorizados
- Frames: Solo YouTube, Vimeo, Cloudflare
- Connect: APIs autorizadas únicamente

---

### 7. Protección XSS

**Archivo:** `lib/utils/sanitize.ts`

**Funciones:**
- `escapeHtml()` - Escapa caracteres HTML peligrosos
- React JSX - Escapado automático por defecto

**Uso:**
```typescript
import { escapeHtml } from '@/lib/utils/sanitize';

const safeHtml = escapeHtml(userInput);
```

---

### 8. SQL Injection Prevention

**ORM:** Prisma Client

- ✅ Queries parametrizadas automáticamente
- ✅ Type-safe
- ✅ Sin concatenación de strings

---

## 🔑 Variables de Entorno Requeridas

### Seguridad Crítica
```env
# CSRF Protection (OBLIGATORIO)
CSRF_SECRET=

# Admin Authentication (OBLIGATORIO)
ADMIN_USER=
ADMIN_PASS=

# Turnstile CAPTCHA (RECOMENDADO)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

### Opcionales (con fallback)
```env
# Rate Limiting - usa in-memory si no está configurado
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 📋 Checklist de Deployment

Antes de desplegar a producción, verifica:

- [ ] `CSRF_SECRET` configurado (mínimo 32 caracteres)
- [ ] `ADMIN_USER` y `ADMIN_PASS` configurados
- [ ] `ADMIN_PASS` tiene mínimo 16 caracteres
- [ ] `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` configurados
- [ ] Upstash Redis configurado (opcional pero recomendado)
- [ ] CSP headers verificados en navegador
- [ ] Rate limiting probado
- [ ] CAPTCHA probado en formularios

---

## 🚨 Incidentes de Seguridad

Si descubres una vulnerabilidad:

1. **NO** la publiques públicamente
2. Envía un email a: [email de seguridad]
3. Incluye:
   - Descripción detallada
   - Pasos para reproducir
   - Impacto potencial
   - Solución sugerida (opcional)

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [Prisma Security](https://www.prisma.io/docs/guides/database/advanced-database-tasks/sql-injection)

---

**Última actualización:** 2026-01-08
**Responsable:** Equipo de Desarrollo Òrbita Events
