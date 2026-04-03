import path from 'path';
import sharp from 'sharp';
import { normalizePortfolioImageBuffer } from '@/lib/services/portfolioImageService';

export type ProcessedAsset = {
  buffer: Buffer;
  mimeType: string;
  ext: string;
  width: number;
  height: number;
  sizeBytes: number;
};

type ProcessingStrategy = 'passthrough' | 'avif' | 'jpeg-og' | 'optimize-keep-format';

function getStrategy(placementKey: string, mimeType: string): ProcessingStrategy {
  if (mimeType === 'image/svg+xml') return 'passthrough';
  if (placementKey.startsWith('layout.')) return 'optimize-keep-format';
  if (placementKey.startsWith('seo.')) return 'jpeg-og';
  return 'avif';
}

function mimeToFormat(mime: string): { ext: string; sharpFormat: keyof sharp.FormatEnum } {
  switch (mime) {
    case 'image/png': return { ext: '.png', sharpFormat: 'png' };
    case 'image/webp': return { ext: '.webp', sharpFormat: 'webp' };
    case 'image/gif': return { ext: '.gif', sharpFormat: 'gif' };
    default: return { ext: '.jpg', sharpFormat: 'jpeg' };
  }
}

async function extractMetadata(buffer: Buffer): Promise<{ width: number; height: number }> {
  try {
    const meta = await sharp(buffer).metadata();
    return { width: meta.width || 0, height: meta.height || 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

async function passthrough(buffer: Buffer, mimeType: string, fileName: string): Promise<ProcessedAsset> {
  const ext = path.extname(fileName).toLowerCase() || '.svg';
  const { width, height } = mimeType === 'image/svg+xml'
    ? { width: 0, height: 0 }
    : await extractMetadata(buffer);
  return { buffer, mimeType, ext, width, height, sizeBytes: buffer.length };
}

async function toAvif(buffer: Buffer): Promise<ProcessedAsset> {
  const processed = await normalizePortfolioImageBuffer(buffer);
  const { width, height } = await extractMetadata(processed);
  return { buffer: processed, mimeType: 'image/avif', ext: '.avif', width, height, sizeBytes: processed.length };
}

async function toJpegOg(buffer: Buffer): Promise<ProcessedAsset> {
  const processed = await sharp(buffer)
    .rotate()
    .resize(1200, 630, { fit: 'cover' })
    .jpeg({ quality: 85 })
    .toBuffer();
  return { buffer: processed, mimeType: 'image/jpeg', ext: '.jpg', width: 1200, height: 630, sizeBytes: processed.length };
}

async function optimizeKeepFormat(buffer: Buffer, mimeType: string): Promise<ProcessedAsset> {
  const { ext, sharpFormat } = mimeToFormat(mimeType);
  const img = sharp(buffer).rotate().resize({
    width: 1024,
    height: 1024,
    fit: 'inside',
    withoutEnlargement: true,
  });

  const processed = sharpFormat === 'png'
    ? await img.png({ quality: 90 }).toBuffer()
    : sharpFormat === 'webp'
      ? await img.webp({ quality: 85 }).toBuffer()
      : await img.jpeg({ quality: 85 }).toBuffer();

  const { width, height } = await extractMetadata(processed);
  return { buffer: processed, mimeType, ext, width, height, sizeBytes: processed.length };
}

export async function processImageManagerUpload(
  placementKey: string,
  buffer: Buffer,
  originalMimeType: string,
  fileName: string,
): Promise<ProcessedAsset> {
  const strategy = getStrategy(placementKey, originalMimeType);

  switch (strategy) {
    case 'passthrough':
      return passthrough(buffer, originalMimeType, fileName);
    case 'avif':
      return toAvif(buffer);
    case 'jpeg-og':
      return toJpegOg(buffer);
    case 'optimize-keep-format':
      return optimizeKeepFormat(buffer, originalMimeType);
  }
}
