// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-api-cron-auth.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-cron-auth-'));
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

const withCronSecret = `import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization') ?? '';
  const expected = Buffer.from(\`Bearer \${cronSecret}\`);
  const received = Buffer.from(authHeader);
  if (expected.length !== received.length || !require('crypto').timingSafeEqual(expected, received)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}`;

const withoutCronSecret = `import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ ok: true });
}`;

describe('check-api-cron-auth', () => {
  it('passes when all /api/cron/* routes have CRON_SECRET', () => {
    const result = runGuard({
      'app/api/cron/daily/route.ts': withCronSecret,
      'app/api/cron/weekly/route.ts': withCronSecret,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[api-cron-auth] OK');
  });

  it('fails when a cron route is missing CRON_SECRET', () => {
    const result = runGuard({
      'app/api/cron/daily/route.ts': withCronSecret,
      'app/api/cron/public-task/route.ts': withoutCronSecret,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[api-cron-auth] FAIL');
    expect(result.stderr).toContain('public-task/route.ts');
  });

  it('reports all violating cron routes, not just the first', () => {
    const result = runGuard({
      'app/api/cron/job-a/route.ts': withoutCronSecret,
      'app/api/cron/job-b/route.ts': withoutCronSecret,
      'app/api/cron/job-c/route.ts': withCronSecret,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('job-a/route.ts');
    expect(result.stderr).toContain('job-b/route.ts');
    expect(result.stderr).not.toContain('job-c/route.ts');
  });

  it('passes with no cron route files present', () => {
    const result = runGuard({
      'app/api/cron/.gitkeep': '',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[api-cron-auth] OK');
  });

  it('ignores routes outside app/api/cron', () => {
    const result = runGuard({
      'app/api/admin/leads/route.ts': withoutCronSecret,
      'app/api/public/stats/route.ts': withoutCronSecret,
      'app/api/cron/daily/route.ts': withCronSecret,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[api-cron-auth] OK');
  });

  const helperPattern = (callsHelper: boolean) => `import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  const expected = Buffer.from(\`Bearer \${cronSecret}\`);
  const received = Buffer.from(authHeader);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
export async function GET(request: NextRequest) {
  ${callsHelper ? "if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });" : '// auth oblidada'}
  return NextResponse.json({ ok: true });
}`;

  it('passa amb el patró real: helper isAuthorized cridat pel handler', () => {
    const result = runGuard({
      'app/api/cron/commercial-daily/route.ts': helperPattern(true),
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[api-cron-auth] OK');
  });

  it('REGRESSIÓ (#698): helper isAuthorized definit però NO cridat → FAIL', () => {
    const result = runGuard({
      'app/api/cron/commercial-daily/route.ts': helperPattern(false),
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[api-cron-auth] FAIL');
    expect(result.stderr).toContain('GET()');
    expect(result.stderr).toContain('commercial-daily/route.ts');
  });

  it('REGRESSIÓ (#702): destructuració de params al helper no fa fals negatiu', () => {
    // Mirror del bug del #697 corregit al #701, aplicat a la sister guard.
    // El parser ingenu `indexOf('{', dm.index)` matchava la `{` de la
    // destructuració de params del helper, deixava `authNames` buit i el
    // handler que cridava el helper passava com a `no verifica CRON_SECRET`.
    const helperWithDestructured = `import { NextRequest, NextResponse } from 'next/server';
function isAuthorized(
  request: NextRequest,
  { logger }: { logger: { info: (m: string) => void } }
): boolean {
  logger.info('checking auth');
  return process.env.CRON_SECRET === request.headers.get('authorization');
}
export async function GET(request: NextRequest) {
  if (!isAuthorized(request, { logger: console })) {
    return NextResponse.json({ error: 'no' }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}`;
    const result = runGuard({
      'app/api/cron/job/route.ts': helperWithDestructured,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[api-cron-auth] OK');
  });

  it('REGRESSIÓ (#702): destructuració de params al handler no fa fals positiu', () => {
    // Variant amb destructuració al handler propi en lloc del helper.
    const handlerWithDestructured = `import { NextRequest, NextResponse } from 'next/server';
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  if (process.env.CRON_SECRET !== request.headers.get('authorization')) {
    return NextResponse.json({ error: 'no' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, jobId: params.jobId });
}`;
    const result = runGuard({
      'app/api/cron/[jobId]/route.ts': handlerWithDestructured,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[api-cron-auth] OK');
  });

  it('una crida a isAuthorized comentada no compta', () => {
    const commented = `import { NextRequest, NextResponse } from 'next/server';
function isAuthorized(request: NextRequest): boolean {
  return process.env.CRON_SECRET === request.headers.get('authorization');
}
export async function GET(request: NextRequest) {
  // if (!isAuthorized(request)) return NextResponse.json({ error: 'no' }, { status: 401 });
  return NextResponse.json({ ok: true });
}`;
    const result = runGuard({
      'app/api/cron/job/route.ts': commented,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('GET()');
  });
});
