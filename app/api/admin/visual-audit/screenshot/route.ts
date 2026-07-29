import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const run = searchParams.get('run') ?? '';
  const file = searchParams.get('file') ?? '';

  if (!/^visual-audit-[a-zA-Z0-9._-]+$/.test(run)) {
    return badRequest('Run invàlid');
  }
  if (!/^[a-zA-Z0-9._-]+\.png$/.test(file) || file !== path.basename(file)) {
    return badRequest('Captura invàlida');
  }

  const screenshotsDir = path.resolve(process.cwd(), '.codex-captures', run, 'screenshots');
  const targetPath = path.resolve(screenshotsDir, file);
  if (!targetPath.startsWith(`${screenshotsDir}${path.sep}`)) {
    return badRequest('Ruta fora del directori de captures');
  }

  try {
    const image = await fs.readFile(targetPath);
    return new NextResponse(new Uint8Array(image), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Captura no trobada' }, { status: 404 });
  }
}
