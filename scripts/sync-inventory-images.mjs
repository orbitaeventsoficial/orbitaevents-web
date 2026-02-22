#!/usr/bin/env node
/**
 * sync-inventory-images.mjs
 * Sincronitza imatges d'inventari a Supabase Storage (WebP optimitzat).
 *
 * Usage:
 *   node scripts/sync-inventory-images.mjs [--apply] [--only-missing] [--force] [--limit=N] [--concurrency=N]
 *
 * Options:
 *   --apply          Executa canvis (per defecte és dry-run)
 *   --only-missing   Només elements sense imageUrl
 *   --force          Reprocessa fins i tot si ja és al bucket
 *   --limit=N        Processa com a màxim N elements
 *   --concurrency=N  Elements en paral·lel (defecte: 3, màxim: 8)
 */

import fs from 'node:fs';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

for (const file of ['.env.local', '.env.production', '.env.railway', '.env']) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file, override: false });
  }
}

const prisma = new PrismaClient();

// ─── Constants (alineades amb lib/inventory-image-constants.ts) ─────────────
const BUCKET = 'inventory';
const MAX_DIMENSION = 800;
const WEBP_QUALITY = 82;
const REQUEST_TIMEOUT_MS = 25_000;
const USER_AGENT = 'orbita-inventory-image-sync/1.0';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1_500;
// ────────────────────────────────────────────────────────────────────────────

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const onlyMissing = args.has('--only-missing');
const force = args.has('--force');

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

const concurrencyArg = process.argv.find((a) => a.startsWith('--concurrency='));
const concurrency = Math.min(8, Math.max(1, concurrencyArg ? Number(concurrencyArg.split('=')[1]) : 3));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase config. Required: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function toPublicUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function isInventoryBucketUrl(url) {
  return (
    typeof url === 'string' &&
    url.includes('.supabase.co/storage') &&
    url.includes(`/${BUCKET}/`)
  );
}

function inventoryImagePath(code) {
  return `${code.toLowerCase()}.webp`;
}

async function ensureBucket() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  const exists = (data || []).some((b) => b.name === BUCKET);
  if (exists) return;
  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
  });
  if (createError) throw createError;
  console.log(`[inventory-image-sync] Bucket "${BUCKET}" creat.`);
}

/** Fetch amb timeout i reintentos exponencials */
async function fetchWithRetry(url, retries = MAX_RETRIES) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'user-agent': USER_AGENT },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arr = await res.arrayBuffer();
      return Buffer.from(arr);
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * attempt;
        console.log(`  (reintent ${attempt}/${retries - 1} en ${delay}ms per a ${url})`);
        await new Promise((r) => setTimeout(r, delay));
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

async function optimizeToWebp(buffer) {
  return sharp(buffer)
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

/** Executa un array de tasques en lots de `concurrency` */
async function runConcurrent(tasks, concurrency) {
  const results = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((fn) => fn()));
    results.push(...batchResults);
  }
  return results;
}

function printUsage() {
  console.log('');
  console.log('Sync inventory images to Supabase storage (WebP optimized)');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/sync-inventory-images.mjs [options]');
  console.log('');
  console.log('Options:');
  console.log('  --apply             Executa canvis (per defecte dry-run)');
  console.log('  --only-missing      Només elements sense imageUrl');
  console.log('  --force             Reprocessa fins i tot si ja és al bucket');
  console.log('  --limit=N           Processa com a màxim N elements');
  console.log('  --concurrency=N     Paral·lelisme (defecte 3, màxim 8)');
  console.log('');
}

if (args.has('--help') || args.has('-h')) {
  printUsage();
  process.exit(0);
}

async function processItem(item) {
  const sourceUrl = item.imageUrl;
  const filePath = inventoryImagePath(item.code);
  const nextPublicUrl = toPublicUrl(filePath);

  if (!sourceUrl) {
    return { code: item.code, status: 'skip', reason: 'no source imageUrl' };
  }

  if (!force && isInventoryBucketUrl(sourceUrl) && sourceUrl === nextPublicUrl) {
    return { code: item.code, status: 'skip', reason: 'already normalized' };
  }

  try {
    const original = await fetchWithRetry(sourceUrl);
    const optimized = await optimizeToWebp(original);

    const originalKB = Math.round(original.length / 1024);
    const optimizedKB = Math.round(optimized.length / 1024);
    const savings = Math.round((1 - optimized.length / original.length) * 100);

    if (!apply) {
      return {
        code: item.code,
        status: 'dry',
        detail: `${originalKB}KB → ${optimizedKB}KB WebP (-${savings}%)`,
      };
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, optimized, {
        contentType: 'image/webp',
        upsert: true,
      });
    if (uploadError) throw uploadError;

    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { imageUrl: nextPublicUrl },
    });

    return {
      code: item.code,
      status: 'ok',
      detail: `${originalKB}KB → ${optimizedKB}KB WebP (-${savings}%)`,
    };
  } catch (error) {
    return {
      code: item.code,
      status: 'err',
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  await ensureBucket();

  const where = onlyMissing ? { imageUrl: null } : {};
  const items = await prisma.inventoryItem.findMany({
    where,
    select: { id: true, code: true, name: true, imageUrl: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    ...(Number.isFinite(limit) && limit > 0 ? { take: limit } : {}),
  });

  if (items.length === 0) {
    console.log('[inventory-image-sync] Cap element coincideix amb els filtres.');
    return;
  }

  console.log(
    `[inventory-image-sync] mode=${apply ? 'APPLY' : 'DRY-RUN'} items=${items.length} concurrency=${concurrency}`
  );

  const tasks = items.map((item) => () => processItem(item));
  const results = await runConcurrent(tasks, concurrency);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of results) {
    switch (r.status) {
      case 'ok':
        processed++;
        console.log(`✓ OK  ${r.code}: ${r.detail}`);
        break;
      case 'dry':
        processed++;
        console.log(`~ DRY ${r.code}: ${r.detail}`);
        break;
      case 'skip':
        skipped++;
        console.log(`- SKP ${r.code}: ${r.reason}`);
        break;
      case 'err':
        failed++;
        console.error(`✗ ERR ${r.code}: ${r.reason}`);
        break;
    }
  }

  console.log('');
  console.log(`Fet. processed=${processed} skipped=${skipped} failed=${failed}`);
  if (!apply && processed > 0) {
    console.log('→ Executa amb --apply per aplicar els canvis.');
  }
  if (failed > 0) {
    process.exitCode = 2;
  }
}

main()
  .catch((error) => {
    console.error('[inventory-image-sync] Error fatal:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
