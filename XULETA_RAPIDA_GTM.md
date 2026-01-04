# 🚀 XULETA RÀPIDA: Configuració GTM en 10 minuts

## 📋 PASO 1: Troba els IDs (5 min)

### Google Analytics 4:
1. https://analytics.google.com
2. Admin → Data Streams → Clic al teu stream
3. Copia **Measurement ID**: `G-XXXXXXXXXX`

### Google Ads:
1. https://ads.google.com
2. Eines → Mesurament → Conversions
3. Crea conversió "Lead" si no tens
4. Copia **Conversion ID**: `AW-XXXXXXXXXX`
5. Copia **Conversion Label**: `xxxxxxxxxxxxx`

---

## 🏷️ PASO 2: Crea Tags a GTM (5 min)

### https://tagmanager.google.com → GTM-P3S2RV7R

### TAG 1: GA4
- **Nova etiqueta**
- Tipus: **Google Analytics: GA4 Configuration**
- Measurement ID: `G-XXXXXXXXXX` ← El teu ID
- Activador: **All Pages**
- Nom: "GA4 - Configuration"
- **DESA**

### TAG 2: Google Ads Lead
- **Nova etiqueta**
- Tipus: **Google Ads Conversion Tracking**
- Conversion ID: `AW-XXXXXXXXXX` ← El teu ID
- Conversion Label: `xxxxxxxxxxxxx` ← El teu Label
- **Activador IMPORTANT:**
  - Crea nou trigger
  - Nom: "Event - generate_lead"
  - Tipus: **Custom Event**
  - Nom event: `generate_lead`
- Nom: "Google Ads - Lead"
- **DESA**

---

## 🚀 PASO 3: Publica (1 min)

1. Clic **"Envia"** (dalt dreta)
2. Nom: "Tracking inicial"
3. Clic **"Publicar"**

---

## ✅ PASO 4: Verifica (2 min)

1. Obre https://orbitaevents.com/contacto
2. Prem **F12** → Console
3. Escriu: `window.dataLayer`
4. Omple i envia el formulari
5. Hauries de veure: `{event: "generate_lead", ...}`

---

## 🎯 PASO 5: Importa conversions a Google Ads (2 min)

1. Google Ads → Conversions → **"Importar"**
2. Selecciona **Google Analytics 4**
3. Marca: `generate_lead`
4. Valor: 50€ (o el que vulguis)
5. **Importar**

---

## 🎉 FET!

En 24h hauràs de veure conversions a Google Ads quan algú ompli el formulari.

---

**NOTA:** Si tens problemes, consulta la guia completa: `GUIA_CONFIGURACIO_GTM_COMPLET.md`
