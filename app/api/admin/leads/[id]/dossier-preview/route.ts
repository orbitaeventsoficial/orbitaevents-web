import { readFileSync } from 'fs';
import { join } from 'path';
import { requireAuth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { buildDossierHtmlForLeadPreview } from '@/lib/services/dossierAutoDraftService';

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

  const result = await buildDossierHtmlForLeadPreview(params.id, {
    logoDataUri: readLogoDataUri(),
    locale: 'ca-ES',
  });
  if (!result.ok) {
    const status = result.error === 'Lead no trobat' ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return new NextResponse(result.html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
