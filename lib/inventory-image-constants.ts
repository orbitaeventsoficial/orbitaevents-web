/**
 * INVENTORY IMAGE CONSTANTS
 * =========================
 * Font única de veritat per a la configuració d'imatges d'inventari.
 * Usades per: scripts/sync-inventory-images.mjs, app/api/admin/inventory/[id]/photo/route.ts
 *
 * NOTA: El component client (InventoryPhotoUpload.tsx) usa WEBP_QUALITY_CLIENT (escala 0-1)
 * per canvas.toBlob(), que és equivalent a WEBP_QUALITY (escala 1-100) per a sharp.
 */

/** Nom del bucket de Supabase Storage per a inventari */
export const INVENTORY_BUCKET = 'inventory';

/** Dimensió màxima en píxels (amplada o alçada) */
export const INVENTORY_IMAGE_MAX_DIMENSION = 800;

/** Qualitat WebP per a sharp (escala 1-100) */
export const INVENTORY_IMAGE_WEBP_QUALITY = 82;

/** Qualitat WebP per a canvas.toBlob al navegador (escala 0-1) */
export const INVENTORY_IMAGE_WEBP_QUALITY_CLIENT = 0.82;

/** Tamany màxim d'arxiu acceptat (10 MB) */
export const INVENTORY_IMAGE_MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Configuració del bucket de Supabase */
export const INVENTORY_BUCKET_CONFIG = {
  public: true,
  fileSizeLimit: INVENTORY_IMAGE_MAX_FILE_SIZE,
  allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
};

/** Temps màxim en ms per a peticions de fetch externes (scripts) */
export const INVENTORY_IMAGE_REQUEST_TIMEOUT_MS = 25_000;

/** User-agent per al script de sincronització */
export const INVENTORY_IMAGE_USER_AGENT = 'orbita-inventory-image-sync/1.0';

/**
 * Genera el path del fitxer dins del bucket a partir del codi d'element.
 * Ex: "SON-003" → "son-003.webp"
 */
export function inventoryImagePath(code: string): string {
  return `${code.toLowerCase()}.webp`;
}

/**
 * Comprova si una URL pertany al bucket d'inventari de Supabase.
 */
export function isInventoryBucketUrl(url: string | null | undefined): boolean {
  return (
    typeof url === 'string' &&
    url.includes('.supabase.co/storage') &&
    url.includes(`/${INVENTORY_BUCKET}/`)
  );
}
