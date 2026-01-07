# 🛡️ Sentry Setup - Guía Rápida

## ⚡ Configuración en 5 Minutos

### Paso 1: Crear Cuenta en Sentry
1. Ve a https://sentry.io/signup/
2. Crea cuenta gratuita (10k errors/mes gratis)
3. Selecciona "Next.js" como plataforma

### Paso 2: Obtener Credenciales
Después de crear el proyecto, obtendrás:

```
DSN: https://[key]@[org].ingest.sentry.io/[project-id]
Organization Slug: [tu-org]
Project Slug: orbitaevents
```

### Paso 3: Configurar en Vercel

#### A) Via Vercel Dashboard (Recomendado)
1. Ve a https://vercel.com/orbitaeventsoficial/orbitaevents-web
2. Settings → Environment Variables
3. Añade estas variables:

```bash
# Production
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=orbitaevents
SENTRY_AUTH_TOKEN=sntrys_xxx

# También añadirlas en Preview y Development
```

#### B) Via Vercel CLI
```bash
vercel env add NEXT_PUBLIC_SENTRY_DSN
# Pega el DSN cuando te lo pida

vercel env add SENTRY_ORG
vercel env add SENTRY_PROJECT
vercel env add SENTRY_AUTH_TOKEN
```

### Paso 4: Generar Auth Token

1. Ve a https://sentry.io/settings/account/api/auth-tokens/
2. Click "Create New Token"
3. Permisos necesarios:
   - `project:read`
   - `project:releases`
   - `org:read`
4. Copia el token (empieza con `sntrys_`)

### Paso 5: Redeploy

```bash
# Desde tu local
git commit --allow-empty -m "trigger: enable sentry"
git push

# O desde Vercel Dashboard
Deployments → ... → Redeploy
```

### Paso 6: Verificar

1. Ve a https://sentry.io/issues/
2. Debería aparecer "Waiting for first event"
3. Visita https://orbitaevents.com
4. Si hay algún error, aparecerá en Sentry

### Paso 7: Test Manual (Opcional)

Añade un error de prueba temporalmente:

```tsx
// En cualquier página client component
useEffect(() => {
  if (process.env.NODE_ENV === 'production') {
    // Descomentar para test
    // throw new Error('Sentry test error');
  }
}, []);
```

---

## 🎯 Configuración Avanzada

### Alertas por Email

1. Sentry Dashboard → Alerts → Create Alert
2. Select "Issues"
3. Configure:
   - When: First seen
   - Then: Send email to: tu@email.com

### Slack Integration

1. Settings → Integrations → Slack
2. Connect workspace
3. Create alert rule → Send to Slack

### Performance Monitoring

Ya está configurado con `tracesSampleRate: 0.1` (10% de requests)

Para aumentar:
```ts
// sentry.server.config.ts
tracesSampleRate: 0.5, // 50% de requests
```

---

## 📊 Qué Monitorea Sentry

✅ **Client-side Errors**
- JavaScript exceptions
- Unhandled promise rejections
- Console errors

✅ **Server-side Errors**
- API route errors
- Server component errors
- Middleware errors

✅ **Performance**
- Page load times
- API response times
- Database query times

✅ **Session Replay** (10% de sessions)
- Video de lo que hizo el usuario
- Clicks, scrolls, inputs
- Ideal para debugging

---

## 🔍 Usando Sentry

### Ver Errores
https://sentry.io/organizations/[org]/issues/

### Ver Performance
https://sentry.io/organizations/[org]/performance/

### Ver Session Replays
https://sentry.io/organizations/[org]/replays/

---

## ⚠️ Troubleshooting

### "No events received"
- Verifica que `NEXT_PUBLIC_SENTRY_DSN` está en Vercel
- Asegúrate de que es `NEXT_PUBLIC_` (con prefijo)
- Redeploy después de añadir variables

### "Source maps not uploading"
- Verifica `SENTRY_AUTH_TOKEN`
- Token necesita permisos `project:releases`

### "Too many events"
- Reduce `tracesSampleRate` a 0.05 (5%)
- Ajusta `replaysSessionSampleRate` a 0.05

---

## 💰 Plan Gratuito

**Límites:**
- 10,000 errors/mes
- 10,000 performance events/mes
- 50 session replays/mes
- 1 proyecto

**Si necesitas más:** Upgrade a $29/mes (100k errors)

---

## ✅ Checklist

- [ ] Cuenta Sentry creada
- [ ] Proyecto Next.js creado en Sentry
- [ ] `NEXT_PUBLIC_SENTRY_DSN` añadido en Vercel
- [ ] `SENTRY_ORG` añadido en Vercel
- [ ] `SENTRY_PROJECT` añadido en Vercel
- [ ] `SENTRY_AUTH_TOKEN` generado y añadido
- [ ] Redeployado en Vercel
- [ ] Primer evento recibido en Sentry
- [ ] Alerta de email configurada

---

**Tiempo estimado:** 10-15 minutos

**¿Problemas?** Consulta https://docs.sentry.io/platforms/javascript/guides/nextjs/
