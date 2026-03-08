/**
 * LOCAL FILE STORAGE
 * ==================
 * Gestió de fitxers amb filesystem local.
 * Fitxers es guarden a ./uploads/ i es serveixen via /api/uploads/[...path]
 */

import { promises as fs } from 'fs';
import path from 'path';

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

/**
 * Assegura que el directori existeix
 */
async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Puja un fitxer al filesystem local
 */
export async function uploadFile(
  filePath: string,
  buffer: Buffer,
): Promise<{ path: string; publicUrl: string }> {
  const fullPath = path.join(UPLOADS_DIR, filePath);
  await ensureDir(path.dirname(fullPath));
  await fs.writeFile(fullPath, buffer);

  const publicUrl = `/api/uploads/${filePath}`;
  return { path: filePath, publicUrl };
}

/**
 * Elimina un fitxer del filesystem local
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const fullPath = path.join(UPLOADS_DIR, filePath);
    await fs.unlink(fullPath);
  } catch {
    // Ignorar si el fitxer no existeix
  }
}

/**
 * Llegeix un fitxer del filesystem local
 */
export async function readFile(filePath: string): Promise<Buffer | null> {
  try {
    const fullPath = path.join(UPLOADS_DIR, filePath);
    return await fs.readFile(fullPath);
  } catch {
    return null;
  }
}

/**
 * Obté la URL pública d'un fitxer
 */
export function getPublicUrl(filePath: string): string {
  return `/api/uploads/${filePath}`;
}

/**
 * Comprova si un fitxer existeix
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(UPLOADS_DIR, filePath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Comprova si una URL és del nostre storage local
 */
export function isLocalStorageUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.includes('/api/uploads/');
}

/**
 * Extreu el path relatiu d'una URL del storage local
 */
export function extractPathFromUrl(url: string): string | null {
  const match = url.match(/\/api\/uploads\/(.+)$/);
  return match ? match[1] : null;
}
