# 🎯 GUIA COMPLETA: Configuració Google Tag Manager per Òrbita Events

**Data:** 2 de gener de 2026
**Objectiu:** Activar el tracking complet per Google Ads i Analytics
**Temps estimat:** 20-30 minuts

---

## 📊 FASE 1: Obtenir els IDs necessaris

### 1.1 Google Analytics 4 (GA4) - OBLIGATORI

**Pas 1:** Entra a https://analytics.google.com

**Pas 2:** Fes clic a **"Admin"** (engranatge a baix esquerra)

**Pas 3:** A la columna del mig "Propietat", busca:
- **"Orbita Events Web"** (505204120)
- Fes clic a **"Data Streams"** (Fluxos de dades)

**Pas 4:** Fes clic al teu stream (probablement "orbitaevents.com")

**Pas 5:** Copia el **"Measurement ID"** (ID de mesurament)
```
Format: G-XXXXXXXXXX
Exemple: G-ABC123XYZ
```

✅ **ANOTA'L AQUÍ:** `G-_________________`

---

### 1.2 Google Ads Conversion ID - PER TRACKING DE LEADS

**Pas 1:** Entra a https://ads.google.com

**Pas 2:** Fes clic a **"Eines i configuració"** (dalt dreta) → **"Mesurament"** → **"Conversions"**

**Pas 3:** Si NO tens cap conversió creada:
- Fes clic **"+ Nova acció de conversió"**
- Selecciona **"Lloc web"**
- Categoria: **"Enviament de formulari de generació de clients potencials"**
- Nom: **"Lead - Formulari contacte"**
- Valor: **Cada conversió** (posa el valor mitjà d'un lead, ex: 50€)
- Recompte: **Una sola vegada**
- Finestra de conversió de clics: **30 dies**
- Model d'atribució: **Basada en dades** (o "Últim clic")
- Fes clic **"Fet"**

**Pas 4:** Després de crear-la, veuràs:
```
Conversion ID: AW-XXXXXXXXXX
Conversion Label: xxxxxxxxxxxxx
```

✅ **ANOTA'LS AQUÍ:**
- Conversion ID: `AW-_________________`
- Conversion Label: `_________________`

---

### 1.3 Meta Pixel (Facebook/Instagram Ads) - OPCIONAL

**Pas 1:** Entra a https://business.facebook.com/events_manager

**Pas 2:** Selecciona el teu Business Account

**Pas 3:** Fes clic a **"Orígens de dades"** → **"Píxels"**

**Pas 4:** Si no en tens, crea'n un:
- **"Afegeix"** → **"Crea un píxel"**
- Nom: **"Òrbita Events"**
- URL: **orbitaevents.com**

**Pas 5:** Copia el **"Pixel ID"**
```
Format: només números
Exemple: 1234567890123456
```

✅ **ANOTA'L AQUÍ:** `_________________`

---

## 🏷️ FASE 2: Configurar Tags a Google Tag Manager

### 2.1 Entrar a GTM

**Pas 1:** Entra a https://tagmanager.google.com

**Pas 2:** Hauries de veure el contenidor: **GTM-P3S2RV7R** (Òrbita Events)

**Pas 3:** Fes clic per obrir-lo

---

### 2.2 TAG 1: Google Analytics 4 (GA4)

**Pas 1:** Fes clic a **"Etiquetes"** (Tags) al menú esquerre

**Pas 2:** Fes clic a **"Nova"** (dalt dreta)

**Pas 3:** Fes clic a la zona de configuració de l'etiqueta (rectangle gran)

**Pas 4:** Selecciona **"Google Analytics: GA4 Configuration"**

**Pas 5:** Omple els camps:
- **Measurement ID:** Enganxa el teu `G-XXXXXXXXXX` (del pas 1.1)
- **Send a page view event when this configuration loads:** ✅ **Activat**

**Pas 6:** Fes clic a la zona d'activació (Triggering)

**Pas 7:** Selecciona **"All Pages"** (Totes les pàgines)

**Pas 8:** Dóna-li nom a l'etiqueta (dalt de tot):
```
GA4 - Configuration
```

**Pas 9:** Fes clic **"Desa"** (Save)

✅ **TAG 1 COMPLETAT**

---

### 2.3 TAG 2: Google Ads - Conversion Lead

**Pas 1:** Fes clic a **"Etiquetes"** → **"Nova"**

**Pas 2:** Fes clic a la zona de configuració

**Pas 3:** Selecciona **"Google Ads Conversion Tracking"**

**Pas 4:** Omple els camps:
- **Conversion ID:** Enganxa el teu `AW-XXXXXXXXXX` (del pas 1.2)
- **Conversion Label:** Enganxa el label (del pas 1.2)
- **Conversion Value:** Deixa en blanc (o posa un valor fix com "50")
- **Transaction ID:** Deixa en blanc

**Pas 5:** Fes clic a la zona d'activació (Triggering)

**Pas 6:** **IMPORTANT:** Aquí hem de crear un activador personalitzat
- Fes clic **"+"** per crear un nou trigger
- Nom del trigger: **"Event - generate_lead"**
- Tipus de trigger: **"Esdeveniment personalitzat"** (Custom Event)
- Nom de l'esdeveniment: `generate_lead`
- Aquest activador s'activa en: **"Tots els esdeveniments personalitzats"**
- Fes clic **"Desa"**

**Pas 7:** Dóna-li nom a l'etiqueta:
```
Google Ads - Lead Conversion
```

**Pas 8:** Fes clic **"Desa"**

✅ **TAG 2 COMPLETAT**

---

### 2.4 TAG 3: Events de WhatsApp i Telèfon

**Pas 1:** Fes clic a **"Etiquetes"** → **"Nova"**

**Pas 2:** Selecciona **"Google Analytics: GA4 Event"**

**Pas 3:** Omple:
- **Configuration Tag:** Selecciona la tag **"GA4 - Configuration"** que vas crear abans
- **Event Name:** `contact_whatsapp`

**Pas 4:** Activador:
- Crea un nou trigger **"Event - contact_whatsapp"**
- Tipus: **Custom Event**
- Nom: `contact_whatsapp`

**Pas 5:** Nom de la tag:
```
GA4 - WhatsApp Click
```

**Pas 6:** Desa

**Pas 7:** Repeteix per crear:
- **GA4 - Phone Click** (event: `contact_phone`)
- **GA4 - Pack Selected** (event: `select_pack`)

✅ **TAG 3 COMPLETAT**

---

### 2.5 TAG 4: Meta Pixel (OPCIONAL)

**Pas 1:** Fes clic a **"Etiquetes"** → **"Nova"**

**Pas 2:** Selecciona **"HTML personalitzat"** (Custom HTML)

**Pas 3:** Enganxa aquest codi (substitueix PIXEL_ID pel teu):

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'EL_TEU_PIXEL_ID_AQUÍ');
fbq('track', 'PageView');
</script>
<noscript>
<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=EL_TEU_PIXEL_ID_AQUÍ&ev=PageView&noscript=1"/>
</noscript>
<!-- End Meta Pixel Code -->
```

**Pas 4:** Activador: **"All Pages"**

**Pas 5:** Nom:
```
Meta Pixel - PageView
```

**Pas 6:** Desa

**Pas 7:** Crea una segona tag per leads:
- Nom: **"Meta Pixel - Lead"**
- Codi HTML:
```html
<script>
fbq('track', 'Lead');
</script>
```
- Activador: **"Event - generate_lead"**

✅ **TAG 4 COMPLETAT**

---

## 🚀 FASE 3: Publicar i Verificar

### 3.1 Publicar els canvis

**Pas 1:** Fes clic a **"Envia"** (Submit) a la part superior dreta de GTM

**Pas 2:** Omple:
- **Nom de la versió:** "Configuració tracking inicial"
- **Descripció:** "GA4, Google Ads conversions i Meta Pixel"

**Pas 3:** Fes clic **"Publicar"** (Publish)

✅ **PUBLICAT!**

---

### 3.2 Verificar que funciona

**Opció 1: Vista Prèvia de GTM**

**Pas 1:** A GTM, fes clic a **"Vista prèvia"** (Preview) dalt dreta

**Pas 2:** Introdueix: `https://orbitaevents.com`

**Pas 3:** S'obrirà la web amb el debugger de GTM

**Pas 4:** Navega per la web i comprova que:
- ✅ GA4 Configuration es dispara a totes les pàgines
- ✅ Quan cliques WhatsApp, es dispara "contact_whatsapp"
- ✅ Quan omples el formulari, es dispara "generate_lead"

---

**Opció 2: Google Tag Assistant**

**Pas 1:** Instal·la l'extensió de Chrome: **"Tag Assistant Companion"**
- https://chrome.google.com/webstore/detail/tag-assistant-companion/jmekfmbnaedfebfnmakmokmlfpblbfdm

**Pas 2:** Ves a https://orbitaevents.com

**Pas 3:** Fes clic a l'extensió → **"Connect"**

**Pas 4:** Hauries de veure:
- ✅ Google Tag Manager (GTM-P3S2RV7R)
- ✅ Google Analytics 4 (G-XXXXXXXXXX)
- ✅ Google Ads Conversion
- ✅ Meta Pixel (si el tens configurat)

---

**Opció 3: Consola del navegador**

**Pas 1:** Obre https://orbitaevents.com

**Pas 2:** Prem **F12** → **Console**

**Pas 3:** Escriu:
```javascript
window.dataLayer
```

**Pas 4:** Hauries de veure un array amb events (gtm.js, gtm.load, etc.)

**Pas 5:** Prova d'omplir el formulari de contacte

**Pas 6:** A la consola hauries de veure:
```javascript
{event: "generate_lead", ...}
```

---

## 🎯 FASE 4: Configurar Conversions a Google Ads

### 4.1 Importar conversions de GA4 (RECOMANAT)

**Pas 1:** Ves a Google Ads → **"Eines"** → **"Conversions"**

**Pas 2:** Fes clic **"+ Nova acció de conversió"**

**Pas 3:** Selecciona **"Importar"**

**Pas 4:** Selecciona **"Google Analytics 4"**

**Pas 5:** Marca els events:
- ✅ `generate_lead`
- ✅ `contact_whatsapp`
- ✅ `contact_phone`

**Pas 6:** Fes clic **"Importar i continuar"**

**Pas 7:** Configura:
- **Objectiu:** "Lead"
- **Valor:** Posa un valor estimat (ex: 50€ per lead)
- **Recompte:** Una sola vegada

**Pas 8:** Fes clic **"Fet"**

✅ **CONVERSIONS IMPORTADES**

---

### 4.2 Verificar que arriben dades

**Pas 1:** Omple el formulari de contacte de https://orbitaevents.com

**Pas 2:** Espera 5-10 minuts

**Pas 3:** Ves a Google Ads → **"Conversions"**

**Pas 4:** Hauries de veure:
```
Lead - Formulari contacte: 1 conversió (últimes 24h)
```

**Si no apareix:** Comprova que:
- ✅ Les tags de GTM estan publicades
- ✅ El Conversion ID i Label són correctes
- ✅ L'event "generate_lead" es dispara (comprova amb Tag Assistant)

---

## 📱 FASE 5: Configurar Enhanced Conversions (OPCIONAL però RECOMANAT)

### 5.1 Què són les Enhanced Conversions?

Google Ads pot fer un millor seguiment si li passes dades de l'usuari (email, telèfon, nom) de forma encriptada.

### 5.2 Com activar-ho

**Pas 1:** Ves a Google Ads → **"Conversions"**

**Pas 2:** Fes clic a la conversió **"Lead - Formulari contacte"**

**Pas 3:** Fes clic a **"Configuració"** → **"Enhanced conversions"**

**Pas 4:** Selecciona **"Google Tag Manager"**

**Pas 5:** A GTM, edita la tag **"Google Ads - Lead Conversion"**

**Pas 6:** A **"User Provided Data"**, afegeix:
```javascript
email: {{DLV - Email}}
phone_number: {{DLV - Phone}}
```

(Hauràs de crear variables de DataLayer per email i phone)

**Pas 7:** Desa i publica

✅ **ENHANCED CONVERSIONS ACTIVADES**

---

## ✅ CHECKLIST FINAL

Marca quan hagis completat cada pas:

### IDs obtinguts:
- [ ] Google Analytics 4 ID (G-XXXXXXXXXX)
- [ ] Google Ads Conversion ID (AW-XXXXXXXXXX)
- [ ] Google Ads Conversion Label
- [ ] Meta Pixel ID (opcional)

### Tags creades a GTM:
- [ ] GA4 - Configuration (activador: All Pages)
- [ ] Google Ads - Lead Conversion (activador: generate_lead)
- [ ] GA4 - WhatsApp Click (activador: contact_whatsapp)
- [ ] GA4 - Phone Click (activador: contact_phone)
- [ ] Meta Pixel (opcional)

### Publicació i verificació:
- [ ] Tags publicades a GTM
- [ ] Verificat amb Tag Assistant
- [ ] Conversions importades a Google Ads
- [ ] Test de formulari enviat
- [ ] Conversió apareix a Google Ads (espera 5-10 min)

---

## 🆘 RESOLUCIÓ DE PROBLEMES

### "No veig l'event generate_lead al debugger"

**Solució:** El codi ja l'envia correctament. Comprova:
1. Obre https://orbitaevents.com/contacto
2. Omple el formulari
3. Envia'l
4. A la consola (F12), escriu: `window.dataLayer`
5. Hauries de veure l'event

### "Les conversions no apareixen a Google Ads"

**Causes possibles:**
1. ❌ Conversion ID o Label incorrectes → Revisa'ls
2. ❌ L'event no es dispara → Comprova amb Tag Assistant
3. ❌ Cal esperar més temps → Google Ads pot tardar fins a 24h

### "Meta Pixel no funciona"

**Solució:**
1. Instal·la l'extensió **"Meta Pixel Helper"** de Chrome
2. Obre https://orbitaevents.com
3. Hauries de veure el pixel disparant-se

---

## 📞 CONTACTE SUPORT

Si tens problemes:
- **Google Tag Manager:** https://support.google.com/tagmanager
- **Google Ads:** https://support.google.com/google-ads
- **Meta Pixel:** https://www.facebook.com/business/help

---

## 🎉 FELICITATS!

Un cop completada aquesta guia, tindràs:
- ✅ Tracking complet de Google Analytics 4
- ✅ Conversions a Google Ads funcionant
- ✅ Dades per optimitzar campanyes
- ✅ ROI mesurable

**Resultat esperat:** En 2-4 setmanes veuràs les primeres dades de conversió i podràs optimitzar les campanyes per maximitzar els leads.

---

**Document creat per:** Claude Code (Anthropic)
**Data:** 2 de gener de 2026
**Versió:** 1.0
