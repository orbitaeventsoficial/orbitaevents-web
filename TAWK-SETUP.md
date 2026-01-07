# 💬 Tawk.to Live Chat - Guía de Configuración

## ⚡ Configuración en 5 Minutos

Tawk.to es un chat en vivo **100% gratuito** sin limitaciones de agentes o conversaciones.

### Paso 1: Crear Cuenta Gratuita

1. Ve a https://www.tawk.to/
2. Click en "Sign Up Free"
3. Completa el registro (correo, contraseña)
4. Verifica tu email

### Paso 2: Crear Propiedad (Property)

1. Después de login, te pedirá crear una Property
2. Nombre: **Orbita Events**
3. Website URL: **https://orbitaevents.com**
4. Click "Create Property"

### Paso 3: Obtener Credenciales

Una vez creada la propiedad:

1. Ve a **Administration → Property**
2. Copia el **Property ID**
   - Formato: `5f1234567890abcdef123456`
3. Copia el **Widget ID** (normalmente es `default`)

### Paso 4: Configurar en Vercel

#### Opción A: Via Vercel Dashboard (Recomendado)

1. Ve a https://vercel.com/orbitaeventsoficial/orbitaevents-web
2. Settings → Environment Variables
3. Añade estas 3 variables:

```bash
# Production + Preview + Development
NEXT_PUBLIC_TAWK_ENABLED=true
NEXT_PUBLIC_TAWK_PROPERTY_ID=tu-property-id-aqui
NEXT_PUBLIC_TAWK_WIDGET_ID=default
```

**Importante:** Marca las 3 checkboxes (Production, Preview, Development)

#### Opción B: Via Vercel CLI

```bash
# Activar chat
vercel env add NEXT_PUBLIC_TAWK_ENABLED
# Escribe: true

# Property ID
vercel env add NEXT_PUBLIC_TAWK_PROPERTY_ID
# Pega el Property ID

# Widget ID
vercel env add NEXT_PUBLIC_TAWK_WIDGET_ID
# Escribe: default
```

### Paso 5: Redeploy

```bash
# Desde local
git commit --allow-empty -m "enable: tawk.to live chat"
git push

# O desde Vercel Dashboard
Deployments → ... → Redeploy
```

### Paso 6: Verificar

1. Espera 2-3 minutos después del deploy
2. Visita https://orbitaevents.com
3. Deberías ver el widget de chat en la esquina inferior derecha
4. El widget aparecerá **3 segundos después** de cargar la página (optimización de rendimiento)

---

## 🎨 Personalización del Widget

### Cambiar Colores y Apariencia

1. Dashboard Tawk.to → **Channels → Chat Widget**
2. Click en tu widget
3. **Appearance:**
   - Color principal: `#7C3AED` (violeta de Orbita)
   - Position: Bottom right
   - Language: Español

### Personalizar Mensajes

#### Mensaje de Bienvenida
1. Dashboard → **Chat Widget → Customize**
2. **Pre-Chat Form:**
   - Welcome message: "¡Hola! ¿En qué podemos ayudarte?"
   - Ask visitor name: Yes
   - Ask visitor email: Yes (opcional)

#### Mensaje Offline
1. **Offline Form:**
   - Message: "Ahora no estamos disponibles, pero déjanos un mensaje y te responderemos pronto."

### Horario de Atención

1. Dashboard → **Administration → Hours**
2. Configura tu horario:
   ```
   Lunes-Viernes: 10:00 - 20:00
   Sábado: 10:00 - 14:00
   Domingo: Cerrado
   ```
3. Zona horaria: **Europe/Madrid**

---

## 📱 Aplicaciones Móviles

Para responder chats desde el móvil:

### iOS
https://apps.apple.com/app/tawk-to/id1247501927

### Android
https://play.google.com/store/apps/details?id=com.tawk.app

---

## 🔔 Notificaciones

### Email Notifications

1. Dashboard → **Administration → Notifications**
2. Activa:
   - ✅ New chat message
   - ✅ Offline message
   - ✅ Missed chat
3. Email: tu@email.com

### Desktop Notifications

1. Dashboard → **Settings → Notifications**
2. Activa notificaciones del navegador
3. Se mostrarán incluso cuando el dashboard esté en segundo plano

### Sonidos

- Puedes activar/desactivar sonidos en el dashboard
- Útil para saber cuando llega un chat nuevo

---

## 👥 Añadir Más Agentes (Gratis)

1. Dashboard → **Administration → Agents**
2. Click "Add Agent"
3. Email del nuevo agente
4. Rol: Agent o Admin
5. El agente recibirá invitación por email

**Ilimitado y gratis** - puedes añadir todos los agentes que quieras.

---

## 🤖 Shortcuts (Respuestas Rápidas)

Crea respuestas predefinidas para preguntas frecuentes:

1. Dashboard → **Shortcuts**
2. Click "Add Shortcut"

### Ejemplos:

**Shortcut:** `#precios`
```
Nuestros servicios parten desde 250 EUR.
Puedes ver todos los packs en: https://orbitaevents.com/packs

¿Te gustaría un presupuesto personalizado?
```

**Shortcut:** `#bodas`
```
Ofrecemos DJ profesional para bodas con:
- Sonido premium
- Iluminación LED
- Efectos especiales
- Tematización

Más info: https://orbitaevents.com/servicios/bodas
```

**Shortcut:** `#contacto`
```
Puedes contactarnos:
📧 Email: info@orbitaevents.com
📱 WhatsApp: +34 XXX XXX XXX
📍 Barcelona y Girona
```

Para usar: Escribe `#precios` en el chat y se autocompletará.

---

## 📊 Estadísticas y Reportes

### Dashboard Principal

Muestra en tiempo real:
- Visitantes online
- Chats activos
- Mensajes no leídos
- Tiempo de respuesta promedio

### Reportes

1. Dashboard → **Reports**
2. Métricas disponibles:
   - Total de conversaciones
   - Tiempo de primera respuesta
   - Satisfacción del cliente (ratings)
   - Horarios pico
   - Agente más activo

---

## 🎯 Características Avanzadas

### Tags (Etiquetas)

Organiza conversaciones con tags:
- `boda`
- `fiesta-tematica`
- `empresa`
- `presupuesto`
- `urgente`

### Knowledge Base (Base de Conocimientos)

Crea artículos de ayuda que los clientes pueden consultar:
1. Dashboard → **Knowledge Base**
2. Añade artículos sobre servicios, precios, zonas, etc.

### Triggers (Automatizaciones)

Envía mensajes automáticos basados en comportamiento:

**Ejemplo 1:** Visitante en página de bodas > 30 segundos
```
¡Hola! ¿Buscas DJ para tu boda?
Estoy aquí para ayudarte 😊
```

**Ejemplo 2:** Visitante inactivo en contacto > 20 segundos
```
¿Necesitas ayuda con el formulario?
```

Configurar en: Dashboard → **Triggers**

---

## 🔒 Privacidad y GDPR

### Consentimiento de Cookies

Tawk.to cumple con GDPR automáticamente:
- No usa cookies de terceros sin consentimiento
- Datos almacenados en UE
- Los usuarios pueden solicitar eliminación de datos

### Configuración GDPR

1. Dashboard → **Administration → Privacy**
2. Activa:
   - ✅ Ask for consent before starting chat
   - ✅ Allow users to request data deletion
   - ✅ Show privacy policy link

---

## 💡 Tips de Uso

### Responde Rápido
- Objetivo: < 2 minutos primera respuesta
- Usa shortcuts para responder más rápido
- Activa notificaciones móviles

### Personaliza las Respuestas
```
❌ "Hola, ¿en qué puedo ayudarte?"
✅ "¡Hola [Nombre]! Vi que estás mirando bodas. ¿Tienes alguna fecha en mente?"
```

### Cierra con Call to Action
```
✅ "Te he enviado el presupuesto por email. ¿Podrías confirmar que lo recibiste?"
✅ "¿Te gustaría que te llamemos para explicarte mejor los servicios?"
```

### Usa Emojis (Con Moderación)
```
✅ "¡Perfecto! 🎉 Te envío la info ahora mismo"
❌ "Hola 😀😀😀 ¿Cómo estás? 😁😁"
```

---

## ⚠️ Troubleshooting

### El widget no aparece

1. **Verifica variables de entorno:**
   ```bash
   # En Vercel Dashboard → Settings → Environment Variables
   NEXT_PUBLIC_TAWK_ENABLED=true ✅
   NEXT_PUBLIC_TAWK_PROPERTY_ID=5f... ✅
   ```

2. **Verifica que hiciste redeploy**
   - Las variables de entorno requieren redeploy

3. **Espera 3 segundos**
   - El widget se carga con delay para no afectar performance

4. **Revisa consola del navegador**
   - F12 → Console
   - Busca errores relacionados con Tawk

### El widget aparece pero no funciona

1. **Verifica Property ID**
   - Debe tener exactamente 24 caracteres
   - Formato: `5f1234567890abcdef123456`

2. **Verifica Widget ID**
   - Normalmente es `default`
   - Si creaste widgets custom, usa el ID correcto

### No recibo notificaciones

1. **Email:**
   - Dashboard → Administration → Notifications
   - Verifica que el email es correcto
   - Revisa spam

2. **Desktop:**
   - Permite notificaciones en el navegador
   - Chrome: Configuración → Privacidad → Notificaciones

---

## 🆓 Plan Gratuito Forever

**Tawk.to es 100% gratuito:**
- ✅ Conversaciones ilimitadas
- ✅ Agentes ilimitados
- ✅ Widgets ilimitados
- ✅ Notificaciones ilimitadas
- ✅ Aplicaciones móviles
- ✅ Shortcuts y triggers
- ✅ Knowledge base
- ✅ Reportes y estadísticas
- ✅ Sin marca de agua (removible gratis)

**Servicios de pago (opcionales):**
- Hiring agents (Tawk.to provee agentes pagados)
- Removing branding permanentemente
- Video/voice chat

---

## ✅ Checklist

- [ ] Cuenta Tawk.to creada
- [ ] Property configurada
- [ ] Property ID y Widget ID copiados
- [ ] Variables de entorno añadidas en Vercel
- [ ] Redeployado
- [ ] Widget visible en web
- [ ] Colores y apariencia personalizados
- [ ] Horario de atención configurado
- [ ] Mensaje de bienvenida personalizado
- [ ] Shortcuts creados
- [ ] Notificaciones activadas
- [ ] App móvil instalada
- [ ] Agentes adicionales invitados (si aplica)

---

**Tiempo estimado:** 10 minutos

**Documentación oficial:** https://help.tawk.to/

**Dashboard:** https://dashboard.tawk.to/

**¿Problemas?** Contacta soporte en: https://www.tawk.to/contact/
