# 🖼️ Guía de Optimización de Imágenes

## Problema Actual

- **Tamaño total:** 279MB en `/public/img`
- **Formato:** Mayormente JPG sin optimizar
- **Impacto:** Carga lenta, alto consumo de ancho de banda, costos de CDN elevados

## Beneficios de Optimizar

- **Ahorro estimado:** 150-200MB (reducción del 50-70%)
- **Mejora de rendimiento:** 30-40% en Page Speed Insights
- **Reducción de costos:** CDN y bandwidth
- **Mejor experiencia:** Carga más rápida en móviles

---

## Opción 1: Automatizada con Sharp (Recomendado)

### Instalación

```bash
pnpm add -D sharp
```

### Script de conversión

Crea `scripts/convert-images.js`:

```javascript
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function convertImages(dir = './public/img') {
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      await convertImages(filePath);
      continue;
    }

    if (!/\.(jpg|jpeg|png)$/i.test(file.name)) continue;

    const outputPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

    try {
      await sharp(filePath)
        .webp({ quality: 85 })
        .toFile(outputPath);

      console.log(`✅ Converted: ${file.name} → ${path.basename(outputPath)}`);
    } catch (error) {
      console.error(`❌ Error converting ${file.name}:`, error.message);
    }
  }
}

convertImages().then(() => {
  console.log('🎉 Conversion complete!');
});
```

### Ejecutar

```bash
node scripts/convert-images.js
```

---

## Opción 2: Squoosh CLI (Google)

### Instalación

```bash
npm install -g @squoosh/cli
```

### Convertir imágenes

```bash
# Convertir todo a WebP
npx @squoosh/cli --webp '{"quality":85}' public/img/**/*.jpg

# O con AVIF (mejor compresión, menos compatible)
npx @squoosh/cli --avif '{"quality":80}' public/img/**/*.jpg
```

---

## Opción 3: Manual con Herramientas Online

### Herramientas recomendadas

1. **Squoosh.app** (Google) - https://squoosh.app
   - Interfaz visual, comparación lado a lado
   - Soporta WebP, AVIF, MozJPEG

2. **TinyPNG** - https://tinypng.com
   - Excelente para PNG y JPG
   - Hasta 5MB por archivo, 20 archivos a la vez

3. **Cloudinary** - Free tier disponible
   - Transformación automática on-the-fly
   - CDN incluido

---

## Estrategia de Calidad por Tipo

### Portfolio (eventos pasados)
```javascript
.webp({ quality: 80-85 })
```
- Balance entre calidad visual y tamaño
- Estas fotos son importantes pero no críticas

### Hero images (página principal)
```javascript
.webp({ quality: 85-90 })
```
- Máxima calidad para primera impresión

### Thumbnails (miniaturas)
```javascript
.webp({ quality: 75 })
```
- Menor calidad aceptable, se ven pequeñas

---

## Actualizar Componentes Next.js

Después de convertir, asegúrate que Next.js Image usa WebP:

```tsx
import Image from 'next/image';

<Image
  src="/img/portfolio/bodas/foto.webp"  // ← Cambiar extensión
  alt="Descripción"
  width={800}
  height={600}
  loading="lazy"  // ← Verificar lazy loading
  quality={85}    // ← Opcional, 75 por defecto
/>
```

---

## Verificar Lazy Loading

Buscar imágenes sin lazy loading:

```bash
grep -r "<img" app/ --include="*.tsx" | grep -v "loading="
```

Todas las imágenes deben tener `loading="lazy"` excepto:
- Hero/Above-the-fold images
- Imágenes críticas de LCP (Largest Contentful Paint)

---

## Script de Limpieza (Opcional)

Después de convertir y verificar, eliminar archivos originales:

```bash
# ⚠️ CUIDADO: Hacer backup primero!
find public/img -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -delete
```

---

## Monitoreo Post-Optimización

### PageSpeed Insights
```bash
# Instalar Lighthouse CI
pnpm add -D @lhci/cli

# Ejecutar
lhci autorun --collect.url=https://orbitaevents.com
```

### Métricas a observar:
- **LCP (Largest Contentful Paint):** Debería mejorar 20-40%
- **Total Blocking Time:** Reducción marginal
- **Speed Index:** Mejora 15-30%

---

## Automatización en CI/CD (Avanzado)

Añadir a `.github/workflows/optimize-images.yml`:

```yaml
name: Optimize Images

on:
  push:
    paths:
      - 'public/img/**'

jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: calibreapp/image-actions@main
        with:
          githubToken: ${{ secrets.GITHUB_TOKEN }}
          jpegQuality: 85
          webpQuality: 85
```

---

## Checklist

- [ ] Backup de `public/img` antes de empezar
- [ ] Instalar sharp o squoosh-cli
- [ ] Ejecutar conversión a WebP
- [ ] Actualizar referencias en componentes (`.jpg` → `.webp`)
- [ ] Verificar lazy loading en todas las imágenes
- [ ] Probar build local: `pnpm build`
- [ ] Verificar imágenes en navegador
- [ ] Medir con PageSpeed Insights
- [ ] Commit y push cambios
- [ ] Opcional: Eliminar archivos originales

---

## Comandos Rápidos

```bash
# Backup
cp -r public/img public/img-backup

# Convertir con Sharp (después de crear el script)
node scripts/convert-images.js

# Buscar referencias a .jpg/.png
grep -r "\.jpg\|\.png" app/ --include="*.tsx"

# Build de prueba
pnpm build

# Revertir si algo sale mal
rm -rf public/img && mv public/img-backup public/img
```

---

## Recursos Adicionales

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [WebP vs AVIF](https://web.dev/uses-webp-images/)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Lighthouse Image Optimization](https://web.dev/fast/#optimize-your-images)

---

**Nota:** Esta optimización es opcional pero altamente recomendada.
Impacto estimado: **Alto** (30-40% mejora en velocidad de carga)
Esfuerzo: **Medio** (1-2 horas incluyendo testing)
