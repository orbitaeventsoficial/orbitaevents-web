// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-api-admin-csrf.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-api-csrf-'));
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

const safeGet = `import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return NextResponse.json({ ok: true });
}`;

const mutatingWithCsrf = `import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  return NextResponse.json({ ok: true });
}`;

const mutatingWithoutCsrf = `import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return NextResponse.json({ ok: true });
}`;

describe('check-api-admin-csrf', () => {
  it('passes for safe handlers without verifyCsrf', () => {
    const result = runGuard({
      'app/api/admin/health/route.ts': safeGet,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[api-admin-csrf] OK');
  });

  it('passes when mutating /api/admin/* handlers call verifyCsrf', () => {
    const result = runGuard({
      'app/api/admin/leads/route.ts': mutatingWithCsrf,
      'app/api/admin/bookings/route.ts': mutatingWithCsrf.replace('POST', 'PATCH'),
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[api-admin-csrf] OK');
  });

  it('fails when a mutating route is missing verifyCsrf', () => {
    const result = runGuard({
      'app/api/admin/leads/route.ts': mutatingWithoutCsrf,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[api-admin-csrf] FAIL');
    expect(result.stderr).toContain('leads/route.ts');
    expect(result.stderr).toContain('POST()');
  });

  it('reports all violating mutating handlers', () => {
    const result = runGuard({
      'app/api/admin/leads/route.ts': mutatingWithoutCsrf,
      'app/api/admin/tasks/route.ts': mutatingWithoutCsrf.replace('POST', 'DELETE'),
      'app/api/admin/bookings/route.ts': mutatingWithCsrf,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('leads/route.ts');
    expect(result.stderr).toContain('tasks/route.ts');
    expect(result.stderr).toContain('DELETE()');
  });

  it('ignores files outside app/api/admin', () => {
    const result = runGuard({
      'app/api/public/contact/route.ts': mutatingWithoutCsrf,
      'app/api/admin/health/route.ts': safeGet,
    });
    expect(result.status).toBe(0);
  });

  it('un verifyCsrf comentat no compta com a proteccio', () => {
    const commentedCsrf = `import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  // const csrfError = verifyCsrf(req);
  return NextResponse.json({ ok: true });
}`;
    const result = runGuard({
      'app/api/admin/leads/route.ts': commentedCsrf,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('POST()');
  });

  it('detecta proteccio parcial: GET segur sense CSRF i DELETE mutador sense CSRF', () => {
    const partialCsrf = `import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return NextResponse.json({ deleted: true });
}`;
    const result = runGuard({
      'app/api/admin/image-manager/route.ts': partialCsrf,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('DELETE()');
    expect(result.stderr).toContain('image-manager/route.ts');
  });

  it('la destructuracio de params no fa fals positiu', () => {
    const dynamicRoute = `import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  return NextResponse.json({ ok: true, id: params.id });
}`;
    const result = runGuard({
      'app/api/admin/leads/[id]/route.ts': dynamicRoute,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[api-admin-csrf] OK');
  });
});
