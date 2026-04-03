import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const targets = ['app', 'lib'];
const ignoredDirs = new Set([
  'app/config',
  'app/api',
  'app/admin/components',
  'docs',
  'lib/constants',
]);

const allowedCatalogs = new Set([
  'app/components/ui/BottomNav.tsx::ICONS',
  'app/components/ui/footer.tsx::SOCIAL_ICON_MAP',
  'app/[locale]/servicios/animacion-infantil/AnimacionInfantilClient.tsx::SERVICE_ICONS',
  'app/[locale]/servicios/animacion-infantil/AnimacionInfantilClient.tsx::INFO_ICONS',
  'lib/coverage.ts::COVERAGE_PROVINCES',
  'lib/coverage.ts::WEDDING_COVERAGE_ZONE_DEFINITIONS',
  'lib/intro.ts::INTRO_PAGES',
  'lib/intro.ts::INTRO_BOT_PATTERNS',
  'lib/pdf-config.ts::COLORS',
  'lib/pdf-config.ts::PAGE',
  'lib/rate-limit.ts::RATE_LIMITS',
  'app/admin/leads/colorTheme.ts::LEAD_COLOR_OPTIONS',
  'app/admin/bookings/BookingPipelineView.tsx::COLUMNS_DEF',
  'app/admin/leads/LeadPipelineView.tsx::COLUMNS',
]);

const suspiciousConst = /^(?:export\s+)?const\s+([A-Z0-9_]+)\s*=\s*(\[|\{|new Set\(|Object\.freeze\()/gm;
const candidateExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const findings = [];

function shouldIgnore(relativePath) {
  return [...ignoredDirs].some((prefix) => relativePath === prefix || relativePath.startsWith(prefix + '/'));
}

function walk(dirPath) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const absolute = path.join(dirPath, entry.name);
    const relative = path.relative(repoRoot, absolute).replace(/\\/g, '/');

    if (shouldIgnore(relative)) continue;

    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }

    if (!candidateExtensions.has(path.extname(entry.name))) continue;

    const content = fs.readFileSync(absolute, 'utf8');
    for (const match of content.matchAll(suspiciousConst)) {
      const name = match[1];
      const key = relative + '::' + name;
      if (!allowedCatalogs.has(key)) {
        findings.push({ relative, name });
      }
    }
  }
}

for (const target of targets) {
  walk(path.join(repoRoot, target));
}

if (findings.length === 0) {
  console.log('[layer-catalogs] OK: no suspicious local catalogs outside allowed exceptions.');
  process.exit(0);
}

console.error('[layer-catalogs] Suspicious local catalogs found:');
for (const finding of findings) {
  console.error('- ' + finding.relative + ' :: ' + finding.name);
}
console.error('');
console.error('Move declarative catalogs to lib/constants/* or add a deliberate allowlist entry with justification.');
process.exit(1);
