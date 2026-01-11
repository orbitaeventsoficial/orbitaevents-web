# 🎯 Configuració GTM - VERSIÓ SÚPER SIMPLE

## ⏱️ 2 minuts (3 clics)

Les teves dades ja estan guardades:
- ✅ GTM: `GTM-P3S2RV7R` (ja funcionant)
- ✅ Google Analytics: `G-055CNQ1L78`
- ✅ Google Ads: `AW-17575053409`

---

## Pas 1: Afegir Google Analytics a GTM

1. **Obre**: https://tagmanager.google.com/
2. **Selecciona**: Contenedor `GTM-P3S2RV7R`
3. **Clic a**: "Etiquetes" (menú esquerra) → Botó "Noves"
4. **Clic a**: "Configuració de l'etiqueta"
5. **Tria**: `Google Analytics: GA4 Configuration`
6. **Enganxa**: `G-055CNQ1L78` al camp "ID de medición"
7. **Activador**: Tria "All Pages" (Totes les pàgines)
8. **Guarda**: Nom: "GA4 - All Pages"

---

## Pas 2: Afegir Google Ads (Opcional)

1. **Nova etiqueta** → Tria `Google Ads Conversion Tracking`
2. **Conversion ID**: `AW-17575053409`
3. **Activador**: All Pages
4. **Guarda**

---

## Pas 3: PUBLICAR (MOLT IMPORTANT!)

1. **Botó "Enviar"** (dalt dreta, botó taronja)
2. **Nom versió**: "Configuració GA4 + Google Ads"
3. **Publica**

---

## ✅ Verificar que funciona

Obre: https://orbitaevents.com
Prem F12 → Console → Escriu: `dataLayer`

Hauries de veure esdeveniments de GA4 disparant-se!

---

**Fet!** Amb això ja tens tracking complet. Tot automàtic a partir d'ara.
