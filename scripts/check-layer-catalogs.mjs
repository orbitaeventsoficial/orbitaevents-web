import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const targets = ['app', 'lib'];
const ignoredDirs = new Set([
  'app/config',
  'app/api',
  'app/admin/components',
  'docs',
  'lib/constants',
  // Fitxa tècnica del sistema visual: showroom autocontingut de mostres
  // il·lustratives (paleta, tipografia, comunicacions, documents) per VISUALITZAR
  // el design system, no catàlegs de domini reutilitzats. Zona protegida
  // (CLAUDE.md §Zones consolidades) amb guard propi `qa:studio-integrity`.
  'app/studio',
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
  // PDF layout constants — coupling with jsPDF generation primitives, not a domain catalog (pdf-header.ts).
  'lib/pdf-header.ts::PDF_DESIGN',
  'lib/pdf-header.ts::CHART_COLORS',
  'lib/rate-limit.ts::RATE_LIMITS',
  'app/admin/leads/colorTheme.ts::LEAD_COLOR_OPTIONS',
  'app/admin/bookings/BookingPipelineView.tsx::COLUMNS_DEF',
  'app/admin/leads/LeadPipelineView.tsx::COLUMNS',
  // i18n adapter map: not a domain catalog, only routes locale -> messages JSON.
  'lib/equipment-i18n.ts::MESSAGES',
  // Editorial showcase data for homepage — deliberately separated from lib/constants (Canvi #124-125).
  'lib/publicHomeShowcase.ts::PUBLIC_PORTFOLIO_SHOWCASE_ITEMS',
  'lib/publicHomeShowcase.ts::PUBLIC_MOBILE_HOME_GUARANTEES',
  // Private filter set for multi-touch attribution algorithm — not a shared domain catalog (Canvi #128).
  'lib/services/attributionService.ts::COMM_ACTIVITY_TYPES',
  // Catalan day abbreviations for social performance display — presentation-only, not a shared domain catalog.
  'lib/services/socialPerformanceService.ts::DAY_NAMES',
  // Season calendar display strings (Brass & Obsidian leads UI).
  // Catalan month names and local SVG icon builder, purely presentational for the season calendar widget.
  'app/admin/leads/LeadsSeasonClient.tsx::MONTHS_FULL',
  'app/admin/leads/LeadsSeasonClient.tsx::MONTHS_SHORT',
  'app/admin/leads/LeadsSeasonClient.tsx::I',
  // Pseudo-random visual particle coordinates for the mobile hero — presentation-only runtime data, not a shared domain catalog (Canvi #354).
  'app/components/mobile-ultimate/MobileHeroUltimate.tsx::HERO_PARTICLES',
  // Local filter subset of CUSTOMER_ACTIVITY_ACTIONS used only inside customerActivityService to query recent email-bearing activity (Canvi #353, follows the COMM_ACTIVITY_TYPES precedent).
  'lib/services/customerActivityService.ts::EMAIL_ACTIVITY_ACTIONS',
  // Inline composer quick-templates for SafataClient — 3 presentational presets (primer-contacte, seguiment, lliure) used only inside this component, not a shared domain catalog (Canvi #804).
  'app/admin/inbox/SafataClient.tsx::TPLS',
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
  const resolved = path.join(repoRoot, target);
  if (fs.existsSync(resolved)) walk(resolved);
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

