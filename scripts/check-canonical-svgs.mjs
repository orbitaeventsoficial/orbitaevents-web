import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const SCAN_DIRS = ['app', 'components', 'lib'];
const SKIP_SEGMENTS = new Set(['__tests__', 'node_modules', '.next', '.git', 'dist', 'build']);

const ALLOWLIST = new Set([
  'app/components/public/WhatsAppIcon.tsx',
  'app/components/public/StarIcon.tsx',
  'app/components/public/GoogleGIcon.tsx',
  'app/[locale]/contacto/client.tsx',
]);

const PATTERNS = [
  {
    id: 'whatsapp-icon',
    detect: (content) => content.includes('M17.472 14.382c-.297-.149'),
    canonical: '<WhatsAppIcon />',
    location: 'app/components/public/WhatsAppIcon.tsx',
  },
  {
    id: 'star-polygon',
    detect: (content) => content.includes('12 2 15.09 8.26 22 9.27'),
    canonical: '<StarIcon /> or <StarPolygon />',
    location: 'app/components/public/StarIcon.tsx',
  },
  {
    id: 'google-g-icon',
    detect: (content) =>
      (
        content.includes('#4285F4')
        && content.includes('#34A853')
        && content.includes('#FBBC05')
        && content.includes('#EA4335')
      )
      || content.includes('M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'),
    canonical: '<GoogleGIcon />',
    location: 'app/components/public/GoogleGIcon.tsx',
  },
];

function* walkFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_SEGMENTS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(full);
    } else if (entry.isFile() && /\.(tsx?|jsx?|mjs|cjs)$/i.test(entry.name)) {
      yield full;
    }
  }
}

function toPosix(relative) {
  return relative.split(path.sep).join('/');
}

const violations = [];

for (const dir of SCAN_DIRS) {
  for (const filePath of walkFiles(path.join(repoRoot, dir))) {
    const relative = path.relative(repoRoot, filePath);
    const normalized = toPosix(relative);
    if (ALLOWLIST.has(normalized)) continue;

    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    for (const pattern of PATTERNS) {
      if (pattern.detect(content)) {
        violations.push({ file: normalized, pattern });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(
    `[canonical-svgs] FAIL: ${violations.length} hardcoded canonical SVG occurrence(s) outside the shared component(s):`,
  );
  for (const v of violations) {
    console.error(
      `  - ${v.file}: detected '${v.pattern.id}' — use ${v.pattern.canonical} from ${v.pattern.location} instead.`,
    );
  }
  console.error(
    'Hardcoded canonical SVGs (Google G, Star polygon, WhatsApp path) must go through the shared component to keep monocapa. See Canvis #407, #412, #422, #432.',
  );
  process.exit(1);
}

console.log(
  '[canonical-svgs] OK: no hardcoded canonical SVGs (WhatsApp, Star, Google G) outside their shared components.',
);
