import { promises as fs } from 'fs';
import path from 'path';
import {
  VISUAL_AUDIT_DEFAULT_RUN_ID,
  VISUAL_AUDIT_ORGAN_ORDER,
  VISUAL_AUDIT_REVIEW_DIMENSIONS,
  VISUAL_AUDIT_VIEWPORT_ORDER,
  VISUAL_AUDIT_ZENIT_PRINCIPLES,
} from '@/lib/constants/visual-audit';

type RawVisualAuditSummary = {
  generatedAt?: string;
  base?: string;
  routeCount?: number;
  skippedRouteCount?: number;
  viewportCount?: number;
  expectedCaptures?: number;
  completedRenders?: number;
  completedCaptures?: number;
  failedChecks?: number;
  routesWithProblems?: number;
  skipped?: Array<{ pattern: string; reason: string }>;
};

type RawVisualAuditRoute = {
  route: string;
  kind: string;
  pattern: string;
  group: string;
  skipped?: boolean;
  skipReason?: string;
};

type RawVisualAuditCheck = {
  id: string;
  ok: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
  message: string;
};

type RawVisualAuditResult = {
  route: string;
  pattern: string;
  kind: string;
  group: string;
  viewport: string;
  status?: number;
  elapsed?: number;
  screenshot?: string;
  screenshotCreated?: boolean;
  metrics?: {
    scrollHeight?: number;
    textLength?: number;
    horizontalOverflow?: boolean;
    nextError?: boolean;
    title?: string;
  };
  consoleErrors?: unknown[];
  pageErrors?: unknown[];
  failedRequests?: unknown[];
  failedResponses?: unknown[];
  failedAssets?: unknown[];
  checks?: RawVisualAuditCheck[];
};

type RawVisualAuditPayload = {
  summary?: RawVisualAuditSummary;
  routes?: RawVisualAuditRoute[];
  viewports?: Array<{ id: string; label?: string; width?: number; height?: number }>;
  issues?: unknown[];
  results?: RawVisualAuditResult[];
};

export type VisualAuditScreenshot = {
  viewport: string;
  fileName: string;
  href: string;
  created: boolean;
};

export type VisualAuditRouteSummary = {
  route: string;
  pattern: string;
  kind: string;
  group: string;
  runtimeStatus: 'OK' | 'FAIL';
  reviewStatus: 'PENDENT';
  httpStatus: number | null;
  failedChecks: number;
  failedCheckIds: string[];
  maxElapsedMs: number;
  maxScrollHeight: number;
  minTextLength: number;
  screenshots: VisualAuditScreenshot[];
  dimensions: typeof VISUAL_AUDIT_REVIEW_DIMENSIONS;
};

export type VisualAuditOrganSummary = {
  group: string;
  routes: number;
  captures: number;
  failedChecks: number;
  routesWithProblems: number;
};

export type VisualAuditAtlas = {
  available: boolean;
  runId: string;
  generatedAt: string | null;
  base: string | null;
  summary: {
    routeCount: number;
    skippedRouteCount: number;
    viewportCount: number;
    expectedCaptures: number;
    completedRenders: number;
    completedCaptures: number;
    failedChecks: number;
    routesWithProblems: number;
  };
  skipped: Array<{ pattern: string; reason: string }>;
  organs: VisualAuditOrganSummary[];
  routes: VisualAuditRouteSummary[];
  viewports: string[];
  dimensions: typeof VISUAL_AUDIT_REVIEW_DIMENSIONS;
  zenitPrinciples: readonly string[];
};

function emptyAtlas(runId = VISUAL_AUDIT_DEFAULT_RUN_ID): VisualAuditAtlas {
  return {
    available: false,
    runId,
    generatedAt: null,
    base: null,
    summary: {
      routeCount: 0,
      skippedRouteCount: 0,
      viewportCount: 0,
      expectedCaptures: 0,
      completedRenders: 0,
      completedCaptures: 0,
      failedChecks: 0,
      routesWithProblems: 0,
    },
    skipped: [],
    organs: [],
    routes: [],
    viewports: [...VISUAL_AUDIT_VIEWPORT_ORDER],
    dimensions: VISUAL_AUDIT_REVIEW_DIMENSIONS,
    zenitPrinciples: VISUAL_AUDIT_ZENIT_PRINCIPLES,
  };
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function viewportRank(viewport: string): number {
  const index = (VISUAL_AUDIT_VIEWPORT_ORDER as readonly string[]).indexOf(viewport);
  return index === -1 ? 99 : index;
}

function organRank(group: string): number {
  const index = (VISUAL_AUDIT_ORGAN_ORDER as readonly string[]).indexOf(group);
  return index === -1 ? 99 : index;
}

function screenshotFileName(screenshotPath: string | undefined): string {
  if (!screenshotPath) return '';
  return path.basename(screenshotPath);
}

function screenshotHref(runId: string, fileName: string): string {
  if (!fileName) return '';
  return `/api/admin/visual-audit/screenshot?run=${encodeURIComponent(runId)}&file=${encodeURIComponent(fileName)}`;
}

export function composeVisualAuditAtlas(payload: RawVisualAuditPayload, runId = VISUAL_AUDIT_DEFAULT_RUN_ID): VisualAuditAtlas {
  const summary = payload.summary ?? {};
  const results = payload.results ?? [];
  const routeMap = new Map<string, RawVisualAuditResult[]>();

  for (const result of results) {
    const key = result.route || result.pattern;
    if (!key) continue;
    const list = routeMap.get(key) ?? [];
    list.push(result);
    routeMap.set(key, list);
  }

  const routeBase = payload.routes?.filter((route) => !route.skipped) ?? [];
  const routes = routeBase.map((route) => {
    const routeResults = routeMap.get(route.route) ?? [];
    const failedChecks = routeResults.flatMap((result) => (result.checks ?? []).filter((check) => !check.ok));
    const runtimeStatus: VisualAuditRouteSummary['runtimeStatus'] = failedChecks.length === 0 ? 'OK' : 'FAIL';
    const screenshots = routeResults
      .map((result) => {
        const fileName = screenshotFileName(result.screenshot);
        return {
          viewport: result.viewport,
          fileName,
          href: screenshotHref(runId, fileName),
          created: Boolean(result.screenshotCreated && fileName),
        };
      })
      .filter((shot) => shot.fileName)
      .sort((a, b) => viewportRank(a.viewport) - viewportRank(b.viewport));
    const statuses = routeResults.map((result) => result.status).filter((status): status is number => typeof status === 'number');
    const failedCheckIds = Array.from(new Set(failedChecks.map((check) => check.id)));

    return {
      route: route.route,
      pattern: route.pattern,
      kind: route.kind,
      group: route.group,
      runtimeStatus,
      reviewStatus: 'PENDENT' as const,
      httpStatus: statuses.length ? Math.max(...statuses) : null,
      failedChecks: failedChecks.length,
      failedCheckIds,
      maxElapsedMs: Math.max(0, ...routeResults.map((result) => asNumber(result.elapsed))),
      maxScrollHeight: Math.max(0, ...routeResults.map((result) => asNumber(result.metrics?.scrollHeight))),
      minTextLength: routeResults.length ? Math.min(...routeResults.map((result) => asNumber(result.metrics?.textLength))) : 0,
      screenshots,
      dimensions: VISUAL_AUDIT_REVIEW_DIMENSIONS,
    };
  }).sort((a, b) => organRank(a.group) - organRank(b.group) || a.route.localeCompare(b.route));

  const organs = Array.from(
    routes.reduce((map, route) => {
      const current = map.get(route.group) ?? {
        group: route.group,
        routes: 0,
        captures: 0,
        failedChecks: 0,
        routesWithProblems: 0,
      };
      current.routes += 1;
      current.captures += route.screenshots.filter((shot) => shot.created).length;
      current.failedChecks += route.failedChecks;
      if (route.failedChecks > 0) current.routesWithProblems += 1;
      map.set(route.group, current);
      return map;
    }, new Map<string, VisualAuditOrganSummary>()).values(),
  ).sort((a, b) => organRank(a.group) - organRank(b.group) || a.group.localeCompare(b.group));

  const viewports = payload.viewports?.map((viewport) => viewport.id) ?? [...VISUAL_AUDIT_VIEWPORT_ORDER];

  return {
    available: routes.length > 0,
    runId,
    generatedAt: summary.generatedAt ?? null,
    base: summary.base ?? null,
    summary: {
      routeCount: asNumber(summary.routeCount) || routes.length,
      skippedRouteCount: asNumber(summary.skippedRouteCount),
      viewportCount: asNumber(summary.viewportCount) || viewports.length,
      expectedCaptures: asNumber(summary.expectedCaptures),
      completedRenders: asNumber(summary.completedRenders),
      completedCaptures: asNumber(summary.completedCaptures),
      failedChecks: asNumber(summary.failedChecks),
      routesWithProblems: asNumber(summary.routesWithProblems),
    },
    skipped: summary.skipped ?? [],
    organs,
    routes,
    viewports,
    dimensions: VISUAL_AUDIT_REVIEW_DIMENSIONS,
    zenitPrinciples: VISUAL_AUDIT_ZENIT_PRINCIPLES,
  };
}

async function runExists(capturesDir: string, runId: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path.join(capturesDir, runId, 'visual-audit-results.json'));
    return stat.isFile();
  } catch {
    return false;
  }
}

async function resolveRunId(capturesDir: string, preferredRunId: string): Promise<string | null> {
  if (await runExists(capturesDir, preferredRunId)) return preferredRunId;

  let entries: Array<{ name: string; generatedAt: string; mtime: number }> = [];
  try {
    const dirEntries = await fs.readdir(capturesDir, { withFileTypes: true });
    for (const entry of dirEntries) {
      if (!entry.isDirectory() || !entry.name.startsWith('visual-audit-')) continue;
      const resultsPath = path.join(capturesDir, entry.name, 'visual-audit-results.json');
      try {
        const [raw, stat] = await Promise.all([
          fs.readFile(resultsPath, 'utf-8'),
          fs.stat(resultsPath),
        ]);
        const parsed = JSON.parse(raw) as RawVisualAuditPayload;
        entries.push({
          name: entry.name,
          generatedAt: parsed.summary?.generatedAt ?? '',
          mtime: stat.mtimeMs,
        });
      } catch {
        // Ignore incomplete audit folders; the auditor writes incrementally.
      }
    }
  } catch {
    return null;
  }

  entries = entries.sort((a, b) => {
    const generated = b.generatedAt.localeCompare(a.generatedAt);
    return generated || b.mtime - a.mtime;
  });
  return entries[0]?.name ?? null;
}

export async function loadVisualAuditAtlas(root = process.cwd(), preferredRunId = VISUAL_AUDIT_DEFAULT_RUN_ID): Promise<VisualAuditAtlas> {
  const capturesDir = path.join(root, '.codex-captures');
  const runId = await resolveRunId(capturesDir, preferredRunId);
  if (!runId) return emptyAtlas(preferredRunId);

  try {
    const raw = await fs.readFile(path.join(capturesDir, runId, 'visual-audit-results.json'), 'utf-8');
    return composeVisualAuditAtlas(JSON.parse(raw) as RawVisualAuditPayload, runId);
  } catch {
    return emptyAtlas(runId);
  }
}
