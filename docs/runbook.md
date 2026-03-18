# Runbook Operacional — Òrbita Events

Manual de procediments per gestionar incidències i manteniment de la plataforma.

---

## 1. Base de dades (Railway PostgreSQL)

### La BD no respon / connexió refusada

1. **Verificar estat a Railway**: [dashboard.railway.com](https://railway.com/dashboard) → projecte → PostgreSQL → Logs
2. Si Railway reporta downtime → esperar o contactar suport
3. Si la connexió falla des del codi però Railway funciona:
   - Verificar `DATABASE_URL` al `.env` i a Railway Variables
   - Provar connexió manual: `psql "$DATABASE_URL" -c "SELECT 1"`
   - Reiniciar el deploy: Railway dashboard → Redeploy
4. Si persisteix → verificar que no s'ha superat el límit de connexions (Railway free: 10 conn)

### Restaurar backup

```bash
# Des d'un backup SQL comprimit
gunzip -c backup/db-2026-03-18-120000.sql.gz | psql "$DATABASE_URL"

# Des d'un backup JSON (export-backup.ts)
# No hi ha script d'importació automàtic — cal inserir manualment via Prisma Studio
npx prisma studio
```

### Migració de schema

```bash
# 1. Crear migració
npx prisma migrate dev --name descripcio-canvi

# 2. Aplicar a producció
npx prisma migrate deploy

# 3. Si falla la migració a producció:
#    - NO fer rollback manual si Prisma ha marcat la migració com applied
#    - Crear migració correctiva nova
#    - Mai editar migracions ja aplicades
```

### Backup manual

```bash
# Backup SQL complet (recomanat)
./scripts/backup-db.sh

# Backup JSON via Prisma (dades crítiques)
npx tsx scripts/export-backup.ts
```

---

## 2. Crons (tasques programades)

### Llistat de crons

| Cron | Endpoint | Freqüència | Funció |
|------|----------|------------|--------|
| commercial-daily | `/api/admin/crons/commercial-daily` | Diari 8:00 | Lead scoring, recordatoris pagament, alertes |
| invoice-sync | `/api/admin/crons/invoice-sync` | Cada 6h | Sincronitza factures Holded |
| pack-pricing-check | `/api/admin/crons/pack-pricing-check` | Setmanal | Alerta si preus packs divergeixen >15% |

### Un cron no s'executa

1. **Verificar logs**: Railway dashboard → Logs → buscar `[CRON]`
2. **Executar manualment**:
   ```bash
   curl -X POST https://orbitaevents.com/api/admin/crons/commercial-daily \
     -H "Authorization: Bearer $CRON_SECRET"
   ```
3. Si falla amb error 500 → revisar logs Sentry
4. Si falla amb 401 → verificar `CRON_SECRET` a les variables d'entorn

### Recordatoris de pagament no s'envien

1. Verificar que el cron `commercial-daily` s'executa
2. Verificar que hi ha reserves CONFIRMED/PREPARING amb pagament pendent a ≤14 dies
3. Verificar que no s'ha enviat recordatori en els últims 7 dies (taula `AdminLog`, action `PAYMENT_REMINDER_SENT`)
4. Verificar que el client té email real (no `@leads.orbitaevents.local`)

---

## 3. Emails (SMTP)

### Els emails no arriben

1. **Verificar variables**:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` al `.env`
2. **Provar connexió**: Enviar email de test des de l'admin → Configuració
3. **Verificar spam**: Mirar carpeta spam del destinatari
4. **Logs**: Buscar `[Email]` als logs de Railway o a Sentry

### Email de confirmació de reserva no s'envia

1. Verificar que el booking té `clientEmail` real
2. Verificar que existeix template `booking-confirmation` a la taula `EmailTemplate`
3. Revisar logs per errors d'enviament

---

## 4. Desplegament

### Fer deploy

```bash
git push origin main  # Railway auto-deploy des de main
```

### Deploy falla (build error)

1. **Verificar build local**: `npm run build`
2. **Errors comuns**:
   - `SKIP_DB_QUERIES=1` ha d'estar configurat a Railway com a build variable
   - `NEXT_PHASE=phase-production-build` es detecta automàticament
3. Si el build passa localment però no a Railway → verificar `node_modules` cache: Railway → Settings → Clear Build Cache

### Rollback

1. Railway dashboard → Deployments → seleccionar deploy anterior → Redeploy
2. O via git: `git revert HEAD && git push origin main`

---

## 5. Monitoratge

### Sentry

- **Dashboard**: [sentry.io](https://sentry.io) → Projecte Orbita Events
- Alertes configurades per errors no gestionats
- DSN configurat via `NEXT_PUBLIC_SENTRY_DSN` i `SENTRY_DSN`

### Verificar salut del sistema

```bash
# Health check
curl https://orbitaevents.com/api/health

# Verificar que la BD respon
curl https://orbitaevents.com/api/health?db=1
```

### Indicadors d'alerta

- Error rate > 5% a Sentry → investigar immediatament
- Build time > 5 min → possibles deps pesades o cache invalidat
- Temps resposta API > 3s → possible query lenta (verificar amb Prisma logging)

---

## 6. Storatge (fitxers locals)

### Fitxers pujats no es mostren

1. Verificar que la carpeta `./uploads/` existeix al servidor
2. Verificar permisos: `ls -la uploads/`
3. Verificar que l'API `/api/uploads/[...path]` respon
4. Si s'ha redesplegat: els fitxers de Railway volatile storage es perden al redeploy → cal storage persistent o S3

### Backup de fitxers

```bash
# Copiar uploads a backup local
cp -r uploads/ backup/uploads-$(date +%Y-%m-%d)/
```

> ⚠️ Railway utilitza storage efímer. Si els fitxers pujats són crítics, cal migrar a un servei de storage persistent (S3, Cloudflare R2, etc.)

---

## 7. Contactes d'emergència

| Qui | Funció | Contacte |
|-----|--------|----------|
| Railway | Hosting + BD | [railway.com/help](https://railway.com/help) |
| Sentry | Monitoratge errors | [sentry.io/support](https://sentry.io/support) |
| Vercel (si migrat) | CDN + Edge | [vercel.com/support](https://vercel.com/support) |
