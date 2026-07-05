import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { composeVisualAuditAtlas, loadVisualAuditAtlas } from '@/lib/services/visualAuditAtlasService';

let tmpRoot: string | null = null;

async function ensureTmpRoot() {
  if (!tmpRoot) tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'orbita-visual-audit-'));
  return tmpRoot;
}

afterEach(async () => {
  if (!tmpRoot) return;
  await fs.rm(tmpRoot, { recursive: true, force: true });
  tmpRoot = null;
});

function payload(overrides: Record<string, unknown> = {}) {
  return {
    summary: {
      generatedAt: '2026-07-04T23:32:58.181Z',
      base: 'http://127.0.0.1:3001',
      routeCount: 2,
      skippedRouteCount: 1,
      viewportCount: 2,
      expectedCaptures: 4,
      completedRenders: 4,
      completedCaptures: 4,
      failedChecks: 1,
      routesWithProblems: 1,
      skipped: [{ pattern: '/admin/questionnaires/[id]', reason: 'sense id' }],
    },
    routes: [
      { route: '/admin', kind: 'static', pattern: '/admin', group: 'Comandament' },
      { route: '/admin/broken', kind: 'static', pattern: '/admin/broken', group: 'Sistema' },
    ],
    viewports: [{ id: 'desktop' }, { id: 'mobile' }],
    results: [
      {
        route: '/admin',
        pattern: '/admin',
        kind: 'static',
        group: 'Comandament',
        viewport: 'desktop',
        status: 200,
        elapsed: 100,
        screenshot: 'D:\\repo\\.codex-captures\\visual-audit-test\\screenshots\\001__admin__desktop.png',
        screenshotCreated: true,
        metrics: { scrollHeight: 1000, textLength: 200 },
        checks: [{ id: 'http-status', ok: true, severity: 'critical', message: 'HTTP OK' }],
      },
      {
        route: '/admin/broken',
        pattern: '/admin/broken',
        kind: 'static',
        group: 'Sistema',
        viewport: 'mobile',
        status: 500,
        elapsed: 200,
        screenshot: 'D:\\repo\\.codex-captures\\visual-audit-test\\screenshots\\002__broken__mobile.png',
        screenshotCreated: true,
        metrics: { scrollHeight: 500, textLength: 20 },
        checks: [{ id: 'http-status', ok: false, severity: 'critical', message: 'HTTP 500' }],
      },
    ],
    ...overrides,
  };
}

describe('visualAuditAtlasService', () => {
  it('agrupa rutes per organ i conserva captures servibles per endpoint admin', () => {
    const atlas = composeVisualAuditAtlas(payload(), 'visual-audit-test');

    expect(atlas.available).toBe(true);
    expect(atlas.summary.routeCount).toBe(2);
    expect(atlas.skipped[0].pattern).toBe('/admin/questionnaires/[id]');
    expect(atlas.organs.map((organ) => organ.group)).toEqual(['Comandament', 'Sistema']);
    expect(atlas.routes[0].route).toBe('/admin');
    expect(atlas.routes[0].runtimeStatus).toBe('OK');
    expect(atlas.routes[0].screenshots[0].href).toBe('/api/admin/visual-audit/screenshot?run=visual-audit-test&file=001__admin__desktop.png');
    expect(atlas.routes[1].runtimeStatus).toBe('FAIL');
    expect(atlas.routes[1].failedCheckIds).toEqual(['http-status']);
    expect(atlas.routes[1].reviewStatus).toBe('PENDENT');
    expect(atlas.routes[1].dimensions.map((dimension) => dimension.id)).toContain('api');
  });

  it('carrega el run preferit des de .codex-captures si existeix', async () => {
    const root = await ensureTmpRoot();
    const runDir = path.join(root, '.codex-captures', 'visual-audit-test');
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(path.join(runDir, 'visual-audit-results.json'), JSON.stringify(payload()), 'utf-8');

    const atlas = await loadVisualAuditAtlas(root, 'visual-audit-test');

    expect(atlas.available).toBe(true);
    expect(atlas.runId).toBe('visual-audit-test');
    expect(atlas.summary.completedCaptures).toBe(4);
  });

  it('retorna baseline buit si no hi ha cap run local', async () => {
    const root = await ensureTmpRoot();
    const atlas = await loadVisualAuditAtlas(root, 'visual-audit-missing');

    expect(atlas.available).toBe(false);
    expect(atlas.summary.routeCount).toBe(0);
  });
});
