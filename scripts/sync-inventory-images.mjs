#!/usr/bin/env node
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

const BUCKET = 'inventory';
const MAX_DIMENSION = 800;
const WEBP_QUALITY = 82;
const REQUEST_TIMEOUT_MS = 25000;
const USER_AGENT = 'orbita-inventory-image-sync/1.0';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const onlyMissing = args.has('--only-missing');
const force = args.has('--force');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

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

function isLikelySupabaseInventoryUrl(url) {
  return (
    typeof url === 'string' &&
    url.includes('.supabase.co/storage') &&
    url.includes(`/${BUCKET}/`)
  );
}

async function ensureBucket() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  const exists = (data || []).some((bucket) => bucket.name === BUCKET);
  if (exists) return;
  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
  });
  if (createError) throw createError;
}

async function fetchImageBuffer(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'user-agent': USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } finally {
    clearTimeout(timeout);
  }
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

function printUsage() {
  console.log('');
  console.log('Sync inventory images to Supabase storage (WebP optimized)');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/sync-inventory-images.mjs [--apply] [--only-missing] [--force] [--limit=N]');
  console.log('');
  console.log('Options:');
  console.log('  --apply         Execute changes (default is dry-run)');
  console.log('  --only-missing  Process only items without imageUrl');
  console.log('  --force         Reprocess even if image already in Supabase inventory bucket');
  console.log('  --limit=N       Process at most N items');
  console.log('');
}

if (args.has('--help') || args.has('-h')) {
  printUsage();
  process.exit(0);
}

async function main() {
  await ensureBucket();

  const where = onlyMissing ? { imageUrl: null } : {};
  const items = await prisma.inventoryItem.findMany({
    where,
    select: { id: true, code: true, name: true, imageUrl: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: Number.isFinite(limit) && limit > 0 ? limit : undefined,
  });

  if (items.length === 0) {
    console.log('No inventory items matched filters.');
    return;
  }

  console.log(`[inventory-image-sync] mode=${apply ? 'apply' : 'dry-run'} items=${items.length}`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    const sourceUrl = item.imageUrl;
    const filePath = `${item.code.toLowerCase()}.webp`;
    const nextPublicUrl = toPublicUrl(filePath);

    if (!sourceUrl) {
      skipped += 1;
      console.log(`- SKIP ${item.code}: no source imageUrl`);
      continue;
    }

    if (!force && isLikelySupabaseInventoryUrl(sourceUrl) && sourceUrl === nextPublicUrl) {
      skipped += 1;
      console.log(`- SKIP ${item.code}: already normalized in inventory bucket`);
      continue;
    }

    try {
      const original = await fetchImageBuffer(sourceUrl);
      const optimized = await optimizeToWebp(original);

      if (!apply) {
        processed += 1;
        console.log(`- DRY ${item.code}: ${Math.round(original.length / 1024)}KB -> ${Math.round(optimized.length / 1024)}KB`);
        continue;
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

      processed += 1;
      console.log(`- OK  ${item.code}: uploaded ${Math.round(optimized.length / 1024)}KB`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`- ERR ${item.code}: ${message}`);
    }
  }

  console.log('');
  console.log(`Done. processed=${processed} skipped=${skipped} failed=${failed}`);
  if (failed > 0) {
    process.exitCode = 2;
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
