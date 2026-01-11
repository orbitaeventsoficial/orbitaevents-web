# 🚀 GUÍA RÁPIDA: Configurar Analytics para Òrbita Events

## ⏱️ Tiempo estimado: 10 minutos

---

## 1️⃣ GOOGLE TAG MANAGER (GTM) - 3 minutos

### Crear cuenta GTM:
1. **Abre**: https://tagmanager.google.com
2. **Clic en**: "Crear cuenta"
3. **Completa**:
   - Nombre cuenta: `Òrbita Events`
   - País: `España`
   - Nombre contenedor: `orbitaevents.com`
   - Plataforma: `Web` ✅
4. **Acepta** términos → Clic "Crear"

### Copiar tu GTM ID:
Aparecerá una ventana con código. Busca algo como:
```
GTM-XXXXXXX
```

**📋 COPIA ESTE ID** y pégalo abajo en el paso 4.

---

## 2️⃣ GOOGLE ANALYTICS 4 (GA4) - 3 minutos

### Crear propiedad GA4:
1. **Abre**: https://analytics.google.com
2. **Clic en**: "Administrar" (⚙️ abajo izquierda)
3. **Clic en**: "+ Crear propiedad"
4. **Completa**:
   - Nombre: `Òrbita Events`
   - Zona horaria: `España (GMT+1)`
   - Moneda: `EUR €`
5. **Siguiente** → Completa info del negocio → **Crear**

### Copiar Measurement ID:
1. En "Administrar" → **Flujos de datos**
2. **Clic en** tu flujo web (si no existe, créalo)
3. Copia el **ID de medición**: `G-XXXXXXXXXX`

**📋 COPIA ESTE ID** y pégalo abajo en el paso 4.

---

## 3️⃣ META PIXEL (Facebook/Instagram) - 2 minutos *(Opcional)*

### Crear Meta Pixel:
1. **Abre**: https://business.facebook.com/events_manager2/list/pixel
2. **Clic en**: "Agregar eventos" → "Desde un nuevo sitio web"
3. **Selecciona**: "Meta Pixel" → Clic "Conectar"
4. **Nombre**: `Òrbita Events Website`
5. **URL**: `https://orbitaevents.com`

### Copiar Pixel ID:
Verás un código como:
```javascript
fbq('init', '1234567890123456');  // ← Este es tu Pixel ID
```

**📋 COPIA ESTE ID** (solo los números) y pégalo abajo en el paso 4.

---

## 4️⃣ CONFIGURAR EN EL PROYECTO - 1 minuto

Una vez tengas los IDs, pégalos aquí:

```bash
# En tu terminal, ejecuta (reemplaza con tus IDs reales):

echo "NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX" >> .env.local
echo "NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX" >> .env.local
echo "NEXT_PUBLIC_META_PIXEL_ID=1234567890123456" >> .env.local
```

**O** edita manualmente `.env.local` y añade:

```env
# Analytics
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=1234567890123456
```

---

## 5️⃣ CONFIGURAR EN VERCEL (Producción) - 2 minutos

1. **Abre**: https://vercel.com/orbitaeventsoficial/orbitaevents-web/settings/environment-variables
   *(o busca tu proyecto en Vercel → Settings → Environment Variables)*

2. **Añade CADA variable**:

   **Variable 1:**
   - Key: `NEXT_PUBLIC_GTM_ID`
   - Value: `GTM-XXXXXXX` (tu ID)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - Key: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - Value: `G-XXXXXXXXXX` (tu ID)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 3 (opcional):**
   - Key: `NEXT_PUBLIC_META_PIXEL_ID`
   - Value: `1234567890123456` (tu ID)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

3. **Clic en** "Save" en cada una

4. **Redeploy**: Deployments → Clic en los 3 puntos del último deploy → "Redeploy"

---

## 6️⃣ CONFIGURAR TAGS EN GTM - 5 minutos *(Importante!)*

Vuelve a Google Tag Manager y añade estos tags:

### **Tag 1: Google Analytics 4**
1. En GTM → **Tags** → **Nuevo**
2. **Configuración de etiqueta** → Tipo: `Google Analytics: GA4 Configuration`
3. **ID de medición**: Pega tu `G-XXXXXXXXXX`
4. **Activador**: `All Pages` (Todas las páginas)
5. **Guardar** → Nombra: `GA4 - All Pages`

### **Tag 2: Meta Pixel Base Code** *(si tienes Meta Pixel)*
1. **Nuevo tag** → **HTML personalizado**
2. **Pega este código** (reemplaza `YOUR_PIXEL_ID`):

```html
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
```

3. **Activador**: `All Pages`
4. **Guardar** → Nombra: `Meta Pixel - Base Code`

### **Tag 3: Meta Pixel PageView**
1. **Nuevo tag** → **HTML personalizado**
2. **Código**:
```html
<script>
fbq('track', 'PageView');
</script>
```
3. **Activador**: `All Pages`
4. **Guardar** → Nombra: `Meta Pixel - PageView`

---

## 7️⃣ PUBLICAR GTM

**MUY IMPORTANTE**: Los tags solo funcionarán cuando publiques los cambios:

1. En GTM → Clic en **"Enviar"** (arriba derecha)
2. **Nombre de versión**: `Configuración inicial - GA4 + Meta Pixel`
3. **Descripción**: `Primera configuración de analytics`
4. **Publicar**

---

## ✅ VERIFICAR QUE FUNCIONA

### Verificar GTM:
1. Abre tu web: https://orbitaevents.com
2. Abre DevTools (F12) → Consola
3. Escribe: `dataLayer`
4. Deberías ver un array con eventos

### Verificar GA4:
1. En Google Analytics → **Informes** → **Tiempo real**
2. Abre tu web en otra pestaña
3. Deberías verte aparecer en "Usuarios en tiempo real"

### Verificar Meta Pixel:
1. Instala: [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Abre tu web
3. El icono debería ponerse verde con "1 Pixel Found"

---

## 🆘 ¿NECESITAS AYUDA?

Si algo no funciona, dime en qué paso te trabaste y te ayudo a resolverlo.

Una vez tengas los IDs, pégamelos y verifico que todo esté bien configurado.
