/**
 * API ROUTE: Serve uploaded files
 * ================================
 * Serveix fitxers del directori uploads/
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from '@/lib/storage';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

interface Params {
  params: { path: string[] };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const filePath = params.path.join('/');

  // Prevenir path traversal
  if (filePath.includes('..') || filePath.includes(':')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const buffer = await readFile(filePath);
  if (!buffer) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
