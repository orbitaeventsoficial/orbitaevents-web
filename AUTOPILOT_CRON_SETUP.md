# Autopilot Comercial Diario

## Objetivo
Ejecutar automáticamente cada día:
- Secuencias comerciales (email/WhatsApp)
- Control SLA de leads
- Envío de resumen diario a admin (email + WhatsApp)

Endpoint:
- `GET /api/cron/commercial-daily`

## Requisitos
Variables de entorno mínimas:
- `CRON_SECRET` (obligatoria)
- `CONTACT_TO` (recomendado para email resumen)
- `ADMIN_WHATSAPP` (recomendado para WhatsApp resumen)
- SMTP configurado (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`)
- WhatsApp API opcional (`WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`)

## Llamada segura
Header obligatorio:
- `Authorization: Bearer <CRON_SECRET>`

Ejemplo `curl`:

```bash
curl -X GET "https://TU_DOMINIO/api/cron/commercial-daily" \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

## Programación recomendada
- Frecuencia: diaria
- Hora: `08:00` Europe/Madrid

Cron expression habitual:
- `0 8 * * *`

## Dónde verlo en el admin
- `Ajustes > Notificaciones > Autopilot Comercial`
  - Estado de `CRON_SECRET`
  - Última ejecución
  - Estado (`ok` / `error`)
  - Resumen KPIs
  - Botón "Ejecutar resumen diario ahora"

## Endpoint manual desde admin
- `POST /api/admin/automation/daily-summary/run`
- Requiere sesión autenticada + permiso `automation` + CSRF válido.

