import {
  MASTER_ATLAS_ACTUAL_TO_ZENIT,
  MASTER_ATLAS_GATES,
  MASTER_ATLAS_MODULES,
  MASTER_ATLAS_PRINCIPLES,
  type MasterAtlasActualToZenit,
  type MasterAtlasModuleDefinition,
  type MasterAtlasNextMove,
  type MasterAtlasZenitImprovement,
} from '@/lib/constants/master-atlas';
import { loadRepoElectricAtlas, type RepoAtlasFileRef, type RepoElectricAtlas } from '@/lib/services/repoElectricAtlasService';
import { loadVisualAuditAtlas, type VisualAuditAtlas, type VisualAuditRouteSummary } from '@/lib/services/visualAuditAtlasService';

export type MasterAtlasModule = MasterAtlasModuleDefinition & {
  actualToZenit: MasterAtlasActualToZenit;
  files: RepoAtlasFileRef[];
  docsPresent: RepoAtlasFileRef[];
  visualRoutes: VisualAuditRouteSummary[];
  status: 'FORT' | 'EN_PROGRES' | 'FRAGIL';
  score: number;
  coverage: {
    files: number;
    docs: number;
    visualRoutes: number;
    failedVisualChecks: number;
    pendingMoves: number;
    pendingZenitImprovements: number;
  };
};

export type MasterAtlas = {
  generatedAt: string;
  title: string;
  thesis: string;
  principles: readonly string[];
  gates: readonly string[];
  summary: {
    modules: number;
    strongModules: number;
    inProgressModules: number;
    fragileModules: number;
    filesIndexed: number;
    visualRoutesIndexed: number;
    pendingMoves: number;
    zenitImprovements: number;
    pendingZenitImprovements: number;
    highImpactZenitImprovements: number;
    failedVisualChecks: number;
  };
  modules: MasterAtlasModule[];
  sourceAtlases: {
    electricGeneratedAt: string;
    visualGeneratedAt: string | null;
    visualAvailable: boolean;
  };
};

function includesAny(value: string, patterns: readonly string[]) {
  const lower = value.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

function uniqueFileRefs(files: RepoAtlasFileRef[]): RepoAtlasFileRef[] {
  const seen = new Set<string>();
  const out: RepoAtlasFileRef[] = [];
  for (const file of files) {
    if (seen.has(file.path)) continue;
    seen.add(file.path);
    out.push(file);
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

function fileRefFromAtlasFile(file: RepoElectricAtlas['files'][number]): RepoAtlasFileRef {
  return {
    path: file.path,
    organ: file.organ,
    lines: file.lines,
    functions: file.functions,
    cables: file.cables,
    hash: file.hash,
  };
}

function findModuleFiles(electric: RepoElectricAtlas, definition: MasterAtlasModuleDefinition): RepoAtlasFileRef[] {
  const patterns = [...definition.electricPatterns, ...definition.sourceOfTruth, ...definition.routes];
  const matched = electric.files
    .filter((file) => includesAny(file.path, patterns))
    .map(fileRefFromAtlasFile);
  return uniqueFileRefs(matched).slice(0, 36);
}

function findDocs(electric: RepoElectricAtlas, definition: MasterAtlasModuleDefinition): RepoAtlasFileRef[] {
  const matched = electric.files
    .filter((file) => definition.docs.some((doc) => file.path === doc || file.path.endsWith(doc)))
    .map(fileRefFromAtlasFile);
  return uniqueFileRefs(matched);
}

function findVisualRoutes(visual: VisualAuditAtlas, definition: MasterAtlasModuleDefinition): VisualAuditRouteSummary[] {
  const routePatterns = definition.routes.map((route) => route.replace('[id]', ''));
  return visual.routes
    .filter((route) => (
      definition.visualGroups.some((group) => route.group.toLowerCase().includes(group.toLowerCase()))
      || routePatterns.some((pattern) => route.route.startsWith(pattern) || route.pattern.startsWith(pattern))
    ))
    .sort((a, b) => a.route.localeCompare(b.route))
    .slice(0, 24);
}

function computeScore(input: {
  files: number;
  docs: number;
  visualRoutes: number;
  failedVisualChecks: number;
  pendingMoves: number;
}) {
  let score = 100;
  if (input.files === 0) score -= 35;
  if (input.docs === 0) score -= 15;
  if (input.visualRoutes === 0) score -= 10;
  score -= Math.min(30, input.failedVisualChecks * 6);
  score -= Math.min(15, input.pendingMoves * 2);
  return Math.max(0, Math.min(100, score));
}

function statusFromScore(score: number): MasterAtlasModule['status'] {
  if (score >= 82) return 'FORT';
  if (score >= 58) return 'EN_PROGRES';
  return 'FRAGIL';
}

function pendingMoves(moves: readonly MasterAtlasNextMove[]) {
  return moves.filter((move) => move.status !== 'FET').length;
}

function pendingZenitImprovements(improvements: readonly MasterAtlasZenitImprovement[]) {
  return improvements.filter((improvement) => improvement.status !== 'FET').length;
}

export function composeMasterAtlas(input: {
  electric: RepoElectricAtlas;
  visual: VisualAuditAtlas;
  generatedAt?: string;
}): MasterAtlas {
  const modules = MASTER_ATLAS_MODULES.map((definition) => {
    const actualToZenit = MASTER_ATLAS_ACTUAL_TO_ZENIT[definition.id];
    if (!actualToZenit) {
      throw new Error(`Master Atlas module "${definition.id}" is missing actual-to-zenit definition`);
    }
    const files = findModuleFiles(input.electric, definition);
    const docsPresent = findDocs(input.electric, definition);
    const visualRoutes = findVisualRoutes(input.visual, definition);
    const failedVisualChecks = visualRoutes.reduce((sum, route) => sum + route.failedChecks, 0);
    const pending = pendingMoves(definition.nextMoves);
    const pendingZenit = pendingZenitImprovements(actualToZenit.improvements);
    const score = computeScore({
      files: files.length,
      docs: docsPresent.length,
      visualRoutes: visualRoutes.length,
      failedVisualChecks,
      pendingMoves: pending,
    });

    return {
      ...definition,
      actualToZenit,
      files,
      docsPresent,
      visualRoutes,
      score,
      status: statusFromScore(score),
      coverage: {
        files: files.length,
        docs: docsPresent.length,
        visualRoutes: visualRoutes.length,
        failedVisualChecks,
        pendingMoves: pending,
        pendingZenitImprovements: pendingZenit,
      },
    };
  });

  const summary = modules.reduce((acc, module) => {
    acc.pendingMoves += module.coverage.pendingMoves;
    acc.zenitImprovements += module.actualToZenit.improvements.length;
    acc.pendingZenitImprovements += module.coverage.pendingZenitImprovements;
    acc.highImpactZenitImprovements += module.actualToZenit.improvements.filter((improvement) => improvement.impact === 'ALT').length;
    if (module.status === 'FORT') acc.strongModules += 1;
    if (module.status === 'EN_PROGRES') acc.inProgressModules += 1;
    if (module.status === 'FRAGIL') acc.fragileModules += 1;
    return acc;
  }, {
    modules: modules.length,
    strongModules: 0,
    inProgressModules: 0,
    fragileModules: 0,
    filesIndexed: input.electric.summary.files,
    visualRoutesIndexed: input.visual.summary.routeCount,
    pendingMoves: 0,
    zenitImprovements: 0,
    pendingZenitImprovements: 0,
    highImpactZenitImprovements: 0,
    failedVisualChecks: input.visual.summary.failedChecks,
  });

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    title: 'Master Òrbita',
    thesis: 'Una sola porta per entendre la màquina: radiografia real, mòduls de negoci, fonts de veritat, riscos, validacions i properes decisions.',
    principles: MASTER_ATLAS_PRINCIPLES,
    gates: MASTER_ATLAS_GATES,
    summary,
    modules,
    sourceAtlases: {
      electricGeneratedAt: input.electric.generatedAt,
      visualGeneratedAt: input.visual.generatedAt,
      visualAvailable: input.visual.available,
    },
  };
}

export async function loadMasterAtlas(): Promise<MasterAtlas> {
  const [electric, visual] = await Promise.all([
    loadRepoElectricAtlas(),
    loadVisualAuditAtlas(),
  ]);
  return composeMasterAtlas({ electric, visual });
}
