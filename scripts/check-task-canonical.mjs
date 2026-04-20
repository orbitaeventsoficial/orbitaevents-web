import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const targets = ['app', 'lib', '__tests__', 'prisma/schema.prisma'];
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.prisma']);
const skipped = new Set([
  'scripts/check-task-canonical.mjs',
]);

const forbidden = [
  { id: 'prisma-lead-task', pattern: /\bprisma\.leadTask\b/, message: 'Use Task via leadScopedTaskService; prisma.leadTask is legacy.' },
  { id: 'lead-tasks-relation', pattern: /\blead\.tasks\b/, message: 'Use lead.universalTasks; lead.tasks belonged to LeadTask.' },
  { id: 'legacy-route-input', pattern: /\bLeadTaskRoute(?:Update)?Input\b/, message: 'Use LeadScopedTaskRouteInput / LeadScopedTaskRouteUpdateInput.' },
  { id: 'legacy-route-service', pattern: /\bleadTaskRouteService\b/, message: 'Use leadScopedTaskRouteService.' },
  { id: 'legacy-facade', pattern: /\bleadTaskFacade\b/, message: 'Use leadScopedTaskService.' },
  { id: 'legacy-model', pattern: /\bmodel\s+LeadTask\b/, message: 'LeadTask model must stay removed from Prisma schema.' },
  {
    id: 'inline-dedupe-template',
    pattern: /dedupeKey:\s*`[^`]*\$\{/,
    message: 'Use TASK_DEDUPE_KEY helpers from lib/constants; inline template-literal dedupeKey strings break the canonical registry.',
    scopes: ['app/', 'lib/'],
  },
];

const findings = [];

function normalize(relativePath) {
  return relativePath.replace(/\\/g, '/');
}

function shouldSkip(relativePath) {
  const normalized = normalize(relativePath);
  return skipped.has(normalized)
    || normalized.includes('/node_modules/')
    || normalized.includes('/.next/')
    || normalized.includes('/coverage/')
    || normalized.includes('/dist/');
}

function scanFile(absolute) {
  const relative = normalize(path.relative(repoRoot, absolute));
  if (shouldSkip(relative)) return;
  if (!extensions.has(path.extname(absolute))) return;

  const content = fs.readFileSync(absolute, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const rule of forbidden) {
      if (rule.scopes && !rule.scopes.some((scope) => relative.startsWith(scope))) {
        continue;
      }
      if (rule.pattern.test(line)) {
        findings.push({
          relative,
          line: index + 1,
          id: rule.id,
          message: rule.message,
        });
      }
    }
  });
}

function walk(absolute) {
  if (!fs.existsSync(absolute)) return;
  const stat = fs.statSync(absolute);
  if (stat.isFile()) {
    scanFile(absolute);
    return;
  }

  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const child = path.join(absolute, entry.name);
    if (entry.isDirectory()) {
      walk(child);
    } else if (entry.isFile()) {
      scanFile(child);
    }
  }
}

for (const target of targets) {
  walk(path.join(repoRoot, target));
}

if (findings.length > 0) {
  console.error('[task-canonical] Legacy LeadTask usage found in active code:');
  for (const finding of findings) {
    console.error(`- ${finding.relative}:${finding.line} [${finding.id}] ${finding.message}`);
  }
  console.error('\nKeep Task as the canonical model. Historical docs/migrations are intentionally outside this guard.');
  process.exit(1);
}

console.log('[task-canonical] OK: active code stays on canonical Task model.');
