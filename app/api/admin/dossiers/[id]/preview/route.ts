import { readFileSync } from 'fs';
import { join } from 'path';
import { requireAuth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { buildDossierHtmlForDossier } from '@/lib/services/dossierService';

function readLogoDataUri(): string | undefined {
  try {
    const svgPath = join(process.cwd(), 'public', 'img', 'logoplanetatextdreta.svg');
    const svg = readFileSync(svgPath, 'utf-8');
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } catch {
    return undefined;
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const result = await buildDossierHtmlForDossier(params.id, {
    logoDataUri: readLogoDataUri(),
    locale: 'ca-ES',
  });
  if (!result) return NextResponse.json({ error: 'No trobat' }, { status: 404 });

  return new NextResponse(result.html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
