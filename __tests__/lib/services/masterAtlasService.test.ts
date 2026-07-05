import { describe, expect, it } from 'vitest';
import { VISUAL_AUDIT_REVIEW_DIMENSIONS } from '@/lib/constants/visual-audit';
import { composeMasterAtlas, type MasterAtlas } from '@/lib/services/masterAtlasService';
import type { RepoElectricAtlas } from '@/lib/services/repoElectricAtlasService';
import type { VisualAuditAtlas } from '@/lib/services/visualAuditAtlasService';

function file(path: string): RepoElectricAtlas['files'][number] {
  return {
    path,
    organ: path.startsWith('docs/') ? 'docs' : path.startsWith('app/admin') ? 'admin' : 'lib',
    ext: path.split('.').pop() ? `.${path.split('.').pop()}` : '',
    bytes: 100,
    chars: 100,
    lines: 10,
    hash: `hash-${path}`,
    text: true,
    functions: path.endsWith('.ts') || path.endsWith('.tsx') ? 1 : 0,
    cables: path.includes('automationTriggers') ? 1 : 0,
  };
}

function electricAtlas(paths: string[]): RepoElectricAtlas {
  const files = paths.map(file);
  return {
    generatedAt: '2026-07-05T00:00:00.000Z',
    rootName: 'orbitaevents',
    excludedDirs: [],
    summary: {
      files: files.length,
      textFiles: files.length,
      binaryFiles: 0,
      lines: files.reduce((sum, f) => sum + f.lines, 0),
      chars: files.reduce((sum, f) => sum + f.chars, 0),
      bytes: files.reduce((sum, f) => sum + f.bytes, 0),
      functions: files.reduce((sum, f) => sum + f.functions, 0),
      cables: files.reduce((sum, f) => sum + f.cables, 0),
      routes: files.filter((f) => f.path.includes('/page.tsx')).length,
      services: files.filter((f) => f.path.includes('lib/services')).length,
      models: 0,
      enums: 0,
    },
    organs: [],
    files,
    functions: [],
    cables: [],
    internalCables: [],
    routes: [],
    models: [],
    flows: [],
    touchpoints: [],
    dictionary: [],
    synthesis: { verdict: 'CRM/ERP', goldenRules: [], useThisAtlasFor: [] },
  };
}

function visualAtlas(routes: Array<{ route: string; group: string; failedChecks?: number }>): VisualAuditAtlas {
  return {
    available: true,
    runId: 'test-run',
    generatedAt: '2026-07-05T00:00:00.000Z',
    base: 'http://localhost:3000',
    summary: {
      routeCount: routes.length,
      skippedRouteCount: 0,
      viewportCount: 3,
      expectedCaptures: routes.length * 3,
      completedRenders: routes.length * 3,
      completedCaptures: routes.length * 3,
      failedChecks: routes.reduce((sum, r) => sum + (r.failedChecks ?? 0), 0),
      routesWithProblems: routes.filter((r) => (r.failedChecks ?? 0) > 0).length,
    },
    skipped: [],
    organs: [],
    routes: routes.map((route) => ({
      route: route.route,
      pattern: route.route,
      kind: 'static',
      group: route.group,
      runtimeStatus: (route.failedChecks ?? 0) > 0 ? 'FAIL' : 'OK',
      reviewStatus: 'PENDENT',
      httpStatus: 200,
      failedChecks: route.failedChecks ?? 0,
      failedCheckIds: [],
      maxElapsedMs: 20,
      maxScrollHeight: 1000,
      minTextLength: 100,
      screenshots: [],
      dimensions: VISUAL_AUDIT_REVIEW_DIMENSIONS,
    })),
    viewports: ['desktop', 'tablet', 'mobile'],
    dimensions: VISUAL_AUDIT_REVIEW_DIMENSIONS,
    zenitPrinciples: [],
  };
}

function buildAtlas(): MasterAtlas {
  return composeMasterAtlas({
    generatedAt: '2026-07-05T12:00:00.000Z',
    electric: electricAtlas([
      'lib/services/automationTriggers.ts',
      'lib/services/leadWelcomeEmailService.ts',
      'lib/services/dossierService.ts',
      'lib/services/dossierSnapshotService.ts',
      'lib/services/costEngine.ts',
      'lib/services/cashFlowForecast.ts',
      'lib/services/economicCockpitService.ts',
      'lib/payment-status.ts',
      'lib/services/dayCollisionService.ts',
      'lib/services/collaboratorAccountService.ts',
      'app/admin/docs/electric-atlas/page.tsx',
      'docs/TESI-MAQUINA-full-de-ruta-2026-07.md',
      'docs/TESI-ZENIT-MAQUINA-ORBITA-2026-07-04.md',
      'docs/audit/AUDITORIA-VISUAL-GLOBAL-1416.md',
    ]),
    visual: visualAtlas([
      { route: '/admin/leads', group: 'Leads' },
      { route: '/admin/dossiers', group: 'Documents' },
      { route: '/admin/economia', group: 'Economia', failedChecks: 2 },
      { route: '/admin/docs/electric-atlas', group: 'Sistema' },
    ]),
  });
}

describe('masterAtlasService', () => {
  it('construeix una porta master amb mòduls de negoci', () => {
    const atlas = buildAtlas();

    expect(atlas.title).toBe('Master Òrbita');
    expect(atlas.summary.modules).toBeGreaterThanOrEqual(9);
    expect(atlas.modules.map((m) => m.id)).toContain('comercial');
    expect(atlas.modules.map((m) => m.id)).toContain('visual-sistema');
  });

  it('creua atles elèctric i visual per al mòdul comercial', () => {
    const atlas = buildAtlas();
    const comercial = atlas.modules.find((m) => m.id === 'comercial');

    expect(comercial?.files.some((f) => f.path === 'lib/services/leadWelcomeEmailService.ts')).toBe(true);
    expect(comercial?.visualRoutes.some((r) => r.route === '/admin/leads')).toBe(true);
    expect(comercial?.nextMoves.some((move) => move.label.includes('welcome'))).toBe(true);
  });

  it('propaga riscos visuals al resum i al mòdul afectat', () => {
    const atlas = buildAtlas();
    const economia = atlas.modules.find((m) => m.id === 'economia');

    expect(atlas.summary.failedVisualChecks).toBe(2);
    expect(economia?.coverage.failedVisualChecks).toBe(2);
    expect(economia?.score).toBeLessThan(100);
  });

  it('incorpora la guàrdia de dissabtes #1421 al mòdul de reserves', () => {
    const atlas = buildAtlas();
    const reserves = atlas.modules.find((m) => m.id === 'reserves');

    expect(reserves?.files.some((f) => f.path === 'lib/services/dayCollisionService.ts')).toBe(true);
    expect(reserves?.sourceOfTruth).toContain('dayCollisionService');
    expect(reserves?.nextMoves.find((move) => move.label.includes('dissabtes'))?.status).toBe('FET');
  });

  it('incorpora la capa executiva #1426 al mòdul d economia', () => {
    const atlas = buildAtlas();
    const economia = atlas.modules.find((m) => m.id === 'economia');

    expect(economia?.operations).toContain('Llegir decisió executiva de caixa/marge al top');
    expect(economia?.nextMoves.find((move) => move.label === 'Capa executiva Economia')?.status).toBe('FET');
    expect(economia?.actualToZenit.improvements.find((improvement) => improvement.label === 'Cash forecast accionable')?.status).toBe('EN_CURS');
  });

  it('exposa el pont Actual -> Zenit amb palanques comercials i operatives', () => {
    const atlas = buildAtlas();
    const economia = atlas.modules.find((m) => m.id === 'economia');

    expect(atlas.summary.zenitImprovements).toBeGreaterThanOrEqual(atlas.summary.modules * 3);
    expect(atlas.summary.pendingZenitImprovements).toBeGreaterThan(0);
    expect(atlas.summary.highImpactZenitImprovements).toBeGreaterThan(0);
    expect(economia?.actualToZenit.superintendentRead).toContain('Mirada ESADE');
    expect(economia?.actualToZenit.improvements.some((improvement) => (
      improvement.area === 'MARGE'
      && improvement.label.includes('Preu mínim')
      && improvement.status === 'PENDENT'
    ))).toBe(true);
  });
});
