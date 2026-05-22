// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-api-admin-auth.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-api-auth-'));
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(root, relative);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, 'utf8');
  }
  return root;
}

function runGuard(files: Record<string, string>) {
  const cwd = writeFixture(files);
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

const withAuth = `import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return NextResponse.json({ ok: true });
}`;

const withoutAuth = `import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ ok: true });
}`;

describe('check-api-admin-auth', () => {
  it('passes when all /api/admin/* routes have requireAuth', () => {
    const result = runGuard({
      'app/api/admin/leads/route.ts': withAuth,
      'app/api/admin/leads/[id]/route.ts': withAuth,
      'app/api/admin/bookings/route.ts': withAuth,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[api-admin-auth] OK');
  });

  it('fails when a route is missing requireAuth', () => {
    const result = runGuard({
      'app/api/admin/leads/route.ts': withAuth,
      'app/api/admin/leads/suggestions/route.ts': withoutAuth,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[api-admin-auth] FAIL');
    expect(result.stderr).toContain('suggestions/route.ts');
  });

  it('reports all violating routes, not just the first', () => {
    const result = runGuard({
      'app/api/admin/leads/follow-ups/route.ts': withoutAuth,
      'app/api/admin/leads/suggestions/route.ts': withoutAuth,
      'app/api/admin/tasks/route.ts': withAuth,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('follow-ups/route.ts');
    expect(result.stderr).toContain('suggestions/route.ts');
  });

  it('passes with no route files present (empty admin dir)', () => {
    const result = runGuard({
      'app/api/admin/.gitkeep': '',
    });
    expect(result.status).toBe(0);
  });

  it('ignores files outside app/api/admin', () => {
    const result = runGuard({
      'app/api/public/stats/route.ts': withoutAuth,
      'app/api/cron/daily/route.ts': withoutAuth,
      'app/api/admin/leads/route.ts': withAuth,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[api-admin-auth] OK');
  });

  it('REGRESSIÓ (#697): detecta protecció parcial — GET protegit però DELETE no', () => {
    const partialAuth = `import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: NextRequest) {
  return NextResponse.json({ deleted: true });
}`;
    const result = runGuard({
      'app/api/admin/image-manager/route.ts': partialAuth,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[api-admin-auth] FAIL');
    expect(result.stderr).toContain('DELETE()');
    expect(result.stderr).toContain('image-manager/route.ts');
  });

  it('un requireAuth comentat no compta com a protecció', () => {
    const commentedAuth = `import { NextResponse } from 'next/server';
export async function POST() {
  // const authError = requireAuth(req);
  return NextResponse.json({ ok: true });
}`;
    const result = runGuard({
      'app/api/admin/leads/route.ts': commentedAuth,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('POST()');
  });

  it('REGRESSIÓ (#701): destructuració de params no fa fals positiu', () => {
    // Reprodueix el bug que va trencar validate:core al #697: les rutes
    // dinàmiques fan `({ params }: { params: { id: string } })` i el parser
    // confonia la `{` de la destructuració amb la `{` del cos del handler.
    const dynamicRoute = `import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return NextResponse.json({ ok: true, id: params.id });
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return NextResponse.json({ ok: true });
}`;
    const result = runGuard({
      'app/api/admin/leads/[id]/route.ts': dynamicRoute,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[api-admin-auth] OK');
  });

  it('passa quan TOTS els handlers tenen requireAuth', () => {
    const allHandlers = `import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return NextResponse.json({ ok: true });
}
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return NextResponse.json({ created: true });
}
export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return NextResponse.json({ deleted: true });
}`;
    const result = runGuard({
      'app/api/admin/bookings/[id]/route.ts': allHandlers,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[api-admin-auth] OK');
  });
});
