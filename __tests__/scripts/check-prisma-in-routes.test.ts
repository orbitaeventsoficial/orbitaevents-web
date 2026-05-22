// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-prisma-in-routes.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-prisma-routes-'));
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

const cleanRoute = `import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { listBookings } from '@/lib/services/bookingService';
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  return NextResponse.json(await listBookings());
}`;

const prismaDirectRoute = `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET() {
  const items = await prisma.booking.findMany();
  return NextResponse.json(items);
}`;

const prismaStaticAndDynamicRoute = `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function POST() {
  const { prisma: p } = await import('@/lib/prisma');
  return NextResponse.json({});
}`;

describe('check-prisma-in-routes', () => {
  it('passes quan cap ruta importa prisma directament', () => {
    const result = runGuard({
      'app/api/admin/bookings/route.ts': cleanRoute,
      'app/api/admin/leads/route.ts': cleanRoute,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[prisma-in-routes] OK');
  });

  it('falla quan una ruta importa prisma directament (import estàtic)', () => {
    const result = runGuard({
      'app/api/admin/bookings/route.ts': cleanRoute,
      'app/api/admin/leads/route.ts': prismaDirectRoute,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[prisma-in-routes] FAIL');
    expect(result.stderr).toContain('leads/route.ts');
  });

  it('detecta import dinàmic de prisma', () => {
    const dynamicRoute = `import { NextResponse } from 'next/server';
export async function GET() {
  const { prisma } = await import('@/lib/prisma');
  return NextResponse.json({});
}`;
    const result = runGuard({
      'app/api/admin/some/route.ts': dynamicRoute,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[prisma-in-routes] FAIL');
  });

  it('la ruta allowlistada (db-reconnect) no genera violació', () => {
    const result = runGuard({
      'app/api/admin/system/db-reconnect/route.ts': prismaDirectRoute,
      'app/api/admin/bookings/route.ts': cleanRoute,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[prisma-in-routes] OK');
  });

  it('reporta totes les rutes violadores, no només la primera', () => {
    const result = runGuard({
      'app/api/admin/bookings/route.ts': prismaDirectRoute,
      'app/api/admin/leads/route.ts': prismaDirectRoute,
      'app/api/admin/customers/route.ts': cleanRoute,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('bookings/route.ts');
    expect(result.stderr).toContain('leads/route.ts');
  });

  it('passa sense fitxers de ruta presents', () => {
    const result = runGuard({
      'app/api/admin/.gitkeep': '',
    });
    expect(result.status).toBe(0);
  });
});
