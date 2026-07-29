import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import {
  REPO_ATLAS_EXCLUDED_DIRS,
  REPO_ATLAS_DOMAIN_DICTIONARY,
  REPO_ATLAS_FLOW_DEFINITIONS,
  REPO_ATLAS_SENSITIVE_FILE_PATTERNS,
  REPO_ATLAS_SYNTHESIS,
  REPO_ATLAS_TEXT_EXTENSIONS,
  REPO_ATLAS_TOUCHPOINT_DEFINITIONS,
} from '@/lib/constants/repo-atlas';

export type RepoAtlasSymbol = {
  file: string;
  line: number;
  name: string;
  kind: 'function' | 'const' | 'class' | 'type' | 'interface' | 'route-handler' | 'model' | 'enum';
  exported: boolean;
};

export type RepoAtlasCable = {
  from: string;
  to: string;
  line: number;
  kind: 'import' | 'fetch' | 'route-handler' | 'model';
  label: string;
};

export type RepoAtlasFile = {
  path: string;
  organ: string;
  ext: string;
  bytes: number;
  chars: number;
  lines: number;
  hash: string;
  text: boolean;
  functions: number;
  cables: number;
};

export type RepoAtlasOrgan = {
  id: string;
  label: string;
  files: number;
  lines: number;
  chars: number;
  functions: number;
  cables: number;
};

export type RepoAtlasFileRef = {
  path: string;
  organ: string;
  lines: number;
  functions: number;
  cables: number;
  hash: string;
};

export type RepoAtlasInternalCable = {
  from: string;
  to: string;
  line: number;
  label: string;
};

export type RepoAtlasFlowStage = {
  label: string;
  intent: string;
  files: RepoAtlasFileRef[];
  symbols: RepoAtlasSymbol[];
  internalCables: RepoAtlasInternalCable[];
  status: 'wired' | 'thin' | 'missing';
};

export type RepoAtlasFlow = {
  id: string;
  title: string;
  question: string;
  stages: RepoAtlasFlowStage[];
  filesCount: number;
  missingStages: number;
};

export type RepoAtlasTouchpoint = {
  id: string;
  title: string;
  when: string;
  readFirst: string[];
  safeOrder: string[];
  doNotTouch: string[];
  validations: string[];
  files: RepoAtlasFileRef[];
  internalCables: RepoAtlasInternalCable[];
};

export type RepoAtlasDictionaryEntry = {
  id: string;
  term: string;
  definition: string;
  useWhen: string;
  sourceOfTruth: string[];
  validations: string[];
  files: RepoAtlasFileRef[];
  symbols: RepoAtlasSymbol[];
  internalCables: RepoAtlasInternalCable[];
};

export type RepoAtlasSynthesis = {
  verdict: string;
  goldenRules: string[];
  useThisAtlasFor: string[];
};

export type RepoElectricAtlas = {
  generatedAt: string;
  rootName: string;
  excludedDirs: string[];
  summary: {
    files: number;
    textFiles: number;
    binaryFiles: number;
    lines: number;
    chars: number;
    bytes: number;
    functions: number;
    cables: number;
    routes: number;
    services: number;
    models: number;
    enums: number;
  };
  organs: RepoAtlasOrgan[];
  files: RepoAtlasFile[];
  functions: RepoAtlasSymbol[];
  cables: RepoAtlasCable[];
  internalCables: RepoAtlasInternalCable[];
  routes: RepoAtlasSymbol[];
  models: RepoAtlasSymbol[];
  flows: RepoAtlasFlow[];
  touchpoints: RepoAtlasTouchpoint[];
  dictionary: RepoAtlasDictionaryEntry[];
  synthesis: RepoAtlasSynthesis;
};

const TEXT_EXTENSIONS = new Set<string>(REPO_ATLAS_TEXT_EXTENSIONS);

function toPosix(relativePath: string): string {
  return relativePath.split(path.sep).join('/');
}

function shouldSkipFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  if (lower.startsWith('.env')) return true;
  if ((REPO_ATLAS_SENSITIVE_FILE_PATTERNS as readonly string[]).includes(lower)) return true;
  return lower.endsWith('.log') || lower.endsWith('.pem') || lower.endsWith('.key') || lower.endsWith('.p12');
}

function toFileRef(file: RepoAtlasFile): RepoAtlasFileRef {
  return {
    path: file.path,
    organ: file.organ,
    lines: file.lines,
    functions: file.functions,
    cables: file.cables,
    hash: file.hash,
  };
}

function matchesAnyPattern(value: string, patterns: readonly string[]): boolean {
  const lower = value.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

function findFilesByPatterns(files: RepoAtlasFile[], patterns: readonly string[], limit = 18): RepoAtlasFileRef[] {
  return files
    .filter((file) => matchesAnyPattern(file.path, patterns))
    .sort((a, b) => {
      const scoreA = (a.path.startsWith('lib/services/') ? 0 : 1) + (a.path.startsWith('app/admin/') ? 0 : 1);
      const scoreB = (b.path.startsWith('lib/services/') ? 0 : 1) + (b.path.startsWith('app/admin/') ? 0 : 1);
      return scoreA - scoreB || a.path.localeCompare(b.path);
    })
    .slice(0, limit)
    .map(toFileRef);
}

function findSymbolsForFiles(symbols: RepoAtlasSymbol[], fileRefs: RepoAtlasFileRef[], limit = 18): RepoAtlasSymbol[] {
  const fileSet = new Set(fileRefs.map((file) => file.path));
  return symbols.filter((symbol) => fileSet.has(symbol.file)).slice(0, limit);
}

function findInternalCablesForFiles(cables: RepoAtlasInternalCable[], fileRefs: RepoAtlasFileRef[], limit = 18): RepoAtlasInternalCable[] {
  const fileSet = new Set(fileRefs.map((file) => file.path));
  return cables.filter((cable) => fileSet.has(cable.from) || fileSet.has(cable.to)).slice(0, limit);
}

function candidateTargets(base: string): string[] {
  return [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mjs`,
    `${base}.js`,
    `${base}.json`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
    `${base}/route.ts`,
    `${base}/page.tsx`,
  ];
}

function resolveInternalImport(fromFile: string, specifier: string, fileSet: Set<string>): string | null {
  let base: string | null = null;
  if (specifier.startsWith('@/')) {
    base = specifier.slice(2);
  } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
    base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), specifier));
  }

  if (!base) return null;
  const normalized = base.replace(/\\/g, '/');
  return candidateTargets(normalized).find((candidate) => fileSet.has(candidate)) ?? null;
}

function buildInternalCables(cables: RepoAtlasCable[], files: RepoAtlasFile[]): RepoAtlasInternalCable[] {
  const fileSet = new Set(files.map((file) => file.path));
  return cables
    .filter((cable) => cable.kind === 'import')
    .map((cable) => {
      const target = resolveInternalImport(cable.from, cable.to, fileSet);
      if (!target) return null;
      return { from: cable.from, to: target, line: cable.line, label: cable.label };
    })
    .filter((cable): cable is RepoAtlasInternalCable => Boolean(cable));
}

function buildFlows(files: RepoAtlasFile[], symbols: RepoAtlasSymbol[], internalCables: RepoAtlasInternalCable[]): RepoAtlasFlow[] {
  return REPO_ATLAS_FLOW_DEFINITIONS.map((definition) => {
    const stages = definition.stages.map((stage) => {
      const stageFiles = findFilesByPatterns(files, stage.patterns);
      const stageSymbols = findSymbolsForFiles(symbols, stageFiles, 12);
      const stageCables = findInternalCablesForFiles(internalCables, stageFiles, 12);
      return {
        label: stage.label,
        intent: stage.intent,
        files: stageFiles,
        symbols: stageSymbols,
        internalCables: stageCables,
        status: stageFiles.length >= 3 ? 'wired' as const : stageFiles.length > 0 ? 'thin' as const : 'missing' as const,
      };
    });
    const uniqueFiles = new Set(stages.flatMap((stage) => stage.files.map((file) => file.path)));
    return {
      id: definition.id,
      title: definition.title,
      question: definition.question,
      stages,
      filesCount: uniqueFiles.size,
      missingStages: stages.filter((stage) => stage.status === 'missing').length,
    };
  });
}

function buildTouchpoints(files: RepoAtlasFile[], internalCables: RepoAtlasInternalCable[]): RepoAtlasTouchpoint[] {
  return REPO_ATLAS_TOUCHPOINT_DEFINITIONS.map((definition) => {
    const matchedFiles = findFilesByPatterns(files, definition.touchPatterns, 24);
    return {
      id: definition.id,
      title: definition.title,
      when: definition.when,
      readFirst: [...definition.readFirst],
      safeOrder: [...definition.safeOrder],
      doNotTouch: [...definition.doNotTouch],
      validations: [...definition.validations],
      files: matchedFiles,
      internalCables: findInternalCablesForFiles(internalCables, matchedFiles, 16),
    };
  });
}

function buildDictionary(files: RepoAtlasFile[], symbols: RepoAtlasSymbol[], internalCables: RepoAtlasInternalCable[]): RepoAtlasDictionaryEntry[] {
  return REPO_ATLAS_DOMAIN_DICTIONARY.map((entry) => {
    const matchedFiles = findFilesByPatterns(files, entry.sourceOfTruth, 18);
    return {
      id: entry.id,
      term: entry.term,
      definition: entry.definition,
      useWhen: entry.useWhen,
      sourceOfTruth: [...entry.sourceOfTruth],
      validations: [...entry.validations],
      files: matchedFiles,
      symbols: findSymbolsForFiles(symbols, matchedFiles, 16),
      internalCables: findInternalCablesForFiles(internalCables, matchedFiles, 12),
    };
  });
}

function classifyOrgan(filePath: string): { id: string; label: string } {
  if (filePath.startsWith('app/api/admin/')) return { id: 'api-admin', label: 'API admin' };
  if (filePath.startsWith('app/api/cron/')) return { id: 'crons', label: 'Crons' };
  if (filePath.startsWith('app/api/public/')) return { id: 'api-public', label: 'API publica' };
  if (filePath.startsWith('app/api/')) return { id: 'api', label: 'API frontissa' };
  if (filePath.startsWith('app/admin/')) return { id: 'admin', label: 'Admin UI' };
  if (filePath.startsWith('app/[locale]/')) return { id: 'public-web', label: 'Web publica' };
  if (filePath.startsWith('app/components/')) return { id: 'public-components', label: 'Components publics' };
  if (filePath.startsWith('app/config/')) return { id: 'config', label: 'Config web' };
  if (filePath.startsWith('lib/services/')) return { id: 'services', label: 'Cervells serveis' };
  if (filePath.startsWith('lib/api/')) return { id: 'api-clients', label: 'Clients API' };
  if (filePath.startsWith('lib/')) return { id: 'lib', label: 'Lib compartida' };
  if (filePath.startsWith('__tests__/')) return { id: 'tests', label: 'Tests' };
  if (filePath.startsWith('prisma/')) return { id: 'database', label: 'BD Prisma' };
  if (filePath.startsWith('scripts/')) return { id: 'scripts', label: 'Scripts i guards' };
  if (filePath.startsWith('docs/')) return { id: 'docs', label: 'Docs i protocol' };
  if (filePath.startsWith('messages/')) return { id: 'i18n', label: 'I18n public' };
  if (filePath.startsWith('public/')) return { id: 'assets', label: 'Assets publics' };
  return { id: 'other', label: 'Altres' };
}

async function walk(root: string, dir = root): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && (REPO_ATLAS_EXCLUDED_DIRS as readonly string[]).includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(root, full));
    } else if (entry.isFile() && !shouldSkipFile(entry.name)) {
      files.push(full);
    }
  }

  return files;
}

function addSymbol(symbols: RepoAtlasSymbol[], file: string, line: number, rawName: string, kind: RepoAtlasSymbol['kind'], exported: boolean) {
  const name = rawName.trim() || '(default)';
  symbols.push({ file, line, name, kind, exported });
}

function parseTextFile(file: string, content: string): {
  symbols: RepoAtlasSymbol[];
  cables: RepoAtlasCable[];
  routes: RepoAtlasSymbol[];
  models: RepoAtlasSymbol[];
} {
  const symbols: RepoAtlasSymbol[] = [];
  const cables: RepoAtlasCable[] = [];
  const routes: RepoAtlasSymbol[] = [];
  const models: RepoAtlasSymbol[] = [];
  const lines = content.split(/\r?\n/);
  const isPrismaSchema = file.endsWith('.prisma');

  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const line = lines[i];

    const route = line.match(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/);
    if (route) {
      const symbol = { file, line: lineNo, name: route[1], kind: 'route-handler' as const, exported: true };
      routes.push(symbol);
      symbols.push(symbol);
      cables.push({ from: file, to: route[1], line: lineNo, kind: 'route-handler', label: `handler ${route[1]}` });
    }

    const model = isPrismaSchema ? line.match(/^model\s+([A-Za-z0-9_]+)/) : null;
    if (model) {
      const symbol = { file, line: lineNo, name: model[1], kind: 'model' as const, exported: true };
      models.push(symbol);
      symbols.push(symbol);
      cables.push({ from: file, to: model[1], line: lineNo, kind: 'model', label: `Prisma model ${model[1]}` });
    }

    const enumMatch = isPrismaSchema ? line.match(/^enum\s+([A-Za-z0-9_]+)/) : null;
    if (enumMatch) {
      const symbol = { file, line: lineNo, name: enumMatch[1], kind: 'enum' as const, exported: true };
      models.push(symbol);
      symbols.push(symbol);
    }

    const defaultFn = !route && line.match(/export\s+default\s+(?:async\s+)?function\s*([A-Za-z0-9_]*)/);
    if (defaultFn) addSymbol(symbols, file, lineNo, defaultFn[1] || 'default', 'function', true);

    const exportFn = !route && !defaultFn && line.match(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/);
    if (exportFn) addSymbol(symbols, file, lineNo, exportFn[1], 'function', true);

    const localFn = !exportFn && line.match(/(?:^|\s)(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/);
    if (localFn) addSymbol(symbols, file, lineNo, localFn[1], 'function', false);

    const exportConst = line.match(/export\s+const\s+([A-Za-z0-9_]+)/);
    if (exportConst) addSymbol(symbols, file, lineNo, exportConst[1], 'const', true);

    const localConstFn = !exportConst && line.match(/(?:^|\s)const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(?[^=]*\)?\s*=>/);
    if (localConstFn) addSymbol(symbols, file, lineNo, localConstFn[1], 'const', false);

    const exportClass = line.match(/export\s+class\s+([A-Za-z0-9_]+)/);
    if (exportClass) addSymbol(symbols, file, lineNo, exportClass[1], 'class', true);

    const exportType = line.match(/export\s+type\s+([A-Za-z0-9_]+)/);
    if (exportType) addSymbol(symbols, file, lineNo, exportType[1], 'type', true);

    const exportInterface = line.match(/export\s+interface\s+([A-Za-z0-9_]+)/);
    if (exportInterface) addSymbol(symbols, file, lineNo, exportInterface[1], 'interface', true);

    const importMatch = line.match(/from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      cables.push({ from: file, to: importMatch[1], line: lineNo, kind: 'import', label: 'import' });
    }

    const sideEffectImport = !importMatch && line.match(/^\s*import\s+['"]([^'"]+)['"]/);
    if (sideEffectImport) {
      cables.push({ from: file, to: sideEffectImport[1], line: lineNo, kind: 'import', label: 'import' });
    }

    const requireMatch = line.match(/require\(['"]([^'"]+)['"]\)/);
    if (requireMatch) {
      cables.push({ from: file, to: requireMatch[1], line: lineNo, kind: 'import', label: 'require' });
    }

    for (const dynamicImport of line.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      cables.push({ from: file, to: dynamicImport[1], line: lineNo, kind: 'import', label: 'dynamic import' });
    }

    for (const fetchMatch of line.matchAll(/fetch\(\s*([`'"])([^`'"]+)\1/g)) {
      cables.push({ from: file, to: fetchMatch[2], line: lineNo, kind: 'fetch', label: 'fetch' });
    }
  }

  return { symbols, cables, routes, models };
}

export async function loadRepoElectricAtlas(root = process.cwd()): Promise<RepoElectricAtlas> {
  const fullFiles = (await walk(root)).sort((a, b) => a.localeCompare(b));
  const files: RepoAtlasFile[] = [];
  const symbols: RepoAtlasSymbol[] = [];
  const cables: RepoAtlasCable[] = [];
  const routes: RepoAtlasSymbol[] = [];
  const models: RepoAtlasSymbol[] = [];
  const organs = new Map<string, RepoAtlasOrgan>();

  let totalBytes = 0;
  let totalLines = 0;
  let totalChars = 0;
  let textFiles = 0;
  let binaryFiles = 0;

  for (const full of fullFiles) {
    const rel = toPosix(path.relative(root, full));
    const ext = path.extname(rel).toLowerCase();
    const buffer = await fs.readFile(full);
    const bytes = buffer.byteLength;
    const hash = createHash('sha1').update(buffer).digest('hex').slice(0, 12);
    const isText = TEXT_EXTENSIONS.has(ext);
    const organInfo = classifyOrgan(rel);
    let chars = bytes;
    let lines = 0;
    let fileFunctions = 0;
    let fileCables = 0;

    totalBytes += bytes;

    if (isText) {
      textFiles += 1;
      const content = buffer.toString('utf-8');
      chars = content.length;
      lines = content.length === 0 ? 0 : content.split(/\r?\n/).length;
      const parsed = parseTextFile(rel, content);
      symbols.push(...parsed.symbols);
      cables.push(...parsed.cables);
      routes.push(...parsed.routes);
      models.push(...parsed.models);
      fileFunctions = parsed.symbols.filter((s) => s.kind !== 'model' && s.kind !== 'enum').length;
      fileCables = parsed.cables.length;
    } else {
      binaryFiles += 1;
    }

    totalLines += lines;
    totalChars += chars;

    files.push({
      path: rel,
      organ: organInfo.label,
      ext: ext || '(none)',
      bytes,
      chars,
      lines,
      hash,
      text: isText,
      functions: fileFunctions,
      cables: fileCables,
    });

    const current = organs.get(organInfo.id) ?? {
      id: organInfo.id,
      label: organInfo.label,
      files: 0,
      lines: 0,
      chars: 0,
      functions: 0,
      cables: 0,
    };
    current.files += 1;
    current.lines += lines;
    current.chars += chars;
    current.functions += fileFunctions;
    current.cables += fileCables;
    organs.set(organInfo.id, current);
  }

  const prismaModels = models.filter((m) => m.kind === 'model').length;
  const prismaEnums = models.filter((m) => m.kind === 'enum').length;
  const domainSymbols = symbols.filter((s) => s.kind !== 'model' && s.kind !== 'enum');
  const internalCables = buildInternalCables(cables, files);

  return {
    generatedAt: new Date().toISOString(),
    rootName: path.basename(root),
    excludedDirs: [...REPO_ATLAS_EXCLUDED_DIRS, '.env*', '*.log', '*.pem', '*.key', '*.p12'],
    summary: {
      files: files.length,
      textFiles,
      binaryFiles,
      lines: totalLines,
      chars: totalChars,
      bytes: totalBytes,
      functions: domainSymbols.length,
      cables: cables.length,
      routes: routes.length,
      services: files.filter((f) => f.path.startsWith('lib/services/') && f.ext === '.ts').length,
      models: prismaModels,
      enums: prismaEnums,
    },
    organs: [...organs.values()].sort((a, b) => b.files - a.files),
    files,
    functions: domainSymbols,
    cables,
    internalCables,
    routes,
    models,
    flows: buildFlows(files, domainSymbols, internalCables),
    touchpoints: buildTouchpoints(files, internalCables),
    dictionary: buildDictionary(files, domainSymbols, internalCables),
    synthesis: {
      verdict: REPO_ATLAS_SYNTHESIS.verdict,
      goldenRules: [...REPO_ATLAS_SYNTHESIS.goldenRules],
      useThisAtlasFor: [...REPO_ATLAS_SYNTHESIS.useThisAtlasFor],
    },
  };
}
