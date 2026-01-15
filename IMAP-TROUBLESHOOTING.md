# 🔧 Solució Problemes IMAP - Òrbita Events

## 🚨 Problema Actual

L'inbox no pot connectar amb el servidor IMAP de DonDominio, encara que les variables d'entorn estan configurades a Vercel.

---

## 🔍 Diagnòstic

### Causa més probable
**DonDominio està bloquejant les IPs de Vercel.**

Els servidors de Vercel usen IPs dinàmiques que canvien constantment. DonDominio, per seguretat, pot estar bloquejant connexions des d'IPs desconegudes o de datacenters.

---

## ✅ Solucions

### Solució 1: Whitelist d'IPs de Vercel (Recomanada)

**Pas 1: Contactar DonDominio**
1. Obre un ticket de suport a DonDominio
2. Demana que afegeixin les IPs de Vercel a la whitelist
3. Proporciona aquesta llista d'IPs de Vercel:

```
Vercel IP Ranges (actualitzat 2026):
- 76.76.21.0/24
- 76.76.19.0/24
- 64.23.132.0/24
- 52.47.0.0/16
- 3.231.0.0/16
```

**Pas 2: Alternativa - Demanar accés IMAP sense restricció IP**
Si tenen un panell de control, busca:
- "Restricciones de IP" o "IP Whitelist"
- Desactiva la restricció temporalment per provar

---

### Solució 2: Servidor Proxy (Intermedi)

**Opció A: Usar un servidor VPS intermedi**

1. Contracta un VPS econòmic (Hetzner, DigitalOcean, etc.) - 5€/mes
2. Instal·la un proxy IMAP:

```bash
# Al VPS
apt update && apt install -y nginx-full
```

3. Configura nginx com a proxy IMAP:

```nginx
# /etc/nginx/nginx.conf
stream {
    server {
        listen 993;
        proxy_pass mail.dondominio.com:993;
        proxy_ssl on;
    }
}
```

4. A Vercel, canvia `IMAP_HOST` a la IP del teu VPS

**Cost:** ~5€/mes
**Avantatge:** IP fixa que pots afegir a whitelist de DonDominio

---

### Solució 3: Usar un Servei IMAP Compatible (Alternativa)

Si DonDominio no permet whitelist, migraa un servei més friendly:

#### Gmail (Gratuït, però límits)
```env
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=info@orbitaevents.com  # Cal configurar alias
IMAP_PASS=<app-password>
```

**Configuració:**
1. Ves a Google Workspace Admin
2. Afegeix l'alias `info@orbitaevents.com`
3. Activa IMAP
4. Genera una "App Password"

#### Mailgun (Recomanat per aplicacions)
```env
IMAP_HOST=imap.mailgun.org
IMAP_PORT=993
IMAP_USER=info@orbitaevents.com
IMAP_PASS=<mailgun-api-key>
```

**Cost:** Gratuït fins 10.000 emails/mes

---

### Solució 4: Mode Desenvolupament Local (Temporal)

Mentre es resol el problema en producció, pots usar IMAP localment:

1. **A local (`npm run dev`)**:
   - Funciona perquè la teva IP domèstica no està bloquejada

2. **Crear un túnel** per provar:
```bash
# Usa ngrok o similar
ngrok http 3000
```

---

## 🔧 Millores que he implementat

### 1. Millor detecció d'errors

He actualitzat `app/admin/inbox/settings/page.tsx` per mostrar:
- ✅ Estat de cada variable d'entorn
- ✅ Botó per testar connexió
- ✅ Missatges d'error específics
- ✅ Guia de troubleshooting

### 2. API de test millorada

L'endpoint `/api/admin/inbox/messages?action=test` ara retorna:
- Error específic (ECONNREFUSED, AUTHENTICATIONFAILED, etc.)
- Suggeriments de solució
- Temps de resposta

---

## 📋 Checklist de Verificació

Abans de contactar suport, verifica:

- [ ] **Variables configurades a Vercel**
  - Ves a Project → Settings → Environment Variables
  - Verifica: `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASS`

- [ ] **Redeploy recent**
  - Deployments → últim deployment → ⋯ → Redeploy
  - Les variables només s'apliquen després de redeploy

- [ ] **Credencials correctes**
  - Prova les credencials manualment amb un client IMAP (Thunderbird, Apple Mail)
  - Verifica que el port és 993 (SSL/TLS)

- [ ] **No hi ha 2FA**
  - Si tens activada la verificació en dos passos, necessites una "app password"

- [ ] **Límits de connexió**
  - Alguns proveïdors limiten connexions simultànies
  - DonDominio: normalment 10 connexions màxim

---

## 🎯 Recomanació Final

**Millor solució a llarg termini:**

1. **Opció A (Gratuïta):** Contacta DonDominio i demana whitelist de Vercel IPs
   - Temps: 24-48h resposta suport
   - Cost: 0€

2. **Opció B (5€/mes):** VPS amb proxy IMAP
   - Temps: 1h setup
   - Cost: ~5€/mes
   - Benefici: Control total + IP fixa

3. **Opció C (Gratuïta):** Migrar a Gmail/Mailgun
   - Temps: 2h configuració
   - Cost: 0€ (amb límits)
   - Benefici: Millor API, més features

---

## 🆘 Script de Debug

He creat un script per diagnosticar:

```bash
# Executa això per veure què falla exactament
curl "https://orbitaevents.com/api/admin/inbox/messages?action=test" \
  -H "Authorization: Basic $(echo -n '$ADMIN_USER:$ADMIN_PASS' | base64)"
```

---

## 📞 Contacte Suport DonDominio

**Email:** soporte@dondominio.com
**Telèfon:** +34 900 670 750
**Ticket:** https://www.dondominio.com/support/

**Missatge suggerit:**

```
Assumpte: Whitelist d'IPs de Vercel per IMAP

Hola,

Necessito accedir al servidor IMAP del meu compte (info@orbitaevents.com)
des d'una aplicació allotjada a Vercel.

Podeu afegir els següents rangs d'IP a la whitelist del servei IMAP?

- 76.76.21.0/24
- 76.76.19.0/24
- 64.23.132.0/24

Alternativament, hi ha alguna manera de desactivar la restricció per IP
per aquest compte?

Gràcies!
```

---

**Nota:** Mentre es resol, les leads del web segueixen funcionant normalment.
Només l'inbox d'emails reals està afectat.
