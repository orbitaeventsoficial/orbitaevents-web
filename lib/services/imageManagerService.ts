import { prisma } from '@/lib/prisma';
import { IMAGE_MANAGER_PLACEMENTS, IMAGE_MANAGER_SECTIONS } from '@/app/admin/image-manager/image-manager-config';
import { deleteFile, isLocalStorageUrl, extractPathFromUrl, uploadFile } from '@/lib/storage';
import { processImageManagerUpload } from '@/lib/services/imageManagerProcessing';
import type { ImageAsset } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types (contracte públic — no canviar sense actualitzar consumidors)
// ---------------------------------------------------------------------------

type ImagePlacementKind = 'single' | 'collection' | 'brand';

export type ImageManagerAsset = {
  id: string;
  src: string;
  alt?: string;
  path?: string;
  label?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  sortOrder: number;
  updatedAt?: string;
};

// ---------------------------------------------------------------------------
// Cache in-memory (TTL 5 min, invalidat per qualsevol escriptura)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 5 * 60 * 1000;
let allAssetsCache: { rows: ImageAsset[]; ts: number } | null = null;

/** @internal Exported for test cleanup — no external consumers. */
export function invalidateCache() {
  allAssetsCache = null;
}

async function getAllAssetsCached(): Promise<ImageAsset[]> {
  const now = Date.now();
  if (allAssetsCache && now - allAssetsCache.ts < CACHE_TTL_MS) {
    return allAssetsCache.rows;
  }

  const rows = await prisma.imageAsset.findMany({ orderBy: { sortOrder: 'asc' } });
  allAssetsCache = { rows, ts: now };
  return rows;
}

// ---------------------------------------------------------------------------
// Helpers purs (sense IO)
// ---------------------------------------------------------------------------

export function inferPlacementKind(key: string): ImagePlacementKind {
  if (key.startsWith('layout.')) return 'brand';
  if (
    key === 'home.hero.slides'
    || key === 'home.portfolioShowcase'
    || key === 'home.clientLogos'
    || key.endsWith('.gallery')
  ) {
    return 'collection';
  }
  return 'single';
}

function ensureValidPlacementKey(key: string) {
  if (!IMAGE_MANAGER_PLACEMENTS.some((p) => p.key === key)) {
    throw new Error(`Placement desconegut: ${key}`);
  }
}

function buildUploadPath(key: string, _fileName: string, ext: string) {
  const safeKey = key.replace(/[^a-z0-9.-]+/gi, '-').toLowerCase();
  return `image-manager/${safeKey}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
}

function toImageManagerAsset(row: ImageAsset): ImageManagerAsset {
  return {
    id: row.id,
    src: row.src,
    alt: row.alt ?? undefined,
    path: row.filePath ?? undefined,
    label: row.label ?? undefined,
    mimeType: row.mimeType ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    sizeBytes: row.sizeBytes ?? undefined,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function groupByPlacement(rows: ImageAsset[]): Record<string, ImageAsset[]> {
  const result: Record<string, ImageAsset[]> = {};
  for (const row of rows) {
    (result[row.placement] ??= []).push(row);
  }
  return result;
}

async function deleteLocalFile(row: ImageAsset) {
  if (!row.filePath) {
    if (isLocalStorageUrl(row.src)) {
      const extracted = extractPathFromUrl(row.src);
      if (extracted) await deleteFile(extracted);
    }
    return;
  }
  await deleteFile(row.filePath);
}

async function cleanupFiles(rows: ImageAsset[]) {
  const failures: Array<{ row: ImageAsset; error: unknown }> = [];

  await Promise.all(rows.map(async (row) => {
    try {
      await deleteLocalFile(row);
    } catch (error) {
      failures.push({ row, error });
    }
  }));

  if (failures.length > 0) {
    const failedRefs = failures.map(({ row }) => row.filePath || row.src).join(', ');
    throw new Error(`S'han eliminat els registres de BD però han fallat ${failures.length} fitxer(s): ${failedRefs}`);
  }
}

// ---------------------------------------------------------------------------
// Reads (consumidors públics — amb cache, 1 query per tots els placements)
// ---------------------------------------------------------------------------

export async function getManagedImageOverride(key: string): Promise<ImageManagerAsset | null> {
  const all = await getAllAssetsCached();
  const row = all.find((r) => r.placement === key);
  return row ? toImageManagerAsset(row) : null;
}

export async function getManagedImageCollection(key: string): Promise<ImageManagerAsset[] | null> {
  const all = await getAllAssetsCached();
  const rows = all.filter((r) => r.placement === key);
  return rows.length > 0 ? rows.map(toImageManagerAsset) : null;
}

// ---------------------------------------------------------------------------
// Payload admin (GET — sense cache, sempre fresc)
// ---------------------------------------------------------------------------

export async function getImageManagerPayload() {
  const allAssets = await prisma.imageAsset.findMany({ orderBy: { sortOrder: 'asc' } });
  const byPlacement = groupByPlacement(allAssets);

  const placements = IMAGE_MANAGER_PLACEMENTS.map((p) => {
    const kind = inferPlacementKind(p.key);
    const items = (byPlacement[p.key] || []).map(toImageManagerAsset);
    const primary = items[0];
    return {
      ...p,
      kind,
      override: {
        mode: items.length > 0 ? ('manual' as const) : ('auto' as const),
        kind,
        src: primary?.src,
        alt: primary?.alt,
        updatedAt: primary?.updatedAt,
        itemCount: items.length,
        items,
      },
    };
  });

  return {
    ok: true as const,
    sections: IMAGE_MANAGER_SECTIONS,
    placements,
    stats: {
      total: placements.length,
      manual: placements.filter((p) => p.override.mode === 'manual').length,
      auto: placements.filter((p) => p.override.mode !== 'manual').length,
    },
  };
}

// ---------------------------------------------------------------------------
// Delete helpers (DB first, cache invalidated before file cleanup)
// ---------------------------------------------------------------------------

async function clearPlacementAssets(placementKey: string) {
  const existing = await prisma.imageAsset.findMany({ where: { placement: placementKey } });
  await prisma.imageAsset.deleteMany({ where: { placement: placementKey } });
  invalidateCache();

  if (existing.length > 0) {
    await cleanupFiles(existing);
  }

  return { deletedRows: existing };
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export async function uploadImageManagerAsset(input: {
  key: string;
  fileBuffer: Buffer;
  fileName: string;
  mimeType?: string;
  alt?: string;
  label?: string;
  replace?: boolean;
}): Promise<ImageManagerAsset> {
  ensureValidPlacementKey(input.key);
  const kind = inferPlacementKind(input.key);

  const processed = await processImageManagerUpload(
    input.key,
    input.fileBuffer,
    input.mimeType || 'application/octet-stream',
    input.fileName,
  );

  const uploadPath = buildUploadPath(input.key, input.fileName, processed.ext);
  const uploaded = await uploadFile(uploadPath, processed.buffer);

  try {
    if (kind !== 'collection' || input.replace) {
      await clearPlacementAssets(input.key);
    }

    const currentCount = kind === 'collection' && !input.replace
      ? await prisma.imageAsset.count({ where: { placement: input.key } })
      : 0;

    const row = await prisma.imageAsset.create({
      data: {
        placement: input.key,
        src: uploaded.publicUrl,
        filePath: uploaded.path,
        alt: input.alt?.trim() || null,
        label: input.label?.trim() || null,
        mimeType: processed.mimeType,
        width: processed.width || null,
        height: processed.height || null,
        sizeBytes: processed.sizeBytes || null,
        sortOrder: currentCount,
      },
    });

    invalidateCache();
    return toImageManagerAsset(row);
  } catch (error) {
    try {
      await deleteFile(uploaded.path);
    } catch {
      // Evitar amagar l'error original; la neteja d'òrfens es pot fer després.
    }
    invalidateCache();
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteImageManagerAsset(input: { key: string; assetId?: string }) {
  ensureValidPlacementKey(input.key);
  const kind = inferPlacementKind(input.key);

  if (kind !== 'collection' || !input.assetId) {
    await clearPlacementAssets(input.key);
    return { ok: true as const };
  }

  const target = await prisma.imageAsset.findUnique({ where: { id: input.assetId } });
  if (target) {
    await prisma.imageAsset.delete({ where: { id: input.assetId } });
    invalidateCache();
    await cleanupFiles([target]);
  } else {
    invalidateCache();
  }

  const remaining = await prisma.imageAsset.findMany({
    where: { placement: input.key },
    orderBy: { sortOrder: 'asc' },
  });
  const updates = remaining
    .filter((r, i) => r.sortOrder !== i)
    .map((r, i) => prisma.imageAsset.update({ where: { id: r.id }, data: { sortOrder: i } }));
  if (updates.length > 0) await prisma.$transaction(updates);

  invalidateCache();
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// Save modifications (PUT — metadata i mode changes)
// ---------------------------------------------------------------------------

type ModificationInput = {
  src?: string;
  alt?: string;
  mode?: 'auto' | 'manual';
  items?: Array<{
    id?: string;
    src?: string;
    alt?: string;
    label?: string;
    sortOrder?: number;
  }>;
};

export async function saveImageManagerModifications(input: {
  modifications: Record<string, ModificationInput>;
}) {
  const modifications = input.modifications || {};

  for (const [key, mod] of Object.entries(modifications)) {
    ensureValidPlacementKey(key);

    if (mod.mode === 'auto') {
      await clearPlacementAssets(key);
      continue;
    }

    const kind = inferPlacementKind(key);
    const existing = await prisma.imageAsset.findMany({
      where: { placement: key },
      orderBy: { sortOrder: 'asc' },
    });

    if (kind === 'collection' && Array.isArray(mod.items)) {
      const ops = mod.items
        .filter((item) => item.id && existing.some((r) => r.id === item.id))
        .map((item) => {
          const row = existing.find((r) => r.id === item.id)!;
          return prisma.imageAsset.update({
            where: { id: item.id! },
            data: {
              alt: item.alt !== undefined ? (item.alt || null) : row.alt,
              label: item.label !== undefined ? (item.label || null) : row.label,
              sortOrder: item.sortOrder !== undefined ? item.sortOrder : row.sortOrder,
            },
          });
        });
      if (ops.length > 0) await prisma.$transaction(ops);
      invalidateCache();
      continue;
    }

    if (existing.length > 0) {
      await prisma.imageAsset.update({
        where: { id: existing[0].id },
        data: {
          alt: mod.alt !== undefined ? (mod.alt || null) : existing[0].alt,
          src: mod.src || existing[0].src,
        },
      });
      invalidateCache();
    } else if (mod.src) {
      await prisma.imageAsset.create({
        data: {
          placement: key,
          src: mod.src,
          alt: mod.alt || null,
          sortOrder: 0,
        },
      });
      invalidateCache();
    }
  }

  return {
    ok: true as const,
    status: 200,
    body: {
      ok: true,
      updated: Object.keys(modifications).length,
      message: 'Placements d\'imatge desats correctament',
    },
  };
}

// ---------------------------------------------------------------------------
// Reorder (PATCH — transacció)
// ---------------------------------------------------------------------------

export async function reorderImageManagerAssets(input: {
  key: string;
  items: Array<{ id: string; sortOrder: number }>;
}) {
  ensureValidPlacementKey(input.key);

  const ops = input.items.map((item) =>
    prisma.imageAsset.update({
      where: { id: item.id },
      data: { sortOrder: item.sortOrder },
    }),
  );
  if (ops.length > 0) await prisma.$transaction(ops);

  invalidateCache();
  return { ok: true as const };
}

